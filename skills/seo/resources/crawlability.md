# Crawlability — Sitemaps & Robots

## robots.ts

Controls which URLs a crawler may fetch. It does not keep a page out of Google. Use `robots: { index: false }` for that, and do not Disallow the same URL. A disallowed URL can still appear, and Google cannot see a noindex tag it was not allowed to crawl.

```tsx
// app/robots.ts
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/'],
      },
      // Search crawlers. Blocking one of these removes you from that product.
      { userAgent: 'OAI-SearchBot', allow: '/' },
      { userAgent: 'Claude-SearchBot', allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
      // Training. A separate choice. Disallow does not remove you from search.
      { userAgent: 'GPTBot', allow: '/' },
      { userAgent: 'ClaudeBot', allow: '/' },
      {
        userAgent: 'Google-Extended',
        allow: '/', // Gemini training and grounding. Not Google Search or AI Overviews.
      },
    ],
    sitemap: 'https://example.com/sitemap.xml',
  }
}
```

### AI Crawler User Agents

| User Agent | Service | Purpose |
|------------|---------|---------|
| `OAI-SearchBot` | OpenAI | ChatGPT search. Blocking this keeps you out of ChatGPT search answers. |
| `GPTBot` | OpenAI | Training. Independent of search. |
| `ChatGPT-User` | OpenAI | User-triggered fetch. Does not decide Search inclusion. robots.txt may not apply. |
| `Googlebot` | Google | Search, including AI Overviews |
| `Google-Extended` | Google | Gemini training and grounding. Does not affect Google Search or AI Overviews. |
| `Claude-SearchBot` | Anthropic | Claude search index |
| `ClaudeBot` | Anthropic | Training |
| `Claude-User` | Anthropic | User-triggered fetch |
| `PerplexityBot` | Perplexity | Search results. Not used for training. |
| `Perplexity-User` | Perplexity | User-triggered fetch. Generally ignores robots.txt. |
| `CCBot` | Common Crawl | Open dataset (used by many AI systems) |

**Search and training are separate rules.** Allow `OAI-SearchBot`, `Claude-SearchBot`, and `PerplexityBot` if you want citations. Disallow `GPTBot`, `ClaudeBot`, or `Google-Extended` on its own if you want out of training. `ChatGPT-User` and `Perplexity-User` are user fetches, and robots.txt may not apply to them.

## sitemap.ts

### Basic Sitemap

Google ignores `priority` and `changefreq`. `lastModified` only helps when it is the real modification time. Do not stamp `new Date()` on every build.

```tsx
// app/sitemap.ts
import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://example.com',
      lastModified: '2026-03-01',
    },
    {
      url: 'https://example.com/about',
      lastModified: '2025-11-12',
    },
  ]
}
```

### Dynamic Sitemap (Database-Driven)

```tsx
// app/sitemap.ts
import type { MetadataRoute } from 'next'
import { db } from '@/lib/db'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: 'https://example.com', lastModified: '2026-03-01' },
    { url: 'https://example.com/about', lastModified: '2025-11-12' },
    { url: 'https://example.com/contact', lastModified: '2025-11-12' },
  ]

  // Dynamic pages from database
  const listings = await db.listings.findMany({
    select: { id: true, updatedAt: true, images: true },
    where: { status: 'active' },
  })

  const listingPages: MetadataRoute.Sitemap = listings.map((listing) => ({
    url: `https://example.com/listings/${listing.id}`,
    lastModified: listing.updatedAt,
    images: listing.images,  // Absolute image URLs. Next.js image sitemap.
  }))

  return [...staticPages, ...listingPages]
}
```

### Multiple Sitemaps (Large Sites)

Google limits sitemaps to 50,000 URLs. For larger sites, split into multiple files:

```tsx
// app/sitemap.ts
import type { MetadataRoute } from 'next'

// This function tells Next.js how many sitemaps to generate
export async function generateSitemaps() {
  const totalListings = await db.listings.count()
  const sitemapsNeeded = Math.ceil(totalListings / 50000)

  return Array.from({ length: sitemapsNeeded }, (_, i) => ({ id: i }))
}

// Next 16: id is a Promise<string>
export default async function sitemap(props: {
  id: Promise<string>
}): Promise<MetadataRoute.Sitemap> {
  const id = Number(await props.id)
  const listings = await db.listings.findMany({
    select: { id: true, updatedAt: true },
    skip: id * 50000,
    take: 50000,
    orderBy: { id: 'asc' },
  })

  return listings.map((listing) => ({
    url: `https://example.com/listings/${listing.id}`,
    lastModified: listing.updatedAt,
  }))
}
// app/sitemap.ts serves /sitemap/0.xml, /sitemap/1.xml, and so on.
```

### Sitemap with i18n

```tsx
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://example.com/about',
      lastModified: '2025-11-12',
      alternates: {
        languages: {
          es: 'https://example.com/es/about',
          fr: 'https://example.com/fr/about',
        },
      },
    },
  ]
}
```

## Internal Linking

Internal links help Google discover pages and understand site structure:

```tsx
// GOOD — descriptive anchor text
<Link href="/listings/2024-bmw-m4">2024 BMW M4 Competition</Link>

// BAD — non-descriptive
<Link href="/listings/2024-bmw-m4">Click here</Link>
<Link href="/listings/2024-bmw-m4">Read more</Link>

// GOOD — breadcrumb navigation (also helps structured data)
<nav aria-label="Breadcrumb">
  <ol className="flex gap-2 text-sm text-muted-foreground">
    <li><Link href="/">Home</Link></li>
    <li>/</li>
    <li><Link href="/listings">Listings</Link></li>
    <li>/</li>
    <li aria-current="page">2024 BMW M4</li>
  </ol>
</nav>
```

## URL Structure

```
GOOD — descriptive, hierarchical:
/listings/2024-bmw-m4-competition
/blog/how-to-buy-used-car
/search?make=bmw&model=m4

BAD — opaque IDs, flat:
/listings/abc123def456
/page?id=42
/content/1234
```

- Use hyphens, not underscores (`used-cars` not `used_cars`)
- Lowercase only
- Keep URLs short and descriptive
- Use hierarchy that matches site structure
- Avoid query parameters for indexable content when possible
