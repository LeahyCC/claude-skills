# Grids

Status: written

Sheets, admin tables, timelines. A row window still mounts every column in that row. The window is two axes.

## Owns

Row and column windowing, the scroll-height cap, the cell being edited, and when a canvas cell beats a DOM cell.

## Does not own

- The harness: [measure.md](./measure.md)
- 1D lists and `content-visibility`: [draw-less.md](./draw-less.md)
- Moving a formula engine off-thread: [off-thread.md](./off-thread.md). A calc is CPU with no DOM, so the worker rules apply.
- The keystroke inside the editor overlay: [typing.md](./typing.md)

## Scan

| Question | Answer |
| --- | --- |
| What is mounted | Frozen bands, plus the rows and columns in view, plus a measured buffer |
| What is the spacer | The scroll track. Its size is the sheet, not the mounted cells |
| What scroll position means | Pixels into that track. A row index is a lookup in the height cache |
| How big is the buffer | The pixels one frame of a fling travels. Not a fixed row count |
| Variable row height | A measured-height cache, an anchor row, a scroll correction in the same frame |
| The cell being edited | One real input, positioned from the layout, mounted for the whole edit |
| Sheet taller than the browser allows | A short track and a stretch offset. Measure the cap |
| Canvas instead of DOM | Only after the trace in this file. No cutoff is stated here |
| What the formula worker receives | The dirty block. The changed cells come back |

## The window

```
scrollLeft = 0 is the first unfrozen column
scrollTop  = 0 is the first unfrozen row

+------------------+------------------------------+
| corner           | frozen rows                  |  mounted
| frozen x frozen  | columns in the x window      |
+------------------+------------------------------+
| frozen columns   | body window                  |  mounted
| rows in the      | rows and columns in view     |
| y window         | plus the buffer              |
+------------------+------------------------------+
|                  | spacer                       |  no cells of its own
|                  | height = body rows           |
|                  | width  = body columns        |
+------------------+------------------------------+
```

Frozen rows and frozen columns stay on screen. They are not part of the scrolled range. A frozen header still shows only the columns in the horizontal window, plus the frozen columns. A frozen column still shows only the rows in the vertical window, plus the frozen rows. Mounting a frozen header for every column in the sheet is the whole sheet again, one row tall.

The spacer is the element the scrollbar measures. Its height is the sum of body row heights, or the measured cap when that sum does not fit. Its width is the same on the column axis. The mounted cells do not create that size. Size the spacer from the layout. If you size it from the cells you mounted, the thumb collapses to the viewport.

`scrollTop` is a pixel offset into the spacer. The row under it is the row whose prefix sum contains that pixel. `scrollLeft` is the same lookup on column widths. The prefix sums come from the height cache and the column widths below.

AG Grid (36.2.0) renders the rows and columns in the viewport and drops the rest. Their illustration: 1,000 records and 20 columns, with 50 rows and 10 columns on screen, mounts those 500 cells. Column count is still the cost after the rows are windowed.

Pinned columns sit on the left or right edge and do not scroll away. Pinned rows sit above or below the body. Both are the frozen bands in the diagram.

## Buffer

The buffer is a pad of pixels outside the viewport, so the next cells exist before a fling reaches them.

Measure it. Script a fling ([measure.md](./measure.md)) and record how many pixels the viewport moves in one frame. The pad has to cover that distance on the machines you ship. Do this for vertical and horizontal. A row count is that pixel pad divided by the row heights you actually have.

AG Grid's default `rowBuffer` is 10 rows before the first visible row and 10 after. They turn that count into pixels with the default row height: 10 times the Quartz height of 42px is 420px each way. They say a 100px row means that same 420px pad fits 5 rows rather than 10. 420 / 100 is 4.2, so the fifth row only starts inside the pad. Their 10 is a default, then a pixel range. It is not the measurement.

`rowBuffer` of 0 is their switch for no pad. On a slow machine the next rows are not mounted when they enter the viewport, and the user sees a blank band.

AG Grid does not add a column buffer. They say horizontal scrolling costs less CPU than vertical. That is their grid. If a horizontal fling shows a hole, the column pad is the same pixel measurement.

A buffer that is the size of the sheet mounts the sheet. The usual cause is a container height that is wrong: 0, or the document instead of the pane, so the "viewport" is huge and the pad adds more. Cap the number of mounted rows. Shrink the pad first. AG Grid will not render more than 500 rows unless `suppressMaxRenderedRowRestriction` is set. Their 500 is a crash guard for a bad height. It is not a canvas cutoff and not a buffer size. Pick the cap from the cell count you measured.

Count mounted cells: body window, plus frozen columns times the vertical window, plus frozen rows times the horizontal window. The corner once. If that count is the sheet, the window is not a window.

