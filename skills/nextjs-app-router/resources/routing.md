# Routing

> **Core Principle:** Organize routes by feature. Use nested layouts for shared UI, route groups for structure, and advanced patterns only when they solve a real UX problem.

## Introduction

The App Router maps the `app/` directory to URL segments. Each folder is a route segment; special files (`page.tsx`, `layout.tsx`, `loading.tsx`, etc.) define behavior. Layouts persist across navigations; pages render unique content per route.

For error and loading UI, see [error-handling.md](error-handling.md). For request interception before routes render, see [proxy.md](proxy.md).

## Architecture

```
app/
├── layout.tsx              # Root layout (required)
├── page.tsx                # /
├── loading.tsx             # Root loading UI
├── error.tsx               # Root error boundary
├── not-found.tsx           # Global 404
│
├── (marketing)/            # Route group — no URL segment
│   ├── layout.tsx
│   ├── page.tsx            # /
│   └── pricing/
│       └── page.tsx        # /pricing
│
├── dashboard/
│   ├── layout.tsx          # Shared dashboard chrome
│   ├── page.tsx            # /dashboard
│   ├── settings/
│   │   └── page.tsx        # /dashboard/settings
│   └── @analytics/         # Parallel route slot
│       ├── page.tsx
│       └── default.tsx
│
├── blog/
│   ├── page.tsx            # /blog
│   └── [slug]/
│       ├── page.tsx        # /blog/:slug
│       └── layout.tsx
│
├── docs/
│   └── [...slug]/
│       └── page.tsx        # /docs/* catch-all
│
└── api/
    └── health/
        └── route.ts        # /api/health
```

### Component Hierarchy (per segment)

```
layout.tsx
  └── template.tsx (optional — remounts on navigation)
        └── error.tsx
              └── loading.tsx
                    └── not-found.tsx
                          └── page.tsx
```

## Decision Matrix

### File convention

| Need | File | URL Impact |
|------|------|------------|
| Route UI | `page.tsx` | Defines routable segment |
| Shared chrome | `layout.tsx` | Wraps segment + children |
| Remount on navigate | `template.tsx` | Same as layout but re-instantiates |
| Loading UI | `loading.tsx` | Suspense fallback for segment |
| Error UI | `error.tsx` | Error boundary for segment |
| 404 UI | `not-found.tsx` | Shown when `notFound()` called |
| HTTP endpoint | `route.ts` | API route — no `page.tsx` sibling |

### Dynamic segment type

| Pattern | Folder | Matches |
|---------|--------|---------|
| Dynamic | `[slug]` | Single segment: `/blog/hello` |
| Catch-all | `[...slug]` | One or more: `/docs/a/b/c` |
| Optional catch-all | `[[...slug]]` | Zero or more: `/shop` or `/shop/a/b` |

### Advanced routing

| Pattern | Use When | Skip When |
|---------|----------|-----------|
| Route groups `(name)` | Organize without URL change | You need a URL segment |
| Parallel routes `@slot` | Independent regions (dashboard panels) | Simple parent-child layout suffices |
| Intercepting routes `(.)` | Modal over list (photo gallery) | No shareable deep-link modal needed |
| Multiple root layouts | Separate apps (admin vs marketing) | Single app shell works |

### Navigation API

| Need | API | Runs On |
|------|-----|---------|
| Declarative links | `<Link href>` | Client + server |
| Programmatic navigate | `useRouter().push()` / `.replace()` | Client only |
| Current path | `usePathname()` | Client only |
| Query params | `useSearchParams()` | Client only |
| Active segment | `useSelectedLayoutSegment()` | Client only |
| Server redirect | `redirect()` | Server |
| Hard refresh client router | `refresh()` from `next/cache` | Server Actions only |

## Production Workflow

```
1. Map features to URL structure
2. Create route groups for unrelated sections
3. Add root layout (html, body, providers)
4. Nest feature layouts (nav, sidebar)
5. Add pages with async params: Promise<{}>
6. Configure generateStaticParams for static paths
7. Add loading.tsx per slow segment
8. Wire navigation with Link + prefetch defaults
9. Add parallel/intercepting routes only if UX requires
```

### Root Layout

```tsx
// app/layout.tsx
import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  metadataBase: new URL('https://acme.com'),
  title: { default: 'Acme', template: '%s | Acme' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={geist.variable}>
      <body>{children}</body>
    </html>
  )
}
```

### Feature Layout with Async Params

