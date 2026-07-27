# Next.js 15 → 16 Version Changes

> **Core Principle:** Upgrade with codemods first, then fix type errors. Async request APIs and Cache Components are the two highest-impact changes.

## Introduction

Next.js 16 renames `middleware.ts` to `proxy.ts`, removes synchronous compatibility for request APIs (`params`, `searchParams`, `cookies`, `headers`, `draftMode`), and introduces **opt-in** Cache Components via `cacheComponents: true`. This resource covers breaking changes, migration steps, and codemods.

For Pages Router migration, see [migration.md](migration.md). For Cache Components usage, see [caching.md](caching.md). For `proxy.ts` patterns, see [proxy.md](proxy.md).

## Architecture

```
Next.js 16 Upgrade Impact
│
├── proxy.ts (was middleware.ts)
├── Async Request APIs
│   ├── params: Promise<{}>
│   ├── searchParams: Promise<{}>
│   ├── cookies(): Promise<ReadonlyRequestCookies>
│   ├── headers(): Promise<ReadonlyHeaders>
│   └── draftMode(): Promise<DraftMode>
│
└── Cache Components (opt-in: cacheComponents: true)
    ├── 'use cache'
    ├── cacheLife / cacheTag
    ├── revalidateTag(tag, 'max')
    ├── updateTag (Server Actions only)
    └── connection() for request-time values
```

## Breaking Changes Summary

| Change | Before (15) | After (16) |
|--------|-------------|------------|
| Default bundler | Webpack (Turbopack opt-in) | **Turbopack** default for `next dev` / `next build`; use `--webpack` to opt out |
| Custom webpack + default build | Silent ignore risk | Build **fails** if `webpack` config present unless `--webpack` or migrate to Turbopack |
| Middleware file | `middleware.ts` | `proxy.ts` (filename deprecated → renamed) |
| Middleware export | `export function middleware` | `export function proxy` |
| Proxy runtime | Middleware could use Edge | `proxy` is **Node.js only** — Edge not supported |
| `params` in pages/layouts | Sync object (compat shim) | `Promise<{}>` — must `await` (**sync removed**) |
| `searchParams` | Sync object (compat shim) | `Promise<{}>` — must `await` (**sync removed**) |
| `cookies()` / `headers()` / `draftMode()` | Sync compat | Must `await` (**sync removed**) |
| `serverRuntimeConfig` / `publicRuntimeConfig` | Supported | **Removed** — use env vars (`NEXT_PUBLIC_*` for client) |
| AMP (`next/amp`, `amp` config) | Supported | **Removed** |
| Node.js | 18+ common | **20.9.0+** minimum |
| TypeScript | Older OK | **5.1.0+** minimum |
| Parallel route slots | Implicit fallback | Explicit `default.js` **required** per slot or build fails |
| `experimental.dynamicIO` | Experimental flag | **Removed** — use `cacheComponents: true` |
| `experimental.useCache` | Experimental flag | **Removed** — use `cacheComponents: true` |
| Caching model | Implicit fetch cache defaults | Opt-in Cache Components (`cacheComponents: true`) + `'use cache'` |
| `revalidateTag(tag)` | Immediate expiry | Deprecated — use `revalidateTag(tag, 'max')` |
| PPR | Experimental flag | Default **when** Cache Components are enabled |
| `unstable_rootParams()` | Experimental | **Removed** (replacement forthcoming) |
| Dev output | Shared `.next` | `next dev` writes to **`.next/dev`** (concurrent with build) |
| `generateImageMetadata` `id` | Sync string | `id` is `Promise<string>` in the image function |
| `generateSitemaps` `id` | Sync | `id` is async (`Promise`) in the sitemap function |
| `next lint` | Built-in command | **Removed** — use ESLint/Biome CLI; `next build` no longer lints |

## Decision Matrix

