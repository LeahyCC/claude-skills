---
name: react-testing
description: >
  Writes and reviews React component tests with Vitest 5, React Testing
  Library 16, user-event 14, jest-dom 7, and MSW 3: query priority and
  accessible names, asserting absence, user-event setup, findBy and waitFor
  rules, act warnings, the Vitest fake-timer hang, cleanup without globals,
  jsdom gaps, custom renders with providers, renderHook, MSW handlers and
  error paths, vi.mock and next/navigation, and what async Server Components
  can and cannot do under RTL. Use when writing, fixing, or reviewing
  *.test.tsx files, when a test is flaky, hangs, or warns about act, or when
  the user mentions Testing Library, getByRole, userEvent, waitFor, or MSW.
  Not for generic false-green test review (gotchas), accessibility audits
  (wcag-accessibility), or React render speed (react-performance).
---

# React testing

Tests that fail when the feature breaks and pass when it works, whatever the internals look like. Find elements the way a user does, act the way a user does, and wait for what a user would see.

**Query by role and name first. If you cannot, the component probably has an accessibility bug.**

**Mock the edges (network, clock, framework), never your own code.**

Versions, source checks, and dates: [SOURCES.md](SOURCES.md).

## Procedure

1. Read the component, its existing tests, `vitest.config.*`, and the setup file. Check the package versions; this skill assumes the stack in SOURCES.md.
2. Pick what the user does and what they should see as a result. That pair is the test.
3. Route by what the test needs, and load only that resource:

```
writing or fixing a test
      |
      +-- finding an element, asserting present or absent ...... queries.md
      |
      +-- clicking, typing, tabbing, uploading .................. user-events.md
      |
      +-- something appears later, a timer, an act warning ...... async.md
      |
      +-- config, cleanup, providers, hooks, jsdom crashes ...... setup.md
      |
      +-- fetch, vi.mock, next/navigation ...................... network-and-mocks.md
      |
      +-- async page, Server Function, useActionState ........... server-components.md
```

4. Run the test. Then break the feature on purpose (comment out the handler, return the wrong value) and confirm the test fails. A test that still passes proves nothing.

## Where to read

| Topic | Resource |
| --- | --- |
| Query priority, `getBy`/`queryBy`/`findBy`, role and name, `within`, absence, `screen`, text matching, test IDs | [queries.md](./resources/queries.md) |
| `userEvent.setup()`, forms, keyboard and focus, uploads, clipboard, `pointer-events: none`, `fireEvent` cases | [user-events.md](./resources/user-events.md) |
| `findBy`, `waitFor` rules, `waitForElementToBeRemoved`, `act` warnings, fake timers in Vitest | [async.md](./resources/async.md) |
| Packages, `vitest.config.ts`, cleanup without globals, jsdom vs browser mode, jsdom gaps, custom render, `renderHook`, StrictMode | [setup.md](./resources/setup.md) |
| What to mock, MSW 3 setup and error paths, `vi.mock` and `vi.hoisted`, `next/navigation`, spies | [network-and-mocks.md](./resources/network-and-mocks.md) |
| Async Server Components, Server Functions, `useActionState` forms, what goes to E2E | [server-components.md](./resources/server-components.md) |

## The traps that cost the most time

| Symptom | Cause | Read |
| --- | --- | --- |
| Every test after a fake-timer test hangs until timeout | `vi.useFakeTimers()` with defaults: Testing Library only detects Jest's fake timers, so `findBy`, `waitFor`, and `await user.*` wait on a frozen `setTimeout` | [async.md](./resources/async.md#fake-timers-in-vitest) |
| `Found multiple elements` in the second test of a file | Vitest `globals` is off by default, so RTL's auto cleanup never registered | [setup.md](./resources/setup.md#the-setup-file-and-cleanup) |
| An absence check can never fail | `expect(queryBy...).toBeDefined()`: `null` is defined | [queries.md](./resources/queries.md#asserting-absence) |
| Assertion runs before the click finished, at random | Missing `await` on a user-event call | [user-events.md](./resources/user-events.md#one-setup-per-test) |
| Click handler fires twice, or a request is sent repeatedly | Side effect inside a `waitFor` callback, which retries | [async.md](./resources/async.md#waitfor-rules) |
| `TypeError: window.matchMedia is not a function` | jsdom has no `matchMedia`, `ResizeObserver`, `IntersectionObserver`, `scrollIntoView`, or `dialog.showModal` | [setup.md](./resources/setup.md#what-jsdom-does-not-have) |
| Unhandled requests reach the real network after upgrading MSW | MSW 3 renamed `onUnhandledRequest` to `onUnhandledFrame` and ignores the old name | [network-and-mocks.md](./resources/network-and-mocks.md#msw-3-for-the-network) |
| `vi.mock` factory says a variable is not defined | `vi.mock` is hoisted above the file's declarations; use `vi.hoisted` | [network-and-mocks.md](./resources/network-and-mocks.md#module-mocks-with-vimock) |
| Async page stays on its `Suspense` fallback, no error | RTL cannot render async Server Components; await the function or use E2E | [server-components.md](./resources/server-components.md#async-server-components) |
| `An update to X inside a test was not wrapped in act(...)` | A promise or timer settled after the test stopped waiting | [async.md](./resources/async.md#act-warnings) |

## Review checklist

- [ ] Queries use `ByRole` with `name`, or `ByLabelText`/`ByText`; `ByTestId` only where no role or text exists
- [ ] No `role` or `aria-*` added only for the test
- [ ] Absence uses `queryBy` with `.not.toBeInTheDocument()`; nothing asserts `toBeDefined()` on a query
- [ ] `userEvent.setup()` per test, and every user-event call is awaited
- [ ] Late content uses `findBy`; `waitFor` holds one assertion and no side effects; no `setTimeout` sleeps
- [ ] Fake timers under Vitest use `shouldAdvanceTime: true` and are restored in `afterEach`
- [ ] The setup file imports `@testing-library/jest-dom/vitest` and calls `cleanup` (or `globals: true`)
- [ ] The network is mocked with MSW and `onUnhandledFrame: 'error'`; the failure path has its own test
- [ ] No mock of the component, hook, or helper under test
- [ ] Assertions check what the user sees or what leaves the component, not internal state
- [ ] The test fails when the feature it covers is broken on purpose
