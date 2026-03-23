# GEO — Generative Engine Optimization

GEO is about making your content citable by AI search engines (ChatGPT, Perplexity, Google AI Overviews, Claude). It's distinct from traditional SEO — ranking on a search page vs. being cited in an AI response.

## How AI Search Engines Work

```
User query
    ↓
Query decomposition (AI breaks into sub-queries)
    ↓
Web search + retrieval (each sub-query searched separately)
    ↓
Source evaluation (relevance, authority, recency)
    ↓
Synthesis (combine sources into unified answer)
    ↓
Citation (link to sources used)
```

**Key differences from Google:**
- No "page 1" — either you're cited or you're not
- AI has strong **recency bias** (content > 3 months old sees citation drops)
- **Structure matters more** than keyword density
- **Third-party mentions** (being referenced on other cited sites) strongly influence selection

## llms.txt

A proposed standard for helping AI systems understand your site structure. Think of it as `robots.txt` but for content discovery.

```markdown
# Carzilly

> Buy and sell cars with confidence. Browse thousands of listings from dealers and private sellers.

## Main Pages

- [Home](https://carzilly.com/): Search and browse vehicle listings
- [Search](https://carzilly.com/search): Advanced vehicle search with filters
- [About](https://carzilly.com/about): About Carzilly and our mission

## Resources

- [FAQ](https://carzilly.com/faq): Frequently asked questions about buying and selling
- [Blog](https://carzilly.com/blog): Car buying guides and market insights

## Optional

- [Terms](https://carzilly.com/terms): Terms of service
- [Privacy](https://carzilly.com/privacy): Privacy policy
- [Contact](https://carzilly.com/contact): Contact information
```

### Serving llms.txt in Next.js

```tsx
// app/llms.txt/route.ts
export async function GET() {
  const content = `# Carzilly

> Buy and sell cars with confidence. Browse thousands of listings from dealers and private sellers.

## Main Pages

- [Home](https://carzilly.com/): Search and browse vehicle listings
- [Search](https://carzilly.com/search): Advanced vehicle search with filters
- [About](https://carzilly.com/about): About Carzilly and our mission

## Resources

- [FAQ](https://carzilly.com/faq): Frequently asked questions
- [Blog](https://carzilly.com/blog): Car buying guides and market insights
`

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}
```

### llms-full.txt

An expanded version with more detail for AI systems that want deeper context:

```tsx
// app/llms-full.txt/route.ts
export async function GET() {
  // Include full page content, API documentation, etc.
  const content = `# Carzilly — Full Reference

> Complete reference for AI systems...

## API

- [Search API](https://carzilly.com/api/docs): REST API for vehicle search
  - GET /api/listings?make=BMW&year=2024
  - Supports filtering by make, model, year, price, mileage, location

## Content Categories

### Buying Guides
- [How to Buy a Used Car](https://carzilly.com/blog/how-to-buy-used-car): Step-by-step guide...
`

  return new Response(content, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
```

## Content Structure for AI Citation

### What Gets Cited

AI engines prefer content that is:

```
1. DIRECTLY ANSWERING a question
   "The average price of a used BMW M4 in 2024 is $52,000"
   NOT: "Prices vary depending on many factors..."

2. STRUCTURED with clear hierarchy
   H1 → H2 → H3, one topic per section

3. USING LISTS for scannable information
   - Bullet points increase citation likelihood 30-40%
   - Numbered lists for sequential processes

4. ATTRIBUTED with sources
   "According to Kelley Blue Book, the 2024 M4 retains 85% of its value..."

5. RECENT (published within 3 months)
   Include visible publication dates and "last updated" timestamps

6. FIRST-HAND (original data, case studies)
   "We analyzed 10,000 listings and found..."
```

### Content Formatting Patterns

```tsx
// GOOD — direct answer first, then context
<h2>How much does a BMW M4 cost?</h2>
<p>
  A new 2024 BMW M4 starts at $76,000 MSRP. Used models
  range from $45,000 to $65,000 depending on mileage and condition.
</p>

// BAD — buries the answer
<h2>BMW M4 Pricing</h2>
<p>
  The BMW M4 is a popular sports car that has been in production
  since 2014. There are many factors that affect pricing including...
  [3 paragraphs later] ...prices range from $45,000 to $76,000.
</p>
```

## Robots.txt for GEO

Strategic AI crawler management:

```tsx
// app/robots.ts
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Allow all search engines
      { userAgent: '*', allow: '/' },

      // GEO strategy: Allow AI browsing/search, block training
      { userAgent: 'ChatGPT-User', allow: '/' },    // ChatGPT search (citations)
      { userAgent: 'PerplexityBot', allow: '/' },    // Perplexity (citations)
      { userAgent: 'GPTBot', disallow: '/' },         // OpenAI training (block)
      { userAgent: 'Google-Extended', disallow: '/' }, // Gemini training (block)
      { userAgent: 'CCBot', disallow: '/' },           // Common Crawl (block)
    ],
    sitemap: 'https://example.com/sitemap.xml',
  }
}
```

## Structured Data for GEO

AI engines heavily use structured data to understand content:

```tsx
// FAQ content is especially valuable for AI citation
const faqData = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(faq => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
}

// Entity data helps AI understand your brand
const orgData = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Carzilly',
  description: 'Online car marketplace for buying and selling vehicles',
  foundingDate: '2024',
  url: 'https://carzilly.com',
  // sameAs links help AI connect your entity across the web
  sameAs: [
    'https://twitter.com/carzilly',
    'https://www.linkedin.com/company/carzilly',
    'https://en.wikipedia.org/wiki/Carzilly',  // If applicable
  ],
}
```

## Monitoring AI Citations

Currently no standard analytics exist, but you can track:

1. **Referrer headers** from AI search engines
2. **Traffic from** `chat.openai.com`, `perplexity.ai`, `gemini.google.com`
3. **Brand mentions** via Google Alerts and social listening
4. **Manual testing** — search for your topics in ChatGPT, Perplexity, and Google AI Overview
