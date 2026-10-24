---
name: code-readability
description: >
  Makes code readable at the point of use: no floating (magic) numbers or
  strings without a name or a unit-and-why note nearby, names that carry units
  and meaning, small functions, shallow nesting, honest comments, and no dead
  code. Balanced by default: 0, 1, -1, named object properties, tests, and
  self-evident math are exempt. Use when writing or reviewing code, naming a
  constant, adding a timeout, retry, threshold, limit, or percentage, or when
  a reviewer asks "what is this number / what does this do". Not for type
  safety (typescript-safety), UI text (ux-copy), or performance (spa-performance,
  react-performance).
---

# Code readability

Code is read at the point of use, by someone who does not have the author's head. A value, name, or shape that needs the author's memory to decode is a readability bug, even when it runs correctly.

**Name it, or document it where it is used. Prefer naming.** A named constant explains itself on every use and can only change in one place. A comment is the fallback for code that cannot hold a name (a config table, a protocol layout), and it must give the unit and the reason, not restate the literal.

**Balanced, not strict.** This skill flags meaning a reader cannot recover from context. It does not flag `0`, `1`, `-1`, a literal already labelled by the property or argument it sits in (`{ timeoutMs: 5000 }`), test data, or math whose meaning the formula itself carries (`width / 2` for a centre). Chasing those teaches people to ignore the rule.

Source checks and dates: [SOURCES.md](SOURCES.md).

## Procedure

1. Read the change for a reader who arrives cold. Mark every place you had to scroll, guess, or already know something to understand it.
2. Read the resource for that smell in the table below.
3. Fix by preference, in order: rename, extract a named constant or helper, restructure (guard clause, lookup table), then — only if none of those fit — a unit-and-why comment at the use site.
4. Do not rename or restructure unrelated code in the same change. Readability fixes ride along only where the change already touches.
5. If the project has linting, run it. Report findings as Must fix / Should fix / Leave, with the rule name. Never report a smell you did not actually see in the code.

```
a literal a reader can't decode ──> magic-numbers.md, magic-strings.md
a name that hides unit or meaning ──> naming.md
a function you must hold in your head ──> functions.md, nesting-and-conditionals.md
a comment that lies, repeats, or apologises ──> comments-and-dead-code.md
want a machine to catch it ──> linting.md
```

## Where to read

| Task | Resource |
| --- | --- |
| Floating / magic numbers: timeouts, retries, thresholds, sizes, rates, the `performance.now()` deadline | [magic-numbers.md](./resources/magic-numbers.md) |
| Magic strings, status literals, boolean flag arguments, stringly-typed values | [magic-strings.md](./resources/magic-strings.md) |
| Names: units in names, abbreviations, boolean names, names that lie, scope and length | [naming.md](./resources/naming.md) |
| Function size, doing one thing, abstraction levels, arguments, early returns as structure | [functions.md](./resources/functions.md) |
| Nesting depth, guard clauses, complex conditions, negations, nested ternaries | [nesting-and-conditionals.md](./resources/nesting-and-conditionals.md) |
| Comments that earn their place, comments that lie or repeat code, commented-out and dead code, TODOs | [comments-and-dead-code.md](./resources/comments-and-dead-code.md) |
| ESLint `no-magic-numbers` and friends, tuned balanced, as warnings, adopted by directory | [linting.md](./resources/linting.md) |

## The smells that cost the most time

| Symptom | Usual cause | Read |
| --- | --- | --- |
| `performance.now() + 180_000` — 180 thousand what? | A duration with no unit and no name | [magic-numbers.md](./resources/magic-numbers.md) |
| `setTimeout(fn, 86400000)` runs daily, nobody dares change it | Milliseconds computed in someone's head once | [magic-numbers.md](./resources/magic-numbers.md) |
| `if (status === 3)` in three files, meaning drifts | A status code never became a named constant or union | [magic-strings.md](./resources/magic-strings.md) |
| `render(true, false, true)` at the call site | Boolean flag arguments; the booleans carry no meaning | [magic-strings.md](./resources/magic-strings.md) |
| `const d = 5000` then `setTimeout(fn, d)` | Abbreviation dropped the unit the reader needed | [naming.md](./resources/naming.md) |
| A 200-line function where the bug hides in the middle | Setup, logic, and formatting at mixed abstraction levels | [functions.md](./resources/functions.md) |
| Code indented six levels, happy path at the bottom right | Missing guard clauses; errors handled by nesting | [nesting-and-conditionals.md](./resources/nesting-and-conditionals.md) |
| `if (!isNotEmpty(x))` needs three reads | Stacked negations; the name or the condition should flip | [nesting-and-conditionals.md](./resources/nesting-and-conditionals.md) |
| A comment says "returns null on error"; the code throws | The comment was true once and never updated | [comments-and-dead-code.md](./resources/comments-and-dead-code.md) |
| 80 lines of commented-out code "just in case" | Git already keeps it; the block only confuses search | [comments-and-dead-code.md](./resources/comments-and-dead-code.md) |

## Review checklist

- [ ] No bare literal carries time, retries, thresholds, limits, money, rates, or sizes without a name or a unit-and-why note at the use site
- [ ] Named constants are named for meaning and unit (`SESSION_TIMEOUT_MS`), not for their value (`TIMEOUT_180000`)
- [ ] `0`, `1`, `-1`, labelled properties, and self-evident math were left alone
- [ ] Strings compared in logic are named constants, enums, or union members — never retyped literals
- [ ] No call passes bare booleans whose meaning is invisible at the call site
- [ ] Names carry their unit and do not lie about type, side effects, or contents
- [ ] Each function does one thing at one level of abstraction; length and nesting read as smell, not law
- [ ] Conditions read in the positive where they can; no nested ternaries in prose-like code
- [ ] Every comment adds why, a constraint, or a warning — none restate the code, none are stale
- [ ] No commented-out code, no unreachable branches, no TODO without an owner or issue
