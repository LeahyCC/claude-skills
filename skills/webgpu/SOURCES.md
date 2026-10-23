# Sources

Checked 2026-10-22. When a file changes, update its row here. Check dates live in this file only. Do not copy rules back into [SKILL.md](./SKILL.md).

## By file

| Claim home | Checked against |
| --- | --- |
| [setup.md](./resources/setup.md) | WebGPU editor's draft, 21 October 2026: `SecureContext`, `requestAdapter` options and null result, adapter consumed after one device, `requiredFeatures` `TypeError`, `requiredLimits` `OperationError`, default limits for core and compatibility, `GPUFeatureName` list, `maxInterStageShaderVariables`. W3C Candidate Recommendation Draft, 15 September 2026. gpuweb Implementation Status wiki, edited 2 October 2026 (per-OS and per-GPU rollout). MDN browser-compat-data 8.1.7 (`api/GPU.json`, `WorkerNavigator.gpu`, `OffscreenCanvas` `webgpu_context`, `GPUAdapter.info`). Chrome "What's New in WebGPU" 121, 133 (`featureLevel`, `@align` rule), 140, 144, 146 (compatibility mode on Android, other platforms being explored). Firefox 141 release notes. WebKit blog 16993 (Safari 26, including visionOS). three.js `WebGPURenderer` docs. Babylon.js WebGPU support page. |
| [errors-and-device-loss.md](./resources/errors-and-device-loss.md) | WebGPU editor's draft: error filters, `popErrorScope`, `uncapturederror` queued and throttleable, invalid-object propagation, `GPUPipelineError` for async pipelines, `GPUDeviceLostInfo` reasons, no errors after loss, consumed adapters reject and expired adapters give lost devices. Brandon Jones, "WebGPU device loss best practices" (toji.dev, not normative). |
| [buffers-and-textures.md](./resources/buffers-and-textures.md) | WebGPU editor's draft: usage flags, `MAP_READ` with `COPY_DST` only, `MAP_WRITE` with `COPY_SRC` only, multiple-of-4 rules, `writeBuffer` element vs byte units, map state and submit validation, `unmap` detaching, `destroy` unmapping, 256 rules for offsets, buffer-texture copies and query resolve, no alignment for `writeTexture`, `copyExternalImageToTexture` usages and `flipY`, no mipmap generation in the API, zero-initialized resources. |
| [wgsl.md](./resources/wgsl.md) | WGSL editor's draft, 21 October 2026: alignment and size table, uniform 16-byte stride rule, `@align(n)` must be a multiple of the required alignment, address spaces, `read_write` storage barred from vertex, uniformity rules and `derivative_uniformity` filter, overrides, enables and language extensions, precision, no recursion, no 64-bit types, out-of-bounds outcomes. WebGPU spec: zero-initialized memory including workgroup memory. Chrome 133 (`@align`), 134 (subgroups), 144 (`uniform_buffer_standard_layout`). |
| [pipelines.md](./resources/pipelines.md) | WebGPU editor's draft: async creation resolves when ready, sync may compile late, auto layouts cannot be shared, `maxBindGroups` 4, render bundles. Brandon Jones, "WebGPU bind group best practices" (toji.dev, not normative). |
| [render-basics.md](./resources/render-basics.md) | WebGPU editor's draft: coordinate systems (NDC Y up and Z 0..1, framebuffer Y down, texture origin at the first texel, match DirectX), near plane is application specific, `frontFace` `ccw` and `cullMode` `none` defaults, `depthWriteEnabled` required for depth formats and `depthCompare` required with depth writes, `sampleCount` 1 or 4, resolve target rules, `alphaToCoverageEnabled` rules, external texture expiry for `HTMLVideoElement` and `VideoFrame`. WGSL draft: `texture_external`, `textureSampleBaseClampToEdge`. Chrome "From WebGL to WebGPU" (updated 2025-09-16). webgpu-samples `reversedZ` and `helloTriangleMSAA`. |
| [canvas.md](./resources/canvas.md) | WebGPU editor's draft: `getCurrentTexture` expiry at the rendering update and on resize or configure, `unconfigure`, worker presentation and `requestAnimationFrame` in dedicated workers, `maxTextureDimension2D`. MDN `GPUCanvasContext.configure`. MDN browser-compat-data `ResizeObserverEntry.devicePixelContentBoxSize`. Chrome 140 post: `bgra8unorm-storage`. React Strict Mode double effects is React's documented behavior. |
| [compute.md](./resources/compute.md) | WebGPU editor's draft: compute limits, robust access. WGSL editor's draft: built-ins, `@workgroup_size` with overrides, barriers, atomic types and address spaces. |
| [profiling.md](./resources/profiling.md) | WebGPU editor's draft: `timestampWrites`, nanosecond `u64` values, coarsened precision, values may be negative or non-monotonic, `resolveQuerySet` 256 offset and `QUERY_RESOLVE`. Chrome WebGPU developer features page (updated 2025-06-03): 100 microsecond quantization, removed by the developer-features flag. |
| [debugging-and-testing.md](./resources/debugging-and-testing.md) | Chrome WebGPU troubleshooting tips (updated 2025-10-17): `chrome://gpu`, flags. Chrome "Supercharge Web AI model testing" (updated 2024-01-16): headless flags. `webgpu` npm package 0.6.2 (Dawn for Node, maintained by Chrome's WebGPU team). naga-cli 30.0.1 (wgpu project). WebGPU Inspector repository (community). |
| [scripts/wgsl-layout.mjs](./scripts/wgsl-layout.mjs) | WGSL editor's draft memory layout rules and the uniform address space rules. |

## How the code was checked

Run on 2026-10-22 on an Apple GPU (Metal) with Node 24.

| Check | Result |
| --- | --- |
| TypeScript examples in setup, errors, buffers, profiling, canvas (React), render-basics, and the Dawn test in debugging-and-testing, `tsc --strict` against `@webgpu/types` 0.1.74. Fragments were wrapped in declarations for the names they assume. | Pass |
| All 11 WGSL snippets, compiled with naga 30.0.1 and with Dawn (`webgpu` 0.6.2). Fragments were wrapped in the declarations they assume. | Pass, except the uniformity FAIL example, which Dawn rejects as intended. naga accepted it. |
| Compute step with 1000 particles (not a multiple of 64), read back with `readResults` | All 1000 moved |
| Workgroup reduction over 1000 values | Sum 1000 |
| Timestamp timer sketch on a small pass | Read real timestamps. Start equaled end, so the sample was dropped as written. |
| Second `requestDevice` on one adapter | Rejected with `OperationError` |
| `wgsl-layout.mjs` against the three layout examples in the WGSL spec | Every offset and size matches. Uniform checks flag the spec's invalid cases and pass its valid ones. |
| `wgsl-layout.mjs` against a real GPU: a shader writes markers into 9 members of the spec's struct B | All 9 land at the offsets the script printed |

Not run: the React component in a browser, the worker example, render-basics in a browser, headless Chrome, and other GPUs or browsers. Two larger compute runs crashed inside the Dawn Node package, not in the skill's code, and were not pursued.

## Not confirmed from a primary source

These are kept, and labeled where they appear.

- **Firefox WebGPU in `OffscreenCanvas` on macOS.** Compat data still says Windows only. The gpuweb status wiki lists Firefox macOS at 147, including Intel Macs, where compat data does not yet.
- **Workgroup size 64 as a starting point.** Community practice. No spec states it.
- **`chrome://gpucrash`** for testing device loss. A Chrome debug page, not rechecked on this date.
- **Compressed texture families by device class** (BC on desktop, ETC2 or ASTC on mobile). General practice. Check `adapter.features` on the device.
- **WebGPU Inspector browser support.** From its repository, not tested.

## Overlap

`spa-performance` owns whether WebGPU is the right fix, frame measurement, and when to move rendering or video decode to a worker. Its off-thread resource points here for API correctness. Engine and library skills (three.js, TypeGPU) own code where the library holds the device.
