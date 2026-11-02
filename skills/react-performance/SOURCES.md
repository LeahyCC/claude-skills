# Scoped follow-up, 2026-10-21

Checked on 2026-10-21 (Pacific/Honolulu). This follows #9, not a fresh certification of the whole skill. Entry/resource filenames and discovery frontmatter are preserved. Older review dates elsewhere do not imply that every claim was checked today. Current live docs identify React 19.3 and Next 16.4.2; inspect installed versions/configs before using newer APIs.

| Section | KEEP | REVISE | ADD | REMOVE | Source scope |
| --- | --- | --- | --- | --- | --- |
| Entry / Compiler decisions | Measurement and focused routing | Incremental optional adoption, preserve existing manual memoization | Version/config preflight and identity-contract caveat | Fictional official optimization hierarchy and blanket remove/don't-add rules | React intro/adoption |
| Compiler resource | Existing setup and gradual rollout | Contradictory replacement table and new-code recommendation | Coverage/behavior/performance check | Unsourced Meta percentages and universal superiority claim | React intro/adoption |
| Assets: images/fonts | Space reservation, sizes, helpers | Next16 loading hints; actual font network/CLS tradeoffs | Explicit version gate and constrained example | First-index priority, guaranteed zero shift, wildcard CDN default | Next Image/Font |
| Assets: scripts/video/preload | Delayed noncritical loading | Worker/router restrictions and client event timing | Typed load-video example, native controls | Arbitrary polyfill CDN recommendation, play-before-mount call, invalid metadata link object | Next Script/Metadata; React state snapshot |