| Task | Tool / Pattern |
|------|----------------|
| Rename middleware → proxy | `npx @next/codemod@canary middleware-to-proxy .` |
| Async params migration | `npx @next/codemod@canary next-async-request-api .` |
| Enable Cache Components | `cacheComponents: true` in `next.config.ts` |
| User mutation cache refresh | `updateTag()` in Server Actions |
| Webhook cache refresh | `revalidateTag(tag, 'max')` in Route Handlers |
| Request-time random values | `await connection()` + Suspense |

## Upgrade Workflow

```
1. npx @next/codemod@canary upgrade latest
2. npx @next/codemod@canary middleware-to-proxy .
3. npx @next/codemod@canary next-async-request-api .
4. npx @next/codemod@canary next-lint-to-eslint-cli .   # next lint removed
5. Confirm Node ≥ 20.9 and TypeScript ≥ 5.1
6. Add cacheComponents: true (replaces experimental.dynamicIO / useCache)
7. Fix remaining TypeScript errors (await params, cookies, headers)
8. Replace revalidateTag(tag) → revalidateTag(tag, 'max')
9. Add default.js to every parallel route slot
10. Audit webpack config — use Turbopack or next build --webpack
11. Run next build && next typegen
12. Test proxy matcher excludes static assets
```

### package.json Upgrade

```bash
npm install next@latest react@latest react-dom@latest
npx @next/codemod@canary upgrade latest
```

### Enable Cache Components

```ts
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
}

export default nextConfig
```

## middleware.ts → proxy.ts

The `middleware` filename is deprecated and renamed to `proxy` to clarify the network boundary. The named export must change from `middleware` to `proxy`.

**Runtime:** `proxy` defaults to the **Node.js** runtime. The Edge runtime is **not** supported in `proxy` and cannot be configured. If you must keep the Edge runtime, continue using `middleware` until Next.js ships further Edge guidance.

```ts
// BEFORE — middleware.ts (deprecated)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const session = request.cookies.get('session')
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  return NextResponse.next()
}

export const config = { matcher: '/dashboard/:path*' }
```

```ts
// AFTER — proxy.ts (project root or src/)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const session = request.cookies.get('session')
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  return NextResponse.next()
}

export const config = { matcher: '/dashboard/:path*' }
```

Codemod (renames file + export):

```bash
npx @next/codemod@canary middleware-to-proxy .
```

Also rename related config flags (e.g. `skipMiddlewareUrlNormalize` → `skipProxyUrlNormalize`).

## Async Request APIs

Next.js **15** introduced async request APIs as a breaking change, with **temporary synchronous compatibility** so existing sync access still worked (with warnings).

Next.js **16** **removes** that synchronous compatibility. These APIs can only be accessed asynchronously — this is not “Next.js 16 made params async”; async landed in 15, and 16 finishes the migration by deleting sync access.

Affected APIs: `cookies()`, `headers()`, `draftMode()`, `params` (layouts/pages/routes/metadata images), and `searchParams` (pages).

### params

```tsx
// BEFORE — sync access (allowed with warnings in Next.js 15; removed in 16)
export default function Page({ params }: { params: { slug: string } }) {
  return <h1>{params.slug}</h1>
}
```

```tsx
// AFTER — required in Next.js 16 (also the correct pattern in 15)
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <h1>{slug}</h1>
}
```

```tsx
// Client Component — use React use()
'use client'
import { use } from 'react'

export default function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  return <h1>{slug}</h1>
}
```

### searchParams

```tsx
// AFTER
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  return <SearchResults query={q ?? ''} />
}
```

### cookies() and headers()

```tsx
// BEFORE — sync access (temporary compat in Next.js 15; removed in 16)
import { cookies, headers } from 'next/headers'

export default function Page() {
  const token = cookies().get('token')
  const ua = headers().get('user-agent')
}
```

```tsx
// AFTER — await required in Next.js 16
import { cookies, headers } from 'next/headers'

export default async function Page() {
  const token = (await cookies()).get('token')
  const ua = (await headers()).get('user-agent')
}
```

