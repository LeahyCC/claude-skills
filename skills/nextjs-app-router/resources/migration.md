# Pages Router Migration

> **Core Principle:** Migrate incrementally. Run `pages/` and `app/` side by side until each route is ported. Adopt App Router patterns route by route — not in one big bang.

## Introduction

Migrating from the Pages Router (`pages/`) to the App Router (`app/`) is an architectural shift: file-based routing stays, but data fetching, layouts, metadata, and API routes change fundamentally. Both routers can coexist during migration.

For Next.js 15 → 16 upgrades on an existing App Router app, see [version-changes.md](version-changes.md). For Server/Client boundaries after migration, see [server-components.md](server-components.md).

## Architecture

```
Migration State
│
├── pages/          (legacy — remove when ported)
│   ├── _app.tsx
│   ├── _document.tsx
│   ├── index.tsx
│   ├── blog/[slug].tsx
│   └── api/users.ts
│
└── app/            (target)
    ├── layout.tsx
    ├── page.tsx
    ├── blog/[slug]/page.tsx
    └── api/users/route.ts
```

### Concept Mapping

| Pages Router | App Router | Resource |
|--------------|------------|----------|
| `pages/_app.tsx` | `app/layout.tsx` | Root layout |
| `pages/_document.tsx` | `app/layout.tsx` + Metadata API | No `_document` |
| `pages/index.tsx` | `app/page.tsx` | [routing.md](routing.md) |
| `pages/blog/[slug].tsx` | `app/blog/[slug]/page.tsx` | [routing.md](routing.md) |
| `getStaticProps` | `async` Server Component + `'use cache'` | [caching.md](caching.md) |
| `getServerSideProps` | `async` Server Component (request-time) | [data-fetching.md](data-fetching.md) |
| `getStaticPaths` | `generateStaticParams` | [routing.md](routing.md) |
| `pages/api/*.ts` | `app/api/*/route.ts` | Route Handlers |
| `next/head` `<Head>` | `metadata` / `generateMetadata` | [metadata-and-seo.md](metadata-and-seo.md) |
| `next/router` | `next/navigation` | [routing.md](routing.md) |

## Decision Matrix

| Legacy Pattern | App Router Replacement |
|----------------|------------------------|
| Global layout in `_app.tsx` | `app/layout.tsx` |
| Per-page layout via `getLayout` | Nested `layout.tsx` files |
| `<Head>` per page | `metadata` export or `generateMetadata` |
| `getStaticProps` + ISR | Server Component + `'use cache'` + `cacheLife` |
| `getServerSideProps` | Server Component reading `cookies()` / `headers()` |
| `getInitialProps` | Remove — use Server Components |
| API route `req/res` | Route Handler `Request` / `Response` |
| Client-only page | `'use client'` on page or leaf component |
| `router.query` | `params` / `searchParams` (async) |

## Production Migration Workflow

```
1. Upgrade to Next.js 16 (see version-changes.md)
2. Create app/layout.tsx (root layout)
3. Port simplest static pages first
4. Port layouts as nested layout.tsx files
5. Replace getStaticProps → async Server Components
6. Replace getServerSideProps → request-time Server Components
7. Replace API routes → Route Handlers
8. Replace next/head → Metadata API
9. Add 'use client' only where interactivity required
10. Remove ported pages/ files
11. Delete _app.tsx and _document.tsx when app/ is complete
```

### Step 1 — Root Layout (`_app.tsx` + `_document.tsx`)

```tsx
// pages/_app.tsx (BEFORE)
import type { AppProps } from 'next/app'
import '../styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}
```

```tsx
// pages/_document.tsx (BEFORE)
import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
```

```tsx
// app/layout.tsx (AFTER)
import type { Metadata } from 'next'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: { default: 'Acme', template: '%s | Acme' },
  description: 'Fleet management software.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

> Do not manually add `<head>` tags for title/meta in root layout — use the Metadata API.

### Step 2 — Page Migration

```tsx
// pages/blog/[slug].tsx (BEFORE)
import { GetStaticProps, GetStaticPaths } from 'next'

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getPosts()
  return { paths: posts.map((p) => ({ params: { slug: p.slug } })), fallback: false }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const post = await getPost(params!.slug as string)
  return { props: { post }, revalidate: 3600 }
}

