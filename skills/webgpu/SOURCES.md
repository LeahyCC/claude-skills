# Sources

Checked 2026-10-22. When a file changes, update its row here. Do not copy rules back into [SKILL.md](./SKILL.md).

| Claim home | Checked against |
| --- | --- |
| [setup.md](./resources/setup.md) | WebGPU editor's draft, 21 October 2026: `SecureContext`, `requestAdapter` options and null result, adapter consumed after one device, `requiredFeatures` `TypeError`, `requiredLimits` `OperationError`, default limits for core and compatibility, `GPUFeatureName` list, `maxInterStageShaderVariables`. W3C Candidate Recommendation Draft, 15 September 2026. MDN browser-compat-data 8.1.7 (`api/GPU.json`, `WorkerNavigator.gpu`, `OffscreenCanvas` `webgpu_context`, `GPUAdapter.info`). Chrome "What's New in WebGPU" 121, 133, 140, 144, 146. Firefox 141 release notes. WebKit blog 16993 (Safari 26). three.js `WebGPURenderer` docs. Babylon.js WebGPU support page. |
| [errors-and-device-loss.md](./resources/errors-and-device-loss.md) | WebGPU editor's draft, 21 October 2026: error filters, `popErrorScope`, `uncapturederror` queued and throttleable, invalid-object propagation, `GPUPipelineError` for async pipelines, `GPUDeviceLostInfo` reasons, no errors after loss. Brandon Jones, "WebGPU device loss best practices" (toji.dev, not normative): new adapter before each device, recreate everything. |
| [buffers-and-textures.md](./resources/buffers-and-textures.md) | WebGPU editor's draft, 21 October 2026: usage flags, `MAP_READ` with `COPY_DST` only, `MAP_WRITE` with `COPY_SRC` only, multiple-of-4 rules, `writeBuffer` element vs byte units, map state and submit validation, `unmap` detaching, `destroy` unmapping, 256 rules for offsets, buffer-texture copies and query resolve, no alignment for `writeTexture`, `copyExternalImageToTexture` usages and `flipY`, no mipmap generation in the API. |
| [wgsl.md](./resources/wgsl.md) | WGSL editor's draft, 21 October 2026: alignment and size table, uniform 16-byte stride rule, address spaces, `read_write` storage barred from vertex, uniformity rules and `derivative_uniformity` filter, overrides, enables and language extensions, precision (2.5 ULP division, finite math, integer divide by zero), no recursion, no 64-bit types, out-of-bounds outcomes. Chrome 134 (subgroups) and 144 (`uniform_buffer_standard_layout`). |
| [pipelines.md](./resources/pipelines.md) | WebGPU editor's draft, 21 October 2026: async creation resolves when ready, sync may compile late, auto layouts cannot be shared, `maxBindGroups` 4, render bundles. Brandon Jones, "WebGPU bind group best practices" (toji.dev, not normative): group by change frequency. |
| [canvas.md](./resources/canvas.md) | WebGPU editor's draft, 21 October 2026: `getCurrentTexture` expiry at the rendering update and on resize or configure, `unconfigure`, worker presentation and `requestAnimationFrame` in dedicated workers, `maxTextureDimension2D`. MDN `GPUCanvasContext.configure` (formats, `alphaMode`, `colorSpace`, `toneMapping`, `usage`). MDN browser-compat-data `ResizeObserverEntry.devicePixelContentBoxSize`. React Strict Mode double effects is React's documented behavior. |
| [compute.md](./resources/compute.md) | WebGPU editor's draft, 21 October 2026: compute limits, robust access. WGSL editor's draft: built-ins, `@workgroup_size` with overrides, barriers, atomic types and address spaces. |
| [profiling.md](./resources/profiling.md) | WebGPU editor's draft, 21 October 2026: `timestampWrites`, nanosecond `u64` values, coarsened precision, values may be negative or non-monotonic, `resolveQuerySet` 256 offset and `QUERY_RESOLVE`. |

## Not confirmed from a primary source

These are kept, and labeled where they appear.

- **Chrome's 100 microsecond timestamp quantization** and the developer-features flag that removes it. Seen in a summary of Chrome's WebGPU developer-features page, not the full page.
- **Firefox WebGPU in `OffscreenCanvas` on macOS.** Compat data still says Windows only, which may be stale next to the macOS notes on `GPU` itself.
- **Workgroup size 64 as a starting point.** Community practice. No spec states it.
- **`chrome://gpucrash`** for testing device loss. A Chrome debug page, not rechecked on this date.
- **Compressed texture families by device class** (BC on desktop, ETC2 or ASTC on mobile). General practice. Check `adapter.features` on the device.
- **`webgpu-utils`** is a third-party library mentioned as an option, not an authority.

## Overlap

`spa-performance` owns whether WebGPU is the right fix, frame measurement, and when to move rendering to a worker. Its off-thread resource points here for API correctness. This skill owns how to use the API correctly.