### draftMode()

```tsx
// AFTER
import { draftMode } from 'next/headers'

export default async function Page() {
  const { isEnabled } = await draftMode()
  if (isEnabled) return <DraftBanner />
}
```

Codemod:

```bash
npx @next/codemod@canary next-async-request-api .
```

## Cache Components Changes

### revalidateTag signature

```tsx
// BEFORE — deprecated single argument
revalidateTag('posts')
```

```tsx
// AFTER — stale-while-revalidate (recommended)
revalidateTag('posts', 'max')

// Immediate expiry (webhooks only)
revalidateTag('posts', { expire: 0 })
```

### updateTag — Server Actions only

```tsx
'use server'
import { updateTag } from 'next/cache'

export async function createPost(formData: FormData) {
  await db.post.create({ data: { ... } })
  updateTag('posts') // Immediate — read-your-own-writes
}
```

Cannot be used in Route Handlers or `proxy.ts`. Use `revalidateTag` there instead.

### connection() for non-deterministic values

```tsx
import { connection } from 'next/server'
import { Suspense } from 'react'

async function RequestTime() {
  await connection()
  return <p>Loaded at {new Date().toISOString()}</p>
}

export default function Page() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <RequestTime />
    </Suspense>
  )
}
```

### generateStaticParams with Cache Components

Must return **at least one** param when `cacheComponents` is enabled. Empty arrays cause build errors — Cache Components needs a sample param to validate the route does not incorrectly access runtime APIs.

If real params are unknown at build time, return a placeholder, then call `notFound()` for it in the page. **Limitation:** a placeholder bypasses effective build-time validation and may surface runtime errors instead.

```tsx
import { notFound } from 'next/navigation'

export async function generateStaticParams() {
  const slugs = await getAllSlugs()
  if (slugs.length > 0) {
    return slugs.map((slug) => ({ slug }))
  }
  // Placeholder only when no real params exist yet — prefer real IDs when available
  return [{ slug: '__placeholder__' }]
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  if (slug === '__placeholder__') notFound()
  // ...
}
```

## PASS Examples

### Full async page signature

```tsx
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { id } = await params
  const { tab } = await searchParams
  const session = (await cookies()).get('session')?.value
  // ...
}
```

### Proxy at correct location

```
project-root/
├── proxy.ts       ✓
├── src/
│   ├── proxy.ts   ✓ (with src/app/)
│   └── app/
└── app/
    └── proxy.ts   ✗ wrong
```

## FAIL Examples

### Sync cookies in Next.js 16

```tsx
// FAIL — TypeScript error; runtime may warn
const session = cookies().get('session')
```

```tsx
// PASS
const session = (await cookies()).get('session')
```

### Keeping middleware.ts filename

```tsx
// FAIL — removed in Next.js 16
// middleware.ts still works temporarily but will be removed
export function middleware(request: NextRequest) { ... }
```

### updateTag in Route Handler

```ts
// FAIL
export async function POST() {
  updateTag('posts') // Throws — Server Actions only
}
```

```ts
// PASS
export async function POST() {
  revalidateTag('posts', 'max')
}
```

### Reading cookies inside 'use cache'

```tsx
// FAIL — build error with Cache Components
export default async function Page() {
  'use cache'
  const theme = (await cookies()).get('theme')?.value
}
```

```tsx
// PASS — see caching.md for full pattern
async function ThemedContent() {
  const theme = (await cookies()).get('theme')?.value
  return <CachedTheme theme={theme ?? 'light'} />
}
```

## Removed / Deprecated APIs

