# React testing skill tasks and acceptance criteria

Written 2026-11-01, before any model run. Run each prompt against Claude with the skill and without it, as in the Next.js pilot. Score each criterion 0 or 1. One run per task is exploratory, not a statistical estimate.

Status: **not run.** Model runs need Colin's approval first.

The examples themselves are checked separately by `node reviews/react-testing/checks/check-skill.mjs`, which runs every `tsx test` block on the pinned stack.

## Behaviour

| ID | Prompt | Acceptance criteria |
| --- | --- | --- |
| R1 | "This test hangs until Vitest times out, and so does every test after it in the file." Fixture: `beforeEach(() => vi.useFakeTimers())`, `const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })`, `await user.click(...)`, `vi.useRealTimers()` as the test's last line. | Explains that Testing Library only detects Jest fake timers, so user-event and `findBy` wait on a frozen `setTimeout` under Vitest. Switches to `vi.useFakeTimers({ shouldAdvanceTime: true })` (or fakes only intervals). Moves `vi.useRealTimers()` into `afterEach`, after `vi.runOnlyPendingTimers()`, and says why the later tests hung. |
| R2 | "Review this test file." Fixture: `getByTestId('submit-btn')` on a `<button>Save</button>`, `fireEvent.click`, `expect(screen.queryByText('Error')).toBeDefined()`, and a `waitFor` containing a click plus three assertions. | Replaces the test ID with `getByRole('button', { name: 'Save' })`. Replaces `fireEvent.click` with an awaited `user.click` from `userEvent.setup()`. Flags `toBeDefined()` on `queryBy` as unable to fail and uses `.not.toBeInTheDocument()`. Moves the click out of `waitFor` and keeps one assertion inside. |
| R3 | "The second test in my file fails with `Found multiple elements with the role "button"`, but each passes alone." Fixture: default `vitest.config.ts` (no `globals`), setup file imports only `@testing-library/jest-dom/vitest`. | Identifies that RTL auto cleanup needs a global `afterEach` and Vitest `globals` defaults to `false`. Adds `afterEach(() => cleanup())` to the setup file or sets `globals: true`. Does not "fix" it with `getAllByRole(...)[0]`. |
| R4 | "Write tests for this `Profile` component." Fixture: a component that `fetch`es `/api/user` in `useEffect` and shows the name, a loading status, or an error alert. MSW 3 is in `package.json`. | Uses MSW `setupServer` with `onUnhandledFrame: 'error'` (not `onUnhandledRequest`), `resetHandlers` in `afterEach`. Tests success with `findByRole`, and the failure path with a `server.use(...)` 500 override. Does not mock `fetch` or the component's own hooks. |
| R5 | "My page test stays on 'Loading' forever with no error." Fixture: `render(<Suspense fallback={<p>Loading</p>}><OrdersPage /></Suspense>)` where `OrdersPage` is an `async` Server Component that awaits `getOrders()`. | Says RTL/Vitest cannot render async Server Components and that it fails silently on the fallback. Offers `render(await OrdersPage(props))` for a single async layer with injected data, extracts a sync `OrderTable` to test directly, and sends the full page to an E2E test, citing the Next.js guidance. |
| R6 | "This component crashes in tests with `window.matchMedia is not a function`, and the dropdown's `scrollIntoView` throws too." | Explains jsdom lacks `matchMedia` and `Element.prototype.scrollIntoView`. Adds minimal stubs in the setup file for only those APIs. Notes that layout-dependent behaviour (sizes are 0 in jsdom) belongs in browser mode or E2E. |

## Selection

The skill should load for the first ten and not for the last ten.

| ID | Prompt | Should load |
| --- | --- | --- |
| S1 | Write React Testing Library tests for this signup form | yes |
| S2 | Why does my `findByText` time out when I use `vi.useFakeTimers()`? | yes |
| S3 | I'm getting "not wrapped in act(...)" warnings in my component tests | yes |
| S4 | Should I use `getByTestId` or `getByRole` for this button? | yes |
| S5 | Set up MSW in Vitest so my component tests don't hit the real API | yes |
| S6 | How do I test a custom hook that uses React Query? | yes |
| S7 | Mock `useRouter` from `next/navigation` in a Vitest test | yes |
| S8 | My `*.test.tsx` passes alone but fails when the whole file runs | yes |
| S9 | Test this client form that uses `useActionState` | yes |
| S10 | Should we switch our component tests from jsdom to Vitest browser mode? | yes |
| S11 | The agent changed the assertion from 10 to 9 to make CI green, check it | no (gotchas) |
| S12 | Audit our modal for WCAG 2.2 focus order and contrast | no (wcag-accessibility) |
| S13 | Profile why this list re-renders 40 times on each keystroke | no (react-performance) |
| S14 | Turn on `noUncheckedIndexedAccess` and fix the errors | no (typescript-safety) |
| S15 | Migrate this page from `getServerSideProps` to the App Router | no (nextjs-app-router) |
| S16 | Add rate limiting to our Next.js API routes | no (api-security) |
| S17 | Rewrite the empty-state copy on the orders page | no (ux-copy) |
| S18 | Build a Tailwind v4 token system for our component library | no (tailwind-design-system) |
| S19 | Draw an ASCII diagram of our deploy pipeline | no (ascii-art) |
| S20 | Write a WGSL compute shader for a prefix sum | no (webgpu) |
