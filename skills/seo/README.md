# seo

Production-ready SEO and GEO (Generative Engine Optimization) for Next.js — the first skill that generates actual code, not just audits.

## Install

```bash
npx skills add LeahyCC/claude-skills@seo
```

## What It Does

When you edit layout or page files, this skill auto-activates and provides SEO implementation guidance with production Next.js code. It covers both traditional search engines (Google) and AI search engines (ChatGPT, Perplexity, Google AI Overviews).

**Auto-triggers on:**
- Layout/page files: `src/app/**/layout.tsx`, `src/app/**/page.tsx`
- SEO files: `sitemap.ts`, `robots.ts`, `opengraph-image.tsx`
- Build/analysis: `next build`, `lighthouse`

## What's Different

Every existing SEO skill tells you what's wrong. This one generates the code to fix it:

- **Implementation-first** — production `generateMetadata`, `sitemap.ts`, `robots.ts`, JSON-LD components
- **Anti-myth enforcement** — encodes Google's actual guidance, not SEO folklore
- **GEO-aware** — llms.txt generation, AI crawler management, citation-optimized content patterns
- **INP-aware** — references the correct Core Web Vital (INP replaced FID in March 2024)

## Coverage

| Resource | Topics |
|----------|--------|
| [metadata.md](./resources/metadata.md) | Static/dynamic metadata, title templates, metadataBase, canonical URLs, noindex |
| [crawlability.md](./resources/crawlability.md) | robots.ts with AI crawlers, dynamic sitemaps, multiple sitemaps, i18n, internal linking |
| [structured-data.md](./resources/structured-data.md) | JSON-LD components: Organization, Product, Article, BreadcrumbList, LocalBusiness, FAQ |
| [og-images.md](./resources/og-images.md) | Dynamic OG images via ImageResponse, custom fonts, per-route images |
| [geo.md](./resources/geo.md) | llms.txt, AI crawler management, content structure for citations, entity optimization |
| [performance.md](./resources/performance.md) | LCP/INP/CLS fixes for SEO ranking, web-vitals monitoring, Lighthouse |

## Verified Against

- [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Google Structured Data](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)
- [Next.js Metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Web Vitals Specification](https://web.dev/articles/vitals)
- [llmstxt.org](https://llmstxt.org/)

Last verified: March 2026

## License

[MIT](../../LICENSE)
