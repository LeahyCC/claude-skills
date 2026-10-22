# Scoped performance follow-up

Actually checked 2026-10-21 (Pacific/Honolulu), after #10. This review concerns performance.md; it does not re-certify metadata, crawlability, schema, OG or GEO. Current Next docs are 16.4.2 and React docs 19.3; use installed-version guidance, with React18+ for useDeferredValue and explicit Next16 image deprecation.

| Section | KEEP | REVISE | ADD | REMOVE |
| --- | --- | --- | --- | --- |
| Metrics | Existing field thresholds and ranking caveat | Distinguish current INP from historical FID | None needed | Claim any historical FID reference is invalid |
| LCP/fonts | Space reservation and initial useful content | Supported image hints and font/network tradeoffs | Version prerequisites and Client prerender distinction | MUST priority, automatic font benefit guarantee, server/client false binary |
| INP | Urgent input and optional deferred UI | Complete typed deferred-results example | Single synchronous computation caveat | Claim filtering in startTransition becomes nonblocking |
| Splitting/audits | Optional lazy loading and measurement | Router/component constraint; automated vs manual audit scope | Rich Results/manual fallback | Generic ssr:false recommendation and schema certification implication |

| Canonical source | Version/config and checked guidance | Upstream date |
| --- | --- | --- |
| [Next Image](https://nextjs.org/docs/app/api-reference/components/image) | Next16 preload/priority, sizes, eager/fetchPriority; older apps use their supported props | 2026-09-28 |
| [Server/Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components) | App Router prerender/hydration vs effect-driven fetch timing | 2026-10-05 |
| [Next Font](https://nextjs.org/docs/app/api-reference/components/font) | Google build download/local asset and display behavior | 2026-09-24 |
| [useTransition](https://react.dev/reference/react/useTransition) | React18+ synchronous callback vs scheduling React work | unknown |
| [useDeferredValue](https://react.dev/reference/react/useDeferredValue) | React18+ slow subtree memoization/interruptible rendering; not arbitrary CPU preemption | unknown |
| [Next lazy loading](https://nextjs.org/docs/app/guides/lazy-loading) | App Router ssr:false only in Client Components | unknown |
| [Google structured data introduction](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data) | Rich Results Test and supported rich-result eligibility, not blanket Lighthouse certification | unknown |

All rows checked 2026-10-21; unknown means an upstream date was not captured. Existing thresholds/monitoring were retained from prior review, not freshly field-benchmarked. Sibling React performance/App Router asset guidance intentionally overlaps; preserve the resources and their callers rather than require another installed skill. Use primary docs to resolve version questions.

Validation: both new complete TSX examples typecheck with Next16.4.2 and React19.2.0. A React runtime assertion confirms transition callback execution precedes the next synchronous statement. Frontmatter/discovery unchanged; links and whitespace checked. No new behavioral model evaluation, browser latency measurement, full search-index assessment or measured ranking gain. Recheck on upgrades, observed failures or after three months of active reliance; age alone does not disprove a claim.
