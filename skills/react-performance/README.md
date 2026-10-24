# react-performance

Comprehensive React performance optimization for Claude Code — measurement-first methodology, Core Web Vitals, rendering optimization, React Compiler, Server Components, and bundle analysis.

## Install

```bash
npx skills add LeahyCC/claude-skills@react-performance
```

## What It Does

Claude uses the description to decide relevance. Editing a `.tsx` file, including one under `src/features/`, does not itself load this skill. Path and shell patterns used to sit under `metadata` and were removed: nothing reads them, and a list there breaks the skill format.

It follows a measure-first approach, diagnosing before fixing, and is aware of React Compiler (it will not suggest manual memoization when the compiler already handles it).

## What's Different

Most React performance skills say "use React.memo everywhere."

| Other React skills | This skill |
| --- | --- |
| Use React.memo everywhere | Measure first. Is it actually slow? |
| No React Compiler awareness | Skips manual memoization when the compiler already handles it |
| No profiling guidance | Starts with the DevTools Profiler |
| Generic JS micro-optimizations | React patterns tied to LCP, INP, and CLS |
| Next.js only | Core React patterns, plus Next.js where the framework changes the answer |
| Trick lists | Anti-patterns, and why they hurt |

## Coverage

| Resource | Topics |
|----------|--------|
| [profiling.md](./resources/profiling.md) | React DevTools Profiler, Chrome Performance, dev-build symbols, web-vitals, bundle analysis, CI testing |
| [rendering.md](./resources/rendering.md) | State colocation, children pattern, useTransition, useDeferredValue, memo, context, a per-asset update under a large tree |
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

Earlier targeted review: October 2026. [Scoped follow-up sources and checks](SOURCES.md) were checked on 2026-10-21; this is not blanket verification of all resources.

## License

[MIT](../../LICENSE)
