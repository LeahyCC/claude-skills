# Compute

A compute pass runs a function over a grid of invocations, with no triangles and no canvas. Use it for work that is the same for every element: particles, culling, image filters, prefix sums, simulation steps.

When compute is worth it at all is a performance question. That decision is in the `spa-performance` skill, in its off-thread resource.

Facts below are from the WebGPU and WGSL editor's drafts of 21 October 2026, checked 2026-10-22. Sources are in [SOURCES.md](../SOURCES.md).

## The grid

```
dispatchWorkgroups(4, 1, 1)          @workgroup_size(64)

 workgroup 0   workgroup 1   workgroup 2   workgroup 3
 [0 ..... 63] [64 .... 127] [128 ... 191] [192 ... 255]
       ^
       global_invocation_id.x = workgroup_id.x * 64 + local_invocation_id.x
```

| Built-in | Type | Meaning |
| --- | --- | --- |
| `global_invocation_id` | `vec3u` | Position in the whole grid. Use it as the element index. |
| `local_invocation_id` | `vec3u` | Position inside the workgroup |
| `local_invocation_index` | `u32` | Same, flattened |
| `workgroup_id` | `vec3u` | Which workgroup |
| `num_workgroups` | `vec3u` | The dispatch size |

## Default limits

| Limit | Default |
| --- | --- |
| `maxComputeInvocationsPerWorkgroup` | 256 (128 in compatibility mode) |
| `maxComputeWorkgroupSizeX`, `Y` | 256 |
| `maxComputeWorkgroupSizeZ` | 64 |
| `maxComputeWorkgroupsPerDimension` | 65535 |
| `maxComputeWorkgroupStorageSize` | 16384 bytes |
| `maxStorageBufferBindingSize` | 128 MiB |

A workgroup size of 64 is a common starting point. That is community practice, not a spec rule. It stays under every default limit. Make it an `override` and measure other sizes on your hardware.

## Round up, then bounds-check

The dispatch is in whole workgroups. When the element count is not a multiple of the workgroup size, the last workgroup runs past the end.

FAIL. The last 36 invocations read and write outside the data. The spec keeps them inside the buffer, but the values are not defined.

```ts
pass.dispatchWorkgroups(1000 / 64) // 15.6 is truncated to 15, and 40 elements never run
```

PASS.

```wgsl
override WG: u32 = 64;

@group(0) @binding(0) var<storage, read_write> items: array<Particle>;
@group(0) @binding(1) var<uniform> params: Params;

@compute @workgroup_size(WG)
fn step(@builtin(global_invocation_id) id: vec3u) {
  let i = id.x;
  if (i >= arrayLength(&items)) { return; }
  items[i].pos += items[i].vel * params.dt;
}
```

```ts
const WG = 64
pass.dispatchWorkgroups(Math.ceil(count / WG))
```

Keep the bounds check before any barrier, or return only from whole workgroups. A barrier must be reached by every invocation in the group (see Uniformity in [wgsl.md](./wgsl.md)).

### More than 65535 workgroups

At 64 per group, one dimension covers about 4.2 million elements. Past that, spread into Y and rebuild the index.

```ts
const groups = Math.ceil(count / WG)
const x = Math.min(groups, device.limits.maxComputeWorkgroupsPerDimension)
const y = Math.ceil(groups / x)
pass.dispatchWorkgroups(x, y)
```

```wgsl
// num is @builtin(num_workgroups). Then bounds-check i as before.
let i = id.x + id.y * num.x * WG;
```

## Sharing inside a workgroup

`var<workgroup>` memory is shared by one workgroup and is usually faster to reach than storage. Use it for tiles of an image or a partial sum.

```wgsl
@group(0) @binding(0) var<storage, read> input: array<f32>;
@group(0) @binding(1) var<storage, read_write> partial: array<f32>;
var<workgroup> tile: array<f32, 64>;

@compute @workgroup_size(64)
fn reduce(@builtin(local_invocation_id) lid: vec3u,
          @builtin(global_invocation_id) gid: vec3u,
          @builtin(workgroup_id) wid: vec3u) {
  // Out-of-range invocations load 0 instead of returning, so all 64 reach the barriers.
  tile[lid.x] = select(0.0, input[gid.x], gid.x < arrayLength(&input));
  workgroupBarrier();

  for (var s = 32u; s > 0u; s >>= 1u) {
    if (lid.x < s) { tile[lid.x] += tile[lid.x + s]; }
    workgroupBarrier();
  }
  if (lid.x == 0u) { partial[wid.x] = tile[0]; }
}
```

| Barrier | Orders |
| --- | --- |
| `workgroupBarrier()` | `workgroup` memory, and syncs the group |
| `storageBarrier()` | `storage` memory, inside one workgroup only |
| `textureBarrier()` | storage textures |

No barrier syncs different workgroups. Work that needs every group to finish goes in the next dispatch. Dispatches in one pass, and passes in one submit, see each other's writes in order.

## Atomics

`atomic<u32>` and `atomic<i32>` only, in `workgroup` or `read_write` storage. Use them for counters and histograms. A hot atomic that every invocation hits serializes them. Accumulate in workgroup memory first, then do one atomic per group.

## Getting results

- **To draw them,** bind the same buffer as a vertex or storage buffer in the render pass. No CPU trip.
- **To read them on the CPU,** copy to a staging buffer and map. The pattern is in [buffers-and-textures.md](./buffers-and-textures.md).

## Checklist

- [ ] Dispatch count is rounded up, and the shader bounds-checks
- [ ] Every invocation reaches every barrier
- [ ] Work that needs all groups done is split across dispatches
- [ ] Workgroup size is an `override` and was measured, not guessed
- [ ] Results feed the next pass directly when the CPU does not need them
