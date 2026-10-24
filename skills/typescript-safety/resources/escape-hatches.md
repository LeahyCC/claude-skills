# Escape hatches

`any`, `as`, `!`, and the comment directives. Each one tells the compiler to stop checking something. Sometimes that is the least bad option. It is never free, because the check it turns off is the one that would have caught the bug.

Sources are in [SOURCES.md](../SOURCES.md).

## Contents

- The ranking
- any
- as
- Non-null assertion
- ts-expect-error and ts-ignore
- Finding them
- Checklist

## The ranking

From least to most damage. Before using any of these, try narrowing ([narrowing.md](./narrowing.md)).

| Hatch | Turns off | Least bad when | Reach for first |
| --- | --- | --- | --- |
| `as const` | Nothing. It narrows. | Always fine | |
| `satisfies T` | Nothing. It checks. | Always fine | |
| `!` | The `null`/`undefined` check on one expression | The code just proved it is defined in a way the compiler cannot follow | A check, or a `const` before the check |
| `as T` (narrower) | The check that the value really is `T` | Behind a runtime check, such as a brand constructor | A type predicate |
| `@ts-expect-error` | Every error on the next line | A FAIL example, a test of a type error, or a known bug in a library's types, with the reason | Fixing the type |
| `as unknown as T` | Every check between two unrelated types | Almost never. Treat it as a bug report. | Fix the types on one side |
| `@ts-ignore` | Every error on the next line, forever | Never. `@ts-expect-error` does the same and says when it is no longer needed. | `@ts-expect-error` |
| `any` | Every check on the value and on everything it touches | Never in new code | `unknown`, then narrow |

## any

`any` spreads. A property read from `any` is `any`, a call on it returns `any`, and assigning it to a typed variable is not checked. One `any` at an edge can make a whole module unchecked.

FAIL. The `any` parameter accepts anything, and the bug compiles:

```ts
function formatPrice(value: any): string {
  return value.toFixd(2) // typo, no error
}
```

PASS. `unknown` forces a check before use:

```ts
function formatPrice(value: unknown): string {
  if (typeof value !== 'number') throw new TypeError('price must be a number')
  return value.toFixed(2)
}
```

To accept any function without calling it, use `(...args: never[]) => unknown`. Every function is assignable to it, and the body cannot call it with made-up arguments:

```ts
function describe(fn: (...args: never[]) => unknown): string {
  return `${fn.name} takes ${fn.length} arguments`
}

describe((a: string, b: number) => a.repeat(b))
```

To wrap a function and keep its types, make the parameters and the return type generic. No cast is needed:

```ts
function logged<A extends unknown[], R>(fn: (...args: A) => R): (...args: A) => R {
  return (...args) => {
    console.log(fn.name, args)
    return fn(...args)
  }
}

const greet = logged((name: string) => `hello ${name}`) // (name: string) => string
greet('Ada')
```

## as

`as T` says "trust me". It is checked only loosely: the two types must overlap. It does not check the value.

FAIL. Nothing checks that the JSON has this shape:

```ts
interface Order {
  id: string
  total: number
}

function readOrder(json: string): Order {
  return JSON.parse(json) as Order
}
```

PASS. Narrow `unknown`, or validate with a schema. See [domain-types.md](./domain-types.md):

```ts
interface Order {
  id: string
  total: number
}

function readOrder(json: string): Order {
  const data: unknown = JSON.parse(json)
  if (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    typeof data.id === 'string' &&
    'total' in data &&
    typeof data.total === 'number'
  ) {
    return { id: data.id, total: data.total }
  }
  throw new Error('Not an order')
}
```

In tests, partial fixtures cast as the full type (`{ id: '1' } as Order`) hide missing fields when the type grows. Build fixtures with a factory that fills in defaults instead.

## Non-null assertion

`x!` removes `null` and `undefined` from the type of one expression, with no runtime check.

FAIL. `has` then `get!` checks twice and still asserts. If a refactor moves the `get`, the assertion lies:

```ts
const cache = new Map<string, number>()

function lookup(key: string): number {
  if (cache.has(key)) return cache.get(key)! // the compiler cannot connect has and get
  return 0
}
```

PASS. One read, one check:

```ts
const cache = new Map<string, number>()

function lookup(key: string): number {
  const hit = cache.get(key)
  return hit ?? 0
}
```

With `noUncheckedIndexedAccess` on, `arr[i]!` shows up often. Prefer `for...of`, `.at()` with a check, or destructuring with a check.

## ts-expect-error and ts-ignore

Both silence the next line. `@ts-expect-error` is itself an error (TS2578) when the next line has no error, so it cannot outlive the problem it covers. `@ts-ignore` stays silent forever.

```ts
interface Point {
  x: number
}

// @ts-expect-error Point has no y, kept to show the error
const p: Point = { x: 1, y: 2 }
```

Always write the reason after the directive. typescript-eslint's `ban-ts-comment` rule can require one.

## Finding them

```bash
# Every hatch, for a review
grep -rnE ': any\b|as any|<any>|as unknown as|@ts-ignore|@ts-nocheck|[]a-zA-Z0-9_)]!([^=]|$)' src --include='*.ts' --include='*.tsx'
```

The lint rules that report them as you write are in [linting.md](./linting.md): `no-explicit-any`, the `no-unsafe-*` family, `no-non-null-assertion`, `no-unsafe-type-assertion`, and `ban-ts-comment`.

## Checklist

- [ ] No `any` in new code. `unknown` at the edges, then narrowing.
- [ ] Every `as T` sits behind a runtime check
- [ ] No `as unknown as T`
- [ ] No `@ts-ignore` or `@ts-nocheck`. `@ts-expect-error` has a reason.
- [ ] `!` only where a check just happened that the compiler cannot see
- [ ] Test fixtures come from factories, not casts
