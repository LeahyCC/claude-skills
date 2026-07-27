# Caching

> **Core Principle:** Cache intentionally. Match cache lifetime and invalidation strategy to how often data changes and how fresh users need it to be.

## Introduction

Next.js 16 uses **Cache Components** — enabled with `cacheComponents: true` in `next.config.ts`. The `'use cache'` directive marks routes, components, or functions as cacheable. **Partial Prerendering (PPR)** is the default rendering model with Cache Components: a static shell streams immediately; dynamic sections fill in at request time.

This resource covers cache configuration, tagging, invalidation, and production patterns. For data-fetching mechanics, see [data-fetching.md](data-fetching.md). For Server Component boundaries, see [server-components.md](server-components.md).

## Architecture

```
next.config.ts
  cacheComponents: true
        │
        ▼
Build / Request
        │
        ├──────────────────────────────────────┐
        │                                      │
        ▼                                      ▼
'use cache' + cacheLife()              No 'use cache'
(cacheTag optional)                    (runtime data)
        │                                      │
        ▼                                      ▼
Static Shell (prerendered)            Suspense boundary
        │                              streams at request
        ▼                                      │
Cached output in shell ◄───────────────────────┘
        │
        ▼
Mutation (Server Action)
        │
        ├──────────────┬──────────────┐
        ▼              ▼              ▼
   updateTag()   revalidateTag()  revalidatePath()
   (immediate)   (stale-while-     (path-based)
                  revalidate)
```

### Cache Layers

| Layer | Controlled By | Purpose |
|-------|--------------|---------|
| Build-time prerender | `'use cache'`, `generateStaticParams` | Static shell, PPR |
| Server runtime cache | `'use cache'`, `cacheLife` | In-memory LRU (or `use cache: remote`) |
| Client router cache | `cacheLife` `stale` profile | Instant client navigations |
| Fetch cache tags | `next: { tags }` on `fetch()` | Tag-based invalidation |

## Decision Matrix

### "Should I cache this?"

| Data | Cache? | Profile | Invalidation |
|------|--------|---------|--------------|
| Legal pages, docs | Yes | `max` | Rare manual `revalidateTag` |
| Blog posts, articles | Yes | `days` | `revalidateTag('posts', 'max')` on publish |
| Product catalog | Yes | `hours` | Tag per category + `updateTag` on edit |
| User dashboard | Yes (`'use cache: private'`) | `minutes` | Browser-only — never shared server cache |
| Cart, session secrets | No shared `'use cache'` | — | Suspense or `'use cache: private'` |
| Stock prices | Yes | `seconds` | Short TTL + Suspense fallback |
| Admin-only data | No | — | Auth-gated, request-time only |

### "Which invalidation API?"

| Scenario | API | Context |
|----------|-----|---------|
| User edits own post, must see it immediately | `updateTag()` | Server Actions only |
| Background webhook, stale OK briefly | `revalidateTag(tag, 'max')` | Server Actions, Route Handlers |
| Webhook needs immediate expiry | `revalidateTag(tag, { expire: 0 })` | Route Handlers |
| Layout or page path must refresh | `revalidatePath('/blog')` | After mutations |
| Read-your-own-writes after form submit | `updateTag()` | Server Actions |
| Invalidate all pages using a tag | `revalidateTag(tag, 'max')` | Prefer over multiple `revalidatePath` calls |

### "Which `use cache` variant?"

| Need | Directive |
|------|-----------|
| Default server caching | `'use cache'` |
| Per-user / runtime APIs (`cookies`, `headers`) | `'use cache: private'` — browser memory only; not in static shell |
| Compliance / cannot pass runtime data as args | `'use cache: private'` |
| Serverless / shared durable cache (Redis, KV) | `'use cache: remote'` |
| Per-request dynamic data | No directive — wrap in `<Suspense>` |

## Production Workflow

```
1. Enable cacheComponents in next.config.ts
2. Identify static vs dynamic route segments
3. Mark cacheable data/functions with 'use cache'
4. Set cacheLife profile (explicit — never rely on implicit defaults in production)
5. Assign cacheTag for anything you will invalidate
6. Wrap runtime-only sections in Suspense
7. On mutation: updateTag (user-facing) or revalidateTag (background)
8. Verify build output — confirm PPR static shell
```

