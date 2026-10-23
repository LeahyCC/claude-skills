# webgpu

Writing WebGPU and WGSL that work across browsers and fail loudly when they do not. Setup and fallback, buffers and alignment, shaders, pipelines, the canvas loop, compute, device loss, and GPU timing.

Whether WebGPU will make a page faster is in [spa-performance](../spa-performance/).

## Install

```bash
npx skills add LeahyCC/claude-skills@webgpu
```

## What it does

Use it when you write or debug WebGPU code or `.wgsl` files. The entry file is a procedure and a symptom table. Each resource owns one part of the API.

Version 0.1.0. Eight resources are written.

## Coverage

| Resource | Topics |
| --- | --- |
| [setup.md](./resources/setup.md) | Browser support, secure context, adapter, device, features, default limits, compatibility mode, fallback, outdated tutorial APIs |
| [errors-and-device-loss.md](./resources/errors-and-device-loss.md) | How errors arrive, error scopes, labels, pipeline errors, device loss and recovery |
| [buffers-and-textures.md](./resources/buffers-and-textures.md) | Upload paths, usage flags, alignment, dynamic offsets, mapping and readback, textures, mipmaps, destroy |
| [wgsl.md](./resources/wgsl.md) | Memory layout, the vec3 trap, uniform layout, address spaces, uniformity, overrides, extensions, precision |
| [pipelines.md](./resources/pipelines.md) | Async creation, explicit layouts, bind group frequency, instancing, render bundles |
| [canvas.md](./resources/canvas.md) | Configure, one texture per frame, device-pixel sizing, React with Strict Mode, workers |
| [compute.md](./resources/compute.md) | Workgroups, built-ins, limits, bounds checks, large dispatches, workgroup memory, barriers, atomics |
| [profiling.md](./resources/profiling.md) | Which clock answers what, timestamp queries, quantization, reading the numbers |

8 resource files.

## What's different

| Typical WebGPU tutorial | This skill |
| --- | --- |
| `requestAdapter()` then straight to drawing | Every failure path reaches a fallback, and the reason is logged |
| Errors are someone else's problem | Listener, labels, and device-loss recovery from a new adapter come first |
| `layout: 'auto'` everywhere | Explicit layouts, so bind groups can be shared |
| `requestAdapterInfo()`, Linux unsupported | Checked against the 21 October 2026 editor's draft and current release notes |
| `performance.now()` around `submit()` | Timestamp queries, with the browser's quantization stated |

Checked sources are in [SOURCES.md](./SOURCES.md).

## License

[MIT](../../LICENSE)
