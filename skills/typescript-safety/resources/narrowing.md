# Narrowing

Turning a wide type (`unknown`, a union, `T | undefined`) into the one the code needs, with checks the compiler can follow. Most `as` casts and `!` assertions in a codebase are narrowing that nobody wrote.

Sources are in [SOURCES.md](../SOURCES.md).

## Contents

- Which tool to reach for
- Discriminated unions
- Exhaustive switches
- Type predicates
- Assertion functions
- Narrowing in callbacks
- Where narrowing is unsound
- Checklist

## Which tool to reach for

Prefer the first row that works. Lower rows need code the compiler trusts without checking.

| Check | Narrows by | Checked by the compiler |
| --- | --- | --- |
| `typeof x === 'string'`, `x === null`, `x instanceof Date`, `'id' in x` | Built-in operators | Yes |
| `switch (event.type)` on a union | A literal tag shared by every member | Yes |
| A function with an inferred predicate (`x => x !== undefined`) | TS 5.5 infers `x is T` from the body | Yes |
| A hand-written `x is T` predicate | Whatever the body returns | **No.** The body can lie. |
| An `asserts x is T` function | Throwing when wrong | **No.** Same as above. |
| `as T` | Nothing | No. See [escape-hatches.md](./escape-hatches.md). |

## Discriminated unions

Use when: a value is one of several shapes, and the fields that exist depend on which.
Not when: the shapes share every field and differ only in values. A plain union of literals is enough.

FAIL. Optional fields allow states that cannot happen, and every reader has to guess:

```ts
interface Request {
  status: 'loading' | 'success' | 'error'
  data?: string[]
  error?: Error
}

function render(r: Request): string {
  // @ts-expect-error data may be undefined, though status says success
  if (r.status === 'success') return r.data.join(', ')
  return r.status
}
```

PASS. One member per state. Checking the tag narrows to the fields that state has:

```ts
type Request =
  | { status: 'loading' }
  | { status: 'success'; data: string[] }
  | { status: 'error'; error: Error }

function render(r: Request): string {
  if (r.status === 'success') return r.data.join(', ')
  if (r.status === 'error') return r.error.message
  return 'Loading'
}
```

## Exhaustive switches

Use when: a switch over a union must handle every member, and adding a member later must break the build.
Not when: a default branch is the right answer for new members, such as logging an unknown event from a server.

`satisfies never` in the `default` branch fails to compile when a member is not handled:

```ts
type Shape = { kind: 'circle'; r: number } | { kind: 'square'; side: number } | { kind: 'triangle'; base: number; h: number }

function area(s: Shape): number {
  switch (s.kind) {
    case 'circle':
      return Math.PI * s.r ** 2
    case 'square':
      return s.side ** 2
    default:
      // @ts-expect-error 'triangle' is not handled, so s is not never
      return s satisfies never
  }
}
```

Add the `triangle` case and the error goes away. For a runtime guard too, throw in the default:

```ts
function assertNever(value: never): never {
  throw new Error(`Unhandled value: ${JSON.stringify(value)}`)
}

type Status = 'open' | 'closed'

function label(s: Status): string {
  switch (s) {
    case 'open':
      return 'Open'
    case 'closed':
      return 'Closed'
    default:
      return assertNever(s)
  }
}
```

The typescript-eslint rule `switch-exhaustiveness-check` reports the same gap without the default branch. See [linting.md](./linting.md).

## Type predicates

Since TS 5.5 the compiler infers `x is T` for simple functions, so `filter` narrows without help:

```ts
const raw = ['a', undefined, 'b']
const names = raw.filter((x) => x !== undefined) // string[] since TS 5.5
console.log(names.map((n) => n.toUpperCase()))
```

Inference only works when the function returns a boolean check on its parameter and has no explicit return type. It does not infer for truthiness checks like `x => !!x`, because `''` and `0` are falsy and are still strings and numbers.

Use a hand-written predicate when: the check is too complex to infer, such as validating `unknown` input.
Not when: inference already works. A written predicate is a promise the compiler does not check.

FAIL. This compiles, and is wrong for any object with a `name` that is not a string:

```ts
interface User {
  name: string
}

function isUser(x: unknown): x is User {
  return typeof x === 'object' && x !== null && 'name' in x // never checks the type of name
}
```

PASS. Check every property the type promises:

```ts
interface User {
  name: string
}

function isUser(x: unknown): x is User {
  return typeof x === 'object' && x !== null && 'name' in x && typeof x.name === 'string'
}
```

For more than a few fields, or any input from outside the process, use a schema library instead of hand-written predicates. Validating request bodies with Zod is covered in the `api-security` skill.

## Assertion functions

Use when: the caller cannot continue if the check fails, so throwing is right.
Not when: the caller has a sensible fallback. Return a boolean predicate instead.

The function's name must have an explicit type. An arrow function in a `const` with no annotation is an error at the call:

```ts
const assertString = (x: unknown): asserts x is string => {
  if (typeof x !== 'string') throw new TypeError('expected a string')
}

function shout(input: unknown): string {
  // @ts-expect-error assertions need every name in the call target to have an explicit type (TS2775)
  assertString(input)
  // @ts-expect-error so input is never narrowed and stays unknown
  return input.toUpperCase()
}
```

PASS. A function declaration, or a `const` with a written type:

```ts
function assertString(x: unknown): asserts x is string {
  if (typeof x !== 'string') throw new TypeError('expected a string')
}

function shout(input: unknown): string {
  assertString(input)
  return input.toUpperCase()
}
```

## Narrowing in callbacks

Since TS 5.4, a narrowed `let` or parameter stays narrowed inside a closure created after its last assignment:

```ts
function urlsFor(base: string | undefined, paths: string[]): string[] {
  if (base === undefined) base = 'https://example.com'
  // base is string here, and stays string inside the callback
  return paths.map((p) => new URL(p, base).href)
}
```

It does not hold if the variable is assigned anywhere inside a nested function. Copy it to a `const` first in that case.

## Where narrowing is unsound

The compiler keeps a narrowed property narrowed after a function call, even if the call could change it. This is a deliberate trade-off, and it can hide a bug:

```ts
interface Job {
  result: string | null
}

function reset(job: Job): void {
  job.result = null
}

function run(job: Job): number {
  if (job.result !== null) {
    reset(job)
    return job.result.length // compiles, throws at runtime: the compiler still thinks result is string
  }
  return 0
}
```

When a call between the check and the use can mutate the object, read the value into a `const` before the call.

Since TS 5.6, checks that are always true or always nullish are errors:

```ts
function hasDigits(s: string): boolean {
  // @ts-expect-error a regex literal is always truthy, so the test was never called (TS2872)
  if (/\d/) return true
  return /\d/.test(s)
}
```

## Checklist

- [ ] States with different fields are a discriminated union, not optional fields
- [ ] Switches that must be exhaustive end in `satisfies never` or `assertNever`
- [ ] No hand-written predicate where the compiler can infer one
- [ ] Every hand-written predicate checks every property it promises
- [ ] Assertion functions are declarations or have an explicit type
- [ ] Values that a call could change are copied to a `const` before the call
