# Bundle Optimization

## Diagnosis First

Before optimizing, understand what's in your bundle:

```bash
# Next.js Turbopack (v16.1+)
npx next experimental-analyze

# Next.js Webpack
ANALYZE=true npm run build

# Any React app
npx source-map-explorer 'build/static/js/*.js'
```

### Red Flags

| Finding | Impact | Fix |
|---------|--------|-----|
| Library > 50KB gzipped in client bundle | Slow initial load | Dynamic import or Server Component |
| Full icon library imported | 200KB+ wasted | Direct imports or optimizePackageImports |
| moment.js / lodash (full) | 70-230KB | date-fns / lodash-es with tree shaking |
| Same module in multiple chunks | Duplicate download | Check import paths, use shared chunk |
| Server-only code in client bundle | Security + size | Move to Server Component |

## Code Splitting with Dynamic Imports

### next/dynamic (Next.js)

```tsx
import dynamic from 'next/dynamic'

// Heavy chart library — only loaded when component is needed
const Chart = dynamic(() => import('../components/Chart'), {
  loading: () => <ChartSkeleton />,
  ssr: false,  // Skip SSR if component uses browser APIs (canvas, window)
})

// Named export
const Modal = dynamic(
  () => import('../components/Dialogs').then(mod => mod.ConfirmModal)
)

// Conditional loading — never loads if condition is false
function Dashboard({ showAnalytics }: { showAnalytics: boolean }) {
  const Analytics = dynamic(() => import('../components/Analytics'))

  return showAnalytics ? <Analytics /> : null
}
```

### React.lazy (Any React app)

```tsx
import { lazy, Suspense } from 'react'

// MUST be at module top level — never inside a component
const HeavyEditor = lazy(() => import('./HeavyEditor'))

function Page() {
  return (
    <Suspense fallback={<EditorSkeleton />}>
      <HeavyEditor />
    </Suspense>
  )
}

// WRONG — causes state reset on every render
function Page() {
  const Editor = lazy(() => import('./HeavyEditor'))  // DON'T
  return <Editor />
}
```

### Lazy-Load Libraries on Demand

```tsx
'use client'

export default function Search({ items }: { items: Item[] }) {
  const [results, setResults] = useState(items)

  async function handleSearch(query: string) {
    // fuse.js only loaded when user actually searches
    const Fuse = (await import('fuse.js')).default
    const fuse = new Fuse(items, { keys: ['name', 'description'] })
    setResults(fuse.search(query).map(r => r.item))
  }

  return (
    <>
      <input onChange={e => handleSearch(e.target.value)} />
      <ResultsList items={results} />
    </>
  )
}
```

### Preload on Intent

```tsx
'use client'

// Start loading when user hovers (before they click)
function EditButton({ listingId }: { listingId: string }) {
  function handleMouseEnter() {
    // Preload the editor chunk
    import('../components/ListingEditor')
  }

  return (
    <button
      onMouseEnter={handleMouseEnter}
      onClick={() => setEditing(true)}
    >
      Edit
    </button>
  )
}
```

## Tree Shaking

### Barrel Import Problem

```tsx
// BAD — imports the entire library (lucide-react has 1000+ icons)
import { Search, Home, User } from 'lucide-react'

// GOOD — direct imports (each icon is a separate module)
import Search from 'lucide-react/dist/esm/icons/search'
import Home from 'lucide-react/dist/esm/icons/home'
import User from 'lucide-react/dist/esm/icons/user'

// BEST — use Next.js optimizePackageImports (handles it automatically)
// next.config.ts
export default {
  experimental: {
    optimizePackageImports: ['lucide-react', '@heroicons/react', 'date-fns'],
  },
}
// Then barrel imports work fine:
import { Search, Home, User } from 'lucide-react'  // Auto-optimized
```

### Side Effect-Free Imports

```tsx
// Ensure package.json marks side-effect-free modules
// package.json
{
  "sideEffects": false  // Allows bundler to tree-shake unused exports
}

// Or be specific
{
  "sideEffects": ["*.css", "*.global.js"]  // Only these have side effects
}
```

## Server Components for Zero-JS

```tsx
// BEFORE: Heavy library in client bundle (50KB+ gzipped)
'use client'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

function Description({ markdown }: { markdown: string }) {
  const html = DOMPurify.sanitize(marked(markdown))
  return <div dangerouslySetInnerHTML={{ __html: html }} />
}

// AFTER: Library stays on server, client gets only HTML
// No 'use client' — this is a Server Component
import { marked } from 'marked'

function Description({ markdown }: { markdown: string }) {
  const html = marked(markdown)
  return <div dangerouslySetInnerHTML={{ __html: html }} />
}
// marked never appears in the client bundle
```

### Common Libraries to Move to Server Components

| Library | Size (gzipped) | Server Component? |
|---------|---------------|-------------------|
| marked / remark | ~15KB | Yes — rendering only |
| prism / shiki | ~30KB+ | Yes — syntax highlighting |
| date-fns (full) | ~20KB | Depends — format on server, use client for relative time |
| lodash | ~70KB | Yes if used for data transforms |
| zod | ~13KB | Server-side validation; client needs it for forms |
| sanitize-html | ~25KB | Yes — sanitization before render |

## Measuring Bundle Impact

```tsx
// Check what a specific import adds to the bundle
// https://bundlephobia.com/package/[package-name]

// Or locally:
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer'
// Look at the "parsed" size, not "stat" size — parsed = what the browser actually downloads
```

## Third-Party Script Loading

```tsx
import Script from 'next/script'

// Load analytics after page is interactive (doesn't block INP)
<Script
  src="https://www.googletagmanager.com/gtag/js"
  strategy="afterInteractive"  // Default — loads after hydration
/>

// Load non-critical scripts when browser is idle
<Script
  src="https://connect.facebook.net/en_US/sdk.js"
  strategy="lazyOnload"  // Loads during idle time
/>

// Worker strategy — runs in web worker (experimental)
<Script
  src="/heavy-analytics.js"
  strategy="worker"
/>
```
