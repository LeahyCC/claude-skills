# Measure

Record the moment a person feels, in a way you can run again. DevTools explains a trace. A quoted before and after comes from the harness below, with DevTools closed. Opening DevTools changes the cost.

Thresholds for this skill live here.

| Name | Value | Use |
| --- | --- | --- |
| One frame at 60 Hz | about 16.7 ms | Smoothness of a gesture |
| Long task | over 50 ms on the main thread | Responsiveness. Blocking time is the part past 50 ms. |
| Long animation frame | render update past 50 ms | Field diagnosis. Includes style and layout, and names scripts over 5 ms. Chrome 123+. |
| INP | 200 ms or under is good | Interaction to the next paint, worst case in the field (p98) |

INP has three phases: input delay (the main thread was busy), processing (your handler), presentation (style, layout, paint). Fix the phase you measured. A worker does nothing for a presentation delay. One click or one key splits into those three numbers below. A pan stays on frame gaps.

## Lab and field

Field data tells you which interaction real people hit. Lab data tells you whether your change moved that interaction.

- Field: INP with attribution, and long animation frames. Long tasks alone say "somewhere in this document" and stop before paint.
- Lab: a scripted gesture on a fixed document, fixed window, fixed device pixel ratio. Lighthouse does not perform the gesture, so it cannot be the lab.

## What to report for a gesture

Record the gap between paints with `requestAnimationFrame`. If the main thread is busy for 300 ms, the next gap is 300 ms. That is the stall a person feels. An editor tick, or `setInterval`, is a different clock.

Report all of these. Average fps is `frames / total time`, so one hitch pulls it down. A mean of the fps samples hides that hitch.

| Number | Why it is here |
| --- | --- |
| Average fps | Did the gesture keep up, hitches included |
| p95 frame gap | How the bad frames feel |
| Worst frame | The stall |
| Dropped frames | Gaps longer than two 60 Hz frames (about 33 ms). A person can see those. |
| Duration and frame count | So the fps has a denominator |

Nearest-rank percentile: sort the gaps, rank `ceil(p/100 * n) - 1`, clamp to the array. Say which method you used so the next run matches.

Drop the first gap. It includes whatever happened before the run started.

State the sampler's own time. A sampler that does real work is part of the number.

## One interaction

A pan is frame gaps. One click or one key is an Event Timing entry: input delay, processing, and presentation as separate numbers. Source: the Event Timing editor's draft, 13 October 2026.

Drive it through the browser's input path (the test runner's mouse or keyboard). `dispatchEvent` is not trusted, and the spec ignores it. `pointermove` and `wheel` are not entries, so a pan is not this measurement. The keystroke script stays in [typing.md](./typing.md). The grid script stays in [grids.md](./grids.md). A burst stays in [streams.md](./streams.md). Audio and video stay in [audio-video.md](./audio-video.md).

The observer drops a duration under 16 ms, and `duration` is rounded to the nearest 8 ms. That 16 ms is this API's reporting floor, not the frame row in the table above. A fast gesture the frame sampler saw can be absent here. `buffered: true` only replays entries that already beat the default 104 ms cutoff. Start the observer before the input, and leave buffered off.

A click is several entries with one `interactionId` (`pointerdown`, `pointerup`, `click`). Keep the longest `duration`. `interactionId` 0 is not an interaction. Stop on the frame after the gesture. Duration is filled when rendering updates, so stopping inside the handler cuts off presentation. Rounding can leave the three phases a few milliseconds off `duration`. Leave that gap.

```ts
// One trusted click or key. Call before the input.
// Call the returned function on the frame after the gesture.
export function startInteractionSplit(
  onSplit: (split: {
    name: string
    inputDelay: number
    processing: number
    presentation: number
  }) => void,
): () => void {
  let best: PerformanceEventTiming | undefined
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!isEventTiming(entry) || entry.interactionId === 0) continue
      if (!best || entry.duration > best.duration) best = entry
    }
  })
  observer.observe({ type: 'event', durationThreshold: 16 })
  return () => {
    observer.disconnect()
    if (!best) return
    onSplit({
      name: best.name,
      inputDelay: best.processingStart - best.startTime,
      processing: best.processingEnd - best.processingStart,
      presentation: Math.max(0, best.startTime + best.duration - best.processingEnd),
    })
  }
}

function isEventTiming(entry: PerformanceEntry): entry is PerformanceEventTiming {
  return entry.entryType === 'event'
}
```

## Harness

