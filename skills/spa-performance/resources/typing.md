# Typing

Status: written

The moment is the character that was just typed. A code editor, a rich text document, or a chat composer. Paint it on this frame. Analysis catches up after.

```ts
type Edit = { from: number; to: number; insert: string }

// BAD: the glyph waits on the worker. The round trip is the hitch.
async function onType(edit: Edit, buffer: string) {
  const colored = await worker.tokenize(buffer)
  paint(colored)
}

// GOOD: the character is on screen. Post the edit, not the buffer.
function onType(edit: Edit, buffer: string, caret: DOMRect) {
  paint(buffer, caret)
  reportCaret(caret)
  void worker.analyze(edit).then(applyDecorations)
}
```

Canceling `beforeinput` and then awaiting a worker is the same mistake. The browser was ready to paint the character. A native textarea or `contenteditable` already paints it. Your listener's job is to not get in front of that paint.

Do not put the document model in a worker. Three shapes are enough:

| Shape | Document and paint | What leaves |
| --- | --- | --- |
| CodeMirror 6 | One heap. The view reads the state synchronously. | Nothing of the model. Parse work is capped instead. |
| Monaco | The editor keeps the model and paints it. | Language service, against a mirror. `withSyncedResources` returns a Promise. |
| Google Docs | The document surface is canvas. | Not the caret. Input and assistive tech stay on a real DOM path, below. |

## Owns

What stays on the main thread during input, and what may move (highlight, lint, format, spellcheck).

## Does not own

- The harness and the 50 ms / 200 ms thresholds: [measure.md](./measure.md)
- Yield, worker transfer, and startup cost: [off-thread.md](./off-thread.md)
- Windowing a DOM list: [draw-less.md](./draw-less.md)
- Remote cursors and other people's edits: [hosted-editor.md](./hosted-editor.md)
- Hit testing: [hosted-editor.md](./hosted-editor.md)

## Keydown to the next paint

```
event timeStamp
      |
      input delay          processingStart - startTime
      |
      your handlers        processingEnd - processingStart
      |
      style, layout, paint startTime + duration - processingEnd
      |
      next paint           duration, rounded to 8 ms
      |
      lint, format, the rest of the parse
```

`duration` on a `PerformanceEventTiming` entry is the time from that event's `timeStamp` to the next paint. [MDN](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceEventTiming) (page updated 2026-10-22). A key press is one interaction: `keydown` and `keyup` share an `interactionId`, and the longer `duration` is the one INP keeps. [INP](https://web.dev/articles/inp) (updated 2025-09-02). A slow `keyup` still counts after the character painted on `keydown`.

```ts
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (!(entry instanceof PerformanceEventTiming)) continue
    const inputDelay = entry.processingStart - entry.startTime
    const processing = entry.processingEnd - entry.processingStart
    const presentation = Math.max(0, entry.startTime + entry.duration - entry.processingEnd)
    // entry.name is "keydown" or "keyup". entry.interactionId groups the pair.
    report(entry.name, entry.interactionId, { inputDelay, processing, presentation })
  }
})

// 16 ms is the smallest threshold the API allows. The default is 104 ms,
// which hides every key that was merely late.
observer.observe({ type: 'event', durationThreshold: 16, buffered: true })
```

Durations are rounded to the nearest 8 ms, and the observer will not report an entry under 16 ms. The API cannot show a budget tighter than one 16.7 ms frame. A missing entry means "under the threshold," not a measured sub-frame time. This pass did not find a published typing budget under a frame. Do not invent one. The field bar for the whole interaction stays in [measure.md](./measure.md).

`beforeinput` and `input` are in the Event Timing list, and they do not get a keyboard `interactionId`. Use them to see handler time. The field number is still the key press.

## Which thread

