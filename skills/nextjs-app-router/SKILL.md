---
name: nextjs-app-router
description: Build, review, or migrate Next.js App Router applications with version-aware component boundaries, data fetching, caching, routing, and mutations. Use for App Router implementation and architecture tasks, not generic React optimization, copy-only edits, or Pages Router fixes that do not involve migration.
---

# Next.js App Router

Preserve the app's supported version and configuration. Prefer server rendering and direct server reads where they fit; keep interactive and live browser behavior where needed.

## Establish the context

Inspect `package.json`, lockfile, route folders, `next.config.*`, and project instructions. Identify the installed Next.js/React versions, App vs Pages Router, runtime/deployment constraints, and whether Cache Components is enabled. In monorepos resolve these from the affected app. Do not upgrade packages or enable features merely to fit an example.

Prefer version-matched docs bundled at `node_modules/next/dist/docs/` on Next.js 16.2+, when available. Otherwise consult official docs for the supported version. The live docs can describe a newer minor; confirm API version history and config before use. Distinguish stable APIs, experimental options, deprecations and project conventions.

## Choose the relevant resource

Read only the resources needed for the task; follow their official links when a version or behavior is uncertain.

| Task | Resource |
| --- | --- |
| Server/client boundaries, composition, serialization | [Server Components](resources/server-components.md) |
| Reads, streaming, browser data, actions, HTTP endpoints | [Data fetching](resources/data-fetching.md) |
| Existing cache mode, Cache Components, private/remote cache, invalidation | [Caching](resources/caching.md) |
| Layouts, dynamic routes, search, parallel/intercepting routes | [Routing](resources/routing.md) |
| Request redirects/rewrites and optimistic auth gates | [Proxy](resources/proxy.md) |
| Expected errors, loading, recovery, 404 response semantics | [Error handling](resources/error-handling.md) |
| Metadata exports, inheritance and SEO integration | [Metadata](resources/metadata-and-seo.md) |
| Image/font configuration and loading tradeoffs | [Assets](resources/assets.md) |
| Incremental Pages to App migration | [Migration](resources/migration.md) |
| Deliberate major/minor upgrades | [Version changes](resources/version-changes.md) |

## Prioritize decisions

1. Protect secrets and user data. Authenticate and authorize reads/mutations near the data, validate untrusted input, and keep personal data out of an incorrectly shared cache. Proxy and UI visibility are insufficient authorization.
2. Preserve correctness across versions and rendering modes. Async request APIs, cache prerequisites, route conventions and recovery props depend on the installed version/config.
3. Remove demonstrated waterfalls and unnecessary client code. Parallelize independent work; choose Suspense boundaries that preserve useful UI. Client fetching remains appropriate for polling, browser-only state and interactive updates.
4. Tune caching, prefetch and asset hints to freshness, deployment and measured behavior. These are choices, not prerequisites for every App Router app.

Use Server Components for server-only work. Add `'use client'` at a useful module boundary for interaction; it need not be a leaf. Use a Server Action for UI mutations when appropriate, or a Route Handler for an HTTP contract (including browser clients). Neither replaces authorization.

## Validate the actual change

Run the affected app's existing typecheck, lint and build commands when available. Test the behavior that can fail: authenticated direct requests, cross-user isolation, post-mutation freshness, hard/soft navigation, errors, and loading. Do not call a snippet production-ready when imports, auth helpers or persistence are placeholders. State what ran and what remains untested.

For reviews, lead with actionable failures and their version/config scope. Separate optional improvements from correctness issues. For implementation, explain the chosen boundary/cache mode, changed behavior and verification.

Source review is scoped, not a blanket certification. See [SOURCES.md](SOURCES.md) for canonical links, applicable versions/configurations, checked sections, upstream dates and the freshness policy. The repository's pilot review/evaluation records are maintenance evidence and are not required at runtime.