## Variable row height

The one-dimensional case is in [draw-less.md](./draw-less.md). A grid keeps the same cache and the same anchor, and the frozen rows stay out of the scroll.

Cache measured height by row key. A key with no entry uses the estimate. Column widths are the same cache on the other axis. Positions are prefix sums. A new height at row `i` changes the start of every row after `i`.

The anchor is the viewport's top edge, and the row that contains it. Remember the pixels between that edge and the row's top (`scrollTop - rowTop`).

When a measurement arrives, `delta` is the measured height minus the height you had been using (the estimate the first time, the previous cache after that).

- The row's top is above `scrollTop`: add `delta` to `scrollTop`. The guess above the anchor was wrong, and the row under the anchor should stay where it is.
- The row is below the viewport: leave `scrollTop`. The spacer gets taller and the thumb shrinks. The pixels on screen stay.
- The row crosses the top edge and grows downward: leave `scrollTop`. The new pixels are below the anchor.

Write the new `scrollTop` and the new row positions in the same frame. If the scroll moves and the rows translate a frame later, the viewport jumps by `delta` and snaps back.

TanStack Virtual's current `resizeItem` (main, fetched 2026-10-22) does this. On a later measure it only corrects a row that sits entirely above the fold, and it skips the correction while the user is scrolling upward, because that correction was feeding a jump. The geometric rule is the anchor. The upward-scroll skip is their guard against that loop.

AG Grid measures auto-height rows when they are rendered, not before. Their docs describe the uncorrected scrollbar: the thumb lags or jumps while the range changes, and a row revealed at the top pushes every row below it by the delta. Viewport and infinite row models cannot do variable height at all, because a row that is not loaded has no position unless the height is fixed.

An estimate is enough to size the spacer. A jump to a row you have never measured still needs the correction when the real height arrives.

## The editor overlay

The caret, the IME, and the input event stay on the main thread. Those rules are in [typing.md](./typing.md).

The input is not a child of the cell. The window unmounts cells. An input inside a cell unmounts with it, and the caret goes with it. Keeping the editing row mounted until it leaves the buffer does the same thing on a long scroll.

One input stays mounted for the whole edit. Its position comes from the height cache and the column widths, so it still has a rectangle after the cell's DOM node is gone. On scroll, move that rectangle. Do not blur it, and do not focus the grid underneath. The grid's overflow clips it.

```ts
type Cell = { key: string, text: string, draft: string, editing: boolean, onChange: (value: string) => void }
type GridRow = { cells: Cell[] }

// BAD: the input is the cell. The window unmounts it on scroll.
function paintCells(host: HTMLElement, rows: readonly GridRow[]): void {
  host.replaceChildren()
  for (const row of rows) {
    for (const cell of row.cells) {
      if (!cell.editing) {
        const span = document.createElement('span')
        span.dataset.key = cell.key
        span.textContent = cell.text
        host.append(span)
        continue
      }
      const input = document.createElement('input')
      input.dataset.key = cell.key
      input.value = cell.draft
      input.addEventListener('input', () => cell.onChange(input.value))
      host.append(input)
    }
  }
}

// GOOD: one input, outside the window, pinned to the editing cell.
const editInput = document.createElement('input')

function placeEditor(
  editing: { x: number, y: number, width: number, height: number, draft: string, onChange: (value: string) => void },
): void {
  editInput.value = editing.draft
  editInput.oninput = () => editing.onChange(editInput.value)
  editInput.style.position = 'absolute'
  editInput.style.transform = `translate(${editing.x}px, ${editing.y}px)`
  editInput.style.width = `${editing.width}px`
  editInput.style.height = `${editing.height}px`
}
```

`editing.x` and `editing.y` are the cell's painted origin this frame, including the stretch offset below. `editInput` is the same node from the first keystroke to commit or cancel. Building a new input when the row leaves the window is the bad pattern again.

A canvas cell cannot host an input. Glide Data Grid draws the cell and sets `allowOverlay` so an HTML editor is placed on that cell. Same overlay, same lifetime.

## Past the browser's max height

MDN's `max-height` and `overflow` pages (checked 2026-10-22) do not state an engine limit on element size. `max-height` is an author constraint. The rule against hardcoding a cap is in [draw-less.md](./draw-less.md).

AG Grid 36.2.0 says the limit is not published and differs by browser and version. They test the DOM when the grid starts and log `RowContainerHeightService: maxDivHeight`. Their reading on Chrome v118 was 32,000,000 px. That reading is not the cap you ship.

Measure once, in the document, in the browser you ship. Read the probe, not a wrapper. A parent with a max height would make the test lie.