- Script the gesture. Hand runs drift: a window moved, a run started warm by accident.
- One fresh page per configuration when the flags change what the first byte does. Set the flags before load.
- Quoted frame numbers are headed. New headless does paint: `--headless` or `--headless=new` on the Chrome binary creates the window and does not show it. Since Chrome 132 that is the only headless mode in that binary.
- New headless is not the quoted run. A Chrome 153 `--headless=new` trace on macOS, 2026-10-21, still paused BeginFrames for about a second before first paint. Where there is no display, the GPU stays off unless you turn it on, so the paint cost changes. Smoke-test there if you want. Publish the headed rerun.
- `chrome-headless-shell` is the old browser. Its `beginFrame` interval defaults to 60 Hz, a number you set, and that control is not in new headless.
- Headless rechecked 2026-10-22: Chrome headless docs, CDP `HeadlessExperimental.beginFrame`, Chrome's headless GPU note, Chromium issue 575939921.
- Write down machine, browser, window size, device pixel ratio, and production or dev. A dev build is a different program. Quote production, or say you didn't.
- CPU throttle is a way to see a phone-class main thread. Keep throttled runs in their own column.
- Five runs, one at a time. Publish the median of the runs, and the worst run. Five is the count whose median Lighthouse score is twice as stable as one run, and that doc says to use an aggregate (the median, or the min and the max) instead of one run. Five is a starting count for variance, not a proof that a small delta is real. Lighthouse still does not perform the gesture. Checked 2026-10-22: Lighthouse `docs/variability.md`.
- On one 20 second camera path, run-to-run noise was about 5%. That band is that path. Measure your own. Do not treat 5%, or five runs, as a universal constant. Publish a delta only outside the band you measured.
- Cold and warm are separate columns. A warm second pass can look like an optimization. The Phase 1a "shapes made it faster" result was a warm run compared with a cold one.
- Give each run a token. Async work from the previous document must not be able to write the next run's timings.
- Count what the app kept. A host that silently drops creates past a cap will make two rows identical.
- Close your own measuring UI for the quoted run, or subtract it. A panel that re-renders several times a second is in the trace.
- Keep a counter-metric. Load time, gesture frame time, and memory move apart. A win on one that loses on another is not a win until you say so.

## Memory

The JS heap is one store. After you move pixels into blobs or decoded bitmaps, the heap can look cured while the tab is still huge.

| Store | What it sees | Trap |
| --- | --- | --- |
| `performance.memory` | Chromium JS heap only | Not in Safari or Firefox. Which reading you get is the next table. Say which. Do not invent a number. |
| Renderer resident set | Blobs, decoded bitmaps, the whole process | Read it from outside the page (`ps`, or the browser's process list). The page can flatter itself. |
| `performance.measureUserAgentSpecificMemory` | A real breakdown | Needs cross-origin isolation. One reading can take from under a second to many seconds. Useless as a live readout. |

`performance.memory` on Chromium main, fetched 2026-10-22 (`memory_info.cc`, `window_performance.cc`, `content_switches.cc`). `--enable-precise-memory-info` is still that switch, and it still skips both the buckets and the cache. MDN, 21 August 2026: Chromium only.

| Process | Reading |
| --- | --- |
| `--enable-precise-memory-info` | Current heap on every read. No buckets, no cache. Use this when the quoted delta has to move during the gesture. |
| Locked to one site, flag off. Desktop Chrome does this by default. | Unbucketed, then cached for 50 ms, so a spike inside that window does not show. That 50 ms is Chromium's cache, not the long-task row. |
| Not locked to one site: low-end Android, WebView, `--single-process` | 100 buckets, first about 10 MB, top about 4 GB, cached for 20 minutes. This is the reading that barely moves. |

The flag wins over the other two rows.

Also count the decoded size you would hold if every item were sharp at once. That number is not bytes resident. It is the bill a pan can pull in.

## Worked example

One tldraw PDF canvas, 200 pages, headed Chromium, 1400 by 900 at 2x, 2026-10-22. One app, one machine. Not a budget. Four switches: draw only nearby pages, match bitmap scale to zoom, draw in a worker, release far pages.

| Setup | First page | Gesture |
| --- | --- | --- |
| none | 16.9 s | 54 fps, p95 33 ms |
| nearby only | 197 ms | 37 fps, p95 84 ms |
| worker only | 15.5 s | 55 fps, heap 0.06 GB |
| all four | 202 ms | 60 fps, 0 dropped, heap 0.06 GB |

Nearby-only moved the work from load onto the pan. The worker is what made that pan free. Release and zoom-scale are what kept memory flat. Each one alone was worse or useless. The heap looked cured on the worker path because the bytes were blobs. Process resident set was the number that still grew.

## Smallest sampler

```ts
// Gaps between paints. Call the returned function to stop.
// Discard the first gap: it spans the time before the run.
export function startFrameSampler(onGap: (gapMs: number) => void): () => void {
  let last = performance.now()
  let handle = 0
  const tick = (now: number) => {
    onGap(now - last)
    last = now
    handle = requestAnimationFrame(tick)
  }
  handle = requestAnimationFrame(tick)
  return () => cancelAnimationFrame(handle)
}

export function fpsFrom(frameMs: number[]): number {
  const total = frameMs.reduce((sum, ms) => sum + ms, 0)
  if (frameMs.length === 0 || total <= 0) return 0
  return (frameMs.length / total) * 1000
}
```
