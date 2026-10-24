# Gotchas skill tasks and acceptance criteria

Written 2026-10-23, before any model run. Run each prompt against Claude with the skill and without it, as in the Next.js pilot. Score each criterion 0 or 1. One run per task is exploratory, not a statistical estimate.

Status: **not run.** Model runs need Colin's approval first.

## Behaviour

| ID | Prompt | Acceptance criteria |
| --- | --- | --- |
| G1 | "In my Vite app, the buttons for `/stress/stress-50.pdf` are enabled even before I generate the files, and clicking them says the file is not a valid PDF." Fixture: `useEffect` calling `fetch('/stress/stress-50.pdf', { method: 'HEAD' }).then(res => setReady(res.ok))`. | Explains that Vite's SPA fallback answers missing `public/` paths with `200 OK` and `Content-Type: text/html` (`index.html`). Checks `res.headers.get('content-type')` for `pdf` (or sets an explicit `Accept: application/pdf` header) alongside `res.ok`. |
| G2 | "When opening a new file fails, the header already shows the new filename and my old annotations are gone, even though the old document is still on the canvas." Fixture: `async function open(choice) { setChosen(choice); forgetAnnotations(); await fetchAndParse(choice) }`. | Moves state mutations (`setChosen`, `forgetAnnotations`, `lastSource`, timings) after the async fetch/parse commits, or restores previous state on non-aborted failure. Guards post-`await` and `catch` against `signal.aborted`. |
| G3 | "Review this API helper an agent wrote." Fixture: `try { const r = await fetch(url); return await r.json() } catch { return [{ id: 'demo', total: 0 }] }` and a module-level `let currentUser: User \| null = null` set inside a server route handler. | Flags the silent catch returning fake sample data and replaces it with an explicit error state or rethrow with `{ cause }`. Flags the module-level `currentUser` singleton as a cross-request data leak under concurrent requests and passes context or uses `AsyncLocalStorage`. |
| G4 | "Why does copying the exported PNG work in Chrome but throw `NotAllowedError` in Safari?" Fixture: `const blob = await renderPng(); await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])`. | Explains that awaiting `renderPng()` before `navigator.clipboard.write()` loses the user gesture in WebKit (bug 222262). Passes the `Promise<Blob>` directly into `new ClipboardItem({ 'image/png': renderPng() })` inside the click turn, with a fallback for browsers that need a resolved `Blob`. |
| G5 | "Our build works on our Macs, but fails in Docker and when reviewers unpack the zip." Fixture: `package.json` with `"prepare": "lefthook install"`, an import `from './components/button'` where git tracks `Button.tsx`, and an undeclared transitive import. | Identifies that unpacked zips/Docker stages lack `.git` so `prepare` fails `install`. Flags the case-only mismatch between `./components/button` and `Button.tsx` on Linux. Flags the undeclared transitive dependency. |
| G6 | "The agent said it fixed the pagination bug and all tests pass, check the diff." Fixture: a diff where `src/paginate.ts` is untouched or still off-by-one, and `paginate.test.ts` changed `expect(page.length).toBe(10)` to `toBe(9)`. | Rejects the modified test assertion as test tampering. Restores the original assertion (`toBe(10)`), fixes the off-by-one in `src/paginate.ts`, and explains the revert check (test must fail when the source fix is reverted). |

## Selection

The skill should load for the first ten and not for the last ten.

| ID | Prompt | Should load |
| --- | --- | --- |
| S1 | Review this PR for subtle bugs or gotchas before I merge | yes |
| S2 | Why does `fetch('/missing.pdf', { method: 'HEAD' })` return `res.ok === true` in Vite dev? | yes |
| S3 | What could go wrong with this async open/reopen flow if the user clicks twice or the file is corrupt? | yes |
| S4 | Audit this AI-generated diff for swallowed errors, fake fallbacks, or test tampering | yes |
| S5 | Works on my MacBook, fails on a fresh clone and in the reviewer's zip — what should I check? | yes |
| S6 | Why is `new Date('2026-10-23')` showing October 22 in the UI? | yes |
| S7 | My `FormData` file upload says "Multipart: Boundary not found" on the server | yes |
| S8 | We hid the frame button from the toolbar, why does pressing F still create a frame? | yes |
| S9 | Why did User A see User B's data after we refactored the route handler helpers? | yes |
| S10 | Check if these new unit tests actually test the bug or just pass by accident | yes |
| S11 | Turn on `noUncheckedIndexedAccess` in `tsconfig.json` and fix the type errors | no (typescript-safety) |
| S12 | The canvas drops to 20 fps when panning 200 pages, profile it | no (spa-performance) |
| S13 | Memoize this React list and check if React Compiler handles it | no (react-performance) |
| S14 | Add a JSON-LD `Product` schema and `sitemap.ts` to our Next.js store | no (seo) |
| S15 | Write a WebGPU compute shader that sums an array of floats | no (webgpu) |
| S16 | Check whether our icon buttons meet WCAG 2.2 target size and contrast rules | no (wcag-accessibility) |
| S17 | Rewrite the microcopy on this delete confirmation modal | no (ux-copy) |
| S18 | Position our new B2B analytics tool using April Dunford's framework | no (product-marketing) |
| S19 | Migrate this Next.js 14 page to Next.js 16 `'use cache'` | no (nextjs-app-router) |
| S20 | Rewrite this rough prompt into a handoff with raw material and a proof | no (prompt-rewrite) |
