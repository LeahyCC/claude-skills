# code-readability

Code a cold reader can follow: no floating numbers or strings without a name or a unit-and-why note nearby, names that carry units and do not lie, small single-purpose functions, shallow nesting, honest comments, and no dead code. Balanced by default — `0`, `1`, `-1`, labelled properties, tests, and self-evident math are exempt, so the rule keeps its credibility.

Type safety is in [typescript-safety](../typescript-safety/). UI text is in [ux-copy](../ux-copy/).

## Install

```bash
npx skills add LeahyCC/claude-skills@code-readability
```

Or inside Claude Code:

```text
/plugin install code-readability --marketplace LeahyCC/claude-skills
```

## What it does

Use it when writing or reviewing code, naming a constant, or adding a timeout, retry, threshold, limit, or percentage. The entry file is a procedure and a smell table. Each resource owns one topic, with FAIL and PASS samples and a "use when / not when" for each pattern.

The anchor rule: `const deadline = performance.now() + 180_000` fails — a duration with no unit and no name. `const SESSION_TIMEOUT_MS = 180_000` beside it passes. Where a name cannot fit (a config table, a protocol layout), a comment with the unit and the reason passes instead; a comment that merely restates the number does not.

Version 0.1.0. Seven resources.

## Coverage

| File | Topics |
| --- | --- |
| [magic-numbers.md](./resources/magic-numbers.md) | Floating/magic numbers: what must be named, what is exempt, the three naming shapes, the unit-and-why comment fallback, where constants live |
| [magic-strings.md](./resources/magic-strings.md) | Magic strings, boolean flag arguments, stringly-typed values that should be unions |
| [naming.md](./resources/naming.md) | Units in names, names that lie, boolean names, name length vs scope, abbreviations |
| [functions.md](./resources/functions.md) | One thing at one level of abstraction, length as a smell not a law, arguments and options objects, side effects in the open |
| [nesting-and-conditionals.md](./resources/nesting-and-conditionals.md) | Guard clauses, naming compound conditions, negation, ternaries |
| [comments-and-dead-code.md](./resources/comments-and-dead-code.md) | Comments that earn their place, restating and stale comments, commented-out and dead code, TODO discipline |
| [linting.md](./resources/linting.md) | ESLint `no-magic-numbers` tuned balanced, companion complexity/depth/size rules, per-directory adoption |

7 resource files.

## What's different

| Typical readability advice | This skill |
| --- | --- |
| "Never use magic numbers" | Balanced exemptions (`0`, `1`, `-1`, labelled props, fixtures, self-evident math) so the rule is obeyed where it matters |
| "Add a comment" | A comment passes only with unit + why; restating the literal fails |
| "Functions should be ≤ N lines" | Length is a smell trigger with a name-the-section test, not a cap to chop to |
| "Turn on the linter" | `warn` first, per directory, promote to `error` when clean — with each option explained |
| Rules without limits | Each pattern says when not to use it |

Checked sources are in [SOURCES.md](./SOURCES.md).

## License

[MIT](../../LICENSE)
