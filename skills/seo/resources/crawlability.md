# Crawlability — Sitemaps & Robots

## robots.ts

Controls which pages search engines and AI crawlers can access:

```tsx
// app/robots.ts
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/admin/'],
      },
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/admin/'],
      },
      // AI crawlers — allow for GEO visibility (or disallow to block training)
      {
        userAgent: ['GPTBot', 'ChatGPT-User'],
        allow: '/',           // Allow: AI search can cite your content
        // disallow: ['/'],   // Disallow: block from AI training/citations
      },
      {
        userAgent: ['anthropic-ai', 'ClaudeBot'],
        allow: '/',
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
      },
      {
        userAgent: 'Google-Extended',
        allow: '/',           // Controls Gemini training (separate from Search)
      },
    ],
    sitemap: 'https://example.com/sitemap.xml',
  }
}
```

### AI Crawler User Agents

| User Agent | Service | Purpose |
|------------|---------|---------|
| `GPTBot` | OpenAI | Training data |
| `ChatGPT-User` | OpenAI | Live browsing (ChatGPT search) |
| `Google-Extended` | Google | Gemini training (separate from Search) |
| `Googlebot` | Google | Search + AI Overviews |
| `anthropic-ai` | Anthropic | Training data |
| `ClaudeBot` | Anthropic | Claude web browsing |
| `PerplexityBot` | Perplexity | Search and citations |
| `CCBot` | Common Crawl | Open dataset (used by many AI systems) |

**Strategic decision:** Allowing AI crawlers means your content can be cited in AI search results (GEO benefit). Blocking means your content won't be used for training. Many sites allow `ChatGPT-User` and `PerplexityBot` (for citations) but block `GPTBot` and `Google-Extended` (training-only).

## sitemap.ts

### Basic Sitemap

```tsx
// app/sitemap.ts
import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://example.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://example.com/about',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
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
    { url: 'https://example.com', lastModified: new Date(), priority: 1 },
    { url: 'https://example.com/about', lastModified: new Date(), priority: 0.5 },
    { url: 'https://example.com/contact', lastModified: new Date(), priority: 0.5 },
  ]

  // Dynamic pages from database
  const listings = await db.listings.findMany({
    select: { id: true, updatedAt: true, images: true },
    where: { status: 'active' },
  })

  const listingPages: MetadataRoute.Sitemap = listings.map((listing) => ({
    url: `https://example.com/listings/${listing.id}`,
    lastModified: listing.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
    images: listing.images,  // Image sitemap support
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

// Each sitemap gets its own ID
export default async function sitemap(
  { id }: { id: number }
): Promise<MetadataRoute.Sitemap> {
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
// Generates: /sitemap/0.xml, /sitemap/1.xml, etc.
```

### Sitemap with i18n

```tsx
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://example.com/about',
      lastModified: new Date(),
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
