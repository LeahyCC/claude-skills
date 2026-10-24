# Generics and inference

Type parameters, constraints, and the tools that steer inference: `satisfies`, `const` type parameters, and `NoInfer`. Most generic bugs are a type parameter that should not exist, or one inferred from the wrong argument.

Sources are in [SOURCES.md](../SOURCES.md).

## Contents

- When a function needs a type parameter
- Constraints
- satisfies
- const type parameters
- NoInfer
- Checklist

## When a function needs a type parameter

The Handbook's rules for functions: push type parameters down, use as few as possible, and a type parameter should appear at least twice. An inferred return counts, so `function first<T>(arr: T[]) { return arr[0] }` writes `T` once and is the good example. `type Box<T> = { value: T }` is fine. One that appears once only relates nothing, so it is an `unknown` with extra steps.

FAIL. `T` appears once. It lets the caller pick any type and makes the return a silent cast:

```ts
function parse<T>(json: string): T {
  return JSON.parse(json)
}

const port = parse<number>('"8080"') // typed number, holds a string
```

PASS. Return `unknown` and narrow, or validate with a schema:

```ts
function parse(json: string): unknown {
  return JSON.parse(json)
}

function toPort(value: unknown): number {
  const n = typeof value === 'string' ? Number(value) : value
  if (typeof n !== 'number' || !Number.isInteger(n) || n < 1 || n > 65535) {
    throw new Error(`Not a port: ${JSON.stringify(value)}`)
  }
  return n
}

const port = toPort(parse('"8080"'))
```

PASS. `T` links the input to the output, so it earns its place:

```ts
function last<T>(items: readonly T[]): T | undefined {
  return items[items.length - 1]
}

const n = last([1, 2, 3]) // number | undefined
```

## Constraints

Use when: the body needs something from `T`, such as a property.
Not when: the body only passes `T` through. Leave it unconstrained.

FAIL. Without a constraint, the body cannot read `length`:

```ts
function longest<T>(a: T, b: T): T {
  // @ts-expect-error Property 'length' does not exist on type 'T'
  return a.length >= b.length ? a : b
}
```

PASS. Constrain to what is used. The caller still gets its own type back:

```ts
function longest<T extends { length: number }>(a: T, b: T): T {
  return a.length >= b.length ? a : b
}

const word = longest('apple', 'fig') // 'apple' | 'fig'
const list = longest([1, 2], [3]) // number[]
```

`keyof` constraints tie a key to its object:

```ts
function pluck<T, K extends keyof T>(items: readonly T[], key: K): T[K][] {
  return items.map((item) => item[key])
}

const ids = pluck([{ id: 1, name: 'a' }], 'id') // number[]
```

## satisfies

Checks a value against a type without widening the value to that type. Added in 4.9.

Use when: an object must match a shape, and the code also needs its exact keys or literal values.
Not when: the variable should have the wider type, for example so it can be reassigned to another member of the union.

FAIL. The annotation widens `routes`, so the keys are lost and a typo compiles:

```ts
type Route = { path: string; auth: boolean }

const routes: Record<string, Route> = {
  home: { path: '/', auth: false },
  settings: { path: '/settings', auth: true },
}

const r = routes.setings // no error: any string key is allowed
```

PASS. `satisfies` checks each entry and keeps the exact keys:

```ts
type Route = { path: string; auth: boolean }

const routes = {
  home: { path: '/', auth: false },
  settings: { path: '/settings', auth: true },
} satisfies Record<string, Route>

// @ts-expect-error Property 'setings' does not exist
const r = routes.setings
const s = routes.settings.path // string
```

Add `as const` before `satisfies` to keep literal values too: `{ ... } as const satisfies Record<string, Route>`.

## const type parameters

Since TS 5.0, `const T` infers the narrowest type, as if the caller wrote `as const`.

Use when: a function takes a literal list or config, and the caller needs the literal values back.
Not when: the function stores or changes the argument. `const` does not make it readonly at runtime, and it does not reject mutable arrays.

```ts
function defineEvents<const T extends readonly string[]>(names: T): T {
  return names
}

const events = defineEvents(['open', 'close'])
type EventName = (typeof events)[number] // 'open' | 'close'
```

Without `const`, `EventName` would be `string`. Constrain to `readonly string[]`. A mutable `string[]` constraint still infers the tuple on TS 6 and 7, but then callers cannot pass a `readonly` array.

## NoInfer

Since TS 5.4, `NoInfer<T>` stops one argument from being used to infer `T`, so the other arguments decide it.

Use when: one argument defines the allowed values and another must be one of them.
Not when: every argument should widen `T` together.

FAIL. `initial` widens the union, so a value that is not in the list is accepted:

```ts
function createMachine<S extends string>(states: S[], initial: S): S {
  return initial
}

const state = createMachine(['idle', 'running'], 'stopped') // S becomes 'idle' | 'running' | 'stopped'
```

PASS. Only `states` decides `S`:

```ts
function createMachine<S extends string>(states: S[], initial: NoInfer<S>): S {
  return initial
}

// @ts-expect-error '"stopped"' is not assignable to '"idle" | "running"'
createMachine(['idle', 'running'], 'stopped')
```

## Checklist

- [ ] Every function type parameter appears at least twice (an inferred return counts), or the function returns `unknown`
- [ ] No generic return type that only exists to skip validation (`parse<T>(): T`)
- [ ] Constraints name only what the body uses
- [ ] Config objects use `satisfies`, not a widening annotation
- [ ] Literal-list helpers use `const` type parameters with a `readonly` constraint
- [ ] Arguments that should not drive inference are wrapped in `NoInfer`
