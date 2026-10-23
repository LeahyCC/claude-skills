# Errors and device loss

WebGPU calls almost never throw. A bad call makes an error object and reports it later. The device itself can also disappear at any time. An app that ignores both shows a black canvas with nothing in the console that it chose to log.

Facts below are from the WebGPU editor's draft of 21 October 2026, checked 2026-10-22. Recovery steps follow Brandon Jones's device-loss guide (a Chrome WebGPU spec editor, not normative). Sources are in [SOURCES.md](../SOURCES.md).

## How errors arrive

```
createBuffer(bad)  ->  returns an "invalid" buffer, no throw
                         |
                         v
        error goes to the innermost open error scope
                         |
              none open? |
                         v
        device 'uncapturederror' event (fired later, may be throttled)
```

Every object made from an invalid object is invalid too. One bad buffer can sink a bind group, a pass, and a submit. The first error is the one to read.

| Filter | Catches |
| --- | --- |
| `'validation'` | Wrong usage, wrong size, wrong layout. Your bug. |
| `'out-of-memory'` | The allocation did not fit |
| `'internal'` | The implementation failed, often a shader too large for the driver |

## Always listen for uncaptured errors

```ts
device.addEventListener('uncapturederror', (event) => {
  // event.error is a GPUValidationError, GPUOutOfMemoryError, or GPUInternalError.
  reportError(event.error.message)
})
```

The console may also show them, but the listener is how they reach your telemetry.

## Scope the calls you can handle

Use an error scope when you have a plan for the failure. Out-of-memory on a large texture is the usual case. Scopes are a stack. Pop in reverse order.

```ts
// Try the full-size target, and drop to half size if the GPU refuses.
async function createTarget(device: GPUDevice, w: number, h: number) {
  device.pushErrorScope('out-of-memory')
  const texture = device.createTexture({
    label: 'target.full',
    size: [w, h],
    format: 'rgba16float',
    usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
  })
  const error = await device.popErrorScope()
  if (!error) return texture

  texture.destroy()
  return device.createTexture({
    label: 'target.half',
    size: [Math.ceil(w / 2), Math.ceil(h / 2)],
    format: 'rgba8unorm',
    usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
  })
}
```

Do not wrap every frame in a validation scope and await it. It turns an async report into a stall, and it hides nothing a listener would not show.

## Label everything

Every descriptor takes a `label`. Browsers put labels in error messages. "Buffer 'particles.results' used as STORAGE but created without it" beats "Buffer used as STORAGE".

Label with the owner and the role: `'shadow.depth'`, `'ui.quad.vertices'`. Labels cost nothing to keep in production.

## Shader compile errors

`createShaderModule` reports through the same scopes and event. For line numbers, call `getCompilationInfo()`. The pattern is in [wgsl.md](./wgsl.md).

`createRenderPipelineAsync` and `createComputePipelineAsync` are different. They reject their promise with a `GPUPipelineError` and do not raise a device error. Catch them.

## Device loss

The device can be lost by a driver crash or update, a GPU reset, a shader that runs too long and trips the system's GPU timeout, or your own `device.destroy()`. The browser decides the rest, so treat loss as something that can happen at any time.

After loss, every call is a silent no-op. No errors are reported, not even for bad calls. `device.lost` is the only signal.

| `info.reason` | Meaning | Do |
| --- | --- | --- |
| `'destroyed'` | You called `destroy()` | Nothing. Teardown was on purpose. |
| `'unknown'` | Anything else | Recover |

### Recover

1. Get a **new adapter**. An adapter that already made a device is consumed, and `requestDevice` on it returns a device that is already lost.
2. Request a new device with the same features and limits.
3. Recreate every buffer, texture, sampler, bind group, and pipeline. Nothing from the old device works on the new one.
4. Reconfigure the canvas with the new device.
5. Re-upload data. GPU memory is gone. Keep the CPU copy, or the way to rebuild it.

```ts
type Renderer = { destroy(): void }

// Owns the device and rebuilds the renderer whenever the device is lost.
async function startGpu(
  build: (device: GPUDevice) => Promise<Renderer>,
  onFatal: (message: string) => void,
): Promise<() => void> {
  let stopped = false
  let renderer: Renderer | undefined
  let attempts = 0

  async function boot(): Promise<void> {
    const adapter = await navigator.gpu.requestAdapter()
    if (!adapter) return onFatal('No GPU adapter')
    const device = await adapter.requestDevice()

    device.lost.then((info) => {
      renderer?.destroy()
      renderer = undefined
      if (stopped || info.reason === 'destroyed') return
      // A shader that crashes the GPU will crash it again. Give up after a few tries.
      if (++attempts > 3) return onFatal(info.message)
      void boot()
    })

    renderer = await build(device)
  }

  await boot()
  return () => {
    stopped = true
    renderer?.destroy()
  }
}
```

Each renderer's `destroy()` must call `device.destroy()`. That resolves `lost` with `'destroyed'`, and the loop stops.

Test it. In Chrome, `chrome://gpucrash` crashes the GPU process. Calling `device.destroy()` from the console exercises the same path, but with reason `'destroyed'`, so stub the check while testing.

## Checklist

- [ ] An `uncapturederror` listener reports to the same place as other app errors
- [ ] Every descriptor has a label
- [ ] Out-of-memory on large allocations has a smaller fallback
- [ ] Async pipeline promises have a `catch`
- [ ] `device.lost` rebuilds from a new adapter, with a retry cap
- [ ] The CPU keeps what it needs to re-upload after a loss
