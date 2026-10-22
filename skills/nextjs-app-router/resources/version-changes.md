# Version-aware upgrades

Choose the intended target version before running install commands or codemods. Inspect the lockfile, Node/runtime constraints, React compatibility, custom bundler config and deployment adapter. A bug fix does not authorize a major upgrade or experimental feature adoption.

## Next.js 15 to 16 decisions

| Surface | Change / action |
| --- | --- |
| Request APIs | Await params, page searchParams, cookies, headers and draftMode; 15 introduced async APIs with temporary sync compatibility, 16 removes sync access |
| Runtime baseline | Next 16 requires Node >=20.9 and TS >=5.1; these minimums are not a recommendation to run an unsupported Node release |
| Bundler | Turbopack default for dev/build; inspect custom webpack config and choose migration or supported --webpack option |
| Middleware | Deprecated convention renamed to proxy; Proxy is Node-only, so don't blindly rename an Edge integration |
| Lint | next lint removed; next build no longer runs lint; use the project's ESLint/Biome command separately |
| Runtime config / AMP | Removed legacy runtime config and AMP surfaces require alternatives |
| Cache Components | Opt-in, not a required step for every upgrade; replaces earlier experimental useCache/dynamicIO flags |
| Tag invalidation | updateTag added for action read-your-writes; one-argument revalidateTag deprecated; preserve immediate vs stale semantics |
| Images | priority deprecated in favor of preload; review defaults and permitted local/remote URLs |
| Slots | Review required parallel-slot default files and direct-load behavior |

Codemods help but are code changes: run in a clean/recoverable checkout, target a deliberate release and review the diff. Current official upgrade docs show canary tooling and latest package examples; do not execute those silently for a maintenance task targeting an earlier version. Follow the selected target's guide and inspect remaining migration markers/type errors. The async Request API codemod is a separate step when sync access remains.

## Minor versions matter

- Next.js 16.2+ bundles version-matched docs under `node_modules/next/dist/docs/`; resolve them from the affected app.
- Error recovery: 16.2 adds experimental `unstable_retry`, 16.3 stabilizes `retry`. Earlier supported versions use `reset` with different refetch behavior. See [errors](error-handling.md).
- Current live Cache Components config docs request an explicit `partialPrefetching` setting. Use only options supported by the installed minor; plan cache migration separately. Existing fetch and unstable_cache caching need not be rewritten just to enable Cache Components.
- New or experimental APIs in current docs are not universal defaults for “Next.js 16.” Check version history, project config and deployment support; keep unsupported-feature advice out of ordinary fixes.

For Cache Components adoption, remove or migrate incompatible route segment exports per the official migration guide, place runtime work under Suspense and check metadata separately. `generateStaticParams` requirements differ by mode. Don't invent placeholder params merely to make a build pass without explaining weakened validation.

## Verify the upgrade

Run dependency resolution/typecheck, explicit lint and production build using the project's package manager. Exercise request APIs, static/runtime data, invalidation, proxy matchers, slots, image config and direct action/API authorization. Record the actual target and checks, not “latest verified.” Pages to App migration remains a separate [workflow](migration.md).

Sources: [Next 16 upgrade](https://nextjs.org/docs/app/guides/upgrading/version-16), [AI agent/version-matched docs](https://nextjs.org/docs/app/guides/ai-agents), [error version history](https://nextjs.org/docs/app/api-reference/file-conventions/error), [Cache Components config](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents), [cache migration](https://nextjs.org/docs/app/guides/migrating-to-cache-components). Scope/dates: [ledger](../SOURCES.md).
