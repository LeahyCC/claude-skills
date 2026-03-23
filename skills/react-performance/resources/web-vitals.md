# Core Web Vitals

## LCP — Largest Contentful Paint

**What:** Time until the largest visible content element renders. Indicates when main content has loaded.

**Target:** <= 2.5s (75th percentile)

**LCP elements:** `<img>`, `<video>` poster, CSS `background-image`, block elements with text.

### Common Causes and Fixes

**Cause: Unoptimized hero image**
```tsx
// BAD — raw <img> with no optimization
<img src="/hero.jpg" alt="Hero" />

// GOOD — next/image with priority for LCP element
import Image from 'next/image'
import heroImg from './hero.png'  // Static import = auto dimensions

<Image
  src={heroImg}
  alt="Hero banner"
  priority              // Preloads — disables lazy loading
  placeholder="blur"    // Blur-up while loading
/>
```

**Cause: Client-side data fetching delays content**
```tsx
// BAD — blank page until useEffect fetch completes
'use client'
function Page() {
  const [data, setData] = useState(null)
  useEffect(() => {
    fetch('/api/content').then(r => r.json()).then(setData)
  }, [])
  if (!data) return <Skeleton />
  return <h1>{data.title}</h1>  // LCP delayed by fetch
}

// GOOD — Server Component renders content in initial HTML
async function Page() {
  const data = await getContent()  // Runs on server
  return <h1>{data.title}</h1>     // In first HTML response
}
```

**Cause: Font loading delay**
```tsx
// BAD — external font causes FOIT (invisible text until font loads)
<link href="https://fonts.googleapis.com/css2?family=Inter" rel="stylesheet" />

// GOOD — next/font self-hosts with zero layout shift
import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html className={inter.className}><body>{children}</body></html>
}
```

**Cause: Render-blocking JavaScript**
```tsx
// BAD — huge client bundle blocks rendering
'use client'
import { marked } from 'marked'           // 15KB
import { highlight } from 'prismjs'        // 30KB
import { sanitize } from 'sanitize-html'   // 25KB
// 70KB+ of JS must download + parse before anything renders

// GOOD — move to Server Component (zero client JS)
import { marked } from 'marked'
import { highlight } from 'prismjs'
// These libraries never appear in client bundle
```

---

## INP — Interaction to Next Paint

**What:** Responsiveness of all click, tap, and keyboard interactions. Measures full lifecycle: input delay + processing + presentation delay.

**Target:** <= 200ms (75th percentile)

**Replaced FID** — INP measures ALL interactions (not just the first) and the complete lifecycle (not just input delay).

### Common Causes and Fixes

**Cause: Heavy re-renders on user input**
```tsx
// BAD — every keystroke re-renders 1000-item list
function Page() {
  const [query, setQuery] = useState('')
  const filtered = items.filter(i => i.name.includes(query))
  return (
    <>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      <HeavyList items={filtered} />  {/* Blocks interaction */}
    </>
  )
}

// GOOD — useTransition keeps input responsive
function Page() {
  const [query, setQuery] = useState('')
  const [filtered, setFiltered] = useState(items)
  const [isPending, startTransition] = useTransition()

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value)        // Urgent: update input now
    startTransition(() => {
      setFiltered(items.filter(i => i.name.includes(e.target.value)))
    })                              // Non-urgent: can be interrupted
  }

  return (
    <>
      <input value={query} onChange={handleChange} />
      <div style={{ opacity: isPending ? 0.7 : 1 }}>
        <HeavyList items={filtered} />
      </div>
    </>
  )
}
```

**Cause: Expensive event handler blocking the main thread**
```tsx
// BAD — synchronous heavy work blocks painting
function handleClick() {
  processLargeDataset(data)  // 500ms of computation
  sendAnalytics()            // Network request
  updateUI()                 // State update — user sees nothing for 500ms
}

// GOOD — critical work first, defer the rest
function handleClick() {
  updateUI()  // State update — user sees result immediately

  startTransition(() => {
    processLargeDataset(data)  // Deferred — won't block paint
  })

  requestIdleCallback(() => {
    sendAnalytics()  // Runs when browser is idle
  })
}
```

**Cause: Context provider causing cascading re-renders**
```tsx
// BAD — any context change re-renders everything
<AppContext.Provider value={{ user, theme, cart, prefs }}>
  <App />  {/* Everything re-renders when cart updates */}
</AppContext.Provider>

// GOOD — split by update frequency
<UserContext.Provider value={user}>
  <ThemeContext.Provider value={theme}>
    <CartContext.Provider value={cart}>
      <App />  {/* Only cart consumers re-render on cart change */}
    </CartContext.Provider>
  </ThemeContext.Provider>
</UserContext.Provider>
```

---

## CLS — Cumulative Layout Shift

**What:** Largest burst of unexpected layout shifts. A shift happens when a visible element changes position between frames.

**Target:** <= 0.1 (75th percentile)

**Score:** `impact fraction × distance fraction` — how much of the viewport was affected and how far elements moved.

### Common Causes and Fixes

**Cause: Images without dimensions**
```tsx
// BAD — image loads, pushes content down
<img src="/photo.jpg" alt="Photo" />

// GOOD — next/image with dimensions (prevents shift)
import Image from 'next/image'
<Image src="/photo.jpg" alt="Photo" width={800} height={600} />

// GOOD — fill mode with aspect ratio container
<div className="relative w-full" style={{ aspectRatio: '16/9' }}>
  <Image src="/photo.jpg" alt="Photo" fill className="object-cover" />
</div>
```

**Cause: Dynamic content insertion**
```tsx
// BAD — banner appears after load, pushes everything down
function Page() {
  const [banner, setBanner] = useState<string | null>(null)
  useEffect(() => {
    fetchBanner().then(setBanner)
  }, [])

  return (
    <>
      {banner && <Banner text={banner} />}  {/* Shifts content on appear */}
      <MainContent />
    </>
  )
}

// GOOD — reserve space for dynamic content
function Page() {
  return (
    <>
      <div className="min-h-16">  {/* Reserved space */}
        <Suspense fallback={<BannerSkeleton />}>
          <Banner />
        </Suspense>
      </div>
      <MainContent />
    </>
  )
}
```

**Cause: Layout-triggering animations**
```css
/* BAD — animating top/left causes layout shifts */
.slide-in {
  animation: slide 0.3s ease;
}
@keyframes slide {
  from { top: -100px; }
  to { top: 0; }
}

/* GOOD — transform doesn't trigger layout */
.slide-in {
  animation: slide 0.3s ease;
}
@keyframes slide {
  from { transform: translateY(-100px); }
  to { transform: translateY(0); }
}
```

**Cause: Web fonts causing text reflow**
```tsx
// BAD — system font renders, then swaps to web font (different metrics)
@import url('https://fonts.googleapis.com/css2?family=Inter');

// GOOD — next/font applies size-adjust for zero-shift swap
import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'] })
```

---

## Measuring in Production

```tsx
import { onLCP, onINP, onCLS } from 'web-vitals'

function sendToAnalytics(metric: Metric) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    navigationType: metric.navigationType,
    url: window.location.href,
  })

  navigator.sendBeacon?.('/api/vitals', body)
}

onLCP(sendToAnalytics)
onINP(sendToAnalytics)
onCLS(sendToAnalytics)
```
