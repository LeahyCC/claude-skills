# User events

How to click, type, tab, and upload the way a person does. Covers `@testing-library/user-event` 14 and when `fireEvent` is still the right tool.

## Contents

- [user-event versus fireEvent](#user-event-versus-fireevent)
- [One setup per test](#one-setup-per-test)
- [Forms: type, select, submit](#forms-type-select-submit)
- [Keyboard and focus](#keyboard-and-focus)
- [Uploads and clipboard](#uploads-and-clipboard)
- [pointer-events: none](#pointer-events-none)
- [With fake timers](#with-fake-timers)

## user-event versus fireEvent

`fireEvent.click(button)` dispatches one `click` event. A real click is a sequence: pointer move, `pointerdown`, `mousedown`, focus change, `pointerup`, `mouseup`, `click`. `user.click(button)` runs that sequence and skips it the way a browser would when the element is disabled or has `pointer-events: none`.

| Use | For |
| --- | --- |
| `userEvent` | Every interaction a user performs: click, type, tab, select, hover, paste, upload. |
| `fireEvent` | Events a user cannot trigger directly or that user-event does not model: `scroll`, `resize`, media events (`play`, `ended`), `transitionend`, `animationend`, custom events. |

## One setup per test

Call `userEvent.setup()` in the test (or in a setup helper the test calls), then `await` every call. One instance shares keyboard and pointer state, so a held `Shift` carries into the next click as it would for a person.

```tsx test
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { useState } from 'react'
import { expect, test } from 'vitest'

function setup(ui: ReactElement) {
  return { user: userEvent.setup(), ...render(ui) }
}

function Toggle() {
  const [on, setOn] = useState(false)
  return (
    <button type="button" aria-pressed={on} onClick={() => setOn(!on)}>
      Bold
    </button>
  )
}

test('toggles bold on and off', async () => {
  const { user } = setup(<Toggle />)
  const bold = screen.getByRole('button', { name: 'Bold' })

  await user.click(bold)
  expect(bold).toHaveAttribute('aria-pressed', 'true')

  await user.click(bold)
  expect(bold).toHaveAttribute('aria-pressed', 'false')
})
```

Calling `userEvent.click(el)` on the default export still works. It runs `setup()` for you on each call, so state does not carry between calls. The docs keep it for migration and simple tests and recommend instances.

A missing `await` is the most common user-event bug. The assertion runs before the events finish, and the test either fails at random or passes before the handler ran. The typed lint rule `@typescript-eslint/no-floating-promises` catches it.

## Forms: type, select, submit

```tsx test
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { FormEvent } from 'react'
import { expect, test, vi } from 'vitest'

type Signup = { email: string; plan: string; terms: boolean }

function SignupForm({ onSubmit }: { onSubmit: (data: Signup) => void }) {
  function handle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    onSubmit({
      email: String(form.get('email')),
      plan: String(form.get('plan')),
      terms: form.get('terms') === 'on',
    })
  }
  return (
    <form onSubmit={handle}>
      <label>
        Email
        <input name="email" type="email" />
      </label>
      <label>
        Plan
        <select name="plan" defaultValue="free">
          <option value="free">Free</option>
          <option value="pro">Pro</option>
        </select>
      </label>
      <label>
        <input name="terms" type="checkbox" /> I accept the terms
      </label>
      <button type="submit">Create account</button>
    </form>
  )
}

test('submits what the user entered', async () => {
  const user = userEvent.setup()
  const onSubmit = vi.fn()
  render(<SignupForm onSubmit={onSubmit} />)

  await user.type(screen.getByRole('textbox', { name: 'Email' }), 'ada@example.com')
  await user.selectOptions(screen.getByRole('combobox', { name: 'Plan' }), 'Pro')
  await user.click(screen.getByRole('checkbox', { name: 'I accept the terms' }))
  await user.click(screen.getByRole('button', { name: 'Create account' }))

  expect(onSubmit).toHaveBeenCalledExactlyOnceWith({
    email: 'ada@example.com',
    plan: 'pro',
    terms: true,
  })
})
```

- `user.type` clicks the element first, then types. `user.clear` empties it. To replace a value, `clear` then `type`.
- `selectOptions` accepts the option's value or its visible text.
- Assert what leaves the component (the submitted data, the request, the new screen), not the internal state that produced it.

## Keyboard and focus

```tsx test
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'

test('tab order follows the form', async () => {
  const user = userEvent.setup()
  render(
    <form>
      <label>
        Name <input />
      </label>
      <button type="button">Cancel</button>
      <button type="submit">Save</button>
    </form>,
  )

  await user.tab()
  expect(screen.getByRole('textbox', { name: 'Name' })).toHaveFocus()

  await user.tab()
  await user.tab()
  expect(screen.getByRole('button', { name: 'Save' })).toHaveFocus()

  await user.keyboard('{Shift>}{Tab}{/Shift}')
  expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
})
```

`{Key}` presses a named key, `{Key>}` holds it, `{/Key}` releases it. Literal `{` or `[` is written `{{` or `[[`.

## Uploads and clipboard

```tsx test
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'

test('accept filters files the browser would refuse', async () => {
  const user = userEvent.setup()
  render(
    <label>
      Avatar <input type="file" accept="image/png" />
    </label>,
  )
  const input = screen.getByLabelText<HTMLInputElement>('Avatar')

  await user.upload(input, [
    new File(['png'], 'me.png', { type: 'image/png' }),
    new File(['pdf'], 'cv.pdf', { type: 'application/pdf' }),
  ])

  expect(input.files).toHaveLength(1)
  expect(input.files?.[0]?.name).toBe('me.png')
})
```

`upload` honours `accept` by default (`applyAccept: true`) and a missing `multiple`, so a test cannot pass with a file the real input would reject.

An instance from `setup()` replaces `navigator.clipboard` with a stub, so `user.copy()`, `user.cut()`, and `user.paste()` work in jsdom. Read it back with `navigator.clipboard.readText()` in the same test.

```tsx test
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'

function CopyLink({ url }: { url: string }) {
  return (
    <button type="button" onClick={() => navigator.clipboard.writeText(url)}>
      Copy link
    </button>
  )
}

test('copies the share link', async () => {
  const user = userEvent.setup()
  render(<CopyLink url="https://example.com/s/42" />)

  await user.click(screen.getByRole('button', { name: 'Copy link' }))

  await expect(navigator.clipboard.readText()).resolves.toBe('https://example.com/s/42')
})
```

## pointer-events: none

`user.click` rejects when the target or an ancestor has computed `pointer-events: none`, because a person could not click it. That catches overlays and disabled-looking links.

```tsx test
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'

test('a link under a pointer-events: none wrapper cannot be clicked', async () => {
  const user = userEvent.setup()
  render(
    <div style={{ pointerEvents: 'none' }}>
      <a href="#next">Next</a>
    </div>,
  )

  await expect(user.click(screen.getByRole('link', { name: 'Next' }))).rejects.toThrow(
    /pointer-events: none/,
  )
})
```

jsdom only computes styles that are inline or in `<style>` elements in the document. CSS imported from files is not applied unless your config processes CSS (Vitest `css` option), so a rule in a stylesheet will not trigger this check.

## With fake timers

Under Vitest, `vi.useFakeTimers()` with default options makes every `await user.*` call hang until the test times out, even with `advanceTimers` set. Testing Library's async helpers check for Jest's fake timers only (`typeof jest !== 'undefined'`), so under Vitest they wait on a `setTimeout` nobody advances. [async.md](./async.md#fake-timers-in-vitest) has the fix and a passing example.
