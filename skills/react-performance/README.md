# react-performance

Comprehensive React performance optimization for Claude Code — measurement-first methodology, Core Web Vitals, rendering optimization, React Compiler, Server Components, and bundle analysis.

## Install

```bash
npx skills add LeahyCC/claude-skills@react-performance
```

## What It Does

When you edit React component files (`.tsx`, `.jsx`), this skill auto-activates and provides performance guidance. It follows a **measure-first approach** — diagnosing before fixing — and is aware of React Compiler (won't suggest manual memoization if the compiler handles it).

**Auto-triggers on:**
- Component files: `src/components/**/*.tsx`, `src/app/**/*.tsx`, `app/**/*.tsx`
- Build/analysis: `next build`, `lighthouse`, `next experimental-analyze`

## What's Different

Most React performance skills are lists of "use React.memo everywhere." This skill:

- **Starts with measurement** — teaches profiling before any optimization
- **React Compiler-aware** — knows when manual memoization is unnecessary
- **Covers Web Vitals** — LCP, INP, CLS with React-specific causes and fixes
- **Includes what NOT to do** — anti-patterns with explanations of why they hurt
- **Framework-aware** — Next.js App Router patterns alongside vanilla React

## Coverage

| Resource | Topics |
|----------|--------|
| [profiling.md](./resources/profiling.md) | React DevTools Profiler, Chrome Performance, web-vitals, bundle analysis, CI testing |
| [rendering.md](./resources/rendering.md) | State colocation, children pattern, useTransition, useDeferredValue, memo, context |
| [bundle.md](./resources/bundle.md) | Code splitting, tree shaking, dynamic imports, Server Components for zero-JS |
| [web-vitals.md](./resources/web-vitals.md) | LCP, INP, CLS — causes, thresholds, React-specific fixes |
| [server-components.md](./resources/server-components.md) | Server vs Client decision, composition, streaming, parallel fetching |
| [data-and-lists.md](./resources/data-and-lists.md) | Virtualization, pagination, infinite scroll, Web Workers |
| [assets.md](./resources/assets.md) | next/image, next/font, Script loading, video, preloading |
| [react-compiler.md](./resources/react-compiler.md) | Setup, what it replaces, Rules of React, migration strategy |

## Verified Against

- [React documentation](https://react.dev) (React 19+)
- [Web Vitals specification](https://web.dev/articles/vitals)
- [Next.js optimization docs](https://nextjs.org/docs/app/building-your-application/optimizing)

Last verified: March 2026

## License

[MIT](../../LICENSE)
