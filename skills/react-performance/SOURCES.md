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
