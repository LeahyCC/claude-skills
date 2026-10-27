# webgpu

Writing WebGPU and WGSL that work across browsers and fail loudly when they do not. Setup and fallback, buffers and alignment, shaders, pipelines, drawing, the canvas loop, compute, device loss, GPU timing, and testing.

Whether WebGPU will make a page faster is in [spa-performance](../spa-performance/).

## Install

```bash
npx skills add LeahyCC/claude-skills@webgpu
```

Or inside Claude Code:

```text
/plugin install webgpu --marketplace LeahyCC/claude-skills
```

## What it does

Use it when you write or debug WebGPU code or `.wgsl` files. The entry file is a procedure and a symptom table. Each resource owns one part of the API. A bundled script prints struct byte offsets so nobody counts padding by hand.

Version 0.2.0. Ten resources and one script.

## Coverage

| File | Topics |
| --- | --- |
| [setup.md](./resources/setup.md) | Browser support, secure context, adapter, device, features, default limits, compatibility mode, fallback, outdated tutorial APIs |
| [errors-and-device-loss.md](./resources/errors-and-device-loss.md) | How errors arrive, error scopes, labels, pipeline errors, device loss and recovery |
| [buffers-and-textures.md](./resources/buffers-and-textures.md) | Upload paths, usage flags, alignment, dynamic offsets, mapping and readback, textures, mipmaps, zeroed memory, destroy |
| [wgsl.md](./resources/wgsl.md) | Memory layout, the vec3 trap, uniform layout, address spaces, uniformity, overrides, extensions, precision, untrusted shaders |
| [pipelines.md](./resources/pipelines.md) | Async creation, explicit layouts, bind group frequency, instancing, render bundles |
| [render-basics.md](./resources/render-basics.md) | Coordinates and WebGL porting, vertex layouts, depth, culling, blending, MSAA, video frames |
| [canvas.md](./resources/canvas.md) | Configure, one texture per frame, device-pixel sizing, React with Strict Mode, workers |
| [compute.md](./resources/compute.md) | Workgroups, built-ins, limits, bounds checks, large dispatches, workgroup memory, barriers, atomics |
| [profiling.md](./resources/profiling.md) | Which clock answers what, timestamp queries, quantization, reading the numbers |
| [debugging-and-testing.md](./resources/debugging-and-testing.md) | `chrome://gpu`, debug markers, capture tools, naga, tests in Node with Dawn, headless Chrome, how far code was checked |
| [scripts/wgsl-layout.mjs](./scripts/wgsl-layout.mjs) | Prints offset, size, and padding for every struct in a WGSL file, and flags uniform-layout errors. No dependencies. |

10 resource files, 1 script.

## What's different

| Typical WebGPU tutorial | This skill |
| --- | --- |
| `requestAdapter()` then straight to drawing | Every failure path reaches a fallback, and the reason is logged |
| Errors are someone else's problem | Listener, labels, and device-loss recovery from a new adapter come first |
| Count struct padding by hand | A script prints the offsets, checked against the spec's examples and a real GPU |
| `layout: 'auto'` everywhere | Explicit layouts, so bind groups can be shared |
| `requestAdapterInfo()`, "no WebGPU on Linux" | Checked against the current spec and browser release notes |
| `performance.now()` around `submit()` | Timestamp queries, with the browser's quantization stated |
| "It works" | The report says whether it was type-checked, compiled, run on a GPU, or run in a browser |

Checked sources and how the examples were tested are in [SOURCES.md](./SOURCES.md).

## License

[MIT](../../LICENSE)
