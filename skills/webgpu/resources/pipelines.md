# Pipelines and bind groups

A pipeline is the compiled shader plus every fixed setting. A bind group is the set of buffers and textures one draw reads. Getting these two right decides how much the frame loop costs.

The binding-frequency convention is from Brandon Jones's bind group guide. He is a Chrome WebGPU spec editor, and the guide is not normative. Sources are in [SOURCES.md](../SOURCES.md).

## Contents

- What goes where
- Create pipelines async
- Explicit layouts
- Group by how often it changes
- Render bundles
- Checklist

## What goes where

```
load time                          every frame
---------                          -----------
shader module                      command encoder
bind group layouts                 pass
pipeline layout                    setPipeline / setBindGroup / draw
pipelines (async)                  writeBuffer for changed uniforms
buffers, textures, samplers        submit
bind groups
```

If something on the left shows up inside the frame loop, it is a bug. Creating a bind group per frame is allowed but costs CPU. Create it when its resources change.

## Create pipelines async

FAIL. The browser may compile at creation, at `setPipeline`, at `finish`, or at `submit`. Any of those can be a long task.

```ts
const pipeline = device.createRenderPipeline(desc)
```

PASS. The promise resolves when the pipeline can be used without further delay.

```ts
const pipeline = await device.createRenderPipelineAsync(desc).catch((err: unknown) => {
  // GPUPipelineError. No device error is raised for async creation, so this catch is the only report.
  throw new Error(`pipeline ${desc.label ?? ''} failed: ${String(err)}`)
})
```

Start all pipeline creation at once with `Promise.all`, not one await after another.

## Explicit layouts

`layout: 'auto'` reads the bindings from the shader. Bind groups made from an auto layout work only with that one pipeline. The layout can also change when the shader changes.

FAIL. Two pipelines, one camera, two bind groups that should be one.

```ts
const a = await device.createRenderPipelineAsync({ layout: 'auto', ...meshDesc })
const b = await device.createRenderPipelineAsync({ layout: 'auto', ...outlineDesc })
const camera = device.createBindGroup({ layout: a.getBindGroupLayout(0), entries })
pass.setPipeline(b)
pass.setBindGroup(0, camera) // validation error: layout belongs to pipeline a
```

PASS. Declare the shared layout once.

```ts
const frameLayout = device.createBindGroupLayout({
  label: 'frame',
  entries: [
    { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {} },
  ],
})
const materialLayout = device.createBindGroupLayout({
  label: 'material',
  entries: [
    { binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: {} },
    { binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
  ],
})
const layout = device.createPipelineLayout({ bindGroupLayouts: [frameLayout, materialLayout] })

const [mesh, outline] = await Promise.all([
  device.createRenderPipelineAsync({ ...meshDesc, layout }),
  device.createRenderPipelineAsync({ ...outlineDesc, layout }),
])
```

`'auto'` is fine for a one-off compute pipeline whose bind group is never shared.

## Group by how often it changes

| Group | Holds | Set |
| --- | --- | --- |
| `@group(0)` | Camera, time, viewport | Once per frame or pass |
| `@group(1)` | Material: textures, sampler, material params | When the material changes |
| `@group(2)` | Per object: transform | Every draw, or one buffer with a dynamic offset |

`maxBindGroups` defaults to 4. A `setBindGroup` call leaves lower groups alone, so sorting draws by material means group 1 changes rarely.

Per-object data with a dynamic offset is in [buffers-and-textures.md](./buffers-and-textures.md). For thousands of objects, put the transforms in one storage buffer and index it with `instance_index`. One draw call replaces thousands.

<!-- wgsl-prelude
struct Frame { viewProj: mat4x4f }
@group(0) @binding(0) var<uniform> frame: Frame;
-->
```wgsl
@group(2) @binding(0) var<storage, read> transforms: array<mat4x4f>;

@vertex
fn vs(@location(0) pos: vec3f, @builtin(instance_index) i: u32) -> @builtin(position) vec4f {
  return frame.viewProj * transforms[i] * vec4f(pos, 1.0);
}
```

```ts
pass.drawIndexed(indexCount, objectCount)
```

## Render bundles

A `GPURenderBundle` records draw commands once and replays them with `executeBundles`. Use it for a static part of the scene drawn the same way every frame. It saves the JavaScript cost of the calls. It does not make the GPU faster.

## Checklist

- [ ] No pipeline, layout, or shader is created inside the frame loop
- [ ] Pipelines use the async methods, started together, with a `catch`
- [ ] Bind groups shared across pipelines come from an explicit layout
- [ ] Groups are ordered from least to most frequently changed
- [ ] Many copies of one mesh are one instanced draw
