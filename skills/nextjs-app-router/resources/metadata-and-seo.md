# Metadata and SEO

> **Core Principle:** Every public page needs a unique title, description, and canonical URL. Configure `metadataBase` once in the root layout; derive everything else from data.

## Introduction

The Metadata API generates `<title>`, `<meta>`, Open Graph, Twitter Card, and icon tags from `layout.tsx` and `page.tsx` exports. Use static `metadata` for fixed pages and `generateMetadata` for data-driven pages.

This resource owns **App Router metadata conventions** — where metadata lives, how it inherits, and how `generateMetadata` shares data with pages. For deeper SEO implementation (JSON-LD, sitemaps, robots, Open Graph depth), use the sibling **seo** skill:

| Topic | See |
|-------|-----|
| JSON-LD / structured data | [seo skill — Structured Data](../../seo/resources/structured-data.md) |
| Sitemaps (`sitemap.ts`) | [seo skill — Crawlability](../../seo/resources/crawlability.md) |
| Robots (`robots.ts`) | [seo skill — Crawlability](../../seo/resources/crawlability.md) |
| Open Graph images & depth | [seo skill — OG Images](../../seo/resources/og-images.md) |
| Full metadata patterns | [seo skill — Metadata](../../seo/resources/metadata.md) |

For image/font performance affecting SEO Core Web Vitals, see [assets.md](assets.md). For routing of sitemap/robots files, see [routing.md](routing.md).

## Architecture

```
app/layout.tsx
  metadataBase + title template + defaults
        │
        ▼
app/(marketing)/layout.tsx
  section-level overrides
        │
        ▼
app/blog/[slug]/page.tsx
  generateMetadata({ params }) ──► fetch post data
        │                              │
        ▼                              ▼
  <head> tags streamed          page.tsx uses same cached fetch
        │
        ├── title / description
        ├── openGraph / twitter
        ├── alternates.canonical
        ├── robots
        └── icons

File conventions (robots.ts, sitemap.ts, opengraph-image.tsx)
  → implement via seo skill; this resource covers Metadata API ownership only
```

## Decision Matrix

### Metadata approach

| Page Type | Approach | Canonical | Index? |
|-----------|----------|-----------|--------|
| Home | Static `metadata` in layout | Yes | Yes |
| Marketing (about, pricing) | Static `metadata` in page | Yes | Yes |
| Blog post / product | `generateMetadata` + `cache()` | Yes | Yes |
| Paginated list | `generateMetadata` + `rel` alternates | Page 1 or self | Yes |
| Search results | `generateMetadata` with query | Without query params | Yes |
| Dashboard / app | Static `metadata` + `robots: noindex` | No | No |
| Auth (login) | Static `metadata` + `noindex` | No | No |

### File convention (ownership)

| File | Output | Owned by |
|------|--------|----------|
| `export const metadata` | Static tags | This skill |
| `generateMetadata()` | Dynamic tags | This skill |
| `robots.ts` | `/robots.txt` | **seo** skill |
| `sitemap.ts` | `/sitemap.xml` | **seo** skill |
| `opengraph-image.tsx` | OG image per route | **seo** skill |
| `icon.tsx` / `apple-icon.tsx` | Favicons | This skill (convention) / **seo** for depth |
| JSON-LD `<script>` | Structured data | **seo** skill |

## Production Workflow

```
1. Set metadataBase + title template in root layout
2. Add static metadata to marketing pages
3. Implement generateMetadata on dynamic pages
4. Memoize shared fetches with React cache()
5. Set alternates.canonical on all indexable pages
6. noindex auth/dashboard routes
7. For robots.ts, sitemap.ts, JSON-LD, OG images → use seo skill
8. Validate with View Source / Google Rich Results Test
```

### Root Layout Setup

```tsx
// app/layout.tsx
import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  metadataBase: new URL('https://acme.com'),
  title: {
    default: 'Acme — Fleet Management Software',
    template: '%s | Acme',
  },
  description:
    'Manage your vehicle fleet with real-time tracking, maintenance scheduling, and compliance reporting.',
  openGraph: {
    type: 'website',
    siteName: 'Acme',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@acme',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable}>
      <body>{children}</body>
    </html>
  )
}
```

### Static Page Metadata

```tsx
// app/pricing/page.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Transparent fleet management pricing. Starter, Professional, and Enterprise plans with no hidden fees.',
  openGraph: {
    title: 'Acme Pricing',
    description: 'Plans for teams of every size.',
    url: '/pricing',
  },
  alternates: {
    canonical: '/pricing',
  },
}

export default function PricingPage() {
  return <main>{/* ... */}</main>
}
```

### Dynamic `generateMetadata`

```tsx
// app/vehicles/[vin]/page.tsx
import type { Metadata } from 'next'
import { cache } from 'react'
import { notFound } from 'next/navigation'
import { getVehicle } from '@/lib/vehicles'

const getCachedVehicle = cache(async (vin: string) => getVehicle(vin))

export async function generateMetadata({
  params,
}: {
  params: Promise<{ vin: string }>
}): Promise<Metadata> {
  const { vin } = await params
  const vehicle = await getCachedVehicle(vin)

  if (!vehicle) {
    return { title: 'Vehicle Not Found' }
  }

  const title = `${vehicle.year} ${vehicle.make} ${vehicle.model}`
  const description = `${title} — ${vehicle.mileage.toLocaleString()} miles, ${vehicle.location}. VIN ${vin}.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: vehicle.imageUrl
        ? [{ url: vehicle.imageUrl, width: 1200, height: 630, alt: title }]
        : [],
      type: 'website',
    },
    alternates: {
      canonical: `/vehicles/${vin}`,
    },
  }
}

