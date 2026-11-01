# react-testing

React component tests with Vitest 5, React Testing Library 16, user-event 14, jest-dom 7, and MSW 3. Queries a user would use, events a user would make, waits that do not flake, mocks only at the edges, and what Server Components can and cannot do under RTL.

Generic false-green test review stays in [gotchas](../gotchas/). What accessible markup should be stays in [wcag-accessibility](../wcag-accessibility/). Render speed stays in [react-performance](../react-performance/).

## Install

```bash
npx skills add LeahyCC/claude-skills@react-testing
```

Or inside Claude Code:

```text
/plugin install react-testing --marketplace LeahyCC/claude-skills
```

## What it does

Use it when writing or reviewing `*.test.tsx` files, or when a test hangs, flakes, or warns about `act`. The entry file routes by what the test needs. Every `tsx test` example in the resources runs green in CI against the pinned stack, so the PASS code is checked, not just plausible.

Version 0.1.0. 6 resource files.

## Coverage

| Resource | Topics |
| --- | --- |
| [queries.md](./resources/queries.md) | Query priority, `getBy`/`queryBy`/`findBy` table, role and accessible name, `ByRole` filters, `within`, asserting absence, `screen` vs the render result, text matching, test IDs, `ByRole` speed |
| [user-events.md](./resources/user-events.md) | `user-event` vs `fireEvent`, `setup()` per test, forms, keyboard and focus, uploads with `accept`, clipboard stub, `pointer-events: none` |
| [async.md](./resources/async.md) | Choosing a wait, `findBy`, five `waitFor` rules, `waitForElementToBeRemoved`, `act` warnings and their causes, fake timers in Vitest |
| [setup.md](./resources/setup.md) | Packages and peers, `vitest.config.ts`, cleanup without globals, jsdom vs happy-dom vs browser mode, jsdom gaps and stubs, custom render with providers, `renderHook`, StrictMode |
| [network-and-mocks.md](./resources/network-and-mocks.md) | What to mock, MSW 3 setup and `onUnhandledFrame`, per-test error paths, `vi.mock` and `vi.hoisted`, `next/navigation`, restoring spies |
| [server-components.md](./resources/server-components.md) | Where each layer of an RSC page is tested, async Server Components, Server Functions, `useActionState` forms |

## What's different

| Typical advice | This skill |
| --- | --- |
| "Use `screen`, destructured queries go stale" | Use `screen` for convenience. Destructured queries are bound to the live body and do not go stale; a runnable example shows it. |
| "Use fake timers with `advanceTimers`" | Under Vitest that still hangs. Use `shouldAdvanceTime: true` too, and restore timers in `afterEach`. |
| "RTL cleans up automatically" | Only with a global `afterEach`. Vitest's default config has none, so call `cleanup` in the setup file. |
| "Mock `fetch`" | Mock the server with MSW, fail on unhandled requests, and test the error path. |
| "Vitest can't test async Server Components" | It renders the fallback forever with no error. Await the component function for one layer, E2E for the rest. |

Checked sources are in [SOURCES.md](./SOURCES.md).

## License

[MIT](../../LICENSE)
