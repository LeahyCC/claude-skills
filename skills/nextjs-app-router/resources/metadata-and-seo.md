# Metadata and SEO

> **Core Principle:** Every public page needs a unique title, description, and canonical URL. Configure `metadataBase` once in the root layout; derive everything else from data.

## Introduction

The Metadata API generates `<title>`, `<meta>`, Open Graph, Twitter Card, and icon tags from `layout.tsx` and `page.tsx` exports. Use static `metadata` for fixed pages and `generateMetadata` for data-driven pages.

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

app/robots.ts ──► /robots.txt
app/sitemap.ts ──► /sitemap.xml
app/icon.tsx / opengraph-image.tsx ──► generated assets
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

### File convention

| File | Output | When |
|------|--------|------|
| `export const metadata` | Static tags | Known at build time |
| `generateMetadata()` | Dynamic tags | Depends on fetched data |
| `robots.ts` | `/robots.txt` | Crawl rules |
| `sitemap.ts` | `/sitemap.xml` | URL discovery |
| `opengraph-image.tsx` | OG image per route | Social previews |
| `icon.tsx` / `apple-icon.tsx` | Favicons | App icons |
| JSON-LD `<script>` | Structured data | Rich results |

## Production Workflow

```
1. Set metadataBase + title template in root layout
2. Add static metadata to marketing pages
3. Implement generateMetadata on dynamic pages
4. Memoize shared fetches with React cache()
5. Set alternates.canonical on all indexable pages
6. Add robots.ts and sitemap.ts
7. noindex auth/dashboard routes
8. Add JSON-LD for Product, Article, Organization as applicable
9. Validate with Google Rich Results Test
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

### robots.ts

```tsx
// app/robots.ts
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://acme.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/account/', '/fleet/live/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
```

### sitemap.ts

```tsx
// app/sitemap.ts
import type { MetadataRoute } from 'next'
import { db } from '@/lib/db'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://acme.com'

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/pricing`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ]

  const vehicles = await db.vehicle.findMany({
    where: { published: true },
    select: { vin: true, updatedAt: true },
  })

  const vehiclePages: MetadataRoute.Sitemap = vehicles.map((v) => ({
    url: `${baseUrl}/vehicles/${v.vin}`,
    lastModified: v.updatedAt,
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...vehiclePages]
}
```

### JSON-LD Structured Data

```tsx
// components/JsonLd.tsx
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
```

```tsx
// app/vehicles/[vin]/page.tsx
import { JsonLd } from '@/components/JsonLd'

export default async function VehiclePage({ params }: { params: Promise<{ vin: string }> }) {
  const { vin } = await params
  const vehicle = await getCachedVehicle(vin)
  if (!vehicle) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
    description: vehicle.description,
    image: vehicle.imageUrl,
    offers: {
      '@type': 'Offer',
      price: vehicle.price,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
  }

  return (
    <>
      <JsonLd data={jsonLd} />
      <VehicleDetail vehicle={vehicle} />
    </>
  )
}
```

### Dynamic OG Image

```tsx
// app/blog/[slug]/opengraph-image.tsx
import { ImageResponse } from 'next/og'
import { getPost } from '@/lib/posts'

export const alt = 'Blog post'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPost(slug)

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 48,
          background: '#0f172a',
          color: '#f8fafc',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 64,
        }}
      >
        <div style={{ fontSize: 24, opacity: 0.7 }}>Acme Blog</div>
        <div style={{ fontWeight: 700 }}>{post?.title ?? 'Post'}</div>
      </div>
    ),
    { ...size }
  )
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
- Sitemap includes `/api/`, `/dashboard/`, or auth routes.
- JSON-LD with incorrect schema types or missing required fields.
- OG images wrong aspect ratio (use 1200×630).

## Best Practices

- Set `metadataBase` and title `template` in root layout exactly once.
- Every indexable page: unique `title`, `description`, `alternates.canonical`.
- Memoize data fetches shared between `generateMetadata` and page with `cache()`.
- Use `robots: { index: false }` for app routes, not `robots.txt` alone.
- Generate `sitemap.ts` from database for dynamic content.
- Add JSON-LD for Product, Article, Organization, BreadcrumbList where eligible.
- Use `opengraph-image.tsx` for dynamic social previews on high-share pages.
- Set `lang` on `<html>` in root layout.
- Test metadata with View Source and Google Rich Results Test.
- For Cache Components: `generateMetadata` runtime access tracked separately — see Metadata with Cache Components docs.

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
- [ ] OG `title`, `description`, `images` on shareable pages
- [ ] `robots: noindex` on auth, dashboard, admin routes

### Files

- [ ] `app/robots.ts` disallows `/api/`, `/dashboard/`, private routes
- [ ] `app/sitemap.ts` includes all public URLs
- [ ] Sitemap `lastModified` reflects actual content updates
- [ ] JSON-LD validates in Rich Results Test

### Dynamic Pages

- [ ] `generateMetadata` uses `cache()` for shared data access
- [ ] `params` awaited as `Promise<{}>`
- [ ] Missing resources return sensible metadata or trigger `notFound()`

## References

### Verified Against

- [Metadata and OG Images](https://nextjs.org/docs/app/getting-started/metadata-and-og-images)
- [`generateMetadata`](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [`metadata` object](https://nextjs.org/docs/app/api-reference/functions/generate-metadata#the-metadata-object)
- [`robots.ts`](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots)
- [`sitemap.ts`](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)
- [`opengraph-image`](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image)
- [`icon`](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/app-icons)
- [JSON-LD](https://nextjs.org/docs/app/guides/json-ld)
- [`files` metadata API](https://nextjs.org/docs/app/api-reference/file-conventions/metadata)

**Framework:** Next.js 16 App Router

**Last verified:** July 2026
