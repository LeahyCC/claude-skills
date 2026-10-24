# Sources

Checked 2026-10-24. When a file changes, update its row here. Check dates live in this file only. Do not copy rules back into [SKILL.md](./SKILL.md).

## Versions

| Package | Version checked | How |
| --- | --- | --- |
| `eslint` | docs for v9/v10 flat config | eslint.org rule pages, checked 2026-10-24 |
| `typescript-eslint` | v8 rule docs | typescript-eslint.io, `no-magic-numbers` rule page |

## By file

| Claim home | Checked against |
| --- | --- |
| [magic-numbers.md](./resources/magic-numbers.md) | Fowler, *Refactoring* (2nd ed., 2018), "Replace Magic Number with Symbolic Constant"; Martin, *Clean Code* (2008), ch. 17 (G25: Replace Magic Numbers with Named Constants); SonarSource rule S109 "Magic numbers should not be used"; ESLint `no-magic-numbers` rule page (definition-vs-use framing behind `enforceConst` / `detectObjects`). The exemption list (`0`, `1`, `-1`, labelled properties, fixtures, identity math) is the repo's balanced tuning, not quoted from any source — it extends the exemptions those sources already grant (indexing, test data, well-known constants). |
| [magic-strings.md](./resources/magic-strings.md) | Fowler, *Refactoring*: "Replace Magic Number" applied to literal constants generally; Martin, *Clean Code*, ch. 3 (flag arguments are "ugly", split or name them); TypeScript Handbook, union types and literal types (stringly-typed value -> union member). |
| [naming.md](./resources/naming.md) | Martin, *Clean Code*, ch. 2 (intention-revealing names, avoid encodings that lie, one word per concept); McConnell, *Code Complete* (2nd ed.), ch. 11 (name length vs scope, boolean naming, units in names for quantities). |
| [functions.md](./resources/functions.md) | Martin, *Clean Code*, ch. 3 (one level of abstraction, few arguments, no flag arguments, command-query separation); Fowler, *Refactoring*: "Extract Function" and its "nameable fragment" motivation. Length thresholds are stated as smell triggers only; no source endorses a universal line cap, and the file says so. |
| [nesting-and-conditionals.md](./resources/nesting-and-conditionals.md) | Fowler, *Refactoring*: "Replace Nested Conditional with Guard Clauses", "Consolidate Conditional Expression", "Decompose Conditional"; Martin, *Clean Code*, ch. 17 (G29: Avoid Negative Conditionals). |
| [comments-and-dead-code.md](./resources/comments-and-dead-code.md) | Martin, *Clean Code*, ch. 4 (good comments: legal, informative "why", clarification of intent, TODO with context; bad comments: redundant, misleading, commented-out code); Fowler, *Refactoring* ("comments as deodorant" — a restating comment signals a name that failed). |
| [linting.md](./resources/linting.md) | ESLint docs: `no-magic-numbers` (options `ignore`, `ignoreArrayIndexes`, `ignoreDefaultValues`, `enforceConst`, `detectObjects`), `complexity`, `max-depth`, `max-lines-per-function`, `max-params`, `no-warning-comments`; typescript-eslint `no-magic-numbers` (adds `ignoreEnums`, `ignoreClasses`, `ignoreNumericLiteralTypes`, `ignoreTypeIndexes`, `ignoreReadonlyClassProperties`) and `no-unused-vars`; SonarSource S109 as the cross-language equivalent. |

## Further reading for similar anti-patterns

Ranked for someone extending this skill: start at the top.

1. **Martin Fowler, *Refactoring* (2nd edition) and the online catalogue** (refactoring.com/catalog) — the canonical smell list with named cures: Magic Number, Long Function, Large Class, Long Parameter List, Flag Argument, Temporary Field, Dead Code, Speculative Generality, Primitive Obsession, Data Clumps. This is the taxonomy this skill borrows and the best source of "what else".
2. **SonarSource rule index (rules.sonarsource.com)** — S109 (magic numbers), S3776 (cognitive complexity), S107 (too many parameters), S1067 (too many conditional operators), S125 (commented-out code), S1135 (TODOs). Free, per-language, each with compliant/non-compliant samples; the closest thing to a machine-checkable anti-pattern library.
3. **Robert C. Martin, *Clean Code*, ch. 17 smell list (G1–G36, F1–F4)** — the checklist style this repo's skills imitate; G25 is the magic-number rule.
4. **eslint.org rules index + typescript-eslint rules** — every rule is a codified anti-pattern with a rationale and autofix notes; the `complexity` / `max-*` family covers shape, `no-lonely-if`, `no-nested-ternary`, `prefer-const` cover local readability.
5. **Google style guides** (google.github.io/styleguide: Java, C++, Python, TypeScript) — opinionated, public, and diff-tested at scale; useful second opinions on naming, comments, and when a constant is required.
6. **McConnell, *Code Complete* ch. 7, 11, 18** — the empirical backing: routine length studies, naming data, and layout — for when a reviewer asks "says who".
7. **Refactoring Guru (refactoring.guru/refactoring/smells)** — the Fowler taxonomy retold with friendlier visuals; good first link to hand a teammate, not a primary source.

Note on authority: no primary standard mandates naming constants — this is convergent practice across the sources above, plus each tool vendor's shipped rule. This skill states its exemptions explicitly so a team can argue with the tuning, not with each other's taste.

## How the samples were checked

`node reviews/code-readability/checks/check-magic-numbers.mjs` encodes the FAIL/PASS pairs in [magic-numbers.md](./resources/magic-numbers.md) as runnable cases: FAIL = a bare literal carrying time/retries/a threshold in an expression; PASS = the same value named, labelled by a property, carrying a unit-and-why comment, or exempt (`0`, `1`, `-1`, identity math). It also verifies every relative link in the skill resolves. It is a heuristic spec of the rule, not a linter — real enforcement is the ESLint config in [linting.md](./resources/linting.md). The remaining samples (naming, functions, conditionals, comments) are illustrative prose examples and are not snippet-compiled.

| Check | Result |
| --- | --- |
| 5 FAIL cases flagged, 7 PASS cases clean, 68 links checked | Pass, 2026-10-24 |
| Detector flags `performance.now() + 180_000` and passes a named constant | Confirmed by direct import, 2026-10-24 |
