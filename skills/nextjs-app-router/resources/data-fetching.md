# Reads, streaming and mutations

## Choose the transport

| Task | Starting point |
| --- | --- |
| Initial page data / privileged DB read | Read directly in a Server Component/data module |
| Polling, live search, offline/browser-only state | Client fetching with the app's existing data library or browser API |
| UI mutation | Authorized Server Action when it fits |
| HTTP API, webhook, download, browser fetch endpoint | Route Handler |

Don't fetch your own Route Handler from a Server Component merely to reach the same DB. An existing external service/API boundary may still be appropriate. Server Actions are not a general parallel read API.

## Fetch and memoization

Choose caching explicitly with [caching.md](caching.md); uncached fetch data does not imply the entire route cannot be prerendered. `next.tags` labels cached data but is not by itself a cache opt-in.

```tsx
// app/posts/page.tsx; no Cache Components required
// With Cache Components enabled, place this uncached section under Suspense.
type Post = { id: string; title: string }

export default async function PostsPage() {
  const response = await fetch('https://api.example.com/posts', { cache: 'no-store' })
  if (!response.ok) throw new Error('Unable to load posts')
  const posts: Post[] = await response.json()
  return <ul>{posts.map(post => <li key={post.id}>{post.title}</li>)}</ul>
}
```

The type annotation is not runtime validation of an untrusted response. Use the app's schema validation at that boundary when needed.

React rendering deduplicates matching GET/HEAD fetches (URL and options); don't assume this applies to POST or Route Handlers outside the React tree. For ORM work, export one module-level `cache(fn)` from React and reuse it for the same arguments during server rendering. It is request-scoped memoization, not persistent caching. Object arguments compare by identity; prefer stable primitive keys. Don't call `cache()` anew at each call site.

## Parallelism and streaming

Start independent work together, then await together or stream independently. Preserve dependencies and failure isolation: `Promise.all` rejects when any member rejects. A slow optional widget need not block primary content. Put the async work beneath the intended Suspense boundary; awaiting it before returning that boundary defeats the fallback. With Cache Components, runtime reads also need suitable boundaries.

React 19 `use(promise)` can unwrap a stable server-created promise in a Client Component beneath Suspense. A rejected promise needs an error boundary. Do not create a new fetch promise on every client render. Async Server Components can usually `await` directly.

## Mutation example

Illustrative application dependencies (`requireUser`, `db`) must be supplied by the project; this is not a drop-in auth implementation. In this Next.js 16 example, `requireUser` verifies a current session and throws/redirects on failure. Restrict the update to the verified owner; use the app's transaction/authorization policy for more complex roles.

```ts
// app/actions.ts
'use server'
import { updateTag } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function renameProduct(id: string, formData: FormData) {
  const user = await requireUser()
  const value = formData.get('name')
  if (!id || typeof value !== 'string' || !value.trim() || value.length > 120) {
    return { error: 'Enter a product name of 1 to 120 characters.' }
  }
  // updateMany returns a count and enforces ownership in the same query.
  const result = await db.product.updateMany({
    where: { id, ownerId: user.id }, data: { name: value.trim() },
  })
  if (result.count !== 1) return { error: 'Product unavailable.' }
  updateTag('products') // only if reads are cached with this tag
  return { ok: true }
}
```

Treat action arguments and FormData as untrusted. Authenticate/authorize Route Handlers too; HTTP input doesn't gain trust from its caller being your own browser. Select returned fields deliberately. Validate errors as return values; keep redirect/notFound outside broad catches. See [error handling](error-handling.md) and [cache invalidation](caching.md).

Check independent data starts, loading/error behavior, direct unauthorized action/endpoint calls and post-write freshness using the app's own checks.

Sources: [Fetching](https://nextjs.org/docs/app/getting-started/fetching-data), [fetch API](https://nextjs.org/docs/app/api-reference/functions/fetch), [Mutations](https://nextjs.org/docs/app/getting-started/mutating-data), [Route Handlers](https://nextjs.org/docs/app/api-reference/file-conventions/route), [React cache](https://react.dev/reference/react/cache), [React use](https://react.dev/reference/react/use). Review scope/dates: [ledger](../SOURCES.md).
