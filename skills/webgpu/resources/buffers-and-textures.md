# Buffers and textures

Every byte the GPU reads lives in a buffer or a texture you made. Most WebGPU bugs here are a usage flag, an alignment, or a buffer used while it is mapped.

Facts below are from the WebGPU editor's draft of 21 October 2026, checked 2026-10-22. Sources are in [SOURCES.md](../SOURCES.md).

## Pick the upload path

| You have | Use | Why |
| --- | --- | --- |
| Data that changes every frame or often (uniforms, instance data) | `queue.writeBuffer` | One call, no mapping, the browser stages it |
| A large buffer filled once at load | `mappedAtCreation: true`, fill, `unmap()` | No extra copy |
| Data you must read back on the CPU | Copy into a `MAP_READ \| COPY_DST` staging buffer, then `mapAsync` | Only `COPY_DST` may sit beside `MAP_READ` |
| Pixels from an image, video, or canvas | `queue.copyExternalImageToTexture` | Decoding and orientation handled for you |
| Raw pixel bytes in a typed array | `queue.writeTexture` | No row alignment rule |
| Pixels already in a GPU buffer | `copyBufferToTexture` | `bytesPerRow` must be a multiple of 256 |

## Usage flags

A buffer can only do what its `usage` says. Set every flag it will need at creation. You cannot add one later.

| Flag | Meaning |
| --- | --- |
| `VERTEX`, `INDEX` | Bound with `setVertexBuffer` or `setIndexBuffer` |
| `UNIFORM` | `var<uniform>` in a shader |
| `STORAGE` | `var<storage>` in a shader |
| `INDIRECT` | Args for `drawIndirect` or `dispatchWorkgroupsIndirect` |
| `COPY_SRC`, `COPY_DST` | Source or target of a copy, and `COPY_DST` for `writeBuffer` |
| `QUERY_RESOLVE` | Target of `resolveQuerySet` |
| `MAP_READ` | CPU reads it. **May only be combined with `COPY_DST`.** |
| `MAP_WRITE` | CPU writes it. **May only be combined with `COPY_SRC`.** |

FAIL. A storage buffer the CPU can map is invalid. The buffer becomes an error object and every later use fails.

```ts
const buf = device.createBuffer({
  size: 1024,
  usage: GPUBufferUsage.STORAGE | GPUBufferUsage.MAP_READ,
})
```

PASS. Keep the GPU buffer and the readback buffer separate.

```ts
const results = device.createBuffer({
  label: 'particles.results',
  size: 1024,
  usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
})
const readback = device.createBuffer({
  label: 'particles.readback',
  size: 1024,
  usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
})
```

## Alignment

| Rule | Number |
| --- | --- |
| `mappedAtCreation` buffer size | Multiple of 4, or a `RangeError` is thrown |
| `writeBuffer` offset and byte size | Multiple of 4 |
| `mapAsync` and `getMappedRange` size | Multiple of 4 |
| Bind group buffer offset and dynamic offsets for uniforms | Multiple of `minUniformBufferOffsetAlignment`, default 256 |
| Same for storage | Multiple of `minStorageBufferOffsetAlignment`, default 256 |
| `copyBufferToTexture` and `copyTextureToBuffer` `bytesPerRow` | Multiple of 256 |
| `writeTexture` `bytesPerRow` and offset | No alignment rule |
| `resolveQuerySet` destination offset | Multiple of 256 |

Read the real alignment from `device.limits`, not the default. A device can report a smaller one.

`writeBuffer` counts `dataOffset` and `size` in elements when you pass a typed array, and in bytes when you pass an `ArrayBuffer`. Mixing the two writes the wrong range.

Struct layout inside the buffer is a shader rule. The vec3 trap is in [wgsl.md](./wgsl.md).

### Many objects, one uniform buffer

Pack per-object uniforms at the aligned stride and pick one with a dynamic offset. The bind group layout entry needs `hasDynamicOffset: true`.

```ts
// One 64-byte matrix per object, but each slot must start on the alignment boundary.
const align = device.limits.minUniformBufferOffsetAlignment
const stride = Math.ceil(64 / align) * align

const objects = device.createBuffer({
  label: 'objects.uniforms',
  size: stride * objectCount,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
})

for (let i = 0; i < objectCount; i++) {
  device.queue.writeBuffer(objects, i * stride, matrices[i])
}

// In the pass:
for (let i = 0; i < objectCount; i++) {
  pass.setBindGroup(2, objectGroup, [i * stride])
  pass.draw(vertexCount)
}
```

## Mapping and readback

`mapAsync` is a promise. While a buffer is mapped, or waiting to map, any `submit()` that uses it fails validation. `unmap()` detaches every `ArrayBuffer` that `getMappedRange` returned. Copy the data out before you unmap.

```ts
// Readback runs after the GPU work. The caller awaits it; nothing blocks a frame.
async function readResults(
  device: GPUDevice,
  src: GPUBuffer,
  readback: GPUBuffer,
): Promise<Float32Array> {
  const encoder = device.createCommandEncoder()
  encoder.copyBufferToBuffer(src, 0, readback, 0, src.size)
  device.queue.submit([encoder.finish()])

  await readback.mapAsync(GPUMapMode.READ)
  // slice() copies. The mapped range is detached by unmap() below.
  const out = new Float32Array(readback.getMappedRange().slice(0))
  readback.unmap()
  return out
}
```

FAIL. Keeping a view on the mapped range after `unmap()`.

```ts
const view = new Float32Array(readback.getMappedRange())
readback.unmap()
console.log(view[0]) // TypeError: the buffer is detached
```

Do not read back every frame and wait on it. The CPU then waits for the GPU each frame. If you need a value each frame, keep two or three readback buffers and use whichever finished last.

## Textures

- **Mipmaps are not generated for you.** The spec has no method for it. Generate each level with a render or compute pass, or ship them from the asset pipeline.
- **`copyExternalImageToTexture` needs `RENDER_ATTACHMENT` and `COPY_DST`** on the destination. `flipY` defaults to false.
- **Row padding.** When you copy a texture to a buffer, each row is padded to 256 bytes. Strip the padding when you read it.

```ts
// 4 bytes per pixel. Rows in the buffer are padded to 256.
const bytesPerRow = Math.ceil((width * 4) / 256) * 256
encoder.copyTextureToBuffer(
  { texture },
  { buffer: readback, bytesPerRow },
  { width, height },
)
```

## Freeing memory

Call `destroy()` on buffers and textures you are done with. Dropping the last reference leaves the memory to the garbage collector, which does not see GPU pressure. Destroying twice is valid. `destroy()` also unmaps.

## Checklist

- [ ] Every flag the buffer needs is set at creation
- [ ] No `MAP_READ` or `MAP_WRITE` on a buffer the shader binds
- [ ] Offsets use `device.limits`, not a hard-coded 256
- [ ] Mapped data is copied before `unmap()`
- [ ] No frame awaits its own readback
- [ ] Old buffers and textures are destroyed, not just dropped