```tsx
// app/dashboard/[team]/layout.tsx
import { TeamNav } from '@/components/TeamNav'
import { getTeam } from '@/lib/teams'
import { notFound } from 'next/navigation'

export default async function TeamLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ team: string }>
}) {
  const { team: teamSlug } = await params
  const team = await getTeam(teamSlug)
  if (!team) notFound()

  return (
    <div className="flex min-h-screen">
      <TeamNav team={team} />
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
```

### Dynamic Page with `generateStaticParams`

```tsx
// app/blog/[slug]/page.tsx
import { notFound } from 'next/navigation'
import { getPost, getAllPostSlugs } from '@/lib/posts'

export async function generateStaticParams() {
  const slugs = await getAllPostSlugs()
  return slugs.map((slug) => ({ slug }))
}

export const dynamicParams = true

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()

  return (
    <article>
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.html }} />
    </article>
  )
}
```

### Route Groups

```tsx
// app/(marketing)/layout.tsx — URL: /, /pricing (no "marketing" segment)
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <MarketingHeader />
      {children}
      <MarketingFooter />
    </>
  )
}
```

```tsx
// app/(app)/dashboard/layout.tsx — URL: /dashboard
export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-[240px_1fr] min-h-screen">
      <AppSidebar />
      {children}
    </div>
  )
}
```

### Parallel Routes

```tsx
// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
  analytics,
}: {
  children: React.ReactNode
  analytics: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-2 gap-6">
      <section>{children}</section>
      <aside>{analytics}</aside>
    </div>
  )
}
```

```tsx
// app/dashboard/@analytics/page.tsx
import { AnalyticsPanel } from '@/components/AnalyticsPanel'

export default async function AnalyticsSlot() {
  return <AnalyticsPanel />
}
```

```tsx
// app/dashboard/@analytics/default.tsx
export default function AnalyticsDefault() {
  return null
}
```

### Intercepting Routes (Modal Pattern)

```
app/
├── feed/
│   └── page.tsx                    # /feed
├── photo/
│   └── [id]/
│       └── page.tsx                # /photo/:id (full page on direct visit)
└── feed/
    └── @modal/
        └── (.)photo/
            └── [id]/
                └── page.tsx        # Intercepts /photo/:id when navigating from /feed
```

```tsx
// app/feed/layout.tsx
export default function FeedLayout({
  children,
  modal,
}: {
  children: React.ReactNode
  modal: React.ReactNode
}) {
  return (
    <>
      {children}
      {modal}
    </>
  )
}
```

```tsx
// app/feed/@modal/(.)photo/[id]/page.tsx
import { PhotoModal } from '@/components/PhotoModal'
import { getPhoto } from '@/lib/photos'

export default async function InterceptedPhotoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const photo = await getPhoto(id)
  return <PhotoModal photo={photo} />
}
```

### Navigation

```tsx
// components/NavLink.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function NavLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(`${href}/`)

  return (
    <Link
      href={href}
      className={isActive ? 'font-semibold text-foreground' : 'text-muted-foreground'}
      aria-current={isActive ? 'page' : undefined}
    >
      {children}
    </Link>
  )
}
```

```tsx
// components/SearchForm.tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export function SearchForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const q = formData.get('q') as string
    const params = new URLSearchParams(searchParams.toString())
    params.set('q', q)
    router.push(`/search?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="q" defaultValue={searchParams.get('q') ?? ''} />
      <button type="submit">Search</button>
    </form>
  )
}
```

## PASS Examples

### Nested layouts preserve state on navigation

```tsx
// app/products/layout.tsx
export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <ProductsFilterBar />
      {children}
    </div>
  )
}
```

Filter bar stays mounted when navigating `/products/shoes` → `/products/jackets`.

### `generateStaticParams` with Cache Components

```tsx
// Must return at least one param when cacheComponents is enabled
export async function generateStaticParams() {
  const products = await db.product.findMany({
    select: { slug: true },
    take: 100,
  })
  return products.map((p) => ({ slug: p.slug }))
}
```

### Template for remounting animations

```tsx
// app/onboarding/template.tsx
export default function OnboardingTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-fade-in">{children}</div>
}
```

## FAIL Examples

### `page.tsx` and `route.ts` in same segment

```
app/api/users/
  ├── page.tsx    # FAIL — conflict
  └── route.ts    # FAIL — conflict
