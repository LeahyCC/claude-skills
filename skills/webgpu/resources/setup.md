# Setup and support

WebGPU needs four things to work: a secure page, a browser that ships it, an adapter, and a device. Each step can say no. Plan the fallback before the first draw call.

Sources are in [SOURCES.md](../SOURCES.md).

## Contents

- Support
- Detect, then fall back
- Adapter
- Device
- Old tutorials
- Checklist

## Support

| Browser | Since | Gaps |
| --- | --- | --- |
| Chrome, Edge | 113 on Windows, macOS, ChromeOS | Linux: Intel Gen12 and newer from 144, NVIDIA on Wayland (driver 535.183.01 and newer) from 147, others behind a flag. Windows on ARM64 behind a flag. |
| Chrome Android | 121 | Android 12 and newer on ARM, Qualcomm, and Intel GPUs. Imagination GPUs on Android 16 from 139. Samsung Xclipse not yet. |
| Firefox | 141 on Windows | macOS from 147 (Apple silicon on Tahoe from 145). No Linux or Android release yet. |
| Safari macOS, iOS, iPadOS, visionOS | 26 | |

Workers have `navigator.gpu` in the same versions. Firefox leaves it out of service workers. `OffscreenCanvas.getContext('webgpu')` matches, but compat data still marks Firefox as Windows only for it. Test before you rely on that on a Mac.

"Since" is the browser version. A user on that version can still get no adapter, for example on an old GPU or a blocklisted driver. Feature detection, not a version check, decides.

## Detect, then fall back

```
navigator.gpu?  --no-->  fallback (WebGL2 or a static view)
     | yes
requestAdapter() --null--> fallback
     | adapter
requestDevice()  --rejects--> fallback
     | device
draw
```

`navigator.gpu` is only defined in a secure context. Plain `http://` on anything other than localhost reports no WebGPU even in a browser that has it.

```ts
type GpuInit =
  | { kind: 'webgpu'; adapter: GPUAdapter; device: GPUDevice }
  | { kind: 'unsupported'; reason: string }

const wanted: GPUFeatureName[] = ['timestamp-query', 'shader-f16']

// Tries WebGPU and says why it could not, so the caller can pick a fallback and log the reason.
export async function initWebGpu(): Promise<GpuInit> {
  if (!('gpu' in navigator)) {
    return { kind: 'unsupported', reason: isSecureContext ? 'no navigator.gpu' : 'not a secure context' }
  }
  const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' })
  if (!adapter) return { kind: 'unsupported', reason: 'no adapter' }

  try {
    const device = await adapter.requestDevice({
      label: 'app',
      requiredFeatures: wanted.filter((f) => adapter.features.has(f)),
      requiredLimits: {
        // Ask only for what you need, and never more than the adapter has.
        maxStorageBufferBindingSize: Math.min(
          256 * 1024 * 1024,
          adapter.limits.maxStorageBufferBindingSize,
        ),
      },
    })
    return { kind: 'webgpu', adapter, device }
  } catch (err: unknown) {
    return { kind: 'unsupported', reason: err instanceof Error ? err.message : String(err) }
  }
}
```

Log the reason. "No adapter" on a support ticket means the GPU or driver, not your code.

### The fallback

The spec gives no fallback. Pick one by what you built:

| You use | Fallback |
| --- | --- |
| three.js `WebGPURenderer` | It falls back to a WebGL 2 backend by itself. `forceWebGL: true` tests that path. |
| Babylon.js | WebGL and WebGPU engines are kept side by side. Choose the engine before you build the scene. |
| Your own renderer | Keep a WebGL2 path, or show a still image and say why. Shaders do not port for free: WGSL is not GLSL. |
| Compute only | Run the same algorithm in a worker on the CPU, slower, and tell the user. |

## Adapter

| Option | Notes |
| --- | --- |
| `powerPreference` | `'low-power'` or `'high-performance'`. A hint, which the browser may ignore. |
| `featureLevel` | `'core'` by default. `'compatibility'` allows older GPUs with lower limits. |
| `forceFallbackAdapter` | Asks for a software adapter. Slow. For testing. |

