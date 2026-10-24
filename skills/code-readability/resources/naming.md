# Naming

A name is the cheapest documentation: it travels with every use and cannot drift from the code the way a comment can. A good name makes the type, the comment, and the lookup unnecessary. A bad one is worse than none, because readers trust it and stop checking.

Sources are in [SOURCES.md](../SOURCES.md).

## Contents

- Name the meaning, include the unit
- Names that lie
- Booleans read as sentences
- Length follows scope
- Abbreviations
- Checklist

## Name the meaning, include the unit

FAIL. Every use needs a trip back to the definition, and two of these invite a units bug:

```ts
const d = 5000
const t = performance.now() + d
const fee = price * r
```

PASS:

```ts
const RETRY_DELAY_MS = 5000
const deadlineMs = performance.now() + RETRY_DELAY_MS
const feeCents = priceCents * taxRate
```

Quantities carry their unit in the name whenever the language does not carry it in the type: `_MS`, `_SECONDS`, `Cents`, `Bytes`, `Percent` (or `Rate` for 0–1 — pick one per codebase and say which; `0.07` named `taxPercent` has caused real bugs). Units in names is the naming half of [magic-numbers.md](./magic-numbers.md); branded unit types are the compiler half, in [typescript-safety](../../typescript-safety/).

## Names that lie

A name that contradicts the value is an active bug generator, because readers — and future editors — believe the name.

| Lie | Truth in the code | Fix |
| --- | --- | --- |
| `const users = userMap` | a `Map`, iterated like an array later | `usersById` |
| `getUser()` that also writes a cache entry and logs | hidden side effects | name them (`getOrLoadUser`) or split them out |
| `isValid` holding an error string | `''` is falsy, so it half-works | `validationError: string \| null` |
| `MAX_RETRIES = 4` meaning "4 total attempts" | off-by-one in every reader's head | `MAX_ATTEMPTS`, or comment the counting once at the definition |

When you find a lying name in code you touch, renaming it is in scope for the change. Leaving it because "the diff should stay small" leaves the trap armed.

## Booleans read as sentences

A boolean name should make `if (name)` read as prose and make the false case obvious:

- `isReady`, `hasAccess`, `canRetry`, `shouldPoll` — the `if` reads itself.
- Avoid negative booleans: `isNotEmpty`, `noCache`, `disableX` force double negation at use (`if (!isNotEmpty)`). Name the positive (`hasItems`, `cacheEnabled`) and negate at the use site if needed. The full treatment is in [nesting-and-conditionals.md](./nesting-and-conditionals.md).
- Collections are plural (`users`), single values singular; a boolean is never plural.

## Length follows scope

Name length should grow with the distance between definition and furthest use:

- A loop index or a 3-line lambda: `i`, `x`, `el` are fine — the whole life of the value is on screen.
- A module export or a value used 200 lines from its birth: full words, unit included. `cfg`, `ctx`, `mgr` at module scope make every reader keep a decoder ring.
- Never abbreviate by deleting vowels (`btn`, `usr`, `qty` is borderline) in anything that outlives a screenful.

## Abbreviations

Abbreviate only what every reader of this codebase already reads fluently: the project's own domain terms (`SKU`, `TTL` in a caching module) and universal ones (`id`, `url`, `io`). An abbreviation you must expand in a comment has failed — write the expansion as the name. When the codebase already has a glossary or a dominant spelling, match it; consistency beats personal preference across a whole repo.

## Checklist

- [ ] Quantities carry units in their names; one convention for percent vs rate
- [ ] No name contradicts its type, contents, or side effects
- [ ] Booleans are positive and read as sentences inside `if (...)`
- [ ] Name length matches scope; no vowel-deleted abbreviations beyond screen-local values
- [ ] Lying names found while touching code were renamed, not worked around