| Work | Thread | Why |
| --- | --- | --- |
| Caret | Main, this frame | It is the paint. The IME window is placed from its bounds. |
| IME composition | Main, this frame | `compositionstart`, `compositionupdate`, and `compositionend` are dispatched at the focused editing host ([UI Events](https://w3c.github.io/uievents/)). |
| `beforeinput` | Main, synchronous | Fires on that host before the DOM update. A normal insert is cancelable. An update inside a composition (`insertCompositionText`) is not ([Input Events Level 2](https://www.w3.org/TR/input-events-2/)). A worker cannot answer either case in time. |
| `input` | Main, synchronous | After the DOM update. Not cancelable. The character is already committed. Hand the change to analysis. Do not do the analysis in the listener. |
| Tokenize | The viewport may stay. The rest leaves. | The glyph needs the visible tokens only if they are cheap. The rest of the buffer does not. |
| Lint | Off this key | It does not change the character. |
| Format | Compute off this key. Apply later, on the main thread. | The result is a new edit. Applying it before the typed character paints hides the key. |
| Spellcheck | Off this key | A correction is its own later `beforeinput` (`insertReplacementText`). Built-in spellcheck does not run on a canvas. |

Browsers disagree on the order of `compositionupdate` and `beforeinput` ([UI Events #354](https://github.com/w3c/uievents/issues/354), still open). Both are main-thread events at the editing host. The DOM update sits between `beforeinput` and `input`. That is the part that matters.

## Viewport parse, not the whole buffer

CodeMirror's public contract, checked 2026-10-22 against the [language reference](https://codemirror.net/docs/ref/):

- `syntaxTree(state)` is the tree so far. It may not cover the document.
- `forceParsing` defaults its target to `view.viewport.to` and stops after 100 ms.
- `ensureSyntaxTree` stops after 50 ms and returns null if it did not get there.
- The background parse stops once it has spent its time or moved past the viewport (`syntaxTreeAvailable`). It runs from `requestIdleCallback` when the browser has it (`syntaxParserRunning`).

The current language package (main, 2026-10-22) implements that as follows. These are its choices. A different grammar changes how far the same milliseconds get, so re-read the constants before copying them.

- An edit does at most 20 ms of parse (`Work.Apply`). If the previous parse was unfinished, that work stops at the viewport, so the update does not parse past what is on screen.
- Background parsing does not eagerly run more than 100,000 characters past the viewport (`Work.MaxParseAhead`).

The full parse has lost when `ensureSyntaxTree(state, state.doc.length, budget)` returns null for the budget you will spend before paint, and the same call bounded to `view.viewport.to` succeeds. The reference manual does not publish a line count to copy.

VS Code makes a different cut, once, when the model is created. With large-file optimizations, a model over 20 MB or 300,000 lines is never tokenized (`TextModel.LARGE_FILE_SIZE_THRESHOLD`, `LARGE_FILE_LINE_COUNT_THRESHOLD`, vscode main, 2026-10-22). That decision sticks for the life of the model. It is that editor's cutoff for "the whole buffer is no longer worth a parse," not a frame budget.

## What is worth posting

A string posted to a worker is copied. It is not transferable. The main thread pays the copy before the worker runs. Worker startup and transfer rules: [off-thread.md](./off-thread.md). Do not put the first character behind a worker boot.

Monaco's mirror, same code as VS Code's `WorkerTextModelSyncClient` (main, 2026-10-22):

- `withSyncedResources` sends each model once, as its lines, then posts later edits as change events. The proxy method returns a Promise. The editor does not wait on it to paint.
- A model over 50 MB is not sent (`TextModel._MODEL_SYNC_LIMIT`, `isTooLargeForSyncing`). That is a ceiling for a language service that stays warm. It is not a keystroke budget.
- Idle models stop syncing unless `keepIdleModels` is set. The default is false ([IWebWorkerOptions](https://microsoft.github.io/monaco-editor/typedoc/interfaces/IWebWorkerOptions.html)).

On the key, post the edit. Posting the buffer again copies it on the main thread for work that does not paint this character.

A one-shot job (format this file, check this draft) is worth the copy only when the copy is shorter than the work it removes from the key path. Time the clone on the main thread against that work. No source checked for this file published a smaller universal size. If the worker has to answer before the character paints, every size loses, including one character.

CodeMirror's refusal is the other half of this. Serializing the state across a worker, and making every update async, was rejected on purpose: it limits the data structures and makes the editor more expensive (Marijn Haverbeke, [2020-12-28](https://discuss.codemirror.net/t/codemirror-6-web-worker-isolated-state/2788)). Keep the document on the heap the view reads. Send a mirror, or an edit, for analysis.

## What a canvas document owes

A canvas has no caret, no composition, and no accessibility tree. You owe those. Hit testing is [hosted-editor.md](./hosted-editor.md).

Checked again 2026-10-22. The 2021 Docs post is still the migration note. It is not the whole current input path.

- **Focus.** An editing host has to be focused. Attach an [EditContext](https://developer.chrome.com/blog/introducing-editcontext-api) (Chromium 121, February 2024) to that element, or focus a textarea or `contenteditable` and take its events. A canvas alone is not an editing host. EditContext is not in every browser. For a plain field, use `input`, `textarea`, or `contenteditable`.
- **Selection and the IME window.** On each caret move, report the offsets and the client rectangles (`updateSelection`, `updateSelectionBounds`, `updateControlBounds`). Answer `characterboundsupdate`, and paint the composition underline from `textformatupdate`. Docs drives IME through EditContext. A bounds change was reverted in January 2026 because it broke the Docs and Slides candidate window ([crbug 469851070](https://issues.chromium.org/issues/469851070)), and a May 2026 bug records Docs calling `updateText` ([crbug 379723554](https://issues.chromium.org/issues/379723554)).
- **The composition string.** Show it while the composition is open. Commit it at `compositionend`. Do not ask a worker whether it may appear.
- **Accessibility.** Pixels are invisible to a screen reader. Docs keeps an annotated canvas: the text lives in the `aria-label` of SVG elements, and off-screen content exists for screen readers and braille. Chromium's reading mode still special-cases that on main ([read_anything_node_utils.cc](https://chromium.googlesource.com/chromium/src/+/main/chrome/renderer/accessibility/read_anything/read_anything_node_utils.cc)). The [Workspace post](https://workspaceupdates.googleblog.com/2021/05/Google-Docs-Canvas-Based-Rendering-Update.html) (2021-05-11, accessibility note 2021-05-26) says screen readers, braille, and magnification stay supported. A single alt string on the canvas is not that.
- **Paint.** The document surface has been canvas since that 2021 migration. A March 2025 Chromium change describes Docs passing bidi-wrapped strings to `measureText` and `fillText`: Docs chooses the line, and the browser shapes that string ([CanvasTextNG](https://chromium.googlesource.com/chromium/src/+/72cf7f952f6db0860a6b1f31adf69db5f9abe230)). This pass found no later note that this stopped, and no Google source for painting in tiles. The announcement is about the document. It does not say the rest of the page became canvas.

[HTML-in-Canvas](https://developer.chrome.com/blog/html-in-canvas-origin-trial) (Chrome origin trial, 2026-05-19) would draw real DOM into a canvas and put it on the accessibility tree. The post names Docs as the kind of app that still paints its own canvas. Do not assume the trial is the browser you ship, or that Docs has moved to it.
