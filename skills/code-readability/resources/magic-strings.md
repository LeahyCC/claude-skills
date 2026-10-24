# Magic strings and flag arguments

A literal string compared, switched on, or passed as a mode is a number in disguise: its meaning lives in the author's head and in every other place the same literal was typed. Same cure as [magic-numbers.md](./magic-numbers.md) — one name, one spelling — plus one readability trap numbers do not have: bare boolean arguments.

Sources are in [SOURCES.md](../SOURCES.md).

## Contents

- Magic strings
- Boolean flag arguments
- Stringly-typed values that should be unions
- Checklist

## Magic strings

FAIL. `'admin'` typed in four files; renaming the role means hunting strings, and `'Admin'` in one place fails silently:

```ts
if (user.role === 'admin') showBilling()
bus.emit('user:updated', user)
```

PASS. One definition, referenced everywhere:

```ts
const ROLE_ADMIN = 'admin'
if (user.role === ROLE_ADMIN) showBilling()
```

Use when: the same literal is compared or emitted in more than one place, or its spelling is a contract (event names, storage keys, API values).
Not when: the string is display text (that is [ux-copy](../../ux-copy/)), a one-off test assertion, or already a typed union member (below).

## Boolean flag arguments

A boolean parameter makes the call site unreadable: the reader sees the value but not the meaning.

FAIL:

```ts
render(true, false, true)
save(false)
```

No reader can say what any of these do, and swapping two booleans compiles fine.

PASS, in order of preference:

```ts
render({ editable: true, animate: false, focus: true }) // options object: call site self-labels
saveDraft()                                             // split: two verbs beat one flag
save({ autosave: false })                               // one flag left: name it at the call site
```

Use an options object when there are two or more flags or any flag is optional. Split the function when the boolean selects two genuinely different behaviours (`saveDraft` / `publish`). Keep a lone positional boolean only for universally known pairs (`setEnabled(false)`) — and even there, prefer the named form when the call is not obvious.

The mirror trap inside the function: `if (flag)` where `flag` was named `b` or `mode`. A parameter named `shouldAnimate` makes both the call (via object) and the body read in prose.

## Stringly-typed values that should be unions

When a value can only be one of a few strings, say so in the type and the literals stop being magic — the compiler lists them and catches typos.

FAIL:

```ts
function setStatus(s: string) { /* hopes for 'open' | 'closed' */ }
setStatus('clsoed') // compiles
```

PASS:

```ts
type OrderStatus = 'open' | 'closed' | 'refunded'
function setStatus(s: OrderStatus) { /* ... */ }
setStatus('clsoed') // type error
```

Designing unions and catching exhaustiveness is [typescript-safety](../../typescript-safety/) (`narrowing.md` there). The readability point here is smaller: a status written as a bare literal in business logic (`if (order.status === 3)` or `=== 'clsoed'` waiting to happen) should be a named member the reader can look up in one place.

## Checklist

- [ ] No string literal is compared or emitted in more than one place without a shared name
- [ ] Event names, storage keys, and API contract strings have one definition
- [ ] No call site passes bare booleans it takes a trip to the definition to decode
- [ ] Finite string sets are union types or named constants, not retyped literals