`clientHeight` is an integer and it is not a clean clamp. On one Chromium measured 2026-10-22, some heights under the cap read back 1px off, and a request past the cap reads back the cap itself. An exact `clientHeight === request` test is not monotonic there, so a binary search on that test stops short of the cap. Double the request. While the used height keeps up with the request, you are under the cap. When a doubled request comes back far shorter, that used height is the cap.

```ts
// The cap moves. The number you keep is this read, for this document.
// A parent max-height would clamp the probe for the wrong reason.
export function measureMaxElementPx(): { px: number; clamped: boolean } {
  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden'
  const probe = document.createElement('div')
  probe.style.width = '1px'
  wrapper.appendChild(probe)
  document.body.appendChild(wrapper)

  const read = (px: number): number => {
    probe.style.height = `${px}px`
    return probe.clientHeight
  }

  // 1px of slack is integer rounding, seen on that Chromium. It is not the cap.
  let request = 1_000_000
  let used = read(request)
  let clamped = false
  while (request <= 1_000_000_000) {
    const next = request * 2
    if (next > 1_000_000_000) break
    const nextUsed = read(next)
    if (nextUsed >= next - 1) {
      request = next
      used = nextUsed
      continue
    }
    // A collapsed read (0) is not the cap. Keep the last height that grew.
    if (nextUsed > used) {
      used = nextUsed
      clamped = true
    }
    break
  }
  wrapper.remove()
  return { px: used, clamped }
}
```

`clamped: false` means the loop never saw a clamp. `px` is then a lower bound. If a candidate hangs the tab, stop. The last height that still grew is the one that session can use.

Under the cap, the spacer is the real total and `scrollTop` is the logical pixel. Over the cap, the spacer stays at the cap. The thumb tracks the short spacer. A scroll percent is mapped into the pixels that did not fit, and row positions subtract that offset.

```ts
const extra = totalHeight - maxHeight
const maxScroll = Math.max(0, maxHeight - viewportHeight)
const stretch = maxScroll === 0 ? 0 : (scrollTop / maxScroll) * extra

// Pixel in the sheet under the top of the viewport.
const logical = scrollTop + stretch
// Where a row is painted. rowTop is its prefix sum.
const paintedTop = rowTop - stretch
```

This is AG Grid's stretching. `extra` is their `additionalPixelsNeeded`, `scrollTop / maxScroll` is their scroll percent, and `stretch` is their row offset. At the top, the offset is 0. At the bottom, the offset is the whole of `extra`, so the last row lands at the bottom of the short spacer.

The thumb then moves the sheet faster, in the ratio of `totalHeight` to `maxHeight`. Twice the cap, about twice the travel for the same gesture. If that ratio makes the sheet unusable, show fewer rows. The same math applies on the horizontal axis when the sum of column widths exceeds the cap.

## Canvas cells

Window first. A canvas that paints every cell of the sheet skips the window and does the work again.

There is no cell-count cutoff in this file. Glide Data Grid's own FAQ says they left a virtualized DOM because "once you need to load/unload hundreds of DOM elements per frame nothing can save you," and their README says the grid scales to millions of rows. Neither page shows a trace or a method. Those numbers are unverified. Do not use them.

Record this, on one production sheet, headed, DevTools closed, scripted fling, from the harness in [measure.md](./measure.md):

| | DOM window | Same window, cells on canvas |
| --- | --- | --- |
| Mounted cells | | |
| Nodes created per frame | | |
| Nodes removed per frame | | |
| Average fps | | |
| p95 frame gap | | |
| Worst frame | | |
| Dropped frames | | |

Paint a cell on canvas when that table shows the DOM cells are the frame cost and the canvas column moves it. The editor overlay stays. The caret rules stay in [typing.md](./typing.md).

## Formula worker

The worker is the one in [off-thread.md](./off-thread.md): reuse it, and do not pay a clone that is bigger than the calc.

The engine and its dependency graph live in the worker. The first message can be the sheet. A keystroke sends the block that changed, not a copy of every cell.

HyperFormula 3.5.0 stores that graph and recalculates the cells a change reaches. `setCellContents` takes the top-left address and the block, and returns the cells whose values changed (address and new value). That returned list is the paint. `batch` and `suspendEvaluation` / `resumeEvaluation` fold several edits into one pass.

```ts
type DirtyBlock = {
  sheetId: number
  row: number
  col: number
  // The edited rectangle, row-major. Not the sheet.
  values: string[][]
}

type ChangedCell = {
  sheetId: number
  row: number
  col: number
  value: unknown
}
```

A volatile function, or an edit at the start of a long chain, can make `ChangedCell` large. The input is still the dirty block. The worker already has the graph. Sending the sheet again on that keystroke is the clone this section exists to avoid.