export default async function VehiclePage({
  params,
}: {
  params: Promise<{ vin: string }>
}) {
  const { vin } = await params
  const vehicle = await getCachedVehicle(vin)
  if (!vehicle) notFound()

  return <VehicleDetail vehicle={vehicle} />
}
```

### Client Component Page — Metadata via Layout

```tsx
// app/fleet/live/layout.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Live Fleet Map',
  robots: { index: false, follow: false },
}

export default function LiveFleetLayout({ children }: { children: React.ReactNode }) {
  return children
}
```

## PASS Examples

### Title template inheritance

```tsx
// Root: template: '%s | Acme'
// Page:  title: 'Pricing'
// Result: <title>Pricing | Acme</title>
```

### Absolute title override

```tsx
export const metadata: Metadata = {
  title: { absolute: 'Acme — Home' },
}
```

### noindex for private routes

```tsx
// app/dashboard/layout.tsx
export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false, follow: false },
}
```

## FAIL Examples

### Missing `metadataBase`

```tsx
// FAIL — relative OG URLs won't resolve correctly
export const metadata: Metadata = {
  openGraph: {
    images: ['/og.png'],
  },
}
```

```tsx
// PASS
export const metadata: Metadata = {
  metadataBase: new URL('https://acme.com'),
  openGraph: {
    images: ['/og.png'], // Resolves to https://acme.com/og.png
  },
}
```

### Duplicate fetch in `generateMetadata` and page

```tsx
// FAIL — two database calls per request
export async function generateMetadata({ params }) {
  const { slug } = await params
  const post = await getPost(slug)
  return { title: post.title }
}

export default async function Page({ params }) {
  const { slug } = await params
  const post = await getPost(slug) // Duplicate
}
```

```tsx
// PASS — React cache() deduplicates
const getCachedPost = cache(getPost)
```

### Metadata on Client Component page

```tsx
// FAIL — 'use client' pages cannot export metadata
'use client'
export const metadata = { title: 'Dashboard' }
```

```tsx
// PASS — metadata in parent layout.tsx (Server Component)
```

### Manual `<head>` tags in layout

```tsx
// FAIL — bypasses streaming, deduplication, and Metadata API
export default function Layout({ children }) {
  return (
    <html>
      <head>
        <title>My App</title>
        <meta name="description" content="..." />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

## Common Mistakes

- No `metadataBase` in root layout — breaks relative URL resolution.
- Same title on every page — hurts SEO and accessibility.
- Canonical URL includes query parameters on filtered pages.
- `noindex` missing on dashboard, auth, and staging routes.
- `generateMetadata` and page fetch same data without `cache()`.
- Exporting metadata from `'use client'` pages.
- Duplicating robots/sitemap/JSON-LD guidance here — use the **seo** skill instead.

## Best Practices

- Set `metadataBase` and title `template` in root layout exactly once.
- Every indexable page: unique `title`, `description`, `alternates.canonical`.
- Memoize data fetches shared between `generateMetadata` and page with `cache()`.
- Use `robots: { index: false }` for app routes in layout metadata.
- Set `lang` on `<html>` in root layout.
- For Cache Components: `generateMetadata` runtime access tracked separately — see Metadata with Cache Components docs.
- Defer JSON-LD, sitemap, robots, and OG image generation to the **seo** skill.

## Production Checklist

### Root Configuration

- [ ] `metadataBase` set to production domain
- [ ] Title `template` and `default` configured
- [ ] Default `description` set
- [ ] `<html lang="en">` (or appropriate locale)

### Per-Page

- [ ] Unique `<title>` on every public page
- [ ] Unique `description` on every public page
- [ ] `alternates.canonical` on indexable pages
- [ ] Basic OG `title` / `description` on shareable pages
- [ ] `robots: noindex` on auth, dashboard, admin routes

### Dynamic Pages

- [ ] `generateMetadata` uses `cache()` for shared data access
- [ ] `params` awaited as `Promise<{}>`
- [ ] Missing resources return sensible metadata or trigger `notFound()`

### SEO depth (seo skill)

- [ ] `robots.ts` / `sitemap.ts` / JSON-LD / OG images covered via **seo** skill

## References

### Verified Against

- [Metadata and OG Images](https://nextjs.org/docs/app/getting-started/metadata-and-og-images)
- [`generateMetadata`](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [`metadata` object](https://nextjs.org/docs/app/api-reference/functions/generate-metadata#the-metadata-object)
- [`files` metadata API](https://nextjs.org/docs/app/api-reference/file-conventions/metadata)

### Sibling skill

- [seo skill](../../seo/SKILL.md) — JSON-LD, sitemaps, robots, Open Graph depth

**Framework:** Next.js 16 App Router

**Last verified:** July 2026
