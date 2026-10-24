# Types from types

Utility types, mapped types, conditional types, template literal types, and augmenting types you do not own. These derive one type from another so the two cannot drift apart.

Sources are in [SOURCES.md](../SOURCES.md).

## Contents

- When to derive a type
- Utility types
- The Omit trap
- Mapped types
- Conditional types
- Template literal types
- Augmenting globals and modules
- Checklist

## When to derive a type

Use when: two types must stay in step, such as a form state built from a model, or an event name built from a key.
Not when: the derived type is harder to read than writing it out, and the two do not need to stay in step. A type that takes a minute to understand costs every reader that minute, and its errors are worse.

Rule of thumb: if the hover in the editor shows something nobody can read, name the intermediate steps or write the type by hand.

## Utility types

| Type | Gives | Use for |
| --- | --- | --- |
| `Partial<T>` | Every property optional | Patch and update payloads |
| `Required<T>` | Every property required | Config after defaults are applied |
| `Readonly<T>` | Every property `readonly` (shallow) | Values that must not be changed by the receiver |
| `Pick<T, K>` | Only keys `K` | A view of a model |
| `Omit<T, K>` | Every key except `K` | Same, from the other side. See the trap below. |
| `Record<K, V>` | An object with keys `K` and values `V` | Lookup tables. With a union `K`, every key is required. |
| `Exclude<U, X>` / `Extract<U, X>` | Union members not in / in `X` | Filtering unions |
| `NonNullable<T>` | `T` without `null` and `undefined` | After a check |
| `ReturnType<F>` / `Parameters<F>` | A function's return or parameter types | Typing a wrapper around a function you do not own |
| `Awaited<T>` | What `await` gives for `T` | Async return types |

```ts
interface User {
  id: string
  name: string
  email: string
  createdAt: Date
}

type UserPatch = Partial<Pick<User, 'name' | 'email'>>
type UserRow = Readonly<User>

const patch: UserPatch = { name: 'Ada' }
```

## The Omit trap

`Pick` checks its keys. `Omit` does not: its key is any `string | number | symbol`. A typo or a renamed field compiles and omits nothing.

FAIL. `createdAt` was renamed to `created`, and `Omit` did not notice:

```ts
interface User {
  id: string
  created: Date
}

type NewUser = Omit<User, 'id' | 'createdAt'> // still has created, no error

const u: NewUser = { created: new Date() }
```

PASS. A strict version that only accepts real keys:

```ts
type StrictOmit<T, K extends keyof T> = Omit<T, K>

interface User {
  id: string
  created: Date
}

// @ts-expect-error '"createdAt"' does not satisfy the constraint keyof User
type NewUser = StrictOmit<User, 'id' | 'createdAt'>
```

`StrictOmit` checks keys on one object type. On a union, `keyof` is only the shared keys, so the result is not a distributed omit:

```ts
type StrictOmit<T, K extends keyof T> = Omit<T, K>

interface A {
  id: string
  name: string
}
interface B {
  id: string
  email: string
}

type Collapsed = StrictOmit<A | B, 'id'> // {}, not { name: string } | { email: string }
const value: Collapsed = { name: 'Ada' } // extra properties are allowed on {}
// @ts-expect-error Property 'name' does not exist. The only shared key was id, and it was removed.
console.log(value.name)
```

For a union, write the omit inside each member (`T extends unknown ? Omit<T, K> : never`) and check `K` against that member, or write the result by hand. The handbook does not define `StrictOmit`.

## Mapped types

Use when: every property of a type needs the same change.
Not when: only one or two properties change. Write those out.

```ts
type Validators<T> = {
  [K in keyof T]: (value: T[K]) => string | null
}

interface SignUp {
  email: string
  age: number
}

const validators: Validators<SignUp> = {
  email: (v) => (v.includes('@') ? null : 'Enter an email address'),
  age: (v) => (v >= 13 ? null : 'You must be 13 or older'),
}
```

