# Sources

Checked 2026-11-01. When a file changes, update its row here. Do not copy rules back into [SKILL.md](./SKILL.md).

## Pinned stack

Every `tsx test` block runs in CI against these versions ([check-skill.mjs](../../reviews/react-testing/checks/check-skill.mjs)): Vitest 5.0.5, `@vitejs/plugin-react` 6.1.2, jsdom 30.1.3, React and React DOM 19.3.1, `@testing-library/react` 16.3.3, `@testing-library/dom` 10.4.2, `@testing-library/user-event` 14.6.8, `@testing-library/jest-dom` 7.0.1, MSW 3.0.3. Probes run on Node 26.12.

| Claim home | Checked against |
| --- | --- |
| [queries.md](./resources/queries.md) | Testing Library docs: [About Queries](https://testing-library.com/docs/queries/about) (priority tiers, query type table, `screen` recommended, `TextMatch` `exact` and `normalizer`) and [ByRole](https://testing-library.com/docs/queries/byrole) (`hidden`, `name`, `description`, state filters, `level` and `value` throwing on other roles, performance note). Destructured queries staying live: RTL [API](https://testing-library.com/docs/react-testing-library/api) (render result queries are bound to `baseElement`) and the runnable example in the file. |
| [user-events.md](./resources/user-events.md) | user-event docs: [Setup](https://testing-library.com/docs/user-event/setup) (instances recommended, direct APIs kept for migration, shared input state) and [Options](https://testing-library.com/docs/user-event/options) (`advanceTimers`, `applyAccept`, `pointerEventsCheck`, `writeToClipboard` stub on `setup()`). `pointer-events: none` rejection and clipboard round trip: runnable examples. Hang under Vitest fake timers: probe below. |
| [async.md](./resources/async.md) | Testing Library [Async Methods](https://testing-library.com/docs/dom-testing-library/api-async) (1000 ms timeout, 50 ms interval, callback must throw to retry, `MutationObserver` options, `waitForElementToBeRemoved` throwing when absent) and [Using Fake Timers](https://testing-library.com/docs/using-fake-timers) (`runOnlyPendingTimers` before `useRealTimers`, user-event timeouts). React [act](https://react.dev/reference/react/act) (import from `react`, async form recommended, sync form to be deprecated, `IS_REACT_ACT_ENVIRONMENT` set by RTL). `react-dom/test-utils` in React 19.3.1 exports only `act`, which warns. Vitest [vi API](https://vitest.dev/api/vi) (`queueMicrotask` and `nextTick` not faked, `useRealTimers` discards scheduled timers). Fake-timer detection: `jestFakeTimersAreEnabled()` in `@testing-library/dom` 10.4.2 `dist/helpers.js` returns false unless a global `jest` exists. |
| [setup.md](./resources/setup.md) | [Next.js Vitest guide](https://nextjs.org/docs/app/guides/testing/vitest) (packages incl. `@testing-library/dom`, config, `vite-tsconfig-paths`). [jest-dom README](https://github.com/testing-library/jest-dom) (`@testing-library/jest-dom/vitest`, `.ts` setup file) and [7.0.0 release](https://github.com/testing-library/jest-dom/releases) (`@testing-library/dom` required peer, Node 22). `@testing-library/react` 16.3.3 peer dependencies. Vitest [globals](https://vitest.dev/config/globals) (default `false`, RTL auto cleanup needs it). RTL 16.3.3 `dist/index.js` registers cleanup only when `typeof afterEach === 'function'`. Vitest [Browser Mode](https://vitest.dev/guide/browser/) and [vitest-browser-react README](https://github.com/vitest-community/vitest-browser-react) (async `render`, `expect.element`, CDP events, warning against `@testing-library/user-event`). jsdom gaps: runnable example. `@testing-library/react-hooks` README, "A Note about React 18 Support". |
| [network-and-mocks.md](./resources/network-and-mocks.md) | MSW [Node integration](https://mswjs.io/docs/integrations/node) (`setupServer`, lifecycle) and [2.x to 3.x migration](https://mswjs.io/docs/migrations/2.x-to-3.x) (`onUnhandledFrame`). [MSW 3.0.0 release notes](https://github.com/mswjs/msw/releases) (ESM-only, Node 22, no fake-timer patching, no cookie management in Node). Vitest [vi API](https://vitest.dev/api/vi) (`vi.mock` hoisting, `vi.hoisted`, `restoreAllMocks` only restores `spyOn` spies and keeps history). Old option ignored, relative URLs matching: probe below. |
| [server-components.md](./resources/server-components.md) | [Next.js Vitest guide](https://nextjs.org/docs/app/guides/testing/vitest) ("Vitest currently does not support" async Server Components, E2E recommended). React [useActionState](https://react.dev/reference/react/useActionState). Fallback with no error, and awaiting the component function: probe below and the runnable example. |

## Probes, 2026-11-01

Run on the pinned stack, jsdom environment, setup file from [setup.md](./resources/setup.md):

- `vi.useFakeTimers()` (defaults): `await screen.findByText(...)` timed out with and without `vi.advanceTimersByTime`. `await user.click(...)` timed out with no options, with `delay: null`, and with `advanceTimers: vi.advanceTimersByTime`.
- `vi.useFakeTimers({ shouldAdvanceTime: true })`: `findBy` and `user.click` (with and without `advanceTimers`) passed. `toFake: ['setInterval', 'clearInterval']`: `user.click` passed.
- A fake-timer test that times out before `vi.useRealTimers()` made the next tests in the file time out too.
- An `async` component rendered as JSX in `<Suspense>`: after 200 ms the body was `<div><p>loading</p></div>` and `console.error` had no calls.
- `render(await Outer())` where `Outer` renders an async `Inner` in `<Suspense>`: after 300 ms the outer heading was there and `Inner` was still on its fallback.
- Without a `cleanup` call and with `globals: false`, the second of two identical tests failed with `Found multiple elements with the role "button"`.
- MSW 3 `server.listen({ onUnhandledRequest: 'error' })`: an unhandled request printed `[MSW] Warning` and went to the network (`getaddrinfo ENOTFOUND`). With `onUnhandledFrame: 'error'` it rejected with `TypeError: fetch failed`. A handler for `'/api/user'` matched `fetch('/api/user')`; `window.location.href` was `http://localhost:3000/`.

## Prior art

The idea for this skill and some of its scope came from `accelint-react-testing` in [gohypergiant/agent-skills](https://github.com/gohypergiant/agent-skills) (Apache-2.0). No text was copied. Its claim that destructured `render` queries go stale was checked and is wrong (see [queries.md](./resources/queries.md#screen-versus-the-render-result)).

## Overlap

- `gotchas` owns generic false-green tests: edited assertions, mocking the unit under test, zero-assertion async tests, exit codes behind pipes.
- `wcag-accessibility` owns what the markup should be. This skill only queries it.
- `react-performance` owns render cost and profiling.
- `nextjs-app-router` owns how Server Components and Server Functions work. This skill owns how to test them.
