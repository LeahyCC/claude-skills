---
name: react-performance
description: Use when optimizing React component rendering, fixing Core Web Vitals (LCP, INP, CLS), reducing bundle size, diagnosing re-renders, code splitting, memoization decisions, Server Component patterns, or profiling React apps. Covers React 19, React Compiler, useTransition, useDeferredValue, Suspense, and Next.js optimization.
metadata:
  filePattern:
    - "src/components/**/*.tsx"
    - "src/components/**/*.jsx"
    - "src/app/**/*.tsx"
    - "app/**/*.tsx"
    - "components/**/*.tsx"
    - "pages/**/*.tsx"
  bashPattern:
    - "lighthouse"
    - "next build"
    - "next experimental-analyze"
    - "ANALYZE=true"
    - "web-vitals"
  priority: 50
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
    ├── 2. Enable React Compiler (auto-memoization)
    ├── 3. Use concurrent features (transitions, deferred values)
    ├── 4. Move work to Server Components
    ├── 5. Code split heavy dependencies
    └── 6. Manual memo/useMemo/useCallback (last resort)
```

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
| LCP > 2.5s, large image | Unoptimized hero image | `next/image` with `priority` | assets |
| LCP > 2.5s, text content | Render-blocking JS | Server Components, code split | server-components, bundle |
| LCP > 2.5s, font flash | Font loading delay | `next/font` | assets |
| TTFB > 800ms | Slow data fetching | Parallel fetches, streaming | server-components |
| Large JS bundle (> 200KB) | Too much client code | Dynamic imports, tree shaking | bundle |

### "My page feels janky/unresponsive"

| Symptom | Likely Cause | Fix | Resource |
|---------|-------------|-----|----------|
| INP > 200ms on typing | Heavy re-renders on input | `useTransition`, state colocation | rendering |
| INP > 200ms on click | Expensive event handler | `startTransition`, `requestIdleCallback` | rendering |
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

```
Is React Compiler enabled?
├── YES → Don't add manual memoization. Compiler handles it.
└── NO
    ├── Have you measured with Profiler?
    │   ├── NO → Measure first. The problem might not be re-renders.
    │   └── YES, renders are slow (> 1ms per component)
    │       ├── Can you restructure? (children pattern, local state)
    │       │   ├── YES → Do that instead. No memo needed.
    │       │   └── NO → Use memo/useMemo/useCallback.
    │       └── Is the child already wrapped in memo()?
    │           ├── NO → Wrapping parent's callback in useCallback alone does nothing.
    │           └── YES → useCallback/useMemo will help.
    └── Can you enable React Compiler?
        ├── YES → Enable it. Remove manual memoization later.
        └── NO → Use memo/useMemo/useCallback where Profiler shows benefit.
```

## The Optimization Hierarchy

The React team's official priority order:

1. **Write correct code first** — fix bugs, don't mask them with memoization
2. **Structure components well** — local state, children pattern, avoid unnecessary Effects
3. **Measure before optimizing** — use Profiler, console.time, CPU throttling in production builds
4. **Adopt React Compiler** — handles memo/useMemo/useCallback automatically
5. **Use concurrent features** (useTransition, useDeferredValue, Suspense) for responsiveness
6. **Use Server Components** to eliminate client bundle weight and fetch waterfalls
7. **Manual memo/useMemo/useCallback** only as escape hatches when the compiler is insufficient

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