### Enable Cache Components

```ts
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: {
    editorial: {
      stale: 600,
      revalidate: 3600,
      expire: 86400,
    },
  },
}

export default nextConfig
```

### Data-Level Caching

```tsx
// lib/products.ts
import { cacheLife, cacheTag } from 'next/cache'
import { db } from '@/lib/db'

export async function getProducts(category: string) {
  'use cache'
  cacheLife('hours')
  cacheTag('products', `products-${category}`)

  return db.product.findMany({
    where: { category, published: true },
    select: { id: true, name: true, price: true, slug: true },
  })
}
```

### UI-Level Caching

```tsx
// app/blog/page.tsx
import { cacheLife, cacheTag } from 'next/cache'
import { Suspense } from 'react'
import { getFeaturedPosts } from '@/lib/posts'
import { PersonalizedFeed } from './PersonalizedFeed'

export default async function BlogPage() {
  return (
    <>
      <FeaturedPosts />
      <Suspense fallback={<FeedSkeleton />}>
        <PersonalizedFeed />
      </Suspense>
    </>
  )
}

async function FeaturedPosts() {
  'use cache'
  cacheLife('days')
  cacheTag('posts')

  const posts = await getFeaturedPosts()
  return (
    <section>
      {posts.map((post) => (
        <article key={post.id}>
          <h2>{post.title}</h2>
        </article>
      ))}
    </section>
  )
}
```

### Runtime Data with `connection()`

Non-deterministic values (`Date.now()`, `crypto.randomUUID()`) require `connection()` before execution, wrapped in Suspense:

```tsx
// app/dashboard/RequestId.tsx
import { connection } from 'next/server'

export async function RequestId() {
  await connection()
  const id = crypto.randomUUID()
  return <p className="text-muted-foreground text-sm">Request: {id}</p>
}
```

```tsx
// app/dashboard/page.tsx
import { Suspense } from 'react'
import { RequestId } from './RequestId'
import { CachedStats } from './CachedStats'

export default function DashboardPage() {
  return (
    <>
      <CachedStats />
      <Suspense fallback={null}>
        <RequestId />
      </Suspense>
    </>
  )
}
```

### Passing Runtime Values to Cached Functions

```tsx
// app/account/page.tsx
import { Suspense } from 'react'
import { getAccountSummary } from '@/lib/account'

export default function AccountPage() {
  return (
    <Suspense fallback={<AccountSkeleton />}>
      <AccountContent />
    </Suspense>
  )
}

async function AccountContent() {
  const summary = await getAccountSummary()
  if (!summary) return <p>Sign in to view your account.</p>

  return <AccountDashboard summary={summary} />
}
```

```tsx
// lib/account.ts
import { cacheLife, cacheTag } from 'next/cache'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

// Per-user data: 'use cache: private' may read cookies(); results stay in
// browser memory only — never stored on the server or shared across users.
export async function getAccountSummary() {
  'use cache: private'
  cacheLife('minutes')

  const sessionId = (await cookies()).get('session')?.value
  if (!sessionId) return null

  cacheTag(`account-${sessionId}`)
  return db.account.findUnique({ where: { sessionId } })
}
```

## Partial Prerendering

With Cache Components enabled, PPR is automatic:

```
Request
  │
  ▼
Static Shell (header, cached sections, Suspense fallbacks)
  │
  ▼
Stream dynamic holes (runtime data, short-lived caches)
  │
  ▼
Full page interactive
```

| Content Type | Mechanism | In Static Shell? |
|--------------|-----------|------------------|
| Static JSX | Automatic | Yes |
| `'use cache'` + `cacheLife` | Cached at build/revalidate | Yes |
| `cookies()`, `headers()`, `searchParams` | Runtime | No — Suspense |
| Short-lived cache (`seconds` profile) | Dynamic hole | Fallback only |
| `connection()` + random values | Request-time | No — Suspense |

Verify PPR in build output or view page source to confirm static shell content.

## Cache Invalidation Patterns

### Server Action — Read-Your-Own-Writes

