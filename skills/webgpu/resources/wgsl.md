# WGSL

WGSL is the only shader language WebGPU takes. It compiles when the browser makes the pipeline, so its mistakes show up as validation errors, not crashes. The ones that pass validation and still draw wrong are layout and uniformity.

Facts below are from the WGSL editor's draft of 21 October 2026, checked 2026-10-22. Sources are in [SOURCES.md](../SOURCES.md).

## Memory layout

| Type | Align (bytes) | Size (bytes) |
| --- | --- | --- |
| `f32`, `i32`, `u32`, `bool` | 4 | 4 |
| `vec2<f32>` | 8 | 8 |
| `vec3<f32>` | **16** | **12** |
| `vec4<f32>` | 16 | 16 |
| `mat3x3<f32>` | 16 | 48 |
| `mat4x4<f32>` | 16 | 64 |
| `array<E, N>` | align of E | N times the element size rounded up to its alignment |

A `mat3x3` is three columns of `vec3`, and each column takes 16 bytes. So `array<vec3f, N>` has a 16-byte stride, not 12.

### The vec3 trap

FAIL. Six floats packed tight on the CPU.

```wgsl
struct Light {
  position: vec3f, // offset 0
  color: vec3f,    // offset 16, not 12
}
```

```ts
// color.x lands at byte 12, which the shader reads as padding.
const data = new Float32Array([px, py, pz, r, g, b])
```

PASS. Either pad on the CPU, or put a scalar in the gap.

```wgsl
struct Light {
  position: vec3f, // offset 0
  intensity: f32,  // offset 12, fills the padding
  color: vec3f,    // offset 16
  range: f32,      // offset 28
}                  // size 32
```

```ts
const data = new Float32Array([px, py, pz, intensity, r, g, b, range])
```

Write the offsets in a comment next to every struct shared with the CPU. A library such as `webgpu-utils` can compute them from the shader, and that removes the trap entirely.

### Uniform buffers are stricter

Without the `uniform_buffer_standard_layout` language extension, an array in a uniform buffer needs a stride that is a multiple of 16. `array<f32, 8>` in a `var<uniform>` is invalid. Storage buffers do not have this rule.

The extension shipped in Chrome 144. Check for it before you rely on it.

```ts
const relaxed = navigator.gpu.wgslLanguageFeatures.has('uniform_buffer_standard_layout')
```

Without it, use `array<vec4f, 2>`, or wrap the element: `struct F { @size(16) v: f32 }`. Or move the array to a read-only storage buffer.

## Address spaces

| Space | Access | Stages |
| --- | --- | --- |
| `function`, `private` | read_write | all |
| `workgroup` | read_write | compute only |
| `uniform` | read | all |
| `storage` | `read` (default) or `read_write` | `read_write` is not allowed in a vertex shader |
| `handle` | textures and samplers | all |

Atomics live only in `workgroup` variables or `read_write` storage.

## Uniformity

Some calls must run where every invocation takes the same path. WGSL checks this when it compiles.

| Call | If it is in non-uniform control flow |
| --- | --- |
| `textureSample`, `textureSampleBias`, `textureSampleCompare`, `dpdx`, `dpdy`, `fwidth` | Error by default. Rule `derivative_uniformity`, which can be filtered. |
| `workgroupBarrier`, `storageBarrier`, `workgroupUniformLoad` | Error. Cannot be turned off. |
| `textureSampleLevel` | Allowed. It takes an explicit level, so it needs no derivatives. |

FAIL.

```wgsl
if (in.mask > 0.5) {
  color = textureSample(tex, samp, in.uv) // error: derivative_uniformity
}
```

PASS. Sample first, then choose.

```wgsl
let sampled = textureSample(tex, samp, in.uv)
if (in.mask > 0.5) {
  color = sampled
}
```

If you really need the sample inside the branch, use `textureSampleLevel` with level 0, or `textureSampleGrad` with derivatives taken outside it. Turn the rule off with `diagnostic(off, derivative_uniformity);` only when you know the branch is uniform and the analysis cannot see it.

## Overrides

`override` constants are set when the pipeline is made. They let one shader serve several pipelines without string templating.

```wgsl
override WORKGROUP_SIZE: u32 = 64;

@compute @workgroup_size(WORKGROUP_SIZE)
fn main(@builtin(global_invocation_id) id: vec3u) { /* ... */ }
```

```ts
device.createComputePipelineAsync({
  layout,
  compute: { module, constants: { WORKGROUP_SIZE: 128 } },
})
```

An override without a default must be given a value, or pipeline creation fails.

## Extensions

| Kind | How you turn it on | Example |
| --- | --- | --- |
| Device feature | `requiredFeatures` on the device, then `enable` in the shader | `shader-f16` and `enable f16;`, `subgroups` and `enable subgroups;` |
| Language extension | Nothing to enable. Check `navigator.gpu.wgslLanguageFeatures`. `requires x;` documents it. | `uniform_buffer_standard_layout`, `pointer_composite_access` |

`enable` lines must come before every declaration. A shader that enables a feature the device was not created with fails to compile.

Subgroups shipped in Chrome 134. Treat them as optional everywhere else.

## Precision and limits

- **f32 is not exact IEEE.** Add, subtract, and multiply round correctly. Division is within 2.5 ULP. Built-ins have their own error bounds.
- **No inf or NaN you can count on.** Runtime results that would be inf or NaN are indeterminate. Do not test for NaN to detect a bad value. Clamp the input instead.
- **Integer divide by zero returns the dividend** at runtime. With constant operands it is a compile error.
- **No recursion.**
- **No 64-bit types.** No `f64`, no `i64`. Split a 64-bit value into two `u32`.
- **Out-of-bounds reads and writes never leave the resource**, but the result is not defined. A read can return zero or any value inside the buffer. A write can land anywhere inside it or be dropped. Bounds-check yourself.

## Compiler messages

`createShaderModule` never throws. Ask for the messages.

```ts
const module = device.createShaderModule({ label: 'particles.wgsl', code })
const info = await module.getCompilationInfo()
for (const m of info.messages) {
  console[m.type === 'error' ? 'error' : 'warn'](
    `${module.label}:${m.lineNum}:${m.linePos} ${m.message}`,
  )
}
```

Do this in development. Pipeline creation reports the same errors through the device, covered in [errors-and-device-loss.md](./errors-and-device-loss.md).

## Checklist

- [ ] Every CPU-shared struct has its byte offsets written down or generated
- [ ] No tight-packed `vec3` on the CPU side
- [ ] Uniform arrays use a 16-byte stride unless the extension was detected
- [ ] Samples with derivatives sit outside branches that depend on per-pixel data
- [ ] Every `enable` matches a feature the device was created with
- [ ] Every array index from data is bounds-checked
