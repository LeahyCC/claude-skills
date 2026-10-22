# Caching and freshness

## Establish the mode first

Cache Components is opt-in in Next.js 16. Do not enable it as a routine fix for an app using the existing caching model. Inspect the exact installed docs, configuration and deployment. Current live config docs also request an explicit `partialPrefetching` choice; do not copy this newer option into an earlier minor without checking support. Cache Components requires Node.js and changes which route segment options are supported.

| Existing mode / need | Choice |
| --- | --- |
| Cache Components off: cached HTTP data | `fetch(url, { next: { revalidate: 3600, tags: ['products'] } })` or `cache: 'force-cache'` |
| Cache Components off: uncached HTTP read | `cache: 'no-store'`; don't combine with positive revalidate |
| Existing persistent ORM cache | Preserve supported `unstable_cache` or project cache; migration is separate |
| Cache Components on: reusable public result | `'use cache'`, optional `cacheLife`, `cacheTag` for invalidation |
| Personal/session data, either mode | Start with authenticated request-time reads; Suspense where required |
| Private cache deliberately needed | Confirm installed support and Cache Components; see private semantics below |
| Durable shared cache needed | Check platform/`cacheHandlers` support for `'use cache: remote'`; measure cost/latency |

The invalidation APIs below also work with supported tagged fetch caches when Cache Components is off; do not gate all of `next/cache` on that flag.

A missing fetch cache option does not guarantee a request-time page: static route prerender can still produce cached HTML. Check the route's rendering mode and build output. Fetch cache tags alone don't opt the request into caching.

## Shared Cache Components example

Requires `cacheComponents: true`. In this illustrative data module the DB helper is application-owned. Category is part of the function arguments and therefore the cache key. Do not read `cookies()`/`headers()` inside shared `'use cache'`; pass approved non-secret values from an authorized boundary or keep the data uncached. Arguments and captured values affect keys; audit cross-user isolation before sharing personal results.

```ts
// lib/products.ts
import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { db } from '@/lib/db'

export async function getProducts(category: string) {
  'use cache'
  cacheLife('hours')
  cacheTag('products', `products:${category}`)
  return db.product.findMany({
    where: { category, published: true },
    select: { id: true, name: true, price: true },
  })
}
```

The default cache lifetime is valid. Choose an explicit profile when freshness needs differ or clarity helps; don't override defaults as a ritual. Account for nested lifetimes and short-lived entries' effects on prerendering using the installed `cacheLife` docs. Regular cache is in-memory by default; don't promise durability across deployments/instances.

## Private cache is a feature choice

The current official directive page lists support with Cache Components from v16.0.0; it is not marked experimental there. Still check the installed version's docs/config, especially older prereleases. Do not prescribe it when Cache Components is off or adopt experimental flags from old tutorials.

In production it deduplicates matching work within a request and permits request APIs; it does not persist the result in a server cache across requests. Rendered output can stay in browser router memory until its client stale time and does not survive a reload. Development also uses server memory keyed by request cookies/headers, so “never stored on the server” is inaccurate. It runs at request time outside the static shell. `connection()` is disallowed inside both private and shared caches. It is not a compliance guarantee.

Use an uncached authorized read as the simple default. If private caching materially helps, select a deliberate browser stale time and test sign-out, identity switching and freshness. Never use session tokens in tags or return them to the UI. `cacheLife({ stale: 60 })` is a possible policy, not a universal recommendation.

## Match invalidation to the contract

| Contract | API / context |
| --- | --- |
| User must see their write immediately | `updateTag(tag)` in a Server Action; expires tagged cached data |
| Stale briefly is acceptable | `revalidateTag(tag, 'max')` in an action or Route Handler |
| Webhook must expire data immediately | `revalidateTag(tag, { expire: 0 })` where supported |
| Specific page/layout depends on changed data | `revalidatePath(path, type?)`; not a global tag replacement |

Single-argument `revalidateTag` is deprecated in Next.js 16. Do not replace it with stale-while-revalidate when immediate visibility is required. `router.refresh()` refreshes the current client route but does not invalidate server data caches. Invalidate only if the changed data was cached; uncached reads don't need token invalidation by habit.

For UI action authorization/validation see [data fetching](data-fetching.md). A minimal fixed-tag webhook can avoid caller-selected tags entirely:

```ts
// app/api/catalog-changed/route.ts
import { revalidateTag } from 'next/cache'
import { verifyCmsSignature } from '@/lib/cms'

export async function POST(request: Request) {
  const rawBody = await request.text()
  // Project helper verifies the raw body, signature, timestamp/replay policy.
  if (!await verifyCmsSignature(rawBody, request.headers)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  revalidateTag('products', 'max')
  return Response.json({ ok: true })
}
```

This is an integration sketch, not a provider signature implementation. Follow the provider's official verification protocol; keep secrets out of URLs/logs. If selecting tags from input is needed, validate and authorize that selection.

## Validate

Check build output and streaming with the chosen flags. Test cache hits/misses and expiry in production mode, not just HMR. Exercise two users, sign-out, post-write immediate reads and webhook stale behavior. Test deployment persistence if relying on it. Avoid enabling caches merely to improve an isolated benchmark.

Sources: [Cache Components config](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents), [Migration](https://nextjs.org/docs/app/guides/migrating-to-cache-components), [use cache](https://nextjs.org/docs/app/api-reference/directives/use-cache), [private](https://nextjs.org/docs/app/api-reference/directives/use-cache-private), [remote](https://nextjs.org/docs/app/api-reference/directives/use-cache-remote), [cacheLife](https://nextjs.org/docs/app/api-reference/functions/cacheLife), [cacheTag](https://nextjs.org/docs/app/api-reference/functions/cacheTag), [fetch](https://nextjs.org/docs/app/api-reference/functions/fetch), [updateTag](https://nextjs.org/docs/app/api-reference/functions/updateTag), [revalidateTag](https://nextjs.org/docs/app/api-reference/functions/revalidateTag), [revalidatePath](https://nextjs.org/docs/app/api-reference/functions/revalidatePath). Scoped dates: [ledger](../SOURCES.md).
