# Linting, tuned balanced

A linter can catch the mechanical half of readability — a bare literal, an unused variable, depth past a ceiling — so human review can spend itself on whether the name is true. Tuned wrong, the same linter produces warning fatigue and gets switched off. This file is the balanced tuning: loud about meaning, silent about the exempt cases in [magic-numbers.md](./magic-numbers.md).

Sources are in [SOURCES.md](../SOURCES.md).

## Contents

- `no-magic-numbers`, balanced
- Companion rules
- Adopting in an existing codebase
- What no linter catches
- Checklist

## `no-magic-numbers`, balanced

ESLint's core `no-magic-numbers` (and `@typescript-eslint/no-magic-numbers` for TS, which adds `ignoreEnums`, `ignoreTypeIndexes`, and friends) with the options that make it match this skill instead of fighting it:

```js
// eslint.config.js (flat config)
export default [
  {
    files: ['src/**/*.{js,ts,tsx}'],
    rules: {
      '@typescript-eslint/no-magic-numbers': ['warn', {
        ignore: [0, 1, -1],          // identity values
        ignoreArrayIndexes: true,    // arr[0], arr[1]
        ignoreDefaultValues: true,   // function f(retries = 3) — the signature labels it
        enforceConst: true,          // const x = 5 ok, let x = 5 flags: tuning should be const
        detectObjects: false,        // { timeoutMs: 5000 } — the property name labels it
        ignoreEnums: true,           // TS: enum members are named by definition
        ignoreNumericLiteralTypes: true,
        ignoreTypeIndexes: true,
      }],
    },
  },
]
```

(For plain JS, the same options minus the TS-only ones, under `no-magic-numbers`.)

Why these settings, option by option:

- **`warn`, not `error`, on adoption.** See "Adopting" below. Promote per-directory once clean; a rule that blocks CI on day one in a legacy tree gets disabled, not obeyed.
- **`enforceConst: true` is the point.** It allows `const SESSION_TIMEOUT_MS = 180_000` (the definition) and flags `let`/bare-expression uses — exactly the float this skill targets, without demanding a constant for every literal.
- **`detectObjects: false` keeps the labelled-property exemption.** `{ timeoutMs: 5000 }` is already self-documenting; flagging it trains people to add pointless constants.
- **`ignore: [0, 1, -1]` and `ignoreArrayIndexes`** keep identity values and indexing quiet.

Known limits, stated honestly: the rule cannot see that `86400000` "everyone knows", cannot judge whether a name is true, and will flag a one-off literal in a formula that a human would pass. Inline-disable those one at a time with the reason on the same line (`// eslint-disable-next-line ... -- 24 * 60 expansion of MS_PER_DAY for the wire format`), never with a file-level disable. Type-aware tuning and `no-magic-numbers` interplay with const assertions are in typescript-eslint's rule docs, linked from [SOURCES.md](../SOURCES.md).

Other ecosystems, same shape: SonarSource rule S109 ("Magic numbers should not be used") for Java/C#/Python and friends; `clippy::unreadable_literal` plus explicit const naming in Rust; StyleCop / Roslyn analyzers in .NET. The concept ports; the exemption list must be re-expressed in each tool's options.

## Companion rules

Each is an ESLint core (or typescript-eslint) rule; all start at `warn`:

| Rule | Balanced setting | Catches |
| --- | --- | --- |
| `complexity` | `['warn', 10]` | Conditions a reader cannot hold — the lint echo of [nesting-and-conditionals.md](./nesting-and-conditionals.md) |
| `max-depth` | `['warn', 3]` | Nesting past the guard-clause point |
| `max-lines-per-function` | `['warn', { max: 80, skipBlankLines: true, skipComments: true }]` | A prompt to look for a nameable section — a smell trigger, not a cap to chop to ([functions.md](./functions.md)) |
| `max-params` | `['warn', 3]` | The point where an options object reads better |
| `@typescript-eslint/no-unused-vars` | `error` is safe here | The mechanical half of dead code |
| `no-warning-comments` | off by default; `['warn', { terms: ['fixme'], location: 'anywhere' }]` if TODO discipline slips | Bare `FIXME`s; TODOs with issue refs stay allowed |

Set `max-*` thresholds to prompt a look, then defend deliberate exceptions inline (`// eslint-disable-next-line max-lines-per-function -- generated parser table`). A number in this table is itself a magic number until its comment says why — that is deliberate, and the comment is the point.

## Adopting in an existing codebase

1. Turn the rules on at `warn` for one directory — the one under active work.
2. Fix forward: new and touched code goes clean; do not mass-rewrite untouched files to satisfy the linter. Mass rewrites bury behaviour changes in formatting diffs and burn review attention.
3. When a directory reaches zero warnings, promote its rules to `error` in that directory's config block so it cannot regress.
4. Track the remaining count. A falling count with `error` gates on clean directories beats a big-bang cleanup that never lands.

## What no linter catches

- Whether a name lies (`isValid` holding an error string) — [naming.md](./naming.md).
- Whether a comment restates, apologises, or has gone stale — [comments-and-dead-code.md](./comments-and-dead-code.md).
- Whether a constant's name states its unit, or merely its value (`TIMEOUT_180000`) — [magic-numbers.md](./magic-numbers.md).
- Whether a 30-line function still does two things.

Lint is the floor. The checklist in [SKILL.md](../SKILL.md) is the review.

## Checklist

- [ ] `no-magic-numbers` (or S109 equivalent) runs with `[0, 1, -1]`, array indexes, defaults, enums, and labelled objects exempt, `enforceConst` on
- [ ] New rules start at `warn`, promote to `error` per clean directory
- [ ] Inline disables are per-line, with the reason on the same line
- [ ] `complexity`, `max-depth`, `max-lines-per-function`, `max-params` act as smell triggers, not chop targets
- [ ] Review still checks the things on the "no linter catches" list
