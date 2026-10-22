# Performance for SEO

Core Web Vitals are used by Google's ranking systems. Scores are judged at the 75th percentile of real users. A good score does not guarantee a higher rank.

## Thresholds

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| **LCP** (Largest Contentful Paint) | <= 2.5s | 2.5s - 4.0s | > 4.0s |
| **INP** (Interaction to Next Paint) | <= 200ms | 200ms - 500ms | > 500ms |
| **CLS** (Cumulative Layout Shift) | <= 0.1 | 0.1 - 0.25 | > 0.25 |

> **Note:** INP replaced FID as a Core Web Vital in March 2024. Use INP for current Core Web Vitals assessment; historical FID measurements remain historical data.

## LCP Fixes (Most Common SEO Issue)

### Hero Images

Next.js 16 deprecates priority in favor of preload. Do not prescribe either for every hero: inspect the installed version and actual LCP/discovery timing. For an image already in markup, eager loading/high fetch priority may suffice; avoid preloading several viewport-specific candidates or combining preload with loading/fetchPriority.

```tsx
import Image from 'next/image'

export function Hero() {
  return <Image src="/hero.jpg" alt="Featured vehicle"
    width={1200} height={630}
    style={{ width: '100%', maxWidth: 800, height: 'auto' }}
    sizes="(max-width: 800px) 100vw, 800px"
    loading="eager" fetchPriority="high" />
}
```

### Server data and initial content

Server reads can avoid a browser-effect fetch waterfall for initial content. Client Components can also be prerendered to HTML: the client directive alone does not establish slow LCP. Distinguish data loaded only after hydration from data already in the initial response. Retain browser fetching for live/interactive needs. Measure the response, streaming and actual LCP element.

### Fonts

next/font can reduce font-related layout shifts; it does not eliminate all swap or guarantee improved LCP. Google fonts require build-time downloads; local fonts need supplied assets. Test font display and fallback metrics rather than assuming the helper proves a performance gain.

## CLS Fixes

### Images Without Dimensions

```tsx
// BAD — causes layout shift when image loads
<img src="/photo.jpg" alt="Photo" />

// GOOD — dimensions prevent shift
<Image src="/photo.jpg" alt="Photo" width={800} height={600} />

// GOOD — fill mode with aspect ratio
<div className="relative aspect-video">
  <Image src="/photo.jpg" alt="Photo" fill className="object-cover" />
</div>
```

### Dynamic Content

```tsx
// BAD — banner appears after load, pushes content
{loaded && <Banner />}

// GOOD — reserve space
<div className="min-h-16">
  <Suspense fallback={<div className="h-16" />}>
    <Banner />
  </Suspense>
</div>
```

### Animations

```css
/* BAD — layout properties cause shift */
.animate { top: 10px; left: 20px; }

/* GOOD — transform doesn't cause shift */
.animate { transform: translate(20px, 10px); }
```

## INP Fixes

### Heavy re-renders versus synchronous CPU work

startTransition runs its callback immediately. Calling an expensive filter inside that callback still blocks the current task; only React rendering/state priority changes. Keep the input urgent and defer the result rendering instead. This React 18+ example uses a memo boundary so unchanged deferred props can skip the slow subtree; Compiler may supply that optimization when enabled and covering the component.

```tsx
'use client'
import { memo, useDeferredValue, useState } from 'react'

type Item = { id: string; title: string }
const Results = memo(function Results({ items, query }: { items: Item[]; query: string }) {
  const matches = items.filter(item => item.title.toLowerCase().includes(query.toLowerCase()))
  return <ul>{matches.map(item => <li key={item.id}>{item.title}</li>)}</ul>
})

export function Search({ items }: { items: Item[] }) {
  const [query, setQuery] = useState('')
  const deferred = useDeferredValue(query)
  return <section>
    <label>Search <input value={query} onChange={event => setQuery(event.target.value)} /></label>
    <div style={{ opacity: query === deferred ? 1 : 0.7 }}>
      <Results items={items} query={deferred} />
    </div>
  </section>
}
```

This schedules rendering; it does not make an individual JavaScript filter interruptible. For an algorithm that still monopolizes the thread, reduce work, chunk it or use an appropriate worker. Debouncing network requests is a different concern.

### Code splitting

Load optional heavy UI only where needed. next/dynamic defaults to supported prerendering behavior; disabling SSR is not an SEO optimization by itself. Use ssr:false only for a justified browser-only dependency in a Client Component, not from a Server Component. Confirm the installed framework's API and loading/error behavior.

## Monitoring

### web-vitals Library

```tsx
'use client'
import { useReportWebVitals } from 'next/web-vitals'

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    // Send to analytics
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/vitals', JSON.stringify({
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
      }))
    }
  })
  return null
}
```

### Google Search Console

Check Core Web Vitals report:
1. Search Console → Experience → Core Web Vitals
2. Shows real user data (CrUX) grouped by URL pattern
3. Identifies specific pages failing each metric

### Lighthouse

```bash
npx lighthouse https://example.com --only-categories=performance,seo --output=html
```

Lighthouse SEO audit checks:
- Document has a `<title>`
- Document has a meta description
- Page has valid `hreflang`
- Page has successful HTTP status code
- Links have descriptive text
- Page isn't blocked from indexing
- Image elements have `alt` attributes
- Some SEO audit items require manual checks; Lighthouse does not certify structured-data correctness. Use Google Rich Results Test for eligible supported types, plus manual/content validation.

Sources for this follow-up: [Next Image](https://nextjs.org/docs/app/api-reference/components/image), [Next components](https://nextjs.org/docs/app/getting-started/server-and-client-components), [React transitions](https://react.dev/reference/react/useTransition), [deferred rendering](https://react.dev/reference/react/useDeferredValue), [Next lazy loading](https://nextjs.org/docs/app/guides/lazy-loading). Scope/dates: [SOURCES.md](../SOURCES.md).