```

Use `route.ts` for HTTP endpoints or `page.tsx` for UI — never both in the same folder.

### Reading `searchParams` in layout

```tsx
// FAIL — layouts do not re-render; searchParams become stale
export default function Layout({
  children,
  searchParams,
}: {
  children: React.ReactNode
  searchParams: Promise<{ q?: string }>
}) {
  // Don't do this
}
```

```tsx
// PASS — read searchParams in page.tsx or Client Component
// app/search/page.tsx
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  return <SearchResults query={q ?? ''} />
}
```

### Importing Server Component into Client Component

```tsx
// FAIL
'use client'
import ProductList from './ProductList' // Becomes client-bundled

export default function Page() {
  return <ProductList />
}
```

```tsx
// PASS — pass as children or keep page as Server Component
// page.tsx (Server)
import { ProductList } from './ProductList'
import { FilterBar } from './FilterBar'

export default function Page() {
  return (
    <FilterBar>
      <ProductList />
    </FilterBar>
  )
}
```

### Synchronous `params` (deprecated)

```tsx
// FAIL — synchronous access deprecated
export default function Page({ params }: { params: { slug: string } }) {
  return <h1>{params.slug}</h1>
}
```

```tsx
// PASS
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <h1>{slug}</h1>
}
```

## Common Mistakes

- Duplicating nav/footer in every `page.tsx` instead of using `layout.tsx`.
- Using route groups when a URL segment is actually needed.
- Adding parallel routes without `default.tsx` fallbacks for each slot.
- Intercepting route matcher wrong — `(.)` is segment-level, not file-system depth.
- Using `useRouter` for external URLs — use `<a href>` instead.
- Calling `redirect()` inside try/catch — it throws a special error.
- `generateStaticParams` returning empty array with Cache Components enabled.
- Placing auth checks only in layout without validating in page/actions.

## Best Practices

- Colocate routes with the feature they serve: `app/invoices/`, not `app/pages/invoices/`.
- Keep layouts thin — fetch shared data with React `cache()` deduplication.
- Use `generateStaticParams` for all high-traffic dynamic routes.
- Set `dynamicParams = false` only when unknown slugs should 404.
- Prefetch critical routes via `<Link>` (default for static routes in viewport).
- Use `template.tsx` only when you need remount behavior (animations, form reset).
- For active nav, extract a small Client Component — layouts don't access pathname.
- Document parallel route slots in a README within the feature folder.
- Validate dynamic `params` and call `notFound()` for missing resources.

## Production Checklist

### Structure

- [ ] Root `layout.tsx` defines `<html lang>` and `<body>`
- [ ] Routes organized by feature, not by component type
- [ ] Route groups used for layout variants without URL pollution
- [ ] No `page.tsx` + `route.ts` conflicts in same segment

### Dynamic Routes

- [ ] `params` typed as `Promise<{}>` and awaited
- [ ] `generateStaticParams` returns at least one entry (Cache Components)
- [ ] `dynamicParams` configured intentionally
- [ ] Missing resources call `notFound()`

### Navigation

- [ ] Internal links use `<Link>` from `next/link`
- [ ] Active state handled in Client Component with `usePathname`
- [ ] Search/filter uses `searchParams` in `page.tsx`, not layout
- [ ] External links use `<a>` with `rel="noopener noreferrer"` when `target="_blank"`

### Advanced Patterns

- [ ] Parallel routes have `default.tsx` per slot
- [ ] Intercepting routes tested: soft nav (modal) + hard nav (full page)
- [ ] Multiple root layouts documented — full page load between them is expected

## References

### Verified Against

- [Project Structure](https://nextjs.org/docs/app/getting-started/project-structure)
- [Layouts and Pages](https://nextjs.org/docs/app/getting-started/layouts-and-pages)
- [Linking and Navigating](https://nextjs.org/docs/app/getting-started/linking-and-navigating)
- [Route Groups](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups)
- [Dynamic Segments](https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes)
- [Parallel Routes](https://nextjs.org/docs/app/api-reference/file-conventions/parallel-routes)
- [Intercepting Routes](https://nextjs.org/docs/app/api-reference/file-conventions/intercepting-routes)
- [`generateStaticParams`](https://nextjs.org/docs/app/api-reference/functions/generate-static-params)
- [`Link` component](https://nextjs.org/docs/app/api-reference/components/link)
- [`useRouter`](https://nextjs.org/docs/app/api-reference/functions/use-router)
- [`usePathname`](https://nextjs.org/docs/app/api-reference/functions/use-pathname)
- [`template.js`](https://nextjs.org/docs/app/api-reference/file-conventions/template)
- [`layout.js`](https://nextjs.org/docs/app/api-reference/file-conventions/layout)

**Framework:** Next.js 16 App Router

**Last verified:** July 2026
