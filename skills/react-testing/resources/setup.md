# Setup

Vitest config, the setup file, choosing a DOM, custom renders with providers, hooks, and what jsdom does not have.

## Contents

- [Packages](#packages)
- [vitest.config.ts](#vitestconfigts)
- [The setup file and cleanup](#the-setup-file-and-cleanup)
- [jsdom, happy-dom, or a real browser](#jsdom-happy-dom-or-a-real-browser)
- [What jsdom does not have](#what-jsdom-does-not-have)
- [Custom render with providers](#custom-render-with-providers)
- [Testing a hook](#testing-a-hook)
- [StrictMode](#strictmode)

## Packages

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom @testing-library/user-event @testing-library/jest-dom
```

`@testing-library/dom` is a peer dependency of `@testing-library/react` 16 and of `@testing-library/jest-dom` 7. Install it yourself: without it, imports fail.

## vitest.config.ts

```ts
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    restoreMocks: true,
  },
})
```

- `restoreMocks: true` restores every `vi.spyOn` after each test, so a spy on `console.error` or `Date.now` in one test cannot leak into the next.
- Next.js projects add `vite-tsconfig-paths` to the plugins so `@/` imports resolve, as in the [Next.js Vitest guide](https://nextjs.org/docs/app/guides/testing/vitest).
- Per-file environments: a `// @vitest-environment node` comment at the top of a server-only test file skips the DOM cost.

## The setup file and cleanup

```ts
// vitest.setup.ts
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})
```

RTL unmounts rendered trees after each test only when a global `afterEach` exists. Vitest's `globals` option defaults to `false`, so with a default config **no cleanup runs**: every `render` adds to the same `document.body`, and the second test in a file finds two of everything (`Found multiple elements with the role "button"`). Either call `cleanup` as above or set `globals: true`. The explicit call works either way.

`@testing-library/jest-dom/vitest` adds the matchers to Vitest's `expect` and their types. Keep the setup file as `.ts` and inside `tsconfig.json` `include` so the editor sees the types.

## jsdom, happy-dom, or a real browser

| Option | Good for | Watch for |
| --- | --- | --- |
| `environment: 'jsdom'` | The default for RTL. Widest API coverage of the simulated DOMs. | No layout, no real CSS, missing browser APIs (next section). |
| `environment: 'happy-dom'` | Faster startup on large suites. | Less complete than jsdom. Run the suite on both before switching. |
| Vitest browser mode with `vitest-browser-react` | Layout, real CSS, focus, pointer events, canvas, `IntersectionObserver`. | Slower. `render` is `async` (`await render(...)`), assertions use `await expect.element(locator)`, and events come from `userEvent` in `vitest/browser`, which drives the real browser. Do not mix in `@testing-library/user-event` there: it simulates events. |

Most component suites stay on jsdom and move the few tests that need layout or real CSS to a browser-mode project (Vitest `projects`) or to Playwright.

## What jsdom does not have

Checked in jsdom 30 under Vitest 5:

```tsx test
import { expect, test } from 'vitest'

test('jsdom gaps', () => {
  expect(window.matchMedia).toBeUndefined()
  expect(globalThis.ResizeObserver).toBeUndefined()
  expect(globalThis.IntersectionObserver).toBeUndefined()
  expect(Element.prototype.scrollIntoView).toBeUndefined()
  expect(HTMLDialogElement.prototype.showModal).toBeUndefined()

  const box = document.createElement('div')
  box.style.width = '300px'
  document.body.append(box)
  expect(box.getBoundingClientRect().width).toBe(0)

  expect(window.location.href).toBe('http://localhost:3000/')
})
```

Components that call these crash with `TypeError: ... is not a function` before any assertion. Stub only what the component under test uses, in the setup file or the test:

```ts
// vitest.setup.ts: stub only what your components call
import { vi } from 'vitest'

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

Element.prototype.scrollIntoView = vi.fn()

globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}
```

Because sizes are always 0, anything that depends on measurement (virtualised lists, auto-sizing text, responsive breakpoints from `ResizeObserver`) renders differently from a browser. Test those in browser mode, or inject the size as a prop.

## Custom render with providers

When most components need the same providers (theme, router, query client, i18n), wrap `render` once and import it from your own test utils instead of `@testing-library/react`.

```tsx test
import { render, screen } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { createContext, use } from 'react'
import { expect, test } from 'vitest'

type Theme = 'light' | 'dark'
const ThemeContext = createContext<Theme>('light')

function ThemedBadge() {
  const theme = use(ThemeContext)
  return <span role="status">Theme: {theme}</span>
}

// test-utils.tsx: re-export everything, override render.
function renderWithProviders(ui: ReactElement, { theme = 'light' }: { theme?: Theme } = {}) {
  function Providers({ children }: { children: ReactNode }) {
    return <ThemeContext value={theme}>{children}</ThemeContext>
  }
  return render(ui, { wrapper: Providers })
}

test('reads the theme from the provider', () => {
  renderWithProviders(<ThemedBadge />, { theme: 'dark' })
  expect(screen.getByRole('status')).toHaveTextContent('Theme: dark')
})
```

- Take per-test values as options (`theme`, initial route, a pre-filled query cache) and build fresh instances inside the function. A provider value created at module scope is shared by every test in the file.
- `rerender(ui)` keeps the same wrapper.

## Testing a hook

Test a hook through a component that uses it when one exists: that is what users see. Use `renderHook` from `@testing-library/react` for hooks shared across many components or published as a library. Do not install `@testing-library/react-hooks`: its README says React 18 support went into RTL's own `renderHook` instead.

```tsx test
import { act, renderHook } from '@testing-library/react'
import { useState } from 'react'
import { expect, test } from 'vitest'

function useCounter(start = 0) {
  const [count, setCount] = useState(start)
  return { count, increment: () => setCount((c) => c + 1) }
}

test('increments from the start value', () => {
  const { result, rerender } = renderHook((start: number) => useCounter(start), {
    initialProps: 5,
  })

  act(() => {
    result.current.increment()
  })
  expect(result.current.count).toBe(6)

  rerender(10)
  expect(result.current.count).toBe(6)
})
```

- `result.current` is the latest committed value. Read it after `act`, never save it to a variable before the update.
- Call state setters returned by the hook inside `act`, because no Testing Library helper is doing it for you.
- `initialProps` is not passed to `wrapper`. To give the wrapper props, build it in a closure as in the custom render above.

## StrictMode

`render(ui, { reactStrictMode: true })`, or `configure({ reactStrictMode: true })` in the setup file, renders inside `<StrictMode>`. Effects then mount, unmount, and mount again, as in development. Turn it on if the app runs in StrictMode in development, so tests catch effects that break on a second run.