```tsx
// app/actions/posts.ts
'use server'

import { updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'

export async function publishPost(formData: FormData) {
  const user = await requireUser()
  const title = formData.get('title') as string
  const content = formData.get('content') as string

  const post = await db.post.create({
    data: { title, content, authorId: user.id, published: true },
  })

  updateTag('posts')
  updateTag(`post-${post.slug}`)

  redirect(`/blog/${post.slug}`)
}
```

### Route Handler — Webhook Revalidation

```tsx
// app/api/revalidate/route.ts
import { revalidateTag } from 'next/cache'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')
  if (secret !== process.env.REVALIDATE_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { tag } = await request.json()
  revalidateTag(tag, 'max')

  return Response.json({ revalidated: true, tag })
}
```

### Path-Based Revalidation

```tsx
'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'

export async function updateSiteSettings() {
  await db.settings.update({ data: { maintenanceMode: false } })
  revalidatePath('/', 'layout')
}
```

## PASS Examples

### Tagged cache with explicit lifetime

```tsx
import { cacheLife, cacheTag } from 'next/cache'
import { db } from '@/lib/db'

export async function getCategories() {
  'use cache'
  cacheLife('days')
  cacheTag('categories')

  return db.category.findMany({ orderBy: { name: 'asc' } })
}
```

### Fetch with cache tags

```tsx
export async function getExternalPosts() {
  const res = await fetch('https://cms.example.com/api/posts', {
    next: { tags: ['cms-posts'] },
  })
  return res.json()
}
```

### Nested cache with explicit outer `cacheLife`

```tsx
import { cacheLife } from 'next/cache'
import { ShortLivedWidget } from '@/components/ShortLivedWidget'

export default async function CatalogPage() {
  'use cache'
  cacheLife('hours')

  return (
    <div>
      <h1>Catalog</h1>
      <ShortLivedWidget />
    </div>
  )
}
```

### Per-user dashboard with `'use cache: private'`

```tsx
import { cacheLife, cacheTag } from 'next/cache'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

async function PrivateDashboard() {
  'use cache: private'
  cacheLife('minutes')

  const sessionId = (await cookies()).get('session')?.value
  if (!sessionId) return null

  cacheTag(`dashboard-${sessionId}`)
  const data = await db.dashboard.findUnique({ where: { sessionId } })
  return <Dashboard data={data} />
}
```

## FAIL Examples

### Caching per-user data with shared `'use cache'`

```tsx
// FAIL — shared server cache keyed incorrectly / cookies inside 'use cache'
import { cookies } from 'next/headers'

export default async function Page() {
  'use cache'
  const session = (await cookies()).get('session')?.value
  return <Dashboard session={session} />
}
```

```tsx
// PASS — 'use cache: private' may read cookies(); never stored on the server
import { cacheLife, cacheTag } from 'next/cache'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

async function CachedDashboard() {
  'use cache: private'
  cacheLife('minutes')

  const sessionId = (await cookies()).get('session')?.value
  if (!sessionId) return null

  cacheTag(`dashboard-${sessionId}`)
  const data = await db.dashboard.findUnique({ where: { sessionId } })
  return <Dashboard data={data} />
}
```

### Forgetting invalidation after mutation

```tsx
// FAIL — stale UI after write
'use server'
export async function deleteProduct(id: string) {
  await db.product.delete({ where: { id } })
  // Missing updateTag / revalidateTag
}
```

```tsx
'use server'
import { updateTag } from 'next/cache'
import { db } from '@/lib/db'

export async function deleteProduct(id: string) {
  await db.product.delete({ where: { id } })
  updateTag('products')
}
```

### `updateTag` in Route Handler

```tsx
// FAIL — updateTag only works in Server Actions
import { updateTag } from 'next/cache'

export async function POST() {
  updateTag('products') // Throws at runtime
  return Response.json({ ok: true })
}
```

```tsx
// PASS — use revalidateTag in Route Handlers
import { revalidateTag } from 'next/cache'

export async function POST() {
  revalidateTag('products', 'max')
  return Response.json({ ok: true })
}
```

### Nested short-lived cache without explicit outer `cacheLife`

```tsx
// FAIL — build error during prerendering
export default async function Page() {
  'use cache'
  // No cacheLife — inner 'seconds' cache propagates and errors
  return <ShortLivedWidget />
}
```

