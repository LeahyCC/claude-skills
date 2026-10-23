# Canvas and the frame loop

A WebGPU canvas is a `GPUCanvasContext` that hands you one texture per frame. Most canvas bugs are a stale texture, a blurry or stretched size, or a React effect that leaks a device.

Sources are in [SOURCES.md](../SOURCES.md).

## Contents

- Configure
- One texture per frame
- Size
- React
- In a worker
- Checklist

## Configure

```ts
const context = canvas.getContext('webgpu')
if (!context) throw new Error('WebGPU canvas context unavailable')

const format = navigator.gpu.getPreferredCanvasFormat()
context.configure({
  device,
  format,
  alphaMode: 'premultiplied', // 'opaque' is the default and ignores alpha
})
```

| Option | Default | Notes |
| --- | --- | --- |
| `format` | required | `bgra8unorm`, `rgba8unorm`, or `rgba16float`. Use `getPreferredCanvasFormat()`. Another choice can cost an extra copy. |
| `alphaMode` | `'opaque'` | Use `'premultiplied'` to show the page through. Your shader must then output premultiplied color. |
| `colorSpace` | `'srgb'` | `'display-p3'` for wide gamut |
| `toneMapping` | `{ mode: 'standard' }` | `'extended'` with `rgba16float` for HDR |
| `usage` | `RENDER_ATTACHMENT` | Add `STORAGE_BINDING` to write from compute. `rgba8unorm` allows it. `bgra8unorm`, which `getPreferredCanvasFormat()` often returns, needs the `bgra8unorm-storage` feature. |

Pipelines that draw to the canvas must use the same `format` in their color target. Build them after you know it.

## One texture per frame

Call `getCurrentTexture()` inside the frame, every frame. The texture is presented and expires at the next rendering update. Resizing the canvas or calling `configure()` also expires it.

FAIL. Caching the texture.

```ts
const view = context.getCurrentTexture().createView() // expires after the first frame
function frame() {
  draw(view)
  requestAnimationFrame(frame)
}
```

PASS.

```ts
function frame() {
  const encoder = device.createCommandEncoder({ label: 'frame' })
  const pass = encoder.beginRenderPass({
    colorAttachments: [
      {
        view: context.getCurrentTexture().createView(),
        clearValue: [0, 0, 0, 0],
        loadOp: 'clear',
        storeOp: 'store',
      },
    ],
  })
  scene.draw(pass)
  pass.end()
  device.queue.submit([encoder.finish()])
  rafId = requestAnimationFrame(frame)
}
```

Command buffers are single-use. Build a new encoder each frame. Build the pipelines and bind groups once, outside the loop.

## Size

The canvas draws at `canvas.width` by `canvas.height` device pixels. CSS only stretches the result. Set the backing size from the element's real size, and clamp it to `device.limits.maxTextureDimension2D` (8192 by default, 4096 in compatibility mode).

`devicePixelContentBoxSize` gives exact device pixels with no rounding guess. MDN compat data, 2026-10-22: Chrome 84, Firefox 108, no Safari. Fall back to the CSS size times `devicePixelRatio`.

```ts
// Keeps the backing store in device pixels so lines stay sharp.
function observeSize(canvas: HTMLCanvasElement, device: GPUDevice, onResize: () => void) {
  const max = device.limits.maxTextureDimension2D
  const observer = new ResizeObserver(([entry]) => {
    const exact = entry.devicePixelContentBoxSize?.[0]
    const css = entry.contentBoxSize[0]
    const w = exact ? exact.inlineSize : Math.round(css.inlineSize * devicePixelRatio)
    const h = exact ? exact.blockSize : Math.round(css.blockSize * devicePixelRatio)
    canvas.width = Math.max(1, Math.min(w, max))
    canvas.height = Math.max(1, Math.min(h, max))
    onResize() // Recreate depth and other size-matched textures here.
  })
  try {
    observer.observe(canvas, { box: 'device-pixel-content-box' })
  } catch {
    observer.observe(canvas, { box: 'content-box' })
  }
  return () => observer.disconnect()
}
```

