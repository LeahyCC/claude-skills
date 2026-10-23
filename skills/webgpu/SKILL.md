---
name: webgpu
description: >
  Writes, reviews, and debugs WebGPU and WGSL code: adapter and device setup,
  feature detection and WebGL2 fallback, buffers and struct alignment,
  textures, bind groups, pipelines, depth, MSAA, compute shaders, the canvas
  frame loop, React integration, device loss, error scopes, GPU timing, and
  testing. Use when code touches navigator.gpu, GPUDevice, a .wgsl file, a
  WebGPU black canvas or validation error, or a WebGL port to WebGPU. Not for
  deciding whether WebGPU will make a page faster (spa-performance).
---

# WebGPU

Writing WebGPU that works on the browsers you ship to, and does not fail silently when it does not. Whether WebGPU is the right fix for a slow page belongs to the `spa-performance` skill.

**WebGPU almost never throws.** A bad call returns an invalid object and reports the error later, and a lost device turns every call into a no-op. Wire up error reporting and device loss before anything else, or a black canvas is all you get.

**If an engine owns the device, use the engine.** In three.js, Babylon.js, or a library like TypeGPU, follow that library's API and its docs. Do not mix raw WebGPU calls into its frame unless it documents a way to. This skill is for code that owns its own device.

Source checks and dates: [SOURCES.md](SOURCES.md).

## Procedure

1. Read [setup.md](./resources/setup.md). Detect, request only the features and limits the adapter has, and decide the fallback.
2. Add the `uncapturederror` listener and `device.lost` handler from [errors-and-device-loss.md](./resources/errors-and-device-loss.md). Label every object.
3. For multi-pass or compute work, write down each pass first: what it reads, what it writes, and which buffer holds the current data afterwards.
4. Read the resource for the thing you are building.
5. For any struct shared with the CPU, run `node scripts/wgsl-layout.mjs <file.wgsl>` and use the offsets it prints. Add `--uniform` for uniform buffers.
6. Check the resource's checklist, then report how far the code was checked, using the levels in [debugging-and-testing.md](./resources/debugging-and-testing.md).

```
navigator.gpu? -> adapter? -> device?  --any no--> fallback, log why
                                 |
                       error listener + device.lost
                                 |
        +------------------------+------------------------+
        |                        |                        |
   draw to canvas           compute only              both
   canvas.md                compute.md                all three
   render-basics.md              |
        |                        |
        +--- buffers-and-textures.md, wgsl.md, pipelines.md ---+
                                 |
          check it: debugging-and-testing.md   slow? profiling.md
```

## Where to read

| Task | Resource |
| --- | --- |
| Support, detection, adapter, device, limits, fallback, old tutorials | [setup.md](./resources/setup.md) |
| Error scopes, labels, device loss and recovery | [errors-and-device-loss.md](./resources/errors-and-device-loss.md) |
| Usage flags, alignment, uploads, readback, textures, mipmaps | [buffers-and-textures.md](./resources/buffers-and-textures.md) |
| Struct layout, the vec3 trap, uniformity, overrides, extensions, untrusted shaders | [wgsl.md](./resources/wgsl.md) |
| Async pipelines, explicit layouts, bind group frequency, instancing | [pipelines.md](./resources/pipelines.md) |
| Vertex layouts, depth, culling, blending, MSAA, video, porting from WebGL | [render-basics.md](./resources/render-basics.md) |
| Configure, frame loop, resize, React, workers | [canvas.md](./resources/canvas.md) |
| Workgroups, dispatch, bounds, barriers, atomics | [compute.md](./resources/compute.md) |
| GPU time with timestamp queries | [profiling.md](./resources/profiling.md) |
| `chrome://gpu`, capture tools, offline WGSL checks, tests in Node and headless Chrome | [debugging-and-testing.md](./resources/debugging-and-testing.md) |

## The traps that cost the most time

| Symptom | Usual cause | Read |
| --- | --- | --- |
| Black canvas, no exception | An invalid object upstream. Read the first error, not the last. | [errors-and-device-loss.md](./resources/errors-and-device-loss.md) |
| Values shifted or garbled in the shader | `vec3` is 16-byte aligned. The CPU packed it at 12. Run the layout script. | [wgsl.md](./resources/wgsl.md) |
| Works in dev, black after a while in production | Device lost and never recovered | [errors-and-device-loss.md](./resources/errors-and-device-loss.md) |
| Bind group rejected by a second pipeline | Both used `layout: 'auto'` | [pipelines.md](./resources/pipelines.md) |
| Near objects vanish after a WebGL port | Projection maps depth to -1..1. WebGPU clips at 0..1. | [render-basics.md](./resources/render-basics.md) |
| Far objects draw over near ones | No depth texture or `depthStencil` state | [render-basics.md](./resources/render-basics.md) |
| Blurry or stretched output | Canvas size in CSS pixels, not device pixels | [canvas.md](./resources/canvas.md) |
| Device creation fails on some machines | A feature or limit requested that the adapter lacks | [setup.md](./resources/setup.md) |
| Big buffer binding rejected though the GPU is large | The device got the default limit. Request it in `requiredLimits`. | [setup.md](./resources/setup.md) |
| Last elements never computed | Dispatch count truncated, not rounded up | [compute.md](./resources/compute.md) |
| `textureSample` compile error inside an `if` | Uniformity analysis | [wgsl.md](./resources/wgsl.md) |
| Video frame bind group errors after the first frame | External textures expire. Import and bind each frame. | [render-basics.md](./resources/render-basics.md) |
| Two devices in development, one leaked | React Strict Mode cleanup ran during the async setup | [canvas.md](./resources/canvas.md) |
| GPU timer always reads zero | The pass is shorter than the browser's timer quantum | [profiling.md](./resources/profiling.md) |

## Review checklist

- [ ] Every way setup can fail reaches a fallback, and the reason is logged
- [ ] An `uncapturederror` listener and a `device.lost` handler exist, and recovery starts from a new adapter
- [ ] Every descriptor has a `label`
- [ ] Features and limits are requested only when the adapter has them
- [ ] Every CPU-shared struct has offsets from the layout script, not from hand counting
- [ ] Pipelines are created async, outside the frame loop
- [ ] `getCurrentTexture()` is called each frame, and the canvas is sized in device pixels
- [ ] The projection maps depth to 0..1
- [ ] Compute dispatches round up, and shaders bounds-check
- [ ] Readback never makes a frame wait
- [ ] Buffers, textures, and the device are destroyed on teardown
- [ ] The report says how far the code was checked: types, WGSL, a real device, a browser
