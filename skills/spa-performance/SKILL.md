---
name: spa-performance
description: >
  Use when an SPA is slow because of the main thread, frame time, or memory:
  Web Workers, OffscreenCanvas, scheduler.yield, virtualized or windowed
  rendering, canvas and DOM editors, image swaps, flicker, blank frames,
  live updates, or a performance harness.
  Not React re-renders, bundles, or Server Components (see react-performance).
---

# SPA performance

Browser performance for a single-page app: what runs on the main thread, what is worth drawing, and how to prove a change helped. Framework rendering, bundle size, and Server Components belong to the `react-performance` skill.

**Measure the moment the user feels, then change one thing.** A faster load that stalls the gesture is a loss. Measure that change alone and again with the rest of the system. Thresholds, the harness, and the worked example live in [measure.md](./resources/measure.md).

Source checks and what is still open: [SOURCES.md](SOURCES.md).

## Procedure

1. Name the moment: first paint of a thing, a gesture (pan, scroll, drag), a keystroke, or a tick of live data.
2. Read the one resource for that moment before choosing a technique. If its first line says `Status: open` or `Status: partial`, apply the written rules and do not invent the items under its Fill in list.
3. Record a baseline with the harness in [measure.md](./resources/measure.md). DevTools finds the cause. The quoted number comes from a rerun with DevTools closed.
4. Classify the cost and change the smallest thing that attacks it.

```
name the moment
        |
        v
too much work? ----yes----> draw less (window, rough pass, release, cancel)
        |
        no
        v
long task on the main thread?
        |
        +-- touches DOM or layout --------> yield
        +-- CPU only, no DOM -------------> worker, transfer the bytes
        +-- the draw itself is the freeze -> OffscreenCanvas in that worker
        +-- deadline is not a frame ------> audio and video
        |
        v
you already own a GPU renderer, and submission or compute is the wall
        |
        v
WebGPU, with a WebGL2 fallback
```

5. Measure the change alone, then with the other changes. Publish cold and warm separately.

A hosted editor (tldraw, and the same class of canvas) shares the main thread with the app. Read [hosted-editor.md](./resources/hosted-editor.md) before optimizing around it. A worker can take your pixels. It cannot take the host's hit testing.

## Where to read

| Moment | Resource | Status |
| --- | --- | --- |
| Prove a before and after | [measure.md](./resources/measure.md) | written |
| Lists, pages, maps, charts: draw less | [draw-less.md](./resources/draw-less.md) | written |
| Yield, worker, OffscreenCanvas, WebGPU | [off-thread.md](./resources/off-thread.md) | written |
| tldraw and other hosted editors | [hosted-editor.md](./resources/hosted-editor.md) | written |
| Code, docs, chat: the keystroke | [typing.md](./resources/typing.md) | written |
| Sheets and grids: rows and columns | [grids.md](./resources/grids.md) | written |
| Logs, prices, live dashboards | [streams.md](./resources/streams.md) | written |
| Audio and video deadlines | [audio-video.md](./resources/audio-video.md) | written |

Maps, large images, and chart series are [draw-less.md](./resources/draw-less.md): tiles, and one sample per screen pixel. An `<img>` swap that blanks the old picture is in that file too.

## Review checklist

- [ ] The moment is named, and the number is from a scripted rerun, not a single hand gesture
- [ ] Cold and warm are separate, and the previous run cannot write the next run's result
- [ ] Frame numbers are headed, with window size and device pixel ratio written down
- [ ] The gesture was run at 1x and at 2x, and the note says which bottleneck each showed ([measure.md](./resources/measure.md))
- [ ] A long frame has a trace, self time by event name, before any fix ([measure.md](./resources/measure.md))
- [ ] Memory is the store that actually holds the bytes, not only the JS heap
- [ ] A switch that wins on load was also timed on the gesture
- [ ] Hit testing and geometry follow the host's record, not live zoom read during render
- [ ] The character just typed is painted before any worker or full-buffer analysis returns
- [ ] In-flight work is cancelled when it leaves the window
- [ ] The quoted build is production, and the measuring UI was closed or its cost stated
