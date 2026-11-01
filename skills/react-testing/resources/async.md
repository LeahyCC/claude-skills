# Async

Waiting for things to appear, change, or leave, without sleeps, flakes, or `act` warnings. Includes the Vitest fake-timer trap.

## Contents

- [Pick the right wait](#pick-the-right-wait)
- [findBy for something that appears](#findby-for-something-that-appears)
- [waitFor rules](#waitfor-rules)
- [Waiting for something to leave](#waiting-for-something-to-leave)
- [act warnings](#act-warnings)
- [Fake timers in Vitest](#fake-timers-in-vitest)

## Pick the right wait

```
what are you waiting for?
   |
   +-- an element to appear ............. await screen.findByRole(...)
   |
   +-- an element to disappear .......... await waitForElementToBeRemoved(...)
   |                                      (it must be on screen first)
   |
   +-- a mock call, attribute, or value . await waitFor(() => expect(...))
   |
   +-- a timer (debounce, toast, poll) .. fake timers, see the last section
```

Never `await new Promise(r => setTimeout(r, 500))`. It is slow when the work is fast and flaky when CI is slow.

## findBy for something that appears

```tsx test
import { render, screen } from '@testing-library/react'
import { useEffect, useState } from 'react'
import { expect, test } from 'vitest'

function Greeting({ load }: { load: () => Promise<string> }) {
  const [name, setName] = useState<string | null>(null)
  useEffect(() => {
    let live = true
    load().then((n) => live && setName(n))
    return () => {
      live = false
    }
  }, [load])
  return name ? <h1>Hello, {name}</h1> : <p role="status">Loading</p>
}

test('shows the name once it loads', async () => {
  render(<Greeting load={() => Promise.resolve('Ada')} />)

  expect(screen.getByRole('status')).toHaveTextContent('Loading')
  expect(await screen.findByRole('heading', { name: 'Hello, Ada' })).toBeInTheDocument()
})
```

`findBy` retries a `getBy` until it passes or 1000 ms runs out. It also retries when the DOM changes, through a `MutationObserver`, so it usually resolves as soon as React commits. Pass a longer timeout as the third argument only when the real code is slow: `findByRole('table', {}, { timeout: 3000 })`.

## waitFor rules

`waitFor(callback)` runs the callback straight away, then every 50 ms and on every DOM mutation, until it stops throwing or 1000 ms passes.

1. **The callback must throw to retry.** Returning `false` counts as success. Put an `expect` inside.
2. **One assertion per `waitFor`.** With several, a failure in the first hides whether the rest would pass, and the timeout grows with each. Wait for one signal, then assert the rest outside.
3. **No side effects inside.** The callback may run many times. A click or `fetch` inside it fires again on each retry.
4. **Not for queries.** `waitFor(() => screen.getByRole(...))` is `findByRole` written the long way.
5. **No empty callback.** `await waitFor(() => {})` only waits one tick, by luck. Wait for what you need.

```tsx
// FAIL: the click runs on every retry, and three assertions share one timeout
await waitFor(() => {
  fireEvent.click(save)
  expect(onSave).toHaveBeenCalled()
  expect(screen.getByRole('status')).toHaveTextContent('Saved')
  expect(save).toBeEnabled()
})
```

```tsx test
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { expect, test, vi } from 'vitest'

function SaveButton({ onSave }: { onSave: () => Promise<void> }) {
  const [state, setState] = useState<'idle' | 'saving' | 'saved'>('idle')
  return (
    <>
      <button
        type="button"
        disabled={state === 'saving'}
        onClick={async () => {
          setState('saving')
          await onSave()
          setState('saved')
        }}
      >
        Save
      </button>
      <p role="status">{state === 'saved' ? 'Saved' : ''}</p>
    </>
  )
}

test('saves once and reports it', async () => {
  const user = userEvent.setup()
  const onSave = vi.fn(() => Promise.resolve())
  render(<SaveButton onSave={onSave} />)
  const save = screen.getByRole('button', { name: 'Save' })

  await user.click(save)

  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Saved'))
  expect(onSave).toHaveBeenCalledTimes(1)
  expect(save).toBeEnabled()
})
```

## Waiting for something to leave

`waitForElementToBeRemoved` throws straight away if the element is not on screen when it is called. That is a feature: it proves the spinner was there.

```tsx test
import { render, screen, waitForElementToBeRemoved } from '@testing-library/react'
import { useEffect, useState } from 'react'
import { expect, test } from 'vitest'

function Report() {
  const [rows, setRows] = useState<string[] | null>(null)
  useEffect(() => {
    Promise.resolve(['North', 'South']).then(setRows)
  }, [])
  if (!rows) return <p role="progressbar" aria-label="Loading report" />
  return (
    <ul aria-label="Regions">
      {rows.map((r) => (
        <li key={r}>{r}</li>
      ))}
    </ul>
  )
}

test('spinner goes away when the rows arrive', async () => {
  render(<Report />)

  await waitForElementToBeRemoved(() => screen.queryByRole('progressbar', { name: 'Loading report' }))

  expect(screen.getAllByRole('listitem')).toHaveLength(2)
})
```

Pass a callback that re-queries (as above), not an element you saved earlier, when the node may be replaced rather than removed.

## act warnings

Testing Library's `render`, `fireEvent`, user-event calls, `findBy`, and `waitFor` already wrap React's `act`, and RTL sets `IS_REACT_ACT_ENVIRONMENT` for you. If you see `An update to X inside a test was not wrapped in act(...)`, a state update landed after the test stopped watching. Do not silence it with a bare `act`. Find the update:

| Cause | Fix |
| --- | --- |
| A promise resolved after the last assertion | `await` the thing that appears after it with `findBy` |
| A timer fired after the test | Fake timers, and advance them inside `act` |
| A missing `await` on a user-event call | Add the `await` |
| An effect started a fetch the test never waited for | Wait for its result, or give the component a resolved stub |

Import `act` from `react` (React 19) or `@testing-library/react`, which re-exports it. In React 19, `act` is the only export left in `react-dom/test-utils`, and it logs a deprecation warning. Prefer the async form, `await act(async () => ...)`: React's docs say the sync form will be deprecated.

## Fake timers in Vitest

Testing Library detects fake timers by checking for a global `jest`. Under Vitest that check fails, so `findBy`, `waitFor`, and every user-event call schedule a real-looking `setTimeout` on the faked clock and wait forever. The test hangs until Vitest's timeout. With the stack pinned in [SOURCES.md](../SOURCES.md):

| Setup | `await user.click` | `await findBy` |
| --- | --- | --- |
| `vi.useFakeTimers()` | hangs, even with `advanceTimers` | hangs |
| `vi.useFakeTimers({ shouldAdvanceTime: true })` | works | works |
| `vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })` | works (`setTimeout` stays real) | works |

Use `shouldAdvanceTime: true` so time still moves when nothing advances it, set `advanceTimers` so user-event's own delays use the fake clock, and advance the clock yourself inside `act` for the timer you are testing:

```tsx test
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEffect, useState } from 'react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

function SavedToast() {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!open) return
    const id = setTimeout(() => setOpen(false), 3000)
    return () => clearTimeout(id)
  }, [open])
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Save
      </button>
      {open && <p role="status">Saved</p>}
    </>
  )
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.runOnlyPendingTimers()
  vi.useRealTimers()
})

test('the toast closes after three seconds', async () => {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
  render(<SavedToast />)

  await user.click(screen.getByRole('button', { name: 'Save' }))
  expect(screen.getByRole('status')).toHaveTextContent('Saved')

  act(() => {
    vi.advanceTimersByTime(2000)
  })
  expect(screen.getByRole('status')).toBeInTheDocument()

  act(() => {
    vi.advanceTimersByTime(1000)
  })
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
})
```

- `shouldAdvanceTime` also adds the real time that passes while the test runs. Do not assert at the exact millisecond (`2999` then `1`): a few real milliseconds tip it over, and the check failed that way when this example was written. Leave a margin, or keep `shouldAdvanceTime` off and fake only `setInterval` when the code under test uses intervals.

- Restore real timers in `afterEach`, not at the end of the test. A test that times out never reaches its last line, and the fake clock then hangs every test after it in the file.
- Run pending timers before switching back, as Testing Library's fake-timer guide says, so cleanup code scheduled on the fake clock still runs.
- `vi.useFakeTimers()` does not fake `queueMicrotask` or `process.nextTick`. Promises still resolve on their own.
- MSW 3 no longer patches timers. A handler with `await delay(500)` needs the clock advanced too.
