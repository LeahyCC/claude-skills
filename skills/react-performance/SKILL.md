---
name: react-performance
description: Use when optimizing React component rendering, fixing Core Web Vitals (LCP, INP, CLS), reducing bundle size, diagnosing re-renders, code splitting, memoization decisions, Server Component patterns, or profiling React apps. Covers React 19, React Compiler, useTransition, useDeferredValue, Suspense, and Next.js optimization.
---

# React Performance

Comprehensive React performance guidance covering measurement, rendering optimization, bundle size, Core Web Vitals, and Server Component patterns. Verified against React docs and Web Vitals specifications.

**First principle: Measure before you optimize.** This skill teaches you to find problems before fixing them.

## Architecture Overview

```
[Diagnose]
    ├── React DevTools Profiler (component render times)
    ├── Chrome Performance Panel (main thread activity)
    ├── web-vitals library (LCP, INP, CLS in production)
    └── Bundle analyzer (what's in the bundle)
              ↓
[Identify Root Cause]
    ├── Unnecessary re-renders? → Memoization / state colocation
    ├── Slow initial load? → Code splitting / Server Components
    ├── Janky interactions? → useTransition / useDeferredValue
    ├── Layout shifts? → Image/font optimization
    └── Large bundle? → Dynamic imports / tree shaking
              ↓
[Fix — Least Invasive First]
    ├── 1. Restructure components (children pattern, local state)
    ├── 2. Consider incremental Compiler adoption if supported and justified
    ├── 3. Use concurrent features (transitions, deferred values)
    ├── 4. Move work to Server Components
    ├── 5. Code split heavy dependencies
    └── 6. Manual memo/useMemo/useCallback (last resort)
```

Before prescribing an API, inspect the app's installed React/Next versions, bundler and Compiler configuration. Preserve the project's supported setup; an optimization task is not automatic authorization to enable a compiler or change frameworks. Source checks are scoped in [SOURCES.md](SOURCES.md).

## Quick Reference

| Need to...                              | See                                                          |
| --------------------------------------- | ------------------------------------------------------------ |
| Measure performance before optimizing   | [Profiling and Measurement](./resources/profiling.md)        |
| Fix unnecessary re-renders              | [Rendering Optimization](./resources/rendering.md)           |
| Reduce JavaScript bundle size           | [Bundle Optimization](./resources/bundle.md)                 |
| Fix LCP, INP, or CLS scores            | [Core Web Vitals](./resources/web-vitals.md)                 |
| Decide Server vs Client Components      | [Server Components](./resources/server-components.md)        |
| Handle large lists and data sets        | [Data and Lists](./resources/data-and-lists.md)              |
| Optimize images, fonts, and media       | [Assets](./resources/assets.md)                              |
| Decide when React Compiler handles it   | [React Compiler](./resources/react-compiler.md)              |

## Decision Matrix: Which Optimization?

### "My page loads slowly"

| Symptom | Likely Cause | Fix | Resource |
|---------|-------------|-----|----------|
| LCP > 2.5s, large image | Unoptimized hero image | Measure image discovery/size; choose version-supported loading hints | assets |
| LCP > 2.5s, text content | Render-blocking JS | Server Components, code split | server-components, bundle |
| LCP > 2.5s, font flash | Font loading delay | `next/font` | assets |
| TTFB > 800ms | Slow data fetching | Parallel fetches, streaming | server-components |
| Large client JS bundle | Too much client code | Measure with `next analyze`, then split or tree-shake | bundle |

### "My page feels janky/unresponsive"

| Symptom | Likely Cause | Fix | Resource |
|---------|-------------|-----|----------|
| INP > 200ms on typing | Heavy re-renders on input | `useTransition`, state colocation | rendering |
| INP > 200ms on click | Long task in the handler | `scheduler.yield()`, or a worker | web-vitals |
| INP > 200ms on navigation | Route transition re-renders | `useTransition` for navigation | rendering |
| Scrolling stutter | Large list rendering | Virtualization | data-and-lists |
| Input lag | Context re-rendering entire tree | Split context, selector pattern | rendering |

### "Layout is jumping around"

| Symptom | Likely Cause | Fix | Resource |
|---------|-------------|-----|----------|
| CLS > 0.1, images | Missing width/height | `next/image` or explicit dimensions | assets, web-vitals |
| CLS > 0.1, fonts | Font swap | `next/font` | assets |
| CLS > 0.1, dynamic content | Content inserted after load | Reserve space, Suspense fallback | web-vitals |
| CLS > 0.1, animations | Layout-triggering CSS | Use `transform` instead of `top/left` | web-vitals |

### "Should I use memo/useMemo/useCallback?"

Inspect whether the affected component is actually compiled. Prefer measuring and fixing state placement or repeated work first. Existing memo/useMemo/useCallback can remain; do not remove them in bulk when enabling Compiler. If the compiler covers new code, manual memoization is often unnecessary, but it can still be useful for a measured case or an external identity contract. A stable callback can matter to an Effect or subscription even when a child is not wrapped in memo.

## Choose a proportional fix

Keep code correct, identify the measured bottleneck, and choose the smallest effective change: component structure, memoization, deferred rendering, bundle splitting or server work where the framework supports it. Compiler adoption is a separate, incremental project choice with behavior/performance checks, not an official universal ordering of optimizations. Transitions schedule rendering; they do not split an expensive synchronous function into yielding work.

## Anti-Patterns Checklist

When reviewing code, watch for these performance killers:

- [ ] **Effect chains** — `useEffect` that sets state triggering another `useEffect` (derive during render instead)
- [ ] **Inline object/function props** to `memo()`-wrapped children (defeats memoization)
- [ ] **State too high** — input state at page level re-rendering entire tree
- [ ] **`useEffect` for derived state** — `setFiltered(items.filter(...))` in effect (use `useMemo` or calculate during render)
- [ ] **Missing `key` prop** — or using array index as key for dynamic lists
- [ ] **Context monolith** — one Provider with user + theme + cart + notifications
- [ ] **Client Component boundary too high** — `'use client'` at layout/page level instead of leaf components
- [ ] **Heavy imports in client bundle** — syntax highlighters, markdown parsers, date libraries not code-split
- [ ] **Images without dimensions** — causes CLS
- [ ] **`onPaste={e => e.preventDefault()}` on password fields** — blocks password managers (also an a11y violation)
- [ ] **Manual memo/useMemo/useCallback** without measuring first — adds complexity for no proven benefit
- [ ] **`new ExpensiveThing()` in `useRef` initializer** — runs every render (use lazy init pattern)