`adapter.info` is synchronous and gives vendor, architecture, and `isFallbackAdapter`. The old `requestAdapterInfo()` was removed from Chrome in 131. Do not branch on vendor strings to pick features. Check `adapter.features` and `adapter.limits`.

**An adapter makes one device.** A second `requestDevice()` on the same adapter rejects (Chrome 140 and the spec). After device loss, start again from `requestAdapter()`. The recovery code is in [errors-and-device-loss.md](./errors-and-device-loss.md).

### Compatibility mode

`featureLevel: 'compatibility'` reaches GPUs that only run OpenGL ES 3.1. Chrome shipped it in 146 on Android. ChromeOS on OpenGL ES 3.1 and Windows on Direct3D 11 are being explored. Firefox and Safari do not support it, and a browser that cannot enforce it gives you a core adapter instead.

Limits are lower. `maxTextureDimension2D` is 4096, `maxComputeInvocationsPerWorkgroup` is 128, `maxUniformBufferBindingSize` is 16384, and the vertex stage has no storage buffers. If your shaders fit, request it and check `adapter.features.has('core-features-and-limits')` to know which you got.

## Device

| You pass | If the adapter cannot do it |
| --- | --- |
| A feature in `requiredFeatures` | Rejects with `TypeError` |
| A limit better than the adapter's | Rejects with `OperationError` |
| Nothing for a limit | You get the **default**, not the adapter's maximum |

The last row catches people. An adapter may allow a 1 GiB storage binding, but without `requiredLimits` the device enforces 128 MiB.

### Default limits

| Limit | Core | Compatibility |
| --- | --- | --- |
| `maxBindGroups` | 4 | 4 |
| `maxUniformBufferBindingSize` | 64 KiB | 16 KiB |
| `maxStorageBufferBindingSize` | 128 MiB | 128 MiB |
| `maxBufferSize` | 256 MiB | 256 MiB |
| `maxTextureDimension2D` | 8192 | 4096 |
| `maxComputeInvocationsPerWorkgroup` | 256 | 128 |
| `maxStorageBuffersInVertexStage` | 8 | 0 |
| `min{Uniform,Storage}BufferOffsetAlignment` | 256 | 256 |

### Optional features worth knowing

| Feature | Gives |
| --- | --- |
| `timestamp-query` | GPU timing ([profiling.md](./profiling.md)) |
| `shader-f16` | `enable f16;` half floats in WGSL |
| `subgroups` | Subgroup operations in compute and fragment shaders |
| `float32-filterable` | Linear filtering of 32-bit float textures |
| `texture-compression-bc`, `-etc2`, `-astc` | Compressed textures. Desktop usually has BC, mobile ETC2 or ASTC. |
| `indirect-first-instance` | `firstInstance` in indirect draws |

Request each only if `adapter.features` has it, and keep a path without it.

## Old tutorials

| Tutorial says | Now |
| --- | --- |
| `await adapter.requestAdapterInfo()` | `adapter.info`, synchronous |
| `adapter.isFallbackAdapter` | `adapter.info.isFallbackAdapter` |
| `compatibilityMode: true` | `featureLevel: 'compatibility'` |
| `maxInterStageShaderComponents` | Removed. Use `maxInterStageShaderVariables`. |
| Request a second device from the same adapter | Rejects. Request a new adapter. |
| No WebGPU on Linux | Chrome has it since 144 on Intel, 147 on NVIDIA with Wayland. Firefox still does not. |
| Safari needs a flag | Shipped in Safari 26 |
| `@align(4)` on a `vec3` member | Rejected since Chrome 133. `@align` must be a multiple of the type's own alignment. |

## Checklist

- [ ] Page is served over HTTPS or localhost
- [ ] `navigator.gpu`, a null adapter, and a rejected device all reach the fallback
- [ ] The reason for the fallback is logged
- [ ] Features and limits are requested only when the adapter has them
- [ ] Any limit above the default is in `requiredLimits`
- [ ] Device loss starts again from `requestAdapter()`
