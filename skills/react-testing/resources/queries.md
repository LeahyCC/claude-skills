# Queries

How to find an element the way a user would, and how to assert it is there or gone. Most flaky or useless React tests start with the wrong query.

## Contents

- [Priority](#priority)
- [getBy, queryBy, findBy](#getby-queryby-findby)
- [Role and accessible name](#role-and-accessible-name)
- [Scoping with within](#scoping-with-within)
- [Asserting absence](#asserting-absence)
- [screen versus the render result](#screen-versus-the-render-result)
- [Text matching](#text-matching)
- [Test IDs](#test-ids)
- [Speed on large trees](#speed-on-large-trees)

## Priority

Testing Library ranks queries by how close they are to what a user perceives. Use the first one that works.

| Tier | Queries | When |
| --- | --- | --- |
| 1. Accessible to everyone | `ByRole`, `ByLabelText`, `ByPlaceholderText`, `ByText`, `ByDisplayValue` | Almost always. `ByRole` with a `name` first. |
| 2. Semantic | `ByAltText`, `ByTitle` | Images, `<area>`, SVG titles. |
| 3. Test IDs | `ByTestId` | Only when no role or text makes sense, such as a canvas wrapper or a layout-only element. |

If `ByRole` cannot find a control, that is usually an accessibility bug in the component, not a reason to drop to a test ID. Fix the markup (a real `<button>`, a `<label>`), then query it.

Do not add `role` or `aria-label` only so a test can find something. That changes what screen readers announce. The [wcag-accessibility](../../wcag-accessibility/) skill covers what the markup should be.

## getBy, queryBy, findBy

| Prefix | 0 matches | 1 match | 2 or more | Waits |
| --- | --- | --- | --- | --- |
| `getBy` | throws | element | throws | no |
| `queryBy` | `null` | element | throws | no |
| `findBy` | rejects | element | rejects | yes, via `waitFor` (1000 ms default) |
| `getAllBy` | throws | array | array | no |
| `queryAllBy` | `[]` | array | array | no |
| `findAllBy` | rejects | array | array | yes |

- `getBy` for things that are on screen now. Its error prints the DOM, which is the best failure message you will get.
- `queryBy` only to assert something is **not** there.
- `findBy` for things that appear after an effect, a fetch, or a transition. It is `getBy` plus `waitFor`.

## Role and accessible name

`name` matches the accessible name: label text, button text, `aria-label`, or `aria-labelledby`. Pair a role with a name so the query cannot match the wrong control.

```tsx test
import { render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'

function Plans() {
  return (
    <section aria-labelledby="plans-title">
      <h2 id="plans-title">Plans</h2>
      <article aria-label="Free">
        <h3>Free</h3>
        <button type="button">Choose</button>
      </article>
      <article aria-label="Pro">
        <h3>Pro</h3>
        <button type="button" disabled>
          Choose
        </button>
      </article>
    </section>
  )
}

test('the Pro plan button is disabled', () => {
  render(<Plans />)

  expect(screen.getByRole('heading', { level: 2, name: 'Plans' })).toBeInTheDocument()

  const pro = screen.getByRole('article', { name: 'Pro' })
  expect(within(pro).getByRole('button', { name: 'Choose' })).toBeDisabled()
})
```

Useful `ByRole` filters: `level` (headings only, throws on other roles), `checked`, `pressed`, `selected`, `expanded`, `current`, `busy`, and `description`. `value` only works on roles that carry a value and throws on others.

Elements hidden from the accessibility tree (`display: none`, `visibility: hidden`, `aria-hidden="true"`) are skipped unless you pass `hidden: true`. That is usually what you want: a user cannot reach them either.

## Scoping with within

Two buttons named "Choose" make `getByRole('button', { name: 'Choose' })` throw. Do not fall back to `getAllBy(...)[1]`: the index breaks when the order changes. Find the region first, then query inside it with `within`, as in the example above. Rows, list items, dialogs, and landmarks all work as scopes.

## Asserting absence

`queryBy` returns `null` when nothing matches. `null` is defined, so this test can never fail:

```tsx
// FAIL: passes even when the error is missing, and when it is present
expect(screen.queryByRole('alert')).toBeDefined()

// FAIL: passes with no match, but also passes when getBy would have found it
expect(screen.queryByRole('alert')).not.toBeNull()
```

The second line works by accident in one direction only. Use the jest-dom matchers, which say what they mean:

```tsx test
import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'

function Form({ error }: { error?: string }) {
  return <form aria-label="Sign in">{error && <p role="alert">{error}</p>}</form>
}

test('no alert without an error', () => {
  render(<Form />)
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

test('alert shows the error', () => {
  render(<Form error="Wrong password" />)
  expect(screen.getByRole('alert')).toHaveTextContent('Wrong password')
})
```

For "present", use `getBy`. It throws when the element is missing, so `expect(getBy...).toBeInTheDocument()` documents intent rather than adding a check.

For something that disappears later, see [async.md](./async.md#waiting-for-something-to-leave).

## screen versus the render result

Testing Library recommends `screen`. The reason is convenience, not correctness: you never update a destructuring list, and `screen.debug()` prints the whole body, portals included.

A common claim is that queries destructured from `render()` go stale after an update. They do not. They are bound to the live `baseElement` (`document.body` by default) and query it on every call:

```tsx test
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { expect, test } from 'vitest'

function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>Count {count}</button>
}

test('destructured queries see the updated DOM', async () => {
  const user = userEvent.setup()
  const { getByRole } = render(<Counter />)

  await user.click(getByRole('button'))

  expect(getByRole('button', { name: 'Count 1' })).toBeInTheDocument()
})
```

What does go stale is an **element** you kept from before a re-mount. If a key change or a conditional replaces the node, query again instead of reusing the old variable.

Content rendered through a portal (`createPortal` into `document.body`) is found by `screen`. A query bound to a custom `container` will miss it.

## Text matching

- Strings match the whole text, case-sensitive, after trimming and collapsing whitespace. `{ exact: false }` switches to a case-insensitive substring match.
- A regex (`/saved/i`) matches part of the text. Prefer it over `exact: false` because the intent is visible.
- `ByText` matches elements whose own text content matches. Text split across elements (`<p>Total: <b>$5</b></p>`) needs a function matcher or a query on the role that wraps it.

```tsx test
import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'

test('matches text split across elements', () => {
  render(
    <p>
      Total: <b>$5</b>
    </p>,
  )

  expect(screen.queryByText('Total: $5')).not.toBeInTheDocument()
  expect(
    screen.getByText((_, el) => el?.tagName === 'P' && el.textContent === 'Total: $5'),
  ).toBeInTheDocument()
})
```

## Test IDs

`data-testid` is fine for elements that have no role and no text, for example a chart canvas container. It is a smell on a button, link, input, or heading: the test passes while the control has no accessible name. `toHaveAccessibleName` from jest-dom catches that case when a test ID really is needed.

## Speed on large trees

`ByRole` computes accessibility state for every candidate element, which is slow on big DOMs (long tables, virtualised lists in jsdom). In order of preference:

1. Scope first with `within(region)` so fewer nodes are checked.
2. Pass `hidden: true` to skip visibility checks, if hidden matches are impossible in that region.
3. Use `ByLabelText` or `ByText` for that one query.
