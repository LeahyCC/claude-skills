# Hosted editor

tldraw, and any editor you embed, shares your main thread. The host has no worker unless it shipped one. A worker can draw your pixels. It cannot do the host's hit testing, selection, or text caret. How the bytes move: [off-thread.md](./off-thread.md).

```
your code  ---- one main thread ----  the editor
```

Read the host's contract before changing how you draw. The failures below came from breaking a contract that the types still allowed.

## Rules that outlive one library

- Geometry and hit bounds are a function of the stored record. If the spatial index rebuilds only when the record changes, a hit box that reads live zoom goes stale and clicks miss.

```ts
// BAD: index keeps the bounds from the last record change, not the last zoom
getGeometry(shape: Shape) {
  return circle(shape.x, shape.y, 12 / view.getZoom())
}

// GOOD: the radius is on the record, so the index matches the hit
getGeometry(shape: Shape) {
  return circle(shape.x, shape.y, 12 * shape.scale)
}
```

- Write that scale when the gesture ends, not on every frame of a pinch. Writes to a synced document go to every peer.
- Use the host's stable zoom during a camera move. Live zoom redraws every shape mid-gesture.
- Batch host updates. A loop of single-record writes is a loop of renders.
- Remote edits, other people's cursors, and presence must not run inside the keystroke or the pointer frame. Apply them on the next frame.
- What is on screen, and when you plan the next pass: [draw-less.md](./draw-less.md).
- Quote numbers from a production build with the host's dev overlays and your own panel closed. Say so if you didn't.

## tldraw, fetched 2026-10-22

The SDK docs describe the current behavior. Re-read them before treating a default as permanent.

| Contract | What the docs say |
| --- | --- |
| Culling | Off-screen shapes get `display: none`. They stay in the store. Selected and editing shapes are not culled. |
| Zoom during a move | `getEfficientZoomLevel()` stays put while the camera moves, once the page is over `debouncedZoomThreshold` (default 500). `getZoomLevel()` updates every frame. |
| Shape cap | `maxShapesPerPage` defaults to 4000. |
| Perf events | `editor.performance` emits interaction and camera summaries (fps, p95, p99) with no cost when nothing listens. `PerformanceApiAdapter` mirrors them into `performance.measure`. |
| Custom shapes | Keep the component cheap. Put hit-test geometry in `getGeometry`, which the editor caches. Disable `canCull` only for overflow, measurement, or an animation that must run off-screen. |

One PDF canvas on that SDK also found:

- A culled image shape never dropped its bitmap, so pages had to be their own shape that owns the `<img>`.
- Reading zoom inside `getGeometry` broke pin hit testing. A `scale` prop on the record, written from the debounced zoom, fixed it.
- A 1% zoom floor made the first page about a second slower. The time was the host building hatch tiles for every power of two between min and max zoom, on the main thread, during load. The floor went back to 5%.
- `createShapes` past the cap dropped the extra shapes and reported success. The stress code had counted the request.
- Camera export still blocked the main thread for about 430 ms after live page renders had moved to a worker.
- A pin drag re-rendered none of the app's components. The long task was the host.

## Figma is a different bet

Figma gave up HTML, SVG, and Canvas2D for the document and paints it with its own tile renderer (WebGL, later WebGPU). The panels stay DOM.

tldraw stayed on DOM and SVG and culls. A PDF under it stayed as images. Neither of those should be rewritten on WebGPU because Figma did. When that pays: [off-thread.md](./off-thread.md).
