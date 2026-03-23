# Performance for SEO

Core Web Vitals are a Google ranking factor since June 2021. Pages must pass at the 75th percentile across real user data.

## Thresholds

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| **LCP** (Largest Contentful Paint) | <= 2.5s | 2.5s - 4.0s | > 4.0s |
| **INP** (Interaction to Next Paint) | <= 200ms | 200ms - 500ms | > 500ms |
| **CLS** (Cumulative Layout Shift) | <= 0.1 | 0.1 - 0.25 | > 0.25 |

> **Note:** INP replaced FID as a Core Web Vital in March 2024. Any reference to FID is outdated.

## LCP Fixes (Most Common SEO Issue)

### Hero Images

```tsx
import Image from 'next/image'

// LCP image MUST have priority prop (disables lazy loading, preloads)
<Image
  src="/hero.jpg"
  alt="Featured vehicle"
  width={1200}
  height={630}
  priority           // Critical for LCP
  placeholder="blur" // Prevents blank space during load
/>
```

### Server Components for Fast Content

```tsx
// Server Component — content is in initial HTML (fast LCP)
export default async function Page() {
  const data = await getContent()
  return <h1>{data.title}</h1>  // In first HTML response
}

// Client Component — content delayed by JS download + fetch (slow LCP)
'use client'
export default function Page() {
  const [data, setData] = useState(null)
  useEffect(() => { fetch('/api/content').then(...) }, [])
  return <h1>{data?.title}</h1>  // LCP waits for JS + fetch
}
```

### Font Optimization

```tsx
// next/font eliminates font-swap delay (improves LCP + CLS)
import { Geist } from 'next/font/google'
const geist = Geist({ subsets: ['latin'] })

export default function RootLayout({ children }) {
  return <html className={geist.className}><body>{children}</body></html>
}
```

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

### Heavy Re-renders

```tsx
import { useTransition } from 'react'

function Search() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(items)
  const [isPending, startTransition] = useTransition()

  function handleChange(e) {
    setQuery(e.target.value)        // Urgent — input updates immediately
    startTransition(() => {
      setResults(filterItems(e.target.value))  // Deferred — doesn't block input
    })
  }

  return (
    <>
      <input value={query} onChange={handleChange} />
      <ResultsList items={results} />
    </>
  )
}
```

### Code Splitting

```tsx
import dynamic from 'next/dynamic'

// Heavy chart library loaded only when needed
const Chart = dynamic(() => import('../components/Chart'), {
  loading: () => <ChartSkeleton />,
  ssr: false,
})
```

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
- Document has valid structured data
