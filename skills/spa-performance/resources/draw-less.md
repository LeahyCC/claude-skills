# Draw less

Do less work before you move work to another thread. A worker that still draws every page on load does not make the first page fast.

```
viewport
  [ sharp ]          on screen
  [ preview, then sharp ]   just outside
  [ keep a while, then release ]   left the screen
  [ not decoded, or not in the DOM ]   far away
```

Cancel a job when its item leaves the window. Cap how many jobs run at once. The cap is "how many the machine finishes inside a frame", not a constant. One main-thread canvas is often one job. A worker can take more than one if the library is safe to re-enter.

Distances in viewport heights survive a resize. Pixels do not. A flick must not free and rebuild: release only after the item has stayed far for a short time. One PDF canvas used 1 viewport as near, 3 as far, and 1.5 s before release. Those are that document's choices. Time them on yours.

Give a visible item a cheap preview, then replace it with the sharp version. Nearest first. Preview before sharp for the same item.

## DOM lists

Two different tools. `content-visibility` is not a window. The nodes stay.

| Tool | What it keeps | Use when |
| --- | --- | --- |
| `content-visibility: auto` with `contain-intrinsic-size` | Every row in the DOM. Contents are skipped only while the row is not relevant to the user. Find-in-page, tab order, focus, and selection still reach it. | The measured cost is paint or layout, and the row count fits in memory. |
| A window (unmount off-screen rows) | Only the visible rows plus a buffer | The measured cost is memory, the accessibility tree, or node count. |

Relevant means close to the viewport (the browser adds its own margin), or focused, or selected, or in the top layer. A focused row that has scrolled away is still laid out. Put `auto` on each row. On the scroller it does nothing, because that element stays on screen. ([CSS Containment 2](https://drafts.csswg.org/css-contain-2/#content-visibility), editor's draft 15 October 2026.)

Skipping turns on size containment. `contain-intrinsic-size` is the placeholder, and `auto <length>` remembers the last rendered size. Without a size, a skipped row collapses and the scrollbar jumps. `content-visibility: hidden` removes the subtree from find-in-page, tab order, and the accessibility tree. `auto` does not remove it from find-in-page or tab order. A screen reader can still miss a skipped `auto` row: if the browser cannot place it in the accessibility tree without laying it out, the spec says to omit it.

```ts
type Row = { id: string, text: string }

// BAD: off-screen rows are not in the document. Find-in-page cannot see them.
export function mountWindow(host: HTMLElement, rows: readonly Row[], start: number, end: number): void {
  host.replaceChildren()
  for (let i = start; i < end; i++) {
    const row = rows[i]
    if (!row) continue
    const el = document.createElement('div')
    el.dataset.id = row.id
    el.textContent = row.text
    host.append(el)
  }
}

// GOOD: every row stays. Paint and layout wait until the row is relevant.
export function keepRows(host: HTMLElement, rows: readonly Row[], estimatePx: number): void {
  host.replaceChildren()
  for (const row of rows) {
    const el = document.createElement('div')
    el.dataset.id = row.id
    el.textContent = row.text
    el.style.contentVisibility = 'auto'
    el.style.containIntrinsicSize = `auto ${estimatePx}px`
    host.append(el)
  }
}
```

`estimatePx` is a guess for a row you have not rendered yet. It is not a platform constant.

If you unmount rows, you own find-in-page, fragment links, focus, and per-row state. The browser will not.

Scroll anchoring is on by default (`overflow-anchor: auto`). When something above the viewport changes size, the browser shifts the scroll offset so its anchor node stays put. A window that inserts or removes rows above the viewport does that on every scroll. If the window also writes `scrollTop` from its own anchor, both shifts land and the view jumps. Set `overflow-anchor: none` on the scroller when you own the scroll position. Removing the node the browser had chosen as anchor forces it to pick again. ([CSS Scroll Anchoring](https://drafts.csswg.org/css-scroll-anchoring/), editor's draft 30 September 2026.) `content-visibility` does not insert or remove rows, so it does not need that opt-out for this reason.

Variable height: cache a measured height per row, anchor the scroll position to a row you have measured, and correct when the real height arrives. An estimated height for rows you have never seen is enough to place the scrollbar. It is not enough to jump to an unmeasured row without a correction. The two-axis case, including frozen bands, is in [grids.md](./grids.md).

Browsers cap how tall one element can be, and the cap has moved between versions (reports include about 16.8 million px and about 32 million px). Past the cap, map scroll position into a shorter track and position the window inside it. Measure the cap in the browser you ship. Do not hardcode one. The probe and the stretch offset are in [grids.md](./grids.md).

Keep a buffer of rows above and below the viewport so a fast scroll does not show a hole. If the container size is wrong you can try to mount the whole list. Cap the number of mounted rows.

## Spatial documents

Pages on a canvas, map tiles, and a large image are the same policy in two dimensions. The window is the viewport, not a row index.

- Placeholder while the bitmap is missing, so the camera and the scrollbar stay honest.
- Level of detail: step the render scale to a power of two of zoom times device pixel ratio, so a pinch does not redraw every frame. Floor it so a zoomed-out overview is still legible. Cap pixels per item. A screen cannot show more pixels of one item than it has.
- When one item at a sharp scale is larger than the screen, tile it. Draw the visible part. A new graphics API does not fix an oversized bitmap.
- A host that already culls (`display: none` off-screen) may still keep the decoded bitmap. Owning the element is what lets you give the bytes back. See [hosted-editor.md](./hosted-editor.md).

## Charts

A line has one sample per screen pixel. Drawing a million points into an 800 px chart is the same waste as a page rendered sharper than the screen. Decimate to the pixel, in a worker if the reduce is heavy ([off-thread.md](./off-thread.md)).

## Plan outside the render

A pass that reads "what is on screen" and writes "what to draw" must not run inside the reaction that watches those same values. Record that something changed, and plan on the next turn. Doing both in one reaction loops.