export default function BlogPost({ post }: { post: Post }) {
  return <article><h1>{post.title}</h1></article>
}
```

```tsx
// app/blog/[slug]/page.tsx (AFTER)
import { cacheLife, cacheTag } from 'next/cache'
import { notFound } from 'next/navigation'
import { getPost, getAllSlugs } from '@/lib/posts'

export async function generateStaticParams() {
  const slugs = await getAllSlugs()
  return slugs.map((slug) => ({ slug }))
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  'use cache'
  cacheLife('hours')
  cacheTag('posts')

  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()

  return (
    <article>
      <h1>{post.title}</h1>
      <div>{post.content}</div>
    </article>
  )
}
```

### Step 3 — `getServerSideProps` Replacement

```tsx
// pages/dashboard.tsx (BEFORE)
export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = ctx.req.cookies.session
  if (!session) return { redirect: { destination: '/login', permanent: false } }
  const data = await getDashboard(session)
  return { props: { data } }
}
```

```tsx
// app/dashboard/page.tsx (AFTER)
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getDashboard } from '@/lib/dashboard'

export default async function DashboardPage() {
  const session = (await cookies()).get('session')?.value
  if (!session) redirect('/login')

  const data = await getDashboard(session)
  return <Dashboard data={data} />
}
```

### Step 4 — API Routes → Route Handlers

```tsx
// pages/api/users/[id].ts (BEFORE)
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  if (req.method === 'GET') {
    const user = await db.user.findUnique({ where: { id: id as string } })
    return res.status(200).json(user)
  }
  return res.status(405).end()
}
```

```tsx
// app/api/users/[id]/route.ts (AFTER)
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await db.user.findUnique({ where: { id } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(user)
}
```

### Step 5 — Head → Metadata API

```tsx
// pages/about.tsx (BEFORE)
import Head from 'next/head'

export default function About() {
  return (
    <>
      <Head>
        <title>About | Acme</title>
        <meta name="description" content="About Acme fleet software." />
      </Head>
      <main>...</main>
    </>
  )
}
```

```tsx
// app/about/page.tsx (AFTER)
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About',
  description: 'About Acme fleet software.',
  alternates: { canonical: '/about' },
}

export default function AboutPage() {
  return <main>...</main>
}
```

### Step 6 — Client Components

Pages Router components were all client-rendered. In App Router, **remove** `'use client'` from components that don't need it:

```tsx
// BEFORE — unnecessary client boundary
'use client'
export default function ProductCard({ product }: { product: Product }) {
  return <div>{product.name}</div>
}
```

```tsx
// AFTER — Server Component (default)
export default function ProductCard({ product }: { product: Product }) {
  return <div>{product.name}</div>
}
```

Add `'use client'` only to components using `useState`, `useEffect`, event handlers, or browser APIs. See [server-components.md](server-components.md).

### Incremental Strategy

Both routers coexist:

```
pages/blog/[slug].tsx     → still works at /blog/:slug
app/pricing/page.tsx      → works at /pricing
```

**Migration order (recommended):**

1. Static marketing pages (low risk)
2. Root layout + shared navigation
3. Blog/content with `generateStaticParams`
4. Authenticated dashboard (request-time data)
5. API routes → Route Handlers
6. Remove `pages/` directory

## PASS Examples

### Nested layout replaces `getLayout`

```tsx
// app/dashboard/layout.tsx
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <Sidebar />
      <main>{children}</main>
    </div>
  )
}
```

### `generateStaticParams` replaces `getStaticPaths`

```tsx
export async function generateStaticParams() {
  const products = await db.product.findMany({ select: { slug: true } })
  return products.map((p) => ({ slug: p.slug }))
}

