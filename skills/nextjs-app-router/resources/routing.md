# Routes, layouts and navigation

## File and URL boundaries

`page.tsx` exposes UI; `route.ts` handles HTTP methods. They cannot own the same route in the same segment. A layout persists across navigation; a template remounts where its segment key changes. The root layout supplies `<html>` and `<body>`. Route groups `(group)` and parallel slots `@slot` do not add URL segments. Avoid two pages such as `app/page.tsx` and `app/(marketing)/page.tsx` that both resolve to `/`.

In Next.js 15+ use asynchronous `params` and page `searchParams`; Next.js 16 removes synchronous compatibility. Layouts do not receive page `searchParams`. Use the page prop or a small Client Component with `useSearchParams`; a statically rendered route using that client hook needs an appropriate Suspense boundary for production builds.

```tsx
// app/blog/[slug]/page.tsx; application data helper is illustrative
import { notFound } from 'next/navigation'
import { getPost } from '@/lib/posts'

export default async function Page({ params }: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()
  return <article><h1>{post.title}</h1><p>{post.summary}</p></article>
}
```

For Cache Components routes without `generateStaticParams`, put the params-dependent work under Suspense rather than awaiting unknown params above the boundary. Don't copy route segment exports between cache modes: `dynamicParams` is unsupported with Cache Components in the current migration docs. Outside that mode, `dynamicParams = false` limits routes to generated params. If you define `generateStaticParams` with Cache Components, follow its requirement for at least one real representative param; don't routinely fabricate a placeholder that weakens build validation. Outside this mode an empty array can be intentional for runtime ISR.

Use `Link` for ordinary internal navigation; use `next/navigation` client hooks for programmatic interaction. Do not pass unsanitized URLs to router push/replace. Preserve query strings deliberately. Prefetch and loading behavior vary with static/dynamic routes and enabled features; don't add manual prefetch to every link.

## Parallel and intercepting routes

Use these when independently navigable regions or shareable modal URLs justify the extra state. Interception counts URL route segments, not directories: `@modal` and route groups don't count. A modal for sibling `/photo/[id]` can share the root layout with `/feed`:

```text
app/
  layout.tsx                    # renders children and modal
  page.tsx                      # /
  feed/page.tsx                 # links to /photo/123
  photo/[id]/page.tsx            # direct load: full photo page
  @modal/
    default.tsx                 # returns null on unmatched hard navigation
    page.tsx                    # returns null at /
    (.)photo/[id]/page.tsx       # soft navigation: intercepted sibling /photo
    [...catchAll]/page.tsx       # returns null for other soft navigations
```

```tsx
// app/layout.tsx
import type { ReactNode } from 'react'

export default function Layout({ children, modal }: {
  children: ReactNode; modal: ReactNode
}) {
  return <html lang="en"><body>{children}{modal}</body></html>
}
```

The modal component, photo lookup and focus management are application-specific. Supply a close control (often `router.back()` for intercepted navigation), accessible focus handling and a sensible direct-load page. `default.tsx` is a hard-navigation fallback; it does not clear a previously active slot during soft navigation. The catch-all and root null pages handle clearing. Provide needed fallbacks for every unmatched slot, including implicit children where applicable.

The old `app/feed/@modal/(.)photo` location targets `/feed/photo`, not sibling `/photo`. Either use the root sibling tree above or deliberately use a parent-level `(..)photo` interception and an appropriate shared layout. Don't mix trees from different examples.

## Verify behavior

Test link navigation into the modal, direct URL/reload into the full page, close/back, forward reopening and navigation to another route clearing the modal. Test unmatched slots on reload. Test unknown slugs and route-group conflicts with a production build. A layout auth check alone is insufficient for data or action authorization.

Sources: [Layouts/pages](https://nextjs.org/docs/app/getting-started/layouts-and-pages), [layout API](https://nextjs.org/docs/app/api-reference/file-conventions/layout), [Route groups](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups), [Parallel routes](https://nextjs.org/docs/app/api-reference/file-conventions/parallel-routes), [Interception](https://nextjs.org/docs/app/api-reference/file-conventions/intercepting-routes), [generateStaticParams](https://nextjs.org/docs/app/api-reference/functions/generate-static-params), [Cache migration](https://nextjs.org/docs/app/guides/migrating-to-cache-components), [useSearchParams](https://nextjs.org/docs/app/api-reference/functions/use-search-params), [Navigation](https://nextjs.org/docs/app/getting-started/linking-and-navigating). Scope/dates: [ledger](../SOURCES.md).
