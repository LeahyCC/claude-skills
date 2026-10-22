# Incremental Pages to App Router migration

Router migration and a framework major upgrade are separate decisions. Establish the supported version, route parity, data freshness and auth requirements. Keep Pages Router fixes in Pages unless a migration is requested.

## Port one route

1. Add an App root layout with html/body and shared CSS/providers for the routes being moved. `_app`/`_document` continue to serve retained Pages routes.
2. Move one URL to its App folder; remove its old Pages route in the same change so both routers don't own the same URL. Preserve other pages and API routes.
3. Replace `getStaticProps`/`getServerSideProps` with component/data-boundary reads using that version's cache mode. Merely making a component async does not force request rendering.
4. Replace `getStaticPaths` with `generateStaticParams` as needed; preserve fallback/unknown-slug behavior, not just names.
5. Use `next/navigation` in App client code; Pages components can keep `next/router`. Replace next/head concerns with metadata exports on moved routes.
6. Validate route/auth/data parity, then migrate another route. Remove Pages wrappers only after their remaining callers are gone.

Both routers can prerender HTML; Pages Router components are not “all client rendered.” Existing interactive UI can first be wrapped as a Client Component during migration, then server boundaries improved where useful. A provider in App layout does not automatically wrap Pages routes.

## Preserve ISR without adopting Cache Components

Example for Next.js 15 or 16 with Cache Components off. The data endpoint is illustrative and must exist in the app's environment. Async params work in 15 and are required in 16. The empty params array intentionally allows first-visit generation with hourly revalidation in this mode.

```tsx
// app/blog/[slug]/page.tsx
import { notFound } from 'next/navigation'

type Post = { title: string; summary: string }
export const revalidate = 3600
export async function generateStaticParams() { return [] }

export default async function Page({ params }: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const response = await fetch(`https://cms.example.com/posts/${encodeURIComponent(slug)}`, {
    next: { revalidate: 3600 },
  })
  if (response.status === 404) notFound()
  if (!response.ok) throw new Error('Unable to load article')
  const post: Post = await response.json()
  return <article><h1>{post.title}</h1><p>{post.summary}</p></article>
}
```

For Cache Components projects use the separate [caching](caching.md) and [routing](routing.md) guidance; route-segment revalidate/dynamicParams cannot be copied into that mode. Choose representative static params where required. Preserve request-time auth for personal pages; cookie existence alone is insufficient.

API routes can remain in pages/api until migration is useful. When porting, preserve method/status/header/webhook semantics and authenticate/authorize each new handler. Don't expose a broad ORM row in a public example just to demonstrate Request/Response.

## Verify

Run the app's build/type/lint checks and compare direct URLs, client navigation between routers, refresh, unknown slugs, ISR expiry, redirects, auth and providers/styles. Keep `_app` and `_document` until no Pages routes depend on them; don't delete them to satisfy an App-only checklist.

Source: [Official Pages to App migration](https://nextjs.org/docs/app/guides/migrating/app-router-migration), [fetch caching](https://nextjs.org/docs/app/api-reference/functions/fetch), [generateStaticParams](https://nextjs.org/docs/app/api-reference/functions/generate-static-params). Scope/dates: [ledger](../SOURCES.md).
