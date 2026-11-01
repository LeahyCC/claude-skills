# Network and mocks

Where to cut a component off from the outside world, and how. Mock at the boundary (network, clock, browser APIs, framework hooks), never the code you are testing.

## Contents

- [What to mock](#what-to-mock)
- [MSW 3 for the network](#msw-3-for-the-network)
- [Per-test responses and error paths](#per-test-responses-and-error-paths)
- [Module mocks with vi.mock](#module-mocks-with-vimock)
- [Framework hooks: next/navigation](#framework-hooks-nextnavigation)
- [Spies and restoring](#spies-and-restoring)

## What to mock

| Boundary | Mock with | Why |
| --- | --- | --- |
| HTTP (`fetch`, axios, GraphQL clients) | MSW request handlers | The component's real fetch code, parsing, and error handling run. Only the server is fake. |
| Clock (`setTimeout`, `Date`) | `vi.useFakeTimers` | See [async.md](./async.md#fake-timers-in-vitest). |
| Browser APIs jsdom lacks | Stubs in the setup file | See [setup.md](./setup.md#what-jsdom-does-not-have). |
| Framework runtime (`next/navigation`, `next/headers`) | `vi.mock` of that module | No Next.js router or request exists in a unit test. |
| Your own components, hooks, and helpers | **Nothing** | Mocking them tests the mock. A test that mocks `useCart` and asserts the cart renders proves only that the mock returned what you told it to. |

Mocking `fetch` itself (`vi.spyOn(globalThis, 'fetch')`) skips URL building, headers, `response.ok` checks, and `.json()` parsing, which is where the bugs are. Use it only for a one-off where MSW is not set up.

The broader trap, a test that mocks the unit under test and goes green while the bug stays, is in [gotchas/false-green-tests.md](../../gotchas/resources/false-green-tests.md).

## MSW 3 for the network

MSW 3 is ESM-only and needs Node 22 or later. `setupServer` from `msw/node` intercepts requests in Vitest's Node process, including `fetch` called from a jsdom test.

```ts
// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('https://api.example.test/user', () => HttpResponse.json({ name: 'Ada' })),
]
```

```ts
// vitest.setup.ts
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { handlers } from './src/mocks/handlers'

export const server = setupServer(...handlers)

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

- `onUnhandledFrame: 'error'` makes a request with no handler fail with `TypeError: fetch failed` and an MSW message naming the URL. Without it, a typo in a URL in either the app or the handler can still pass when the component swallows the failure. MSW 2 called this option `onUnhandledRequest`. MSW 3 renamed it and ignores the old name: it falls back to a warning and lets the request through to the real network. TypeScript flags the old name as an unknown property.
- `resetHandlers()` drops handlers added with `server.use()` in a test, so overrides never leak.
- MSW 3 no longer manages cookies in Node (`request.headers.get('cookie')` is `null`) and no longer patches fake timers. A handler that calls `await delay()` under fake timers needs the clock advanced.
- In jsdom under Vitest, `window.location` is `http://localhost:3000/`. A relative `fetch('/api/user')` resolves against it, so a handler for `'/api/user'` matches.

## Per-test responses and error paths

Every data component has at least three states: loading, success, failure. Test the failure path with a per-test override.

```tsx test
import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { useEffect, useState } from 'react'
import { afterAll, afterEach, beforeAll, expect, test } from 'vitest'

const url = 'https://api.example.test/user'
const server = setupServer(http.get(url, () => HttpResponse.json({ name: 'Ada' })))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function Profile() {
  const [state, setState] = useState<{ name: string } | 'loading' | 'error'>('loading')
  useEffect(() => {
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<{ name: string }>
      })
      .then(setState, () => setState('error'))
  }, [])
  if (state === 'loading') return <p role="status">Loading profile</p>
  if (state === 'error') return <p role="alert">Could not load your profile</p>
  return <h1>{state.name}</h1>
}

test('shows the user', async () => {
  render(<Profile />)
  expect(await screen.findByRole('heading', { name: 'Ada' })).toBeInTheDocument()
})

test('shows an error when the server fails', async () => {
  server.use(http.get(url, () => new HttpResponse(null, { status: 500 })))
  render(<Profile />)
  expect(await screen.findByRole('alert')).toHaveTextContent('Could not load your profile')
})
```

To assert what the component **sent**, read it inside the handler and keep it in a variable the test checks. Do not assert on a mock of `fetch`.

## Module mocks with vi.mock

`vi.mock(path, factory)` is hoisted above every import in the file, so the factory cannot use variables declared in the test file. Create shared mock functions with `vi.hoisted`:

```tsx
import { vi } from 'vitest'

const { track } = vi.hoisted(() => ({ track: vi.fn() }))
vi.mock('@/lib/analytics', () => ({ track }))
```

- The path is resolved like an import from the test file. Mock the module the component imports, by the same specifier or alias.
- A factory that returns only some exports makes the rest `undefined`. Spread the real module when you only want to replace one: `vi.mock(import('./format'), async (orig) => ({ ...(await orig()), now: () => 0 }))`.
- `vi.mock` applies to the whole file. For one test, use `vi.spyOn` on the module namespace, or pass the dependency as a prop.

## Framework hooks: next/navigation

Client components that call `useRouter` from `next/navigation` throw when no Next.js app router is mounted, which is every unit test. Mock the module and assert the navigation:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { BackButton } from './back-button'

const { push } = vi.hoisted(() => ({ push: vi.fn() }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, back: vi.fn(), replace: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/orders/42',
  useSearchParams: () => new URLSearchParams('tab=items'),
}))

test('goes back to the order list', async () => {
  const user = userEvent.setup()
  render(<BackButton />)
  await user.click(screen.getByRole('button', { name: 'All orders' }))
  expect(push).toHaveBeenCalledWith('/orders')
})
```

`next/link` renders a plain `<a>` in a unit test and needs no mock. Assert its `href` with `toHaveAttribute('href', '/orders')`.

## Spies and restoring

| Call | Restores original | Clears call history |
| --- | --- | --- |
| `vi.restoreAllMocks()` | yes, for `vi.spyOn` spies | no |
| `vi.clearAllMocks()` | no | yes |
| `vi.resetAllMocks()` | no | yes, and resets implementations |

Set `restoreMocks: true` in the config (see [setup.md](./setup.md#vitestconfigts)) and stop thinking about it. A `console.error` spy that silences one expected warning should also assert it was called, so a new, unexpected error does not hide behind it.
