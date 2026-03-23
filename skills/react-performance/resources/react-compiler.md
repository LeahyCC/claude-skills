# React Compiler

React Compiler (formerly "React Forget") is a build-time tool that automatically memoizes components, hooks, JSX elements, and expensive calculations. It eliminates the need for most manual `memo`, `useMemo`, and `useCallback`.

## Status

- **Production-ready** — deployed at Meta across Facebook, Instagram, Threads, and Quest Store (100,000+ components)
- **Available for React 17-18** via `react-compiler-runtime` polyfill
- **Native support in React 19**
- **Next.js support** via SWC plugin (v15.3.1+)
- **Babel plugin** for non-Next.js projects

## What It Replaces

| Manual API | Compiler Equivalent | Keep Manual? |
|-----------|-------------------|--------------|
| `React.memo(Component)` | Auto-memoizes component output | No — remove for cleaner code |
| `useMemo(() => value, [deps])` | Auto-memoizes values | Only for precise Effect dependency control |
| `useCallback(fn, [deps])` | Auto-memoizes functions | Only for very specific escape hatches |
| Inline `() => {}` props | Auto-stabilized | No — write naturally |
| Inline `{{ style }}` props | Auto-stabilized | No — write naturally |

## What It Does NOT Handle

- **Standalone utility functions** outside component/hook context
- **External state stores** (Zustand, Redux) — use selector patterns
- **DOM manipulation** — still need refs
- **Data fetching logic** — still need proper patterns
- **Code splitting** — still need dynamic imports

## Setup: Next.js

```bash
npm install babel-plugin-react-compiler
```

```ts
// next.config.ts
export default {
  experimental: {
    reactCompiler: true,
  },
}
```

## Setup: Vite / Other Bundlers

```bash
npm install babel-plugin-react-compiler @babel/plugin-transform-react-jsx
```

```ts
// vite.config.ts
import react from '@vitejs/plugin-react'

export default {
  plugins: [
    react({
      babel: {
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
  ],
}
```

## ESLint Plugin (Use Immediately)

Even before enabling the compiler, the ESLint plugin validates your code follows the Rules of React (required for the compiler to work):

```bash
npm install eslint-plugin-react-compiler
```

```js
// eslint.config.js
import reactCompiler from 'eslint-plugin-react-compiler'

export default [
  {
    plugins: { 'react-compiler': reactCompiler },
    rules: {
      'react-compiler/react-compiler': 'error',
    },
  },
]
```

## Rules of React (Required for Compiler)

The compiler requires code to follow these rules:

1. **Components and hooks must be pure** — same inputs = same output, no side effects during render
2. **Props and state are immutable** — never mutate, always create new references
3. **Hook return values and arguments are immutable** — don't mutate values from hooks
4. **Values are immutable after being passed to JSX** — don't mutate after rendering
5. **Follow the Rules of Hooks** — only call hooks at the top level, never conditionally

```tsx
// BAD — compiler can't optimize (mutation during render)
function Component({ items }) {
  items.sort()  // Mutates props!
  return <List items={items} />
}

// GOOD — compiler optimizes automatically
function Component({ items }) {
  const sorted = [...items].sort()  // New array, no mutation
  return <List items={sorted} />
}
```

## Opting Out (Per-Component)

```tsx
// Disable compiler for a specific component
// eslint-disable-next-line react-compiler/react-compiler
function LegacyComponent() {
  // Component that breaks Rules of React
  // Fix the violations instead when possible
}

// Or use the directive
function LegacyComponent() {
  'use no memo'  // Opt out of compiler memoization
  // ...
}
```

## Migration Strategy

1. **Start with ESLint plugin** — fix all violations (these are bugs regardless of compiler)
2. **Enable compiler on a single route/page** to verify behavior
3. **Roll out incrementally** — the compiler is designed for gradual adoption
4. **Existing memo/useMemo/useCallback can stay** — removing them may subtly change behavior, so do it gradually
5. **For new code, write naturally** — no manual memoization needed

## Impact

At Meta:
- Only 8% of PRs used manual memoization
- Those PRs took **31-46% longer** to author
- The compiler caught subtle bugs that manual memoization missed (e.g., inline arrow functions in event handlers)

**Bottom line:** If you can enable React Compiler, do so. It handles memoization more precisely and consistently than humans. Manual memo/useMemo/useCallback should become escape hatches, not default patterns.
