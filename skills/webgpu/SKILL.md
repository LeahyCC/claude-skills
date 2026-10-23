---
name: webgpu
description: >
  Use when writing or debugging WebGPU or WGSL: adapter and device setup,
  feature detection and WebGL2 fallback, buffers, alignment, textures,
  bind groups, pipelines, compute shaders, the canvas frame loop, React
  integration, device loss, error scopes, and GPU timestamp queries.
  Not whether WebGPU will make an app faster (see spa-performance).
metadata:
  filePattern:
    - "**/*.wgsl"
    - "**/*webgpu*"
    - "**/*WebGPU*"
    - "**/*.gpu.ts"
  bashPattern:
    - "enable-unsafe-webgpu"
    - "enable-webgpu-developer-features"
  priority: 40
---

# WebGPU

Writing WebGPU that works on the browsers you ship to, and does not fail silently when it does not. Whether WebGPU is the right fix for a slow page belongs to the `spa-performance` skill.

**WebGPU almost never throws.** A bad call returns an invalid object and reports the error later, and a lost device turns every call into a no-op. Wire up error reporting and device loss before anything else, or a black canvas is all you get.

Source checks and dates: [SOURCES.md](SOURCES.md).

## Procedure

1. Read [setup.md](./resources/setup.md). Detect, request only the features and limits the adapter has, and decide the fallback.
2. Add the `uncapturederror` listener and `device.lost` handler from [errors-and-device-loss.md](./resources/errors-and-device-loss.md). Label every object.
3. Read the resource for the thing you are building.
4. Check the resource's checklist before you call it done.

```
navigator.gpu? -> adapter? -> device?  --any no--> fallback, log why
                                 |
                       error listener + device.lost
                                 |
        +------------------------+------------------------+
        |                        |                        |
   draw to canvas           compute only              both
   canvas.md                compute.md                canvas.md, compute.md
        |                        |
        +---- buffers-and-textures.md, wgsl.md, pipelines.md ----+
                                 |
                      slow? measure: profiling.md
```

## Where to read

| Task | Resource |
| --- | --- |
| Support, detection, adapter, device, limits, fallback, old tutorials | [setup.md](./resources/setup.md) |
| Error scopes, labels, device loss and recovery | [errors-and-device-loss.md](./resources/errors-and-device-loss.md) |
| Usage flags, alignment, uploads, readback, textures, mipmaps | [buffers-and-textures.md](./resources/buffers-and-textures.md) |
| Struct layout, the vec3 trap, uniformity, overrides, extensions, precision | [wgsl.md](./resources/wgsl.md) |
| Async pipelines, explicit layouts, bind group frequency, instancing | [pipelines.md](./resources/pipelines.md) |
| Configure, frame loop, resize, React, workers | [canvas.md](./resources/canvas.md) |
| Workgroups, dispatch, bounds, barriers, atomics | [compute.md](./resources/compute.md) |
| GPU time with timestamp queries | [profiling.md](./resources/profiling.md) |

## The traps that cost the most time

| Symptom | Usual cause | Read |
| --- | --- | --- |
| Black canvas, no exception | An invalid object upstream. Read the first error, not the last. | [errors-and-device-loss.md](./resources/errors-and-device-loss.md) |
| Values shifted or garbled in the shader | `vec3` is 16-byte aligned. The CPU packed it at 12. | [wgsl.md](./resources/wgsl.md) |
| Works in dev, black after a while in production | Device lost and never recovered | [errors-and-device-loss.md](./resources/errors-and-device-loss.md) |
| Bind group rejected by a second pipeline | Both used `layout: 'auto'` | [pipelines.md](./resources/pipelines.md) |
| Blurry or stretched output | Canvas size in CSS pixels, not device pixels | [canvas.md](./resources/canvas.md) |
| Device creation fails on some machines | A feature or limit requested that the adapter lacks | [setup.md](./resources/setup.md) |
| Big buffer binding rejected though the GPU is large | The device got the default limit. Request it in `requiredLimits`. | [setup.md](./resources/setup.md) |
| Last elements never computed | Dispatch count truncated, not rounded up | [compute.md](./resources/compute.md) |
| `textureSample` compile error inside an `if` | Uniformity analysis | [wgsl.md](./resources/wgsl.md) |
| Two devices in development, one leaked | React Strict Mode cleanup ran during the async setup | [canvas.md](./resources/canvas.md) |

## Review checklist

- [ ] Every way setup can fail reaches a fallback, and the reason is logged
- [ ] An `uncapturederror` listener and a `device.lost` handler exist, and recovery starts from a new adapter
- [ ] Every descriptor has a `label`
- [ ] Features and limits are requested only when the adapter has them
- [ ] Every CPU-shared struct has known byte offsets
- [ ] Pipelines are created async, outside the frame loop
- [ ] `getCurrentTexture()` is called each frame, and the canvas is sized in device pixels
- [ ] Compute dispatches round up, and shaders bounds-check
- [ ] Readback never makes a frame wait
- [ ] Buffers, textures, and the device are destroyed on teardown
