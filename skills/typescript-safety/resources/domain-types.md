# Domain types and boundaries

Types that carry meaning the compiler can enforce (an ID is not just a string, cents are not dollars) and the places where data enters the program without any type at all.

Sources are in [SOURCES.md](../SOURCES.md).

## Contents

- Where types stop being true
- Untyped data at the edges
- Branded types
- Readonly inputs
- Checklist

## Where types stop being true

TypeScript checks code, not data. Every value that crosses into the process arrives untyped, whatever the annotation says.

```
outside the process          the edge                inside
-------------------          --------                ------
HTTP body, fetch response    unknown  -- parse -->   User
JSON.parse, localStorage     unknown  -- parse -->   Settings
env vars, argv               string | undefined -->  Config
postMessage, worker data     unknown  -- parse -->   Message
```

Parse once, at the edge, into a precise type. Code past the edge trusts the type and does not re-check.

## Untyped data at the edges

`JSON.parse` and `Response.json()` return `any`. Assigning `any` to a typed variable is not checked, so the annotation is a cast.

FAIL. `user` is typed `User`, and nothing checked it:

```ts
interface User {
  id: string
  email: string
}

async function loadUser(id: string): Promise<User> {
  const res = await fetch(`/api/users/${id}`)
  const user: User = await res.json() // any, assigned without a check
  return user
}
```

PASS. Take the value as `unknown`, then parse it:

<!-- ts-prelude
interface User {
  id: string
  email: string
}
declare function isUser(x: unknown): x is User
-->
```ts
async function loadUser(id: string): Promise<User> {
  const res = await fetch(`/api/users/${id}`)
  if (!res.ok) throw new Error(`GET /api/users/${id} failed with ${res.status}`)
  const data: unknown = await res.json()
  if (!isUser(data)) throw new Error('Unexpected user payload')
  return data
}
```

`isUser` is a predicate that checks every field (see [narrowing.md](./narrowing.md)). For real payloads use a schema library, which gives the type and the check from one definition. Schema validation of request bodies, with Zod, is in the `api-security` skill.

The typescript-eslint `no-unsafe-assignment` rule reports the FAIL above (`no-unsafe-return` would, if the code returned `await res.json()` directly). The compiler does not. See [linting.md](./linting.md).

## Branded types

A brand is a type-only tag that makes two structurally equal types incompatible. It has no runtime cost and no runtime check.

Use when: values of the same base type must not be mixed. IDs of different entities, money in different units, a string that passed validation.
Not when: the value is serialised and read back. JSON drops the brand, so parse it again at that edge.

FAIL. Both IDs are `string`, so swapping them compiles:

```ts
function transfer(fromAccount: string, toAccount: string, cents: number): void {
  console.log(fromAccount, toAccount, cents)
}

const userId = 'usr_1'
const accountId = 'acc_1'
transfer(userId, accountId, 500) // wrong ID, no error
```

PASS. A brand per meaning, and one function that is allowed to create each:

```ts
declare const brand: unique symbol
type Brand<T, B extends string> = T & { readonly [brand]: B }

type AccountId = Brand<string, 'AccountId'>
type UserId = Brand<string, 'UserId'>
type Cents = Brand<number, 'Cents'>

function toAccountId(raw: string): AccountId {
  if (!raw.startsWith('acc_')) throw new Error(`Not an account ID: ${raw}`)
  return raw as AccountId // the one cast, behind a check
}

function toUserId(raw: string): UserId {
  if (!raw.startsWith('usr_')) throw new Error(`Not a user ID: ${raw}`)
  return raw as UserId
}

function toCents(raw: number): Cents {
  if (!Number.isInteger(raw)) throw new Error(`Cents must be whole: ${raw}`)
  return raw as Cents
}

function transfer(from: AccountId, to: AccountId, amount: Cents): void {
  console.log(from, to, amount)
}

const userId = toUserId('usr_1')
// @ts-expect-error UserId is not assignable to AccountId
transfer(userId, toAccountId('acc_2'), toCents(500))
transfer(toAccountId('acc_1'), toAccountId('acc_2'), toCents(500))
```

The `unique symbol` key keeps the brand out of autocomplete and stops anyone from building a branded object literal by hand. An `as` cast can still forge one, which is why `no-unsafe-type-assertion` (see [linting.md](./linting.md)) is worth turning on. Keep the constructor functions next to the domain rules they enforce, not in a generic utility file.

## Readonly inputs

Use when: a function reads an array or object it was given. `readonly` says it will not change it, and the compiler holds it to that.
Not when: the function's job is to change the argument. Prefer returning a new value, though.

```ts
function total(prices: readonly number[]): number {
  // @ts-expect-error Property 'push' does not exist on type 'readonly number[]'
  prices.push(0)
  return prices.reduce((sum, p) => sum + p, 0)
}

const config = { retries: 3, regions: ['us', 'eu'] } as const
// config.regions is readonly ['us', 'eu']
```

`readonly` is shallow and type-only. `Object.freeze` is the runtime version, also shallow.

## Checklist

- [ ] Every `JSON.parse`, `.json()`, storage read, and message handler produces `unknown`, then parses
- [ ] No typed annotation on an `any` from an edge (`const x: T = await res.json()`)
- [ ] IDs and units that can be mixed up are branded
- [ ] Each brand has one constructor that checks, and it is the only place with the cast
- [ ] Functions that only read arrays take `readonly` arrays