The canvas texture resizes itself. Your depth texture and offscreen targets do not. Recreate them in `onResize`, and destroy the old ones.

## React

React mounts effects twice in development under Strict Mode. Device setup is async, so the cleanup can run before the setup finishes. Guard both.

```tsx
'use client'

import { useEffect, useRef } from 'react'

// Owns the canvas, the device, and the frame loop for one component instance.
export function GpuCanvas({ createScene }: { createScene: SceneFactory }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !navigator.gpu) return

    let cancelled = false
    let rafId = 0
    let device: GPUDevice | undefined
    let stopResize = () => {}

    void (async () => {
      const adapter = await navigator.gpu.requestAdapter()
      if (!adapter || cancelled) return
      const d = await adapter.requestDevice()
      // Cleanup already ran during the await. Do not leak the device.
      if (cancelled) return d.destroy()
      device = d

      const context = canvas.getContext('webgpu')
      if (!context) return
      const format = navigator.gpu.getPreferredCanvasFormat()
      context.configure({ device: d, format, alphaMode: 'premultiplied' })

      const scene = await createScene(d, format)
      if (cancelled) return

      stopResize = observeSize(canvas, d, () => scene.resize(canvas.width, canvas.height))

      const frame = () => {
        const encoder = d.createCommandEncoder()
        scene.encode(encoder, context.getCurrentTexture())
        d.queue.submit([encoder.finish()])
        rafId = requestAnimationFrame(frame)
      }
      rafId = requestAnimationFrame(frame)
    })()

    return () => {
      cancelled = true
      cancelAnimationFrame(rafId)
      stopResize()
      device?.destroy()
    }
  }, [createScene])

  return <canvas ref={canvasRef} className="block h-full w-full" />
}

type Scene = {
  resize(width: number, height: number): void
  encode(encoder: GPUCommandEncoder, target: GPUTexture): void
}
type SceneFactory = (device: GPUDevice, format: GPUTextureFormat) => Promise<Scene>
```

- `createScene` must be stable (module scope or `useCallback`), or the effect rebuilds the device on every render.
- Keep per-frame data in refs or a store the loop reads. Do not drive the loop with React state.
- In Next.js the component needs `'use client'`. `navigator.gpu` does not exist on the server.
- Add device-loss recovery from [errors-and-device-loss.md](./errors-and-device-loss.md) for production.

## In a worker

Transfer the canvas and render from a dedicated worker. The worker has `navigator.gpu` and its own `requestAnimationFrame`. Presentation happens on the worker's rendering update. Support for WebGPU in workers is in [setup.md](./setup.md).

```ts
// main.ts
const offscreen = canvas.transferControlToOffscreen()
const worker = new Worker(new URL('./gpu.worker.ts', import.meta.url), { type: 'module' })
worker.postMessage({ canvas: offscreen }, [offscreen])
```

```ts
// gpu.worker.ts
self.onmessage = async ({ data }: MessageEvent<{ canvas: OffscreenCanvas }>) => {
  const adapter = await navigator.gpu.requestAdapter()
  if (!adapter) return
  const device = await adapter.requestDevice()
  const context = data.canvas.getContext('webgpu')
  if (!context) return
  context.configure({ device, format: navigator.gpu.getPreferredCanvasFormat() })
  // Same frame loop as above, using the worker's requestAnimationFrame.
}
```

Input events still arrive on the main thread. Post them to the worker. Resize also starts on the main thread: post the new size, and set `width` and `height` on the `OffscreenCanvas` inside the worker. When to move rendering to a worker at all is in the `spa-performance` skill.

## Checklist

- [ ] `getCurrentTexture()` is called inside every frame
- [ ] Pipelines use the configured canvas format
- [ ] Backing size is in device pixels and clamped to `maxTextureDimension2D`
- [ ] Depth and offscreen targets are rebuilt and old ones destroyed on resize
- [ ] React cleanup cancels the frame, stops observers, and destroys the device even if setup was mid-await
- [ ] `alphaMode: 'premultiplied'` comes with premultiplied shader output
