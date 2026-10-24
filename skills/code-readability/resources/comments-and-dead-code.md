# Comments and dead code

Code says what happens. A comment earns its place only by saying something the code cannot: why, a constraint from outside the code, or a warning. Everything else a comment tries to do, a name or a restructure does better and cannot go stale.

Sources are in [SOURCES.md](../SOURCES.md).

## Contents

- Comments that earn their place
- Comments that do not
- The documentation-nearby fallback, honestly used
- Dead code
- TODOs
- Checklist

## Comments that earn their place

Keep, and write more of, comments that carry:

| Kind | Example |
| --- | --- |
| Why, not what | `// Retry once: the gateway drops the first connection after a deploy.` |
| An external constraint | `// 10 MiB cap matches the gateway limit; raising it here alone will 413.` |
| A warning about a non-obvious consequence | `// Order matters: the cache must warm before listeners attach.` |
| A link to the source of truth | `// Tax per the 2026 schedule, finance doc linked in TAX.md.` |
| Why a simpler-looking alternative is wrong | `// Not a Map: keys must serialize to JSON for storage.` |

That last kind is the most valuable comment in a codebase: it stops the next reader from "simplifying" the code back into the bug.

## Comments that do not

Delete or convert these on sight in code you touch:

- **Restating the code.** `// increment i` over `i++`, `// timeout` over a timeout literal. Restating a magic number ("// 5000 ms") is the same failure in miniature — see [magic-numbers.md](./magic-numbers.md).
- **Section banners and change logs.** `// --- utils ---`, `// fixed 2024-03 by Sam`. Git and the file's structure carry this; banners rot in place.
- **Commented-out code.** Delete it. Version control is the archive; a commented block still shows up in search, still gets half-read, and nobody can tell whether it is load-bearing. If it must be referenced, link the commit.
- **Stale comments.** A comment that contradicts the code is a lie the reader discovers only after trusting it. When code changes, its comments are part of the change; when you find a stale one, fixing or deleting it is in scope.
- **Apologies and hedges.** `// hacky but works`, `// TODO: clean up later` with no owner. Either fix it, or write what is actually wrong and what a fix needs (below).

The usual root cause of a restating comment is a name that failed. `// deadline in ms` above `const d = ...` is the signal to rename `d` to `deadlineMs`, not to keep both.

## The documentation-nearby fallback, honestly used

[magic-numbers.md](./magic-numbers.md) allows a unit-and-why comment instead of a named constant where a name cannot fit (config tables, protocol layouts, transliterated formulas). That allowance is narrow on purpose:

- The comment must give the **unit and the reason**: `// 180 s: matches the server session TTL`.
- A comment that gives only the unit (`// 180000 ms`) or only a label (`// timeout`) does not satisfy the rule. Convert it to a name, or finish the comment.
- The fallback never applies when the value is used twice. Two uses means the name has somewhere to live.

## Dead code

Dead code is not neutral: it is read, searched, and maintained as if alive, and it teaches readers that what they see might not run.

- Unreachable branches, unused exports, variables, and parameters: delete. Linters (`no-unused-vars` and friends, [linting.md](./linting.md)) catch the mechanical half.
- Feature-flag-off code with no removal date is dead code on a timer that never fires. A flag older than its stated rollout should be resolved — code deleted or flag removed — not left as a second, hidden program.
- "Kept for reference" implementations belong in git history or a linked document, never beside the live code where they compete for the reader's trust.

## TODOs

A TODO is a promise. Keep it only if it names what is undone, why it is deferred, and where the work is tracked:

PASS: `// TODO(#482): remove after the v2 API rollout; v1 clients still send cents as strings.`
FAIL: `// TODO fix`, `// TODO later`, `// FIXME` with nothing after it.

A TODO without an issue or owner is a wish. Either do the work, file it and cite it, or delete the comment.

## Checklist

- [ ] Every comment states why, an external constraint, a warning, or a source — none restate the code
- [ ] No comment contradicts the code beside it
- [ ] Unit-and-why comments are used only where a named constant cannot fit, and never for a twice-used value
- [ ] No commented-out code survives a change; history lives in git
- [ ] No unused exports, unreachable branches, or undated flag-off paths left behind
- [ ] Every TODO cites an issue or owner and says why it is deferred
