# Server Components and Next.js

What a jsdom unit test can and cannot reach in a React Server Components app, and where each piece should be tested instead.

## Contents

- [The split](#the-split)
- [Async Server Components](#async-server-components)
- [Server Functions](#server-functions)
- [Forms with useActionState](#forms-with-useactionstate)

## The split

```
app/orders/page.tsx  (async Server Component: fetches, awaits)
      |
      +-- data access: getOrders() ......... unit test as a function, node env
      |
      +-- <OrderTable orders={...} /> ...... sync component: RTL + jsdom
      |
      +-- <Filters /> 'use client' ........ RTL + jsdom, mock next/navigation
      |
      +-- the page as a whole .............. Playwright (E2E) against next dev or a build
```

Keep the async layer thin. Fetch in the page, pass plain data down, and put the markup in synchronous components that RTL renders directly.

## Async Server Components

The [Next.js Vitest guide](https://nextjs.org/docs/app/guides/testing/vitest) says Vitest does not support `async` Server Components and recommends E2E tests for them. With React 19.3 and RTL 16, rendering one as JSX inside `Suspense` does not throw and logs nothing. The fallback just stays on screen, so a `findBy` for the real content times out with no hint why:

```tsx
// FAIL: stuck on "Loading" forever, no error
render(
  <Suspense fallback={<p>Loading</p>}>
    <OrdersPage />
  </Suspense>,
)
await screen.findByRole('table') // times out after 1000 ms
```

Awaiting the function and rendering its result works when the page is one async layer over synchronous children:

```tsx test
import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'

type Order = { id: string; total: number }

function OrderTable({ orders }: { orders: Order[] }) {
  return (
    <table aria-label="Orders">
      <tbody>
        {orders.map((o) => (
          <tr key={o.id}>
            <td>{o.id}</td>
            <td>${o.total}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

async function OrdersPage({ getOrders }: { getOrders: () => Promise<Order[]> }) {
  const orders = await getOrders()
  return <OrderTable orders={orders} />
}

test('renders the orders the page loaded', async () => {
  render(await OrdersPage({ getOrders: async () => [{ id: 'A-1', total: 30 }] }))

  expect(screen.getByRole('table', { name: 'Orders' })).toHaveTextContent('A-1$30')
})
```

Limits of that workaround:

- An async component **nested** below the awaited one still hangs on its `Suspense` fallback.
- `cookies()`, `headers()`, and `'use cache'` need the Next.js request context. They throw in Vitest unless mocked.
- `import 'server-only'` throws on import outside a server bundle. Alias it to an empty module in `vitest.config.ts` (`resolve.alias`) for tests that import server files.

Treat it as a quick check for the page's own mapping from data to markup. Use Playwright for the page as users get it.

## Server Functions

A `'use server'` function is an async function. Unit test it as one, in the `node` environment, with the framework calls it makes mocked:

```ts
// @vitest-environment node
import { expect, test, vi } from 'vitest'
import { renameProject } from './actions'

const { revalidatePath } = vi.hoisted(() => ({ revalidatePath: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath }))

test('rejects an empty name without revalidating', async () => {
  const form = new FormData()
  form.set('name', '   ')

  await expect(renameProject(null, form)).resolves.toEqual({ error: 'Name is required' })
  expect(revalidatePath).not.toHaveBeenCalled()
})
```

Test authorisation in the function itself (a user who does not own the project gets rejected). Server Functions are public endpoints: the [api-security](../../api-security/) skill covers what to check.

## Forms with useActionState

A client form wired to an action through `useActionState` renders in jsdom. Pass the action in as a prop (or mock its module) and drive the form with user-event:

```tsx test
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useActionState } from 'react'
import { expect, test } from 'vitest'

type State = { error?: string; saved?: boolean }
type Action = (prev: State, form: FormData) => Promise<State>

function RenameForm({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState(action, {})
  return (
    <form action={formAction}>
      <label>
        Name <input name="name" />
      </label>
      <button type="submit" disabled={pending}>
        Rename
      </button>
      {state.error && <p role="alert">{state.error}</p>}
      {state.saved && <p role="status">Saved</p>}
    </form>
  )
}

test('shows the error the action returns', async () => {
  const user = userEvent.setup()
  const action: Action = async (_, form) =>
    String(form.get('name')).trim() ? { saved: true } : { error: 'Name is required' }
  render(<RenameForm action={action} />)

  await user.click(screen.getByRole('button', { name: 'Rename' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Name is required')

  await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Apollo')
  await user.click(screen.getByRole('button', { name: 'Rename' }))
  expect(await screen.findByRole('status')).toHaveTextContent('Saved')
})
```
