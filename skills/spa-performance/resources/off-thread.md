# Off the main thread

The main thread paints, lays out, and takes input. Anything else can leave, after [draw-less.md](./draw-less.md) has removed the work that should not happen at all.

| Cost | Where it runs |
| --- | --- |
| DOM, layout, or the thing under the user's finger | Main thread. If it would be a long task, yield. The line is in [measure.md](./measure.md). |
| CPU, no DOM, long enough that the postMessage cost is smaller than the work | Worker. Transfer the bytes. |
| The draw call itself is the freeze | OffscreenCanvas in that worker. Input events stay on the main thread. |
| Deadline is not a frame (audio, video encode) | [audio-video.md](./audio-video.md) |
| You already own a GPU renderer, and the wall is draw-call submission or a compute step | WebGPU, with WebGL2 until the machines you care about have it. |

Skip the worker when the task is short, the message is bigger than the work, or you would post a message on every pointer move. Structured clone copies. Transfer `ArrayBuffer`, `ImageBitmap`, and `OffscreenCanvas`. After a transfer, the sender's buffer is detached.

Worker startup is real. Keep a worker and reuse it. Do not put the first keystroke or the first paint behind a worker boot.

`SharedArrayBuffer` needs cross-origin isolation (`COOP` and `COEP`). That isolation breaks some embeds. Do not turn it on for a hot loop you have not measured.

## Support

MDN browser-compat-data 8.1.7, fetched 2026-10-22. Chrome on Android and Firefox on Android match desktop. Safari on iOS matches Safari.

| API | Chrome | Edge | Firefox | Safari |
| --- | --- | --- | --- | --- |
| `scheduler.yield()` | 129 | 129 | 142 | none |
| `transferControlToOffscreen()` | 69 | 79 | 105 | 16.4 |
| Worker `{ type: 'module' }` | 80 | 80 | 114 | 15 |

## Yield

`scheduler.yield()` pauses and continues at the front of similar tasks, so input and rendering can run, then your function resumes before unrelated work. `setTimeout(0)` queues at the back. Nested timers are clamped (the HTML spec uses 4 ms), so a long job of tiny timeouts falls behind.

`isInputPending()` is deprecated. It can report no input when input is waiting, and animation needs a yield too. Yield on a time budget, not on that check.

Safari does not implement `scheduler.yield()`, on desktop or iOS. Feature-detect. The fallback still yields. It does not get the front-of-queue continuation.

```ts
function yieldToMain(): Promise<void> {
  const scheduler = globalThis.scheduler
  if (scheduler && typeof scheduler.yield === 'function') {
    return scheduler.yield()
  }
  return new Promise((resolve) => {
    setTimeout(resolve, 0)
  })
}

// Yield about every long-task interval (measure.md), not every item.
// Yielding more often than the work itself is its own cost.
async function runJobs(jobs: Array<() => void>, deadlineMs = 50): Promise<void> {
  let lastYield = performance.now()
  for (const job of jobs) {
    job()
    if (performance.now() - lastYield >= deadlineMs) {
      await yieldToMain()
      lastYield = performance.now()
    }
  }
}
```

`forEach` does not await. The loop has to be `for...of` inside an `async` function.

## Worker

```ts
const worker = new Worker(new URL('./parse.worker.ts', import.meta.url), { type: 'module' })
const bytes = await file.arrayBuffer()
// The transfer list moves the buffer. Omitting it clones the whole file.
worker.postMessage({ type: 'open', bytes }, [bytes])
```

Type the messages on both sides from one declaration so the two ends cannot drift. Cap in-flight jobs. Abort a job whose result is no longer on screen.

Libraries written for a window fail in three quiet ways: they read `window.location` and fall back to doing the heavy work on your worker thread anyway, they call `document.createElement`, or they read `document.baseURI`. Pass an explicit worker URL, an `OffscreenCanvas` factory, and the flags the library uses to decide those.

Failure: the library logs that it fell back to a fake worker. The heavy work never left the thread. The check is that log line, plus a trace.

## OffscreenCanvas

```ts
const canvas = document.querySelector('canvas')
if (canvas && 'transferControlToOffscreen' in canvas) {
  const offscreen = canvas.transferControlToOffscreen()
  worker.postMessage({ type: 'canvas', canvas: offscreen }, [offscreen])
}
```

After `transferControlToOffscreen()`, the main thread cannot draw that canvas. Pointer events still arrive on the main thread. Forward the ones the worker needs. Hit testing stays with the scene graph. If the scene graph is on the main thread, the worker only draws.

The worker's `requestAnimationFrame` can keep painting while the main thread is busy. Input latency is still bounded by how fast the main thread reads the event.

## WebGPU

There is no universal speedup over WebGL2. The same pixels on a full-screen shader are the same silicon.

WebGPU pays when one of these is the measured wall:

- Many draw calls, where WebGL's per-call validation dominates (CPU-bound submission).
- A compute step (culling, particles, a filter) that you want on the GPU.

It does not pay for a DOM list, a hosted editor that paints SVG, or a document of images. Figma's WebGPU path came after a custom tile renderer that had already left the DOM. Their earlier notes name why HTML, SVG, and Canvas2D lost for that product: DOM cost, Canvas2D re-uploading geometry every frame, and effects those APIs do not have.

Ship WebGL2 beside it until you have checked the browsers you support. How to set it up, detect it, and recover from device loss is in the `webgpu` skill. Readback (`getImageData`, a synchronous map) will stall whichever API you pick.