| Canonical source | Applicable version/config | Upstream date | Checked sections |
| --- | --- | --- | --- |
| [React Compiler introduction](https://react.dev/learn/react-compiler/introduction) | React Compiler; live React19.3 docs, actual compiler coverage required | unknown | Manual memoization migration and supported scope |
| [Incremental adoption](https://react.dev/learn/react-compiler/incremental-adoption) | Existing projects adopting Compiler | unknown | Gradual rollout, opt-in/out, behavior/performance measurement |
| [Image](https://nextjs.org/docs/app/api-reference/components/image) | Next16 preload/deprecation; earlier versions require their API | 2026-09-28 | Sizes/dimensions, preload/loading/fetchPriority, version history |
| [Font](https://nextjs.org/docs/app/api-reference/components/font) | Next/font in supported Next apps | 2026-09-24 | Google/local loading, display, class/variable use |
| [Script](https://nextjs.org/docs/app/api-reference/components/script) | Next16.4.2; App vs Pages and experimental worker distinction | 2026-08-21 | Strategies, placement, worker and event restrictions |
| [Metadata resource hints](https://nextjs.org/docs/app/api-reference/functions/generate-metadata#resource-hints) | App Metadata API; Next16.4.2 live docs | 2026-08-19 | other metadata vs link/resource hint APIs |
| [State as a snapshot](https://react.dev/learn/state-as-a-snapshot) | React state updates | unknown | Setting state schedules rendering rather than mounting a ref synchronously |

Actually checked date for every row: 2026-10-21. Source page dates are upstream fields, not our review date. No broad React17/18 compatibility or compiler/build-configuration revalidation is claimed. Existing performance/resource overlap with Next.js and SEO remains intentional; no sibling files removed. Recheck affected rows on framework upgrades, observed failures or before relying on guidance older than three months in an active project. Age alone does not make guidance wrong.

Validation: unchanged discovery name/description/metadata, frontmatter, links and whitespace checks. Typed changed asset examples checked against local Next16.4.2/React19.2.0; local media/script files and Google build networking are integration prerequisites, not exercised services. No additional Claude evaluation or measured speedup is claimed for this follow-up.

## One PDF canvas, 2026-10-23

| Claim home | Checked against |
| --- | --- |
| [rendering.md](./resources/rendering.md), per-asset update under a large tree | `DECISIONS.md` entry "A bitmap swap keeps the old picture until the new one is decoded". `measurements/2026-10-23-markup/200-pages-10k-profile-before.txt` (`propagateParentContextChanges`, 2450 ms of a 22 s sample) and `200-pages-10k-shapes.txt` (56 fps and 60 dropped, then 59 and 5). Old `page-shape.tsx` at `2761494^` was `useValue` plus `useState`. |
| [profiling.md](./resources/profiling.md), dev build in the profile | Same profile file. The printed symbols are `exports.jsxDEV`, and `now` and `run` with no source location. |

## Rendering, effects, hydration and API fixes, 2026-11-01

Checked on 2026-11-01. Each row was read on that date. "unknown" means the page shows no upstream date. A React Compiler note was added only where the page itself mentions the compiler (useCallback). The other pages do not, so their rules carry no compiler note.

| Claim home | Canonical source | Upstream date | Checked |
| --- | --- | --- | --- |
| [rendering.md](./resources/rendering.md), declare components at the top level | [Your First Component](https://react.dev/learn/your-first-component), [Preserving and Resetting State](https://react.dev/learn/preserving-and-resetting-state) | unknown | Nested definitions are a new type each render, state below resets, declare at top level |
| [rendering.md](./resources/rendering.md), async transitions and ordering | [useTransition](https://react.dev/reference/react/useTransition) | unknown | Updates after `await` need another `startTransition`; no order guarantee; ongoing transitions batched; `useActionState` and form actions handle ordering |
| [rendering.md](./resources/rendering.md), Activity | [Activity](https://react.dev/reference/react/Activity), [React 19.2 release](https://react.dev/blog/2025/10/01/react-19-2) | 2025-10-01 (release post) | `display: none`, state and DOM kept, Effects cleaned up, low-priority re-render, pre-render via Suspense data only, media keeps playing |
| [rendering.md](./resources/rendering.md), useCallback cases and compiler note | [useCallback](https://react.dev/reference/react/useCallback) | unknown | memo child, Effect or Hook dependency, custom Hook return; compiler reduces the need |
| [rendering.md](./resources/rendering.md), lazy useState and updaters | [useState](https://react.dev/reference/react/useState) | unknown | Initializer called once, twice in Strict Mode dev; updater queue; updater not required |
| [rendering.md](./resources/rendering.md), narrow effect dependencies | [Removing Effect Dependencies](https://react.dev/learn/removing-effect-dependencies), [useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore), [MediaQueryList change event](https://developer.mozilla.org/en-US/docs/Web/API/MediaQueryList/change_event) | unknown | Objects and functions as dependencies, read primitives; snapshot must be stable; new `subscribe` re-subscribes. The matchMedia hook is our composition of these documented APIs, not a react.dev example |
| [rendering.md](./resources/rendering.md), useEffectEvent | [useEffectEvent](https://react.dev/reference/react/useEffectEvent), [React 19.2 release](https://react.dev/blog/2025/10/01/react-19-2) | 2025-10-01 (release post) | Unstable identity, not a dependency, call only from Effects, never pass on, upgrade the lint plugin |
| [rendering.md](./resources/rendering.md), app-wide init | [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect#initializing-the-application) | unknown | Runs twice in development; module flag; module top level with `typeof window` |
| [server-components.md](./resources/server-components.md), hydration mismatch | [hydrateRoot](https://react.dev/reference/react-dom/client/hydrateRoot), [React 19 release](https://react.dev/blog/2024/12/05/react-19) | 2024-12-05 (release post) | Slowdown at best, wrong handlers at worst; text not patched; tree regenerated on the client; two-pass cost; `suppressHydrationWarning` one level. The exact extent of the client re-render is not documented, so the resource says so |
| [server-components.md](./resources/server-components.md), [data-and-lists.md](./resources/data-and-lists.md), Promise `params` and `searchParams` | [page.js](https://nextjs.org/docs/app/api-reference/file-conventions/page) | 2026-06-09 | Promise since v15.0.0-RC; await in Server Components, `use` in Client Components |
| [data-and-lists.md](./resources/data-and-lists.md), react-window 2 | [react-window README](https://github.com/bvaughn/react-window), npm 2.5.3 type declarations | unknown | `List`, `rowComponent`, `rowCount`, `rowHeight`, `rowProps`, `RowComponentProps`, `ariaAttributes`, height via `style` |
| [bundle.md](./resources/bundle.md), `dynamic()` at top level | [Lazy loading, Pages Router](https://nextjs.org/docs/pages/guides/lazy-loading), [Lazy loading, App Router](https://nextjs.org/docs/app/guides/lazy-loading) | 2025-04-24, 2026-03-10 | Must be at module top level for preloading; `ssr: false` only in Client Components |
| [web-vitals.md](./resources/web-vitals.md), hero image and next/font | [Image](https://nextjs.org/docs/app/api-reference/components/image), [Font](https://nextjs.org/docs/app/api-reference/components/font) | 2026-09-28, 2026-09-24 | `priority` deprecated in v16 for `preload`; prefer eager or high fetch priority; `adjustFontFallback` reduces CLS; default `display: swap`. The Font page intro says "no layout shift", but its option docs say "reduce", so the resource says reduce |
