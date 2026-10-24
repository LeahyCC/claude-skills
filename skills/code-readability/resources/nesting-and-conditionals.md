# Nesting and conditionals

Readers track nesting as a stack of "what must be true to be here". Every level and every negation spends some of that budget. Spend it on the logic, not on the shape of the code.

Sources are in [SOURCES.md](../SOURCES.md).

## Contents

- Guard clauses: put the happy path on the left edge
- Conditions a reader can hold
- Negation
- Ternaries
- Checklist

## Guard clauses: put the happy path on the left edge

FAIL. The actual work sits three levels deep, and each `else` must be matched to its `if` by eye:

```ts
function handle(req) {
  if (req.user) {
    if (req.user.active) {
      if (req.body) {
        return doWork(req.body)
      } else {
        return err('no body')
      }
    } else {
      return err('inactive')
    }
  } else {
    return err('no user')
  }
}
```

PASS. Each precondition exits early; the work reads top to bottom at one level:

```ts
function handle(req) {
  if (!req.user) return err('no user')
  if (!req.user.active) return err('inactive')
  if (!req.body) return err('no body')
  return doWork(req.body)
}
```

Same shape inside loops: `if (!ok) continue` instead of wrapping the loop body. Extracting a deeply nested block into its own function is the other release valve — see [functions.md](./functions.md).

As a working guide, code past **three levels of indentation** should justify itself (a state machine, a matrix walk), and usually cannot.

## Conditions a reader can hold

A condition with more than two or three clauses, or with mixed `&&` and `||`, exceeds what a reader evaluates at a glance. Name the parts:

FAIL:

```ts
if (user.age >= 18 && (user.country === 'US' || user.consent) && !user.banned) { ... }
```

PASS:

```ts
const isAdult = user.age >= 18
const isAllowedRegion = user.country === 'US' || user.consent
if (isAdult && isAllowedRegion && !user.banned) { ... }
```

When the same compound condition appears twice, it is a function or a property with a domain name (`user.canPurchase`), not two copies that can drift. When branches multiply on one value, a lookup table or `switch` (exhaustive, per [typescript-safety](../../typescript-safety/)) usually beats an `if` ladder — and when branches multiply on two values, a table keyed by the pair beats nested conditions.

## Negation

Negation is the most expensive word in a condition. Reduce it:

- Prefer the positive form: `if (isReady)` over `if (!isNotReady)`; rename negatively-named booleans instead of negating them ([naming.md](./naming.md)).
- `else` after a negated `if` is a double negative in disguise. Swap the branches so the positive case comes first.
- `!x` where `x` is itself a compound (`!(a && b)`) should be rewritten with De Morgan into the form the reader actually needs, or named: `const isIncomplete = !a || !b`.

One negation is normal and fine. The smell starts at two stacked, or at a negation of a name that is already negative.

## Ternaries

A ternary is prose for a two-way value choice: `const label = ok ? 'Ready' : 'Waiting'` reads well. It stops being prose when it nests or when a branch has side effects:

- Nested ternary: convert to `if`/`else`, a lookup, or a small function. No exceptions for "it's just formatting".
- Ternary used as a statement (`cond ? doA() : doB()`): use `if`/`else`; the ternary form promises a value and hides that both branches act.
- Three-way-plus choice: a chain of ternaries is an `if` ladder in a trench coat; write the ladder or the table.

## Checklist

- [ ] Happy path sits at the left edge; preconditions and errors exit early
- [ ] No block is indented past three levels without a structural reason
- [ ] Compound conditions are factored into named booleans or domain predicates
- [ ] No double negations, no negated-negative names, positive branch first
- [ ] No nested ternaries; ternaries produce values, never effects
