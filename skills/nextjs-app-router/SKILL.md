---
name: nextjs-app-router
description: Use when building or reviewing Next.js App Router applications. Covers Server vs Client Components, data fetching, Server Functions, Route Handlers, Cache Components, revalidation, routing, metadata, proxy.ts, error handling, streaming, and migration from the Pages Router. Verified against the official Next.js 16 App Router documentation.
metadata:
  filePattern:
    - "app/**/*.tsx"
    - "app/**/*.ts"
    - "src/app/**/*.tsx"
    - "src/app/**/*.ts"
    - "proxy.ts"
    - "src/proxy.ts"
    - "next.config.ts"
    - "next.config.js"
    - "next.config.mjs"
  bashPattern:
    - "next dev"
    - "next build"
    - "next start"
    - "next typegen"
  priority: 50
---

# Next.js App Router

Production guidance for Next.js 16 App Router applications. **Server-first:** keep rendering, data access, and secrets on the server; add `'use client'` only for interactivity.

## Architecture Overview

```
Request → proxy.ts → Route (layout/page) → Server Components → DB/API
                              │                    │
                              │                    ▼
                              │              RSC Payload + HTML
                              │                    │
                              ▼                    ▼
                        Route Handlers      Streaming + Suspense
                                                   │
                                                   ▼
                                          Client Components (hydrate)
```

## Quick Reference

| Need help with... | Resource |
|-------------------|----------|
| Server vs Client Components | [server-components.md](resources/server-components.md) |
| Data fetching, Suspense, `use()` | [data-fetching.md](resources/data-fetching.md) |
| Cache Components, revalidation | [caching.md](resources/caching.md) |
| Layouts, navigation, dynamic routes | [routing.md](resources/routing.md) |
| `proxy.ts`, auth gates | [proxy.md](resources/proxy.md) |
| `error.tsx`, `loading.tsx`, `notFound()` | [error-handling.md](resources/error-handling.md) |
| Metadata, App Router ownership | [metadata-and-seo.md](resources/metadata-and-seo.md) |
| `next/image`, `next/font` | [assets.md](resources/assets.md) |
| Pages Router migration | [migration.md](resources/migration.md) |
| Next.js 15 → 16 upgrade | [version-changes.md](resources/version-changes.md) |

## Decision Matrix: "What Do I Use?"

| Need | Solution | Resource |
|------|----------|----------|
| Read database / API | Server Component | server-components, data-fetching |
| User interaction / state | Client Component | server-components |
| Form mutation | Server Action | data-fetching |
| HTTP endpoint / webhook | Route Handler | data-fetching |
| Cache expensive data | `'use cache'` + `cacheLife` | caching |
| Invalidate after user edit | `updateTag()` | caching |
| Invalidate from webhook | `revalidateTag(tag, 'max')` | caching |
| Auth redirect before render | `proxy.ts` | proxy |
| Loading UI | `loading.tsx` or `<Suspense>` | error-handling, data-fetching |
| Uncaught error | `error.tsx` | error-handling |
| Missing resource | `notFound()` | error-handling |
| SEO metadata | `metadata` / `generateMetadata` | metadata-and-seo |
| Optimize images/fonts | `next/image`, `next/font` | assets |

## Component Decision Tree

```
Need useState, useEffect, onClick, or browser APIs?
├── YES → Client Component ('use client' at leaf)
└── NO  → Server Component (default — no directive)

Need to mutate data?
├── HTML form / button → Server Action
└── External HTTP API  → Route Handler
```

## Data & Caching

| Scenario | Pattern |
|----------|---------|
| Independent fetches | `Promise.all()` in Server Component |
| Slow section | `<Suspense>` + streaming |
| User-specific data | `'use cache: private'` (or Suspense — no shared `'use cache'`) |
| Shared catalog | `'use cache'` + `cacheTag` |
| After mutation | `updateTag()` (actions) or `revalidateTag` (webhooks) |

## Routing Conventions

| File | Purpose |
|------|---------|
| `page.tsx` | Route UI |
| `layout.tsx` | Shared chrome (persists on navigation) |
| `loading.tsx` | Suspense fallback |
| `error.tsx` | Error boundary (Client Component) |
| `not-found.tsx` | 404 UI |
| `route.ts` | HTTP handler |
| `proxy.ts` | Pre-render interception (root or `src/`) |

## Code Review Checklist

### Components & Data

- [ ] Server Components by default; `'use client'` only at leaves
- [ ] Data fetched in Server Components, not via client `useEffect`
- [ ] Parallel fetching with `Promise.all()` where independent
- [ ] `params` / `searchParams` / `cookies()` / `headers()` awaited
- [ ] No secrets or DB clients in Client Components

### Mutations & Cache

- [ ] Server Actions authenticate and authorize
- [ ] `updateTag` or `revalidateTag` after mutations
- [ ] No `cookies()` inside shared `'use cache'` scopes (use `'use cache: private'` for per-user)

### Routing & UX

- [ ] Nested layouts; no duplicated page wrappers
- [ ] `loading.tsx` / `error.tsx` on slow or critical routes
- [ ] `notFound()` for missing resources

### Security

- [ ] `proxy.ts` gates auth; Server Actions re-verify
- [ ] Input validated in Server Actions and Route Handlers

### Performance & SEO

- [ ] `next/image` and `next/font` used
- [ ] Metadata on every public page
- [ ] Suspense for slow streaming sections

## Anti-Patterns

- [ ] `'use client'` on entire pages or layouts
- [ ] Client Component fetching data the server could fetch
- [ ] Route Handlers for internal reads (use Server Components)
- [ ] Sequential awaits for independent requests
- [ ] `middleware.ts` instead of `proxy.ts` (Next.js 16)
- [ ] Sync `params` or `cookies()` (removed)
- [ ] `revalidateTag(tag)` without second argument
- [ ] Auth only in proxy — not in Server Actions

## Resource Map

| Resource | Owns |
|----------|------|
| [server-components.md](resources/server-components.md) | RSC, Client boundaries, composition, context, server-only |
| [data-fetching.md](resources/data-fetching.md) | fetch, ORM, parallel fetch, Suspense, `use()`, Route Handlers |
| [caching.md](resources/caching.md) | `'use cache'`, cacheLife, cacheTag, revalidation, PPR |
| [routing.md](resources/routing.md) | Layouts, pages, parallel/intercepting routes, Link |
| [proxy.md](resources/proxy.md) | proxy.ts, matcher, redirects, auth gates |
| [error-handling.md](resources/error-handling.md) | loading, error, not-found boundaries |
| [metadata-and-seo.md](resources/metadata-and-seo.md) | Metadata API ownership; SEO depth → seo skill |
| [assets.md](resources/assets.md) | next/image, next/font |
| [migration.md](resources/migration.md) | Pages Router → App Router |
| [version-changes.md](resources/version-changes.md) | Next.js 15 → 16 breaking changes |

## References

Verified against [Next.js 16 App Router documentation](https://nextjs.org/docs/app).

- [Project Structure](https://nextjs.org/docs/app/getting-started/project-structure)
- [Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Fetching Data](https://nextjs.org/docs/app/getting-started/fetching-data)
- [Caching](https://nextjs.org/docs/app/getting-started/caching)
- [Route Handlers](https://nextjs.org/docs/app/api-reference/file-conventions/route)
- [Proxy](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)
- [Upgrading to Version 16](https://nextjs.org/docs/app/guides/upgrading/version-16)

**Last verified:** July 2026