export const dynamicParams = false // equivalent to fallback: false
```

## FAIL Examples

### Copying `getServerSideProps` props pattern

```tsx
// FAIL — no props from data functions; fetch in component
export async function getData() {
  return { props: { users: [] } }
}

export default function Page({ users }: { users: User[] }) {
  return <ul>{users.map(...)}</ul>
}
```

```tsx
// PASS
export default async function Page() {
  const users = await db.user.findMany()
  return <ul>{users.map(...)}</ul>
}
```

### Keeping `_document.tsx` alongside App Router

```tsx
// FAIL — _document.tsx only applies to pages/ router
// app/ routes ignore it entirely
```

### Using `next/head` in App Router

```tsx
// FAIL — Head only works in pages/ router
import Head from 'next/head'
```

```tsx
// PASS
export const metadata: Metadata = { title: 'About' }
```

### `getInitialProps` in new code

```tsx
// FAIL — removed pattern; use Server Components
Page.getInitialProps = async (ctx) => ({ ... })
```

## Common Mistakes

- Deleting `pages/` before all routes are ported.
- Adding `'use client'` to every migrated component by habit.
- Creating API routes for data that Server Components can fetch directly.
- Forgetting `params` is now `Promise<{}>` — must await.
- Using `next/router` instead of `next/navigation` in App Router code.
- Keeping `_document.tsx` for font injection — use `next/font` instead ([assets.md](assets.md)).
- Not setting `metadataBase` when migrating from `<Head>`.
- Running `getStaticProps` logic at module scope instead of in async components.

## Best Practices

- Port one route segment at a time; keep CI green after each.
- Start with leaf pages before nested dynamic routes.
- Replace `getStaticProps` + `revalidate` with `'use cache'` + `cacheLife` ([caching.md](caching.md)).
- Colocate `loading.tsx` and `error.tsx` when adding new `app/` routes.
- Use route groups `(marketing)` to organize without URL changes.
- Run `next build` after each migration batch to catch convention errors.
- Update links from `next/link` (still works) — replace `next/router` with `next/navigation`.
- Delete unused `pages/api` routes only after Route Handler parity is verified.

## Migration Checklist

### Setup

- [ ] `app/layout.tsx` created with `<html>` and `<body>`
- [ ] Global CSS imported in root layout
- [ ] Metadata API replaces `_document` concerns
- [ ] `next/font` replaces font `<link>` tags from `_document`

### Per Route

- [ ] `page.tsx` created at equivalent URL path
- [ ] `getStaticProps` / `getServerSideProps` removed — data fetched in component
- [ ] `getStaticPaths` → `generateStaticParams`
- [ ] `<Head>` → `metadata` or `generateMetadata`
- [ ] `next/router` → `next/navigation` where needed
- [ ] `'use client'` added only to interactive components
- [ ] `loading.tsx` / `error.tsx` added for slow or critical routes

### API

- [ ] `pages/api/*` ported to `app/api/*/route.ts`
- [ ] `NextApiRequest`/`NextApiResponse` → Web `Request`/`Response`
- [ ] HTTP method checks use `export async function GET/POST`

### Cleanup

- [ ] All `pages/` routes ported or intentionally retained
- [ ] `_app.tsx` and `_document.tsx` deleted
- [ ] No `getInitialProps` remaining
- [ ] `next build` passes with only `app/` router

## References

### Verified Against

- [App Router Migration Guide](https://nextjs.org/docs/app/guides/migrating/app-router-migration)
- [Migrating from Pages to App](https://nextjs.org/docs/pages/building-your-application/upgrading/app-router-migration)
- [Project Structure](https://nextjs.org/docs/app/getting-started/project-structure)
- [`generateStaticParams`](https://nextjs.org/docs/app/api-reference/functions/generate-static-params)
- [Route Handlers](https://nextjs.org/docs/app/api-reference/file-conventions/route)
- [Metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)

**Framework:** Next.js 16 App Router

**Last verified:** July 2026