| API | Status | Replacement |
|-----|--------|-------------|
| `middleware.ts` | Deprecated (rename) | `proxy.ts` |
| `export function middleware` | Deprecated (rename) | `export function proxy` |
| Sync `params` / `searchParams` | **Removed** | `await params` / `use(params)` |
| Sync `cookies()` / `headers()` / `draftMode()` | **Removed** | `await cookies()` / `await headers()` / `await draftMode()` |
| `serverRuntimeConfig` / `publicRuntimeConfig` | **Removed** | Environment variables |
| AMP (`next/amp`, `amp` config) | **Removed** | Built-in optimizations / modern web |
| `next lint` | **Removed** | ESLint or Biome CLI |
| `experimental.dynamicIO` | **Removed** | `cacheComponents: true` |
| `experimental.useCache` | **Removed** | `cacheComponents: true` |
| `unstable_rootParams()` | **Removed** | Forthcoming alternative API |
| `revalidateTag(tag)` single arg | Deprecated | `revalidateTag(tag, 'max')` |
| Implicit fetch cache defaults | Changed | Cache Components model |

## Codemods

| Codemod | Command |
|---------|---------|
| Upgrade Next.js | `npx @next/codemod@canary upgrade latest` |
| middleware → proxy | `npx @next/codemod@canary middleware-to-proxy .` |
| Async request APIs | `npx @next/codemod@canary next-async-request-api .` |
| `next lint` → ESLint CLI | `npx @next/codemod@canary next-lint-to-eslint-cli .` |

Run codemods before manual fixes. Review diffs — codemods may not cover every edge case.

## Migration Checklist

### Upgrade

- [ ] `next`, `react`, `react-dom` updated to latest
- [ ] Node.js ≥ 20.9.0 and TypeScript ≥ 5.1.0
- [ ] `npx @next/codemod@canary upgrade latest` run
- [ ] Turbopack default accepted, or `--webpack` / config migrated
- [ ] `next lint` removed from scripts — ESLint/Biome CLI in place
- [ ] `serverRuntimeConfig` / `publicRuntimeConfig` / AMP usage removed
- [ ] Parallel route slots each have `default.js`
- [ ] `next build` passes

### proxy.ts

- [ ] `middleware.ts` renamed to `proxy.ts`
- [ ] Export renamed to `proxy`
- [ ] File at project root or `src/` (not inside `app/`)
- [ ] Matcher excludes `_next/static`, `_next/image`

### Async APIs

- [ ] All `params` typed as `Promise<{}>` and awaited
- [ ] All `searchParams` awaited
- [ ] `cookies()` and `headers()` awaited
- [ ] `draftMode()` awaited
- [ ] `generateImageMetadata` / `generateSitemaps` `id` awaited where applicable
- [ ] Client Components use `use(params)` where needed

### Cache Components

- [ ] `cacheComponents: true` in `next.config.ts` (not `experimental.dynamicIO` / `useCache`)
- [ ] `revalidateTag(tag, 'max')` updated everywhere
- [ ] `updateTag` only in Server Actions
- [ ] `generateStaticParams` returns ≥1 entry (`__placeholder__` + `notFound()` only if needed)
- [ ] No runtime APIs inside `'use cache'` scopes
- [ ] `connection()` used for request-time non-deterministic values
- [ ] No remaining `unstable_rootParams()` calls
- [ ] Dev tooling aware of `.next/dev` output directory

## References

### Verified Against

- [Upgrading to Version 16](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [Proxy Migration](https://nextjs.org/docs/app/api-reference/file-conventions/proxy#migration-to-proxy)
- [Async Request APIs](https://nextjs.org/docs/app/api-reference/functions/cookies)
- [`connection`](https://nextjs.org/docs/app/api-reference/functions/connection)
- [Cache Components](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents)
- [`use cache`](https://nextjs.org/docs/app/api-reference/directives/use-cache)
- [`revalidateTag`](https://nextjs.org/docs/app/api-reference/functions/revalidateTag)
- [`updateTag`](https://nextjs.org/docs/app/api-reference/functions/updateTag)
- [Codemods](https://nextjs.org/docs/app/guides/upgrading/codemods)

**Framework:** Next.js 16 App Router · React 19.2

**Last verified:** July 2026