## Common Mistakes

- Enabling `'use cache'` on components that read `cookies()`, `headers()`, or `searchParams` directly — use `'use cache: private'` or pass values as arguments.
- Using `revalidatePath` when `revalidateTag` would invalidate fewer, more precise entries.
- Calling `revalidateTag(tag)` without the second argument — deprecated; use `revalidateTag(tag, 'max')`.
- Caching user-specific data with shared `'use cache'` — use `'use cache: private'` so results are never stored on the server.
- Omitting `cacheLife` on outer `'use cache'` when nesting short-lived inner caches.
- Expecting `use cache: remote` to work without platform cache handler configuration.
- Using `updateTag` in Route Handlers — it is Server Actions only.
- Placing `<Suspense fallback={null}>` around `<body>` in root layout — blocks entire static shell.

## Best Practices

- Always set an explicit `cacheLife` profile in production code.
- Use descriptive, hierarchical tags: `products`, `product-{slug}`, `category-{id}`.
- Prefer `updateTag` in Server Actions for user-initiated mutations.
- Prefer `revalidateTag(tag, 'max')` for webhooks and background jobs.
- Pass runtime values as arguments into shared `'use cache'` scopes — or use `'use cache: private'` for per-user data that must read `cookies()` / `headers()`.
- Wrap dynamic sections in `<Suspense>` with meaningful skeleton UI.
- Use `'use cache: remote'` on serverless when cross-request persistence is required.
- Reserve `'use cache: private'` for per-user dashboards and compliance cases — browser memory only; not part of the static shell.
- Audit build output to confirm expected routes are prerendered.
- Keep cached return values serializable and minimal — avoid returning full ORM graphs.

## Production Checklist

### Configuration

- [ ] `cacheComponents: true` in `next.config.ts`
- [ ] Custom `cacheLife` profiles defined for domain-specific TTLs
- [ ] `REVALIDATE_SECRET` set for webhook endpoints

### Caching

- [ ] Every `'use cache'` scope has explicit `cacheLife`
- [ ] Cacheable data tagged with `cacheTag` or `fetch` `next.tags`
- [ ] No `cookies()` / `headers()` / `searchParams` inside shared `'use cache'` scopes
- [ ] Per-user data uses `'use cache: private'` (browser-only) — never shared server cache
- [ ] Short-lived nested caches have explicit outer `cacheLife`

### Invalidation

- [ ] Server Actions call `updateTag` after user mutations
- [ ] Webhooks use `revalidateTag(tag, 'max')` or `{ expire: 0 }`
- [ ] `revalidatePath` used only when path-level refresh is required
- [ ] Tags are documented in a central constants file

### PPR / Streaming

- [ ] Dynamic sections wrapped in `<Suspense>` with skeleton fallbacks
- [ ] `connection()` used before non-deterministic operations at request time
- [ ] Build output reviewed for static shell coverage
- [ ] No root-level Suspense with empty fallback blocking static shell

## References

### Verified Against

- [Caching](https://nextjs.org/docs/app/getting-started/caching)
- [Partial Prerendering](https://nextjs.org/docs/app/getting-started/partial-prerendering)
- [`use cache` directive](https://nextjs.org/docs/app/api-reference/directives/use-cache)
- [`use cache: private`](https://nextjs.org/docs/app/api-reference/directives/use-cache-private)
- [`cacheComponents` config](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents)
- [`cacheLife`](https://nextjs.org/docs/app/api-reference/functions/cacheLife)
- [`cacheTag`](https://nextjs.org/docs/app/api-reference/functions/cacheTag)
- [`revalidateTag`](https://nextjs.org/docs/app/api-reference/functions/revalidateTag)
- [`updateTag`](https://nextjs.org/docs/app/api-reference/functions/updateTag)
- [`revalidatePath`](https://nextjs.org/docs/app/api-reference/functions/revalidatePath)
- [`connection`](https://nextjs.org/docs/app/api-reference/functions/connection)
- [Revalidating](https://nextjs.org/docs/app/getting-started/revalidating)

**Framework:** Next.js 16 App Router

**Last verified:** July 2026
