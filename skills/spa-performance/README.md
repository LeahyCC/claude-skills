# spa-performance

Main thread, frame time, and memory for a single-page app. Measure the moment a person feels, draw less before you thread it, and prove the change alone and with the rest.

React re-renders, bundles, the compiler, and Server Components stay in [react-performance](../react-performance/).

## Install

```bash
npx skills add LeahyCC/claude-skills@spa-performance
```

## What it does

Use it when a gesture, a keystroke, a live tick, or a document stalls the page. The entry file is a procedure. Each resource owns one decision.

Version 0.2.0. Eight resources are written.

## Coverage

| Resource | Status | Topics |
| --- | --- | --- |
| [measure.md](./resources/measure.md) | written | Lab vs field, frame gaps, cold and warm, heap vs resident set, a rerunnable harness |
| [draw-less.md](./resources/draw-less.md) | written | Windows, content-visibility, release, level of detail, tiles, chart decimation |
| [off-thread.md](./resources/off-thread.md) | written | scheduler.yield, workers, transferables, OffscreenCanvas, WebGPU last |
| [hosted-editor.md](./resources/hosted-editor.md) | written | Shared main thread, host contracts, tldraw, the Figma contrast |
| [typing.md](./resources/typing.md) | written | Keystroke to next paint, which work stays on the main thread, viewport parse, canvas input |
| [grids.md](./resources/grids.md) | written | Two-axis window, buffer, variable height, editor overlay, scroll-height stretch, canvas-cell trace, formula ranges |
| [streams.md](./resources/streams.md) | written | One paint per frame, what must not be dropped, backpressure, a burst |
| [audio-video.md](./resources/audio-video.md) | written | AudioWorklet deadline, codec support, the audio clock, closing frames |

8 resource files. 8 written.

## What's different

| Typical performance note | This skill |
| --- | --- |
| Add a worker and call it done | Time the worker alone and with the windowing. A lone worker can leave the load slow. |
| One fps number | Average fps, p95, worst frame, dropped frames. Average hides the hitch. |
| JS heap went down | Name the store that holds the bytes. Blobs and decoded bitmaps are not on the heap. |
| WebGPU is faster | WebGPU comes after you own the renderer and the wall is submission or compute. |

Checked sources are in [SOURCES.md](./SOURCES.md).

## License

[MIT](../../LICENSE)
