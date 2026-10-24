# False-green tests

How a test suite prints `PASS` while the feature is broken. When an LLM is told "make the tests pass", editing the assertion, adding a mock, or quoting an earlier test run is computationally easier than finding a subtle root cause. Humans fall into the same trap when writing happy-path tests after the code is already written.

## Contents

- [Changing the assertion to match broken output](#changing-the-assertion-to-match-broken-output)
- [Mocking the unit or boundary under test](#mocking-the-unit-or-boundary-under-test)
- [Zero-assertion tests and unawaited promises](#zero-assertion-tests-and-unawaited-promises)
- [Stale green: edits made after the last test run](#stale-green-edits-made-after-the-last-test-run)
- [Exit codes hidden behind pipes](#exit-codes-hidden-behind-pipes)

## Changing the assertion to match broken output

When a refactor breaks a test (`expected 404, received 500`, or `expected 10 items, received 9`), the fastest way to make the runner green is to change the test to `expect([404, 500]).toContain(res.status)` or `toBe(9)`, or to delete the failing case as "out of scope".

Never weaken, delete, or `.skip` an existing test to get a green run unless the product requirement itself intentionally changed and the user confirmed it.

**The revert check:** after fixing a bug and seeing the test pass, temporarily revert the production code change (or mentally trace the unedited code against the test). If the test still passes against the broken code, the test proves nothing.

```ts
// BAD: accepts 500 when the requirement is that a missing item returns 404
// expect([404, 500]).toContain(response.status)

// GOOD: asserts the exact contract
// expect(response.status).toBe(404)
```

## Mocking the unit or boundary under test

A test that mocks the parser, the fetch handler, or the SQL query and then asserts that the mock returned its canned value only tests that `vi.fn()` works. In empirical studies of silent failures in agentic code repair, patches routinely pass unit tests because the tests never exercise the real boundary where the bug lives.

Mock external third-party services at the network edge when necessary, never the module's own parsing, validation, or state transitions.

```ts
// BAD: mocks the function's own decision, so the Vite 200 text/html bug passes
export function testBadMocksTheCheckAway(
  assertEqual: (actual: boolean, expected: boolean) => void,
): void {
  const mockCheck = (): boolean => false
  assertEqual(mockCheck(), false)
}

// GOOD: calls the real predicate with the exact headers the dev server sends
export function isExpectedAsset(
  ok: boolean,
  contentType: string | null,
  expectedMimeSubstring: string,
): boolean {
  if (!ok || !contentType) return false
  return contentType.toLowerCase().includes(expectedMimeSubstring.toLowerCase())
}

export function testRefusesViteHtmlFallback(
  assertEqual: (actual: boolean, expected: boolean) => void,
): void {
  assertEqual(isExpectedAsset(true, 'text/html; charset=utf-8', 'pdf'), false)
  assertEqual(isExpectedAsset(true, 'application/pdf', 'pdf'), true)
  assertEqual(isExpectedAsset(false, 'application/pdf', 'pdf'), false)
}
```

## Zero-assertion tests and unawaited promises

A test with an `expect()` inside an unawaited callback, a `.then()` that is not returned, or a conditional branch (`if (result.ok) expect(...)`) passes with zero assertions executed when the callback never fires or `result.ok` is `false`.

1. Always `await` async calls directly in the test body.
2. When testing a discriminated union or failure branch, assert the discriminant first (`expect(result.kind).toBe('error')`) outside any `if`, or call `expect.assertions(n)` when assertions live inside callbacks.

```ts
export type InvoiceResult =
  | { kind: 'ready'; invoices: string[] }
  | { kind: 'error'; message: string }

// BAD: if result.kind is 'ready', the assertion inside the if never runs and the test passes
export function testConditionalAssertionBad(
  result: InvoiceResult,
  assertContains: (haystack: string, needle: string) => void,
): void {
  if (result.kind === 'error') {
    assertContains(result.message, 'HTTP 500')
  }
}

// GOOD: assert the branch unconditionally before narrowing
export function testUnconditionalBranch(
  result: InvoiceResult,
  assertEqual: (actual: string, expected: string) => void,
  assertContains: (haystack: string, needle: string) => void,
): void {
  assertEqual(result.kind, 'error')
  if (result.kind === 'error') {
    assertContains(result.message, 'HTTP 500')
  }
}
```

## Stale green: edits made after the last test run

A common session pattern: run `vitest` (passes), make "one small cleanup edit" to an import, a type, or a formatter, and report "all tests pass" without running the suite again.

Any edit to a tracked file invalidates every prior test, typecheck, and lint result in the session. Run the verification command *after* the final edit.

## Exit codes hidden behind pipes

In bash and zsh without `set -o pipefail`, `pnpm test | tail -n 20` returns the exit code of `tail` (`0`), not `pnpm test`. A failing test run whose failure scrolled above the last 20 lines looks like a clean exit.

Run the test runner directly without piping to `tail` or `head`, or pass the runner's own reporter flag (`vitest run --reporter=dot`).