Remap keys with `as`, and drop a key by mapping it to `never`:

```ts
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K]
}

type PublicOnly<T> = {
  [K in keyof T as K extends `_${string}` ? never : K]: T[K]
}

type G = Getters<{ name: string }> // { getName: () => string }
type P = PublicOnly<{ id: string; _secret: string }> // { id: string }
```

`-readonly` and `-?` remove modifiers, as `Required` does.

## Conditional types

Use when: the output type depends on the input type, such as unwrapping a promise or an array.
Not when: an overload or a union would say the same thing more plainly.

```ts
type ElementOf<T> = T extends readonly (infer E)[] ? E : never

type A = ElementOf<string[]> // string
type B = ElementOf<number> // never
```

A conditional type on a naked type parameter distributes over a union. Wrap both sides in a tuple to stop it:

```ts
type ToArray<T> = T extends unknown ? T[] : never
type ToArrayWhole<T> = [T] extends [unknown] ? T[] : never

type D = ToArray<string | number> // string[] | number[]
type W = ToArrayWhole<string | number> // (string | number)[]
```

TS 7.1 (in beta) rejects a type that matches only the original type parameter once that parameter has been distributed. The error says the type is only assignable to the non-distributed form. Check the 7.1 notes before upgrading code with many conditional types.

## Template literal types

Use when: a string has a fixed format, such as an event name, a CSS unit, or an ID prefix.
Not when: the format needs runtime checking anyway. A template type does not validate strings from outside.

```ts
type Locale = 'en' | 'fr'
type Section = 'home' | 'pricing'
type Path = `/${Locale}/${Section}` // 4 members

function go(path: Path): void {
  console.log(path)
}

go('/en/pricing')
// @ts-expect-error '"/de/home"' is not assignable to type Path
go('/de/home')
```

Unions inside template types multiply. Five digits (`${D}${D}${D}${D}${D}`) make 100,000 members, and the compiler refuses with TS2590, "Expression produces a union type that is too complex to represent". Long before that, checking slows down. Past a few hundred members, use `string` with a runtime check.

TS 7.0 changed how `infer` splits strings: it now takes whole Unicode code points, not UTF-16 halves. Type-level string helpers such as `Length` or `Head` can give different answers for emoji and other characters outside the Basic Multilingual Plane:

<!-- ts-only: 7 -->
```ts
type HeadTail<S extends string> = S extends `${infer H}${infer T}` ? [H, T] : never

const split: HeadTail<'😀abc'> = ['😀', 'abc'] // in TS 6 the head was half of the emoji
```

## Augmenting globals and modules

Use when: a library or the platform has a value your code adds, such as a field set by middleware, or a global set by a script tag.
Not when: you own the type. Edit it instead.

Augment a global from a module with `declare global`:

```ts
declare global {
  interface Window {
    analytics?: { track(event: string): void }
  }
}

window.analytics?.track('signup')

export {}
```

Augment a library's types with `declare module` and the package name, in a file the tsconfig includes. The file must be a module (have an import or export), or the declaration replaces the package's types instead of merging. Use `export {}` rather than a bare `import 'pkg'`, which `verbatimModuleSyntax` keeps and runs:

<!-- ts-check: skip, needs express and its types installed -->
```ts
export {}

declare module 'express-serve-static-core' {
  interface Request {
    userId?: string
  }
}
```

An `interface` merges with another `interface`. A `namespace` also merges with a class, a function, an enum, or another namespace. A `type` alias cannot be merged (TS2300).

## Checklist

- [ ] Derived types are used where two types must stay in step, and nowhere else
- [ ] `Omit` keys are checked (`StrictOmit` or `Pick`)
- [ ] Conditional types meant for the whole union wrap the parameter in a tuple
- [ ] Template literal unions stay small
- [ ] Augmentation files are modules and are in the tsconfig `include`
