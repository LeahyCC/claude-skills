# Metadata

## Setup: Root Layout

Every Next.js app should configure metadata in the root layout:

```tsx
// app/layout.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://example.com'),  // REQUIRED for URL resolution
  title: {
    default: 'My App — Tagline',     // Fallback for pages without title
    template: '%s | My App',          // Template for child pages
  },
  description: 'One-sentence description of what the app does.',
  openGraph: {
    type: 'website',
    siteName: 'My App',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@handle',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    // yandex: '...',
    // yahoo: '...',
  },
}
```

### Title Templates

```tsx
// Root layout: template: '%s | My App'
// Child page:  title: 'About'
// Result:      <title>About | My App</title>

// Override template with absolute:
export const metadata: Metadata = {
  title: {
    absolute: 'Custom Title Without Template',  // Ignores parent template
  },
}
```

## Static Metadata (Simple Pages)

For pages where metadata is known at build time:

```tsx
// app/about/page.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about our team, mission, and values.',
  openGraph: {
    title: 'About Us',
    description: 'Learn about our team, mission, and values.',
  },
}

export default function AboutPage() {
  return <main>...</main>
}
```

## Dynamic Metadata (Data-Driven Pages)

For pages where metadata depends on fetched data:

```tsx
// app/listings/[id]/page.tsx
import type { Metadata } from 'next'
import { cache } from 'react'
import { getListing } from '@/lib/db'

// Memoize the fetch — prevents duplicate calls between generateMetadata and page
const getCachedListing = cache(async (id: string) => {
  return getListing(id)
})

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const listing = await getCachedListing(id)

  if (!listing) {
    return { title: 'Listing Not Found' }
  }

  return {
    title: `${listing.year} ${listing.make} ${listing.model}`,
    description: `${listing.year} ${listing.make} ${listing.model} — ${listing.mileage?.toLocaleString()} miles, $${listing.price?.toLocaleString()}. ${listing.dealership_name}.`,
    openGraph: {
      title: `${listing.year} ${listing.make} ${listing.model}`,
      description: `$${listing.price?.toLocaleString()} — ${listing.mileage?.toLocaleString()} miles`,
      images: listing.images?.[0] ? [{ url: listing.images[0], width: 1200, height: 630 }] : [],
    },
    alternates: {
      canonical: `/listings/${id}`,  // Resolved against metadataBase
    },
  }
}

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const listing = await getCachedListing(id)  // Same cache — no duplicate fetch
  // ...
}
```

## Client Component Pages

Client components (`'use client'`) cannot export metadata. Use a layout file:

```tsx
// app/favorites/layout.tsx (Server Component)
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Favorites',
  description: 'Your saved listings.',
}

export default function FavoritesLayout({ children }: { children: React.ReactNode }) {
  return children
}

// app/favorites/page.tsx (Client Component)
'use client'
export default function FavoritesPage() {
  // ... client-side logic
}
```

## Noindex Pages

Pages that should NOT appear in search results:

```tsx
// app/dashboard/layout.tsx
export const metadata: Metadata = {
  title: 'Dashboard',
  robots: {
    index: false,
    follow: false,
  },
}

// Auth pages
// app/(auth)/login/layout.tsx
export const metadata: Metadata = {
  title: 'Sign In',
  robots: { index: false },
}
```

## Canonical URLs

Prevent duplicate content issues when the same page is accessible at multiple URLs:

```tsx
export const metadata: Metadata = {
  alternates: {
    canonical: '/products/widget',  // Resolved against metadataBase
    languages: {
      'en-US': '/en-us/products/widget',
      'es-ES': '/es/productos/widget',
    },
  },
}
```

### When to Set Canonical

- Pages with query parameters (e.g., `/search?q=test` → canonical `/search`)
- Pages accessible with/without trailing slash
- HTTP/HTTPS variants (handle with redirect, not canonical)
- Paginated content (canonical to page 1 or self-referencing)

## File-Based Metadata

### Favicon and Icons

```
app/
├── favicon.ico         → <link rel="icon" href="/favicon.ico">
├── icon.png            → <link rel="icon" type="image/png" href="/icon.png">
├── icon.svg            → <link rel="icon" type="image/svg+xml">
└── apple-icon.png      → <link rel="apple-touch-icon">
```

### Per-Route OG Images

```
app/
├── opengraph-image.png    → Default OG image
├── twitter-image.png      → Twitter card image
└── blog/
    └── [slug]/
        └── opengraph-image.tsx  → Dynamic OG image per post
```

## Common Mistakes

```tsx
// WRONG — meta keywords (Google ignores since 2009)
export const metadata: Metadata = {
  keywords: ['cars', 'buy', 'sell'],  // Useless — remove
}

// WRONG — same title on every page (use title.template)
export const metadata: Metadata = {
  title: 'My App',  // Every page says "My App" — bad for SEO
}

// WRONG — description too long (truncated at ~155 chars in SERP)
export const metadata: Metadata = {
  description: 'A very long description that goes on and on and includes every possible keyword...',
}

// WRONG — missing metadataBase (OG image URLs won't resolve)
// If metadataBase is not set, relative paths like '/og.png' won't have a host

// WRONG — no data memoization (fetches data twice)
export async function generateMetadata({ params }) {
  const data = await fetchData(params.id)  // Fetch 1
  return { title: data.title }
}
export default async function Page({ params }) {
  const data = await fetchData(params.id)  // Fetch 2 (duplicate!)
  return <div>{data.title}</div>
}

// RIGHT — memoized with cache()
const getData = cache(async (id: string) => fetchData(id))
```
