# nextjs-app-router

Production-first Next.js 16 App Router guidance — Server and Client Components, data fetching, Cache Components, routing, proxy, error handling, metadata, assets, and migration. Verified against the official Next.js documentation.

## Install

```bash
npx skills add LeahyCC/claude-skills@nextjs-app-router
```

## What It Does

Auto-activates when you edit App Router files (`app/**`), `proxy.ts`, or run Next.js CLI commands. Provides architecture decision matrices, PASS/FAIL examples, and production TypeScript patterns — not isolated API tutorials.

**Auto-triggers on:** `app/**/*.tsx`, `app/**/*.ts`, `src/app/**`, `proxy.ts`, `next.config.*`, `next dev`, `next build`, `next typegen`

## What's Different

| Typical App Router tutorials | nextjs-app-router |
|------------------------------|-------------------|
| API-by-API reference | **Decision matrices** for rendering, caching, routing, mutations |
| Toy examples | **Production TypeScript** with realistic folder structures |
| Pages Router assumptions | **Next.js 16** — `proxy.ts`, async request APIs, Cache Components |
| Scattered caching advice | **Dedicated caching resource** with `use cache`, `updateTag`, PPR |
| No migration path | **Pages Router migration** + **15 → 16 upgrade** resources |

## Coverage

| Resource | Topics |
|----------|--------|
| [server-components.md](resources/server-components.md) | Server vs Client, composition, context, server-only, environment poisoning |
| [data-fetching.md](resources/data-fetching.md) | fetch, ORM, parallel fetch, Suspense, `use()`, Route Handlers, client fetching |
| [caching.md](resources/caching.md) | Cache Components, `use cache`, cacheLife, cacheTag, revalidation, PPR |
| [routing.md](resources/routing.md) | Layouts, pages, route groups, parallel/intercepting routes, navigation |
| [proxy.md](resources/proxy.md) | proxy.ts, matcher, redirects, authentication |
| [error-handling.md](resources/error-handling.md) | loading.tsx, error.tsx, notFound(), expected errors |
| [metadata-and-seo.md](resources/metadata-and-seo.md) | Metadata API, OpenGraph, sitemap, robots, JSON-LD |
| [assets.md](resources/assets.md) | next/image, next/font, responsive images |
| [migration.md](resources/migration.md) | Pages Router → App Router migration |
| [version-changes.md](resources/version-changes.md) | Next.js 15 → 16 breaking changes, codemods |

## Verified Against

- [Next.js 16 App Router Documentation](https://nextjs.org/docs/app)
- [Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Fetching Data](https://nextjs.org/docs/app/getting-started/fetching-data)
- [Caching](https://nextjs.org/docs/app/getting-started/caching)
- [Upgrading to Version 16](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [React `use()` hook](https://react.dev/reference/react/use)

Last verified: July 2026

## Repository Structure

```
nextjs-app-router/
├── SKILL.md
├── README.md
└── resources/
    ├── server-components.md
    ├── data-fetching.md
    ├── caching.md
    ├── routing.md
    ├── proxy.md
    ├── error-handling.md
    ├── metadata-and-seo.md
    ├── assets.md
    ├── migration.md
    └── version-changes.md
```

## License

[MIT](../../LICENSE)
