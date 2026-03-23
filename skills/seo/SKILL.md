---
name: seo
description: Use when adding metadata, creating sitemaps, generating robots.txt, implementing structured data (JSON-LD), optimizing for search engines, building OG images, creating llms.txt for AI search engines, or fixing SEO issues in Next.js applications. Covers Google's official guidance, GEO (Generative Engine Optimization), Core Web Vitals, and common SEO myths.
metadata:
  filePattern:
    - "src/app/**/layout.tsx"
    - "src/app/**/page.tsx"
    - "app/**/layout.tsx"
    - "app/**/page.tsx"
    - "src/app/sitemap.ts"
    - "src/app/robots.ts"
    - "src/app/opengraph-image.tsx"
    - "app/sitemap.ts"
    - "app/robots.ts"
  bashPattern:
    - "lighthouse"
    - "next build"
    - "next-sitemap"
  priority: 50
---

# SEO — Search & AI Engine Optimization

Production-ready SEO patterns for Next.js applications. Covers traditional SEO (Google), GEO (AI search engines), and implementation with actual code — not just recommendations.

**This skill generates code, not audits.** Every pattern includes production-ready Next.js App Router examples you can use directly.

## Architecture Overview

```
[Metadata]
    ├── Static metadata (layout.tsx / page.tsx exports)
    ├── Dynamic metadata (generateMetadata with data fetching)
    ├── File-based (favicon.ico, opengraph-image.tsx, robots.ts, sitemap.ts)
    └── Title templates (%s | Site Name)
              ↓
[Structured Data]
    ├── JSON-LD via <script type="application/ld+json">
    ├── Schema.org types (Article, Product, Organization, BreadcrumbList)
    └── Rich results eligibility (FAQ, HowTo, Review, Video)
              ↓
[Crawlability]
    ├── robots.ts (Google + AI crawler control)
    ├── sitemap.ts (dynamic, with images and i18n)
    ├── Canonical URLs (alternates.canonical)
    └── Internal linking
              ↓
[Performance (Ranking Factor)]
    ├── LCP — next/image priority, Server Components
    ├── INP — useTransition, code splitting
    └── CLS — next/font, image dimensions
              ↓
[AI Visibility (GEO)]
    ├── llms.txt generation
    ├── Content structure for citation
    ├── AI crawler user-agent management
    └── Entity optimization
```

## Quick Reference

| Need to...                                   | See                                                        |
| -------------------------------------------- | ---------------------------------------------------------- |
| Add metadata to pages and layouts            | [Metadata](./resources/metadata.md)                        |
| Create sitemap.xml and robots.txt            | [Crawlability](./resources/crawlability.md)                |
| Add JSON-LD structured data                  | [Structured Data](./resources/structured-data.md)          |
| Generate dynamic OG images                   | [OG Images](./resources/og-images.md)                      |
| Optimize for AI search (ChatGPT, Perplexity) | [GEO](./resources/geo.md)                                  |
| Fix Core Web Vitals for SEO ranking          | [Performance](./resources/performance.md)                  |
| Avoid common SEO mistakes                    | [Anti-Myths](#seo-anti-myths-googles-actual-guidance)      |

## Decision Matrix

### "What metadata does this page need?"

| Page Type | Title | Description | OG Image | Canonical | Structured Data |
|-----------|-------|-------------|----------|-----------|-----------------|
| Home page | Static | Yes | Yes (branded) | Yes | Organization, WebSite, SearchAction |
| Listing/product page | Dynamic (from data) | Dynamic | Dynamic (from image) | Yes | Product, BreadcrumbList |
| Blog post | Dynamic | Dynamic | Dynamic (generated) | Yes | Article, BreadcrumbList |
| Category/search | Dynamic (with filters) | Dynamic | Optional | Yes (without query params) | BreadcrumbList, ItemList |
| Auth pages (login) | Static | Optional | No | noindex | None |
| Legal (privacy, terms) | Static | Yes | No | Yes | None |
| Dashboard/app pages | Static | Optional | No | noindex | None |

### "Should this page be indexed?"

```
Is the page valuable to search users?
├── YES (content, product, article)
│   ├── Is there a canonical version? → Set alternates.canonical
│   ├── Is it paginated? → Set rel prev/next or canonical to page 1
│   └── Index it (default — no robots directive needed)
└── NO (auth, dashboard, admin, API, staging)
    └── Set robots: { index: false, follow: false }
        └── Also consider: noindex via robots.ts rules
```

## SEO Anti-Myths (Google's Actual Guidance)

These are widely believed but **wrong** according to Google's official documentation:

| Myth | Reality | Source |
|------|---------|--------|
| "Add meta keywords" | Google has ignored `<meta name="keywords">` since 2009 | [Google Webmaster Blog](https://developers.google.com/search/blog/2009/09/google-does-not-use-keywords-meta-tag) |
| "E-E-A-T is a ranking factor" | E-E-A-T is a quality rater guideline, not an algorithm signal | [Google Quality Rater Guidelines](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) |
| "Content must be X words long" | No minimum or maximum. Write what's useful. | [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide) |
| "Heading order affects rankings" | Heading hierarchy helps accessibility, not rankings | Google Search Central (multiple confirmations) |
| "Duplicate content is a penalty" | No spam penalty. Google picks a canonical. Bad UX, not a ranking hit. | [Google Search Central](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls) |
| "Domain keywords boost ranking" | Minimal if any impact | Google (multiple confirmations) |
| "Subdomain vs subdirectory matters" | Google can handle either. Choose for architecture, not SEO. | [John Mueller, Google](https://www.youtube.com/watch?v=uJGDyAN9g-g) |
| "More backlinks = higher ranking" | Quality and relevance matter, not quantity | [Google Link Spam Update](https://developers.google.com/search/docs/essentials/spam-policies) |
| "FID is a Core Web Vital" | **INP replaced FID** in March 2024 | [web.dev](https://web.dev/articles/inp) |

## What Google Actually Cares About

1. **Unique, descriptive title tags** per page
2. **Concise meta descriptions** that summarize page content
3. **Canonical URLs** to consolidate duplicate content
4. **Structured data** (JSON-LD) for rich results eligibility
5. **Mobile-friendly design** (responsive, touch-friendly)
6. **Core Web Vitals** — LCP <= 2.5s, INP <= 200ms, CLS <= 0.1
7. **Descriptive alt text** for images
8. **Internal linking** with descriptive anchor text
9. **XML sitemaps** for crawl efficiency
10. **robots.txt** for crawl control
11. **HTTPS** (ranking signal since 2014)

## When Reviewing Code

- [ ] Every page has a unique `<title>` (via metadata export or generateMetadata)
- [ ] Every page has a meta description
- [ ] Root layout sets `metadataBase` for URL resolution
- [ ] Root layout uses title template: `{ template: '%s | Site Name', default: '...' }`
- [ ] `app/sitemap.ts` exists and covers all public routes
- [ ] `app/robots.ts` exists with rules for Googlebot and AI crawlers
- [ ] Product/article pages have JSON-LD structured data
- [ ] Dynamic pages use `generateMetadata` with data memoization (`cache()`)
- [ ] Images use `next/image` with proper `alt` text
- [ ] Fonts use `next/font` (prevents CLS)
- [ ] Auth/dashboard pages have `robots: { index: false }`
- [ ] Canonical URLs set for pages accessible at multiple URLs
- [ ] No `<meta name="keywords">` tag (Google ignores it)
- [ ] OG images exist for shareable pages (social + messaging previews)
