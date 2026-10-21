# React Compiler

React Compiler (formerly "React Forget") is a build-time tool that automatically memoizes components, hooks, JSX elements, and expensive calculations. It eliminates the need for most manual `memo`, `useMemo`, and `useCallback`.

## Status

- **Production-ready** — deployed at Meta across Facebook, Instagram, Threads, and Quest Store (100,000+ components)
- **Available for React 17-18** via `react-compiler-runtime` polyfill
- **Native support in React 19**
- **Next.js 16** runs `babel-plugin-react-compiler`. An SWC pass limits that plugin to files with JSX or Hooks. Set top-level `reactCompiler` (moved out of `experimental` in 16.0.0).
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
npm install -D babel-plugin-react-compiler
```

```ts
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactCompiler: true,
}

export default nextConfig
```

Annotation mode opts in per component with `'use memo'`:

```ts
const nextConfig: NextConfig = {
  reactCompiler: {
    compilationMode: 'annotation',
  },
}
```

## Setup: Vite

`@vitejs/plugin-react` 6 and later dropped the inline `babel` option. Use `reactCompilerPreset()` with `@rolldown/plugin-babel`.

```bash
npm install -D babel-plugin-react-compiler @rolldown/plugin-babel
```

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

export default defineConfig({
  plugins: [
    react(),
    babel({
      presets: [reactCompilerPreset()],
    }),
  ],
})
```

Older `@vitejs/plugin-react` (before 6) can still pass the plugin inline:

```ts
react({
  babel: {
    plugins: ['babel-plugin-react-compiler'],
  },
})
```

## ESLint

Compiler rules ship in `eslint-plugin-react-hooks`, in the `recommended-latest` preset. React's install page says to use that preset. The plugin README calls it bleeding edge.

```bash
npm install -D eslint-plugin-react-hooks@latest
```

```js
// eslint.config.js
import reactHooks from 'eslint-plugin-react-hooks'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  reactHooks.configs.flat['recommended-latest'],
])
```

The preset includes `react-hooks/purity`, `immutability`, `refs`, `use-memo`, `preserve-manual-memoization`, and the other compiler rules. `unsupported-syntax` and `incompatible-library` are warnings. A reported component is skipped. The rest of the file still compiles.

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
function LegacyComponent() {
  'use no memo'  // Skip compiler memoization for this component
  // Fix the Rules of React violation when you can
}
```

## Migration Strategy

1. **Turn on `recommended-latest`** — it flags components the compiler will skip. Fix them as you go.
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
