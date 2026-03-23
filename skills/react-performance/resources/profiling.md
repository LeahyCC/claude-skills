# Profiling and Measurement

**Rule: Never optimize without measuring first.** Premature optimization adds complexity for no proven benefit. The React team recommends measuring in production builds with CPU throttling to simulate real user devices.

## React DevTools Profiler

### Setup

1. Install [React Developer Tools](https://react.dev/learn/react-developer-tools) browser extension
2. Open DevTools → Profiler tab
3. Click Record → interact with your app → Stop

### Reading the Flamegraph

```
Each bar = one component render
Width = render duration (wider = slower)
Color:
  - Gray = did not render (skipped via memo)
  - Blue/teal = rendered (fast)
  - Yellow/orange = rendered (slow — investigate)
```

### Key Metrics

- **actualDuration** — time spent rendering this component tree (reflects memoization savings)
- **baseDuration** — estimated time without any memoization (worst case)
- **If actualDuration ≈ baseDuration** → memoization is not helping, remove it
- **If actualDuration << baseDuration** → memoization is effective, keep it

### Programmatic Profiling

```tsx
import { Profiler } from 'react'

function onRender(
  id: string,
  phase: 'mount' | 'update' | 'nested-update',
  actualDuration: number,
  baseDuration: number,
  startTime: number,
  commitTime: number
) {
  // Send to analytics in production
  if (actualDuration > 16) {
    // Took longer than one frame (16ms at 60fps)
    console.warn(`Slow render: ${id} took ${actualDuration.toFixed(1)}ms`)
  }
}

// Wrap the component tree you want to measure
<Profiler id="SearchResults" onRender={onRender}>
  <SearchResults query={query} />
</Profiler>
```

## Chrome Performance Panel

### Recording

1. DevTools → Performance → Record
2. Interact with the app (the specific action that feels slow)
3. Stop recording

### What to Look For

```
Main thread timeline:
├── Long yellow blocks = JavaScript execution (potential janks)
├── Purple blocks = Layout/rendering (potential CLS causes)
├── Green blocks = Paint (usually fine)
└── Gray blocks = Idle (good)

Long Task = anything > 50ms blocking the main thread
```

### CPU Throttling

**Critical**: Always profile with CPU throttling enabled. Developer machines are 4-10x faster than user devices.

1. Performance → Settings gear → CPU: **4x slowdown** (or 6x for mobile simulation)
2. Now profile — this reflects real user experience

## console.time for Specific Calculations

```tsx
// Measure if a calculation warrants useMemo
console.time('filter todos')
const filtered = todos.filter(t => t.completed)
console.timeEnd('filter todos')
// If < 1ms → don't bother with useMemo
// If >= 1ms → consider useMemo
// Always measure in production builds, not development
```

## web-vitals Library (Production Monitoring)

```bash
npm install web-vitals
```

```tsx
// app/layout.tsx — Client Component for reporting
'use client'

import { useReportWebVitals } from 'next/web-vitals'

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    // Send to your analytics endpoint
    const body = JSON.stringify({
      name: metric.name,    // LCP, INP, CLS, FCP, TTFB
      value: metric.value,
      rating: metric.rating, // 'good', 'needs-improvement', 'poor'
      delta: metric.delta,
      id: metric.id,
    })

    // Use sendBeacon for reliability (survives page unload)
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/vitals', body)
    }
  })

  return null
}
```

### Thresholds (75th percentile)

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP | <= 2.5s | 2.5s - 4.0s | > 4.0s |
| INP | <= 200ms | 200ms - 500ms | > 500ms |
| CLS | <= 0.1 | 0.1 - 0.25 | > 0.25 |
| FCP | <= 1.8s | 1.8s - 3.0s | > 3.0s |
| TTFB | <= 800ms | 800ms - 1.8s | > 1.8s |

## Bundle Analysis

### Next.js (Turbopack — v16.1+)

```bash
npx next experimental-analyze          # Interactive UI
npx next experimental-analyze --output # Save to .next/diagnostics/analyze
```

### Next.js (Webpack)

```bash
npm install @next/bundle-analyzer
```

```js
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})
module.exports = withBundleAnalyzer({})
```

```bash
ANALYZE=true npm run build  # Opens treemap visualization
```

### What to Look For

```
Red flags in bundle analysis:
├── Large libraries in client bundle (> 50KB gzipped)
│   ├── moment.js → use date-fns or Temporal
│   ├── lodash (full) → use lodash-es with tree shaking
│   └── chart.js → dynamic import
├── Duplicated modules (same lib in multiple chunks)
├── Server-only code leaked to client bundle
└── Entire icon library imported (lucide-react, heroicons)
```

## Performance Testing in CI

```tsx
// playwright performance test
import { test, expect } from '@playwright/test'

test('search results render under 100ms', async ({ page }) => {
  await page.goto('/search?q=test')

  const renderTime = await page.evaluate(() => {
    return new Promise<number>((resolve) => {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lcp = entries[entries.length - 1]
        resolve(lcp.startTime)
      })
      observer.observe({ type: 'largest-contentful-paint', buffered: true })
    })
  })

  expect(renderTime).toBeLessThan(2500) // LCP under 2.5s
})
```

## Measurement Workflow

```
1. Identify the symptom (slow load, janky interaction, layout jump)
2. Open DevTools → Performance → Record with 4x CPU throttle
3. Reproduce the symptom
4. Stop recording → look for:
   - Long tasks (> 50ms yellow blocks)
   - Layout shifts (purple blocks)
   - React component renders (Profiler tab)
5. Identify the slowest component or longest task
6. Apply the targeted fix (see decision matrix in SKILL.md)
7. Re-measure to confirm improvement
8. Set up production monitoring with web-vitals
```
