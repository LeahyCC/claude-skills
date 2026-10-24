# Floating (magic) numbers

A floating number is a literal whose meaning a reader cannot recover from the code around it: what it counts, in what unit, and why that value. The fix is a name. A nearby comment is the fallback, and only a comment that carries the unit and the reason counts.

Sources are in [SOURCES.md](../SOURCES.md).

## Contents

- The rule, balanced
- What must be named
- What is exempt
- Name it: the three shapes
- Document it nearby: when a name cannot fit
- Where the constant lives
- Checklist

## The rule, balanced

> A numeric literal in an expression must be self-evident from its context, named, or documented nearby with its unit and reason.

Self-evident is a property of the context, not the number. `5000` is obvious inside `{ timeoutMs: 5000 }` and opaque inside `setTimeout(fn, 5000)`. Judge the use site, not the digits.

FAIL. Three readers, three guesses — seconds, frames, retries?

```ts
const deadline = performance.now() + 180_000
if (retries > 5) await sleep(250)
if (score >= 0.85) promote()
```

PASS. Each number now answers "how much of what, and why":

```ts
const SESSION_TIMEOUT_MS = 180_000 // 3 min, matches the server session TTL
const deadline = performance.now() + SESSION_TIMEOUT_MS

const MAX_RETRIES = 5
const RETRY_DELAY_MS = 250
if (retries > MAX_RETRIES) await sleep(RETRY_DELAY_MS)

const PROMOTION_THRESHOLD = 0.85 // set by the ranking team, see RANKING.md
if (score >= PROMOTION_THRESHOLD) promote()
```

## What must be named

Name the literal when it carries any of these and the context does not already label it:

| Carries | Examples of bare literals to name |
| --- | --- |
| Time | `180_000`, `86400000`, `setTimeout(fn, 300)`, TTLs, poll intervals, animation durations |
| Retries and attempts | `> 5`, backoff bases and caps |
| Thresholds and limits | `>= 0.85`, max file size, page size, rate limits, quota |
| Money and rates | `0.07` tax, `1.5` multiplier, prices in cents |
| Sizes and counts from a spec | `4096` buffer, `65536`, protocol field widths |
| Domain constants | gravity, conversion factors, business rules ("free shipping over 5000 cents") |

Also name a literal that appears twice, even an innocent-looking one. Two `250`s that mean the same thing today drift apart tomorrow. One name, one place to change.

## What is exempt

Do not flag these. Flagging them is how the rule gets ignored.

| Exempt | Why |
| --- | --- |
| `0`, `1`, `-1` in ordinary arithmetic, indexing, comparison | Identity values; `length - 1`, `i + 1`, `count === 0` read instantly |
| A literal labelled by its slot: `{ timeoutMs: 5000 }`, `maxRetries: 3` in a config object | The property name already carries meaning and unit |
| Literals inside the named constant's own definition | `const MS_PER_DAY = 86_400_000` is the fix, not the problem |
| Self-evident math: `width / 2` (centre), `n * 100` (percent), `deg * Math.PI / 180` | The formula is the explanation |
| Array and object literal data, enum-like tables, test fixtures and expected values | The surrounding label names the data; a test's `expect(total).toBe(4200)` states the case |
| Loop bounds tied to a just-declared structure, `for (const i of [0, 1, 2])`-style small fixed sets | Local and exhaustively visible |

Not exempt just because it is common: `86400000` is famous and still forces every reader to divide by 1000, then 60, then 60 — and to wonder whether leap handling was intended. Write `MS_PER_DAY` or `24 * 60 * 60 * 1000` under a name.

## Name it: the three shapes

**1. A module-level constant** — the default for values shared or tuned.

```ts
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024 // 10 MiB, the gateway limit
```

Write large values in computed form when the computation is the meaning (`10 * 1024 * 1024`), and with digit separators when it is not (`180_000`).

**2. A local constant** — when the value is used once but not self-evident.

```ts
function nextPollDelay(attempt: number): number {
  const BASE_DELAY_MS = 500
  const MAX_DELAY_MS = 30_000 // never poll slower than every 30 s
  return Math.min(BASE_DELAY_MS * 2 ** attempt, MAX_DELAY_MS)
}
```

A one-use named constant is not over-engineering; it moves the explanation from a comment into the code, where renames keep it true.

**3. A labelled property or option** — when the value is passed, let the callee's name label it.

FAIL: `connect(host, 22, 3)` — port? retries? timeout?
PASS: `connect(host, { port: 22, retries: 3 })` — and if `22` there means "the SSH default the infra team chose", it still earns a name, because the choice, not the number, is the information.

## Document it nearby: when a name cannot fit

Some code cannot hold a new constant without distortion: a dense config table, a binary layout, a transliterated formula from a spec. Then a comment at the use site may carry the explanation instead — if it gives **unit + why**.

PASS:

```ts
// 180 s: matches the server session TTL; longer strands the socket.
deadline = performance.now() + 180_000
```

FAIL — these document nothing:

```ts
// 180000 milliseconds          <- restates the literal in words
deadline = performance.now() + 180_000 // timeout   <- "timeout" is the variable's job, not a reason
```

A restating comment is worse than none: it looks documented, so the next reader stops asking. If the comment cannot say why this value, that is the signal to name the constant and put the why on its definition, once.

## Where the constant lives

- Used in one function: inside that function, at the top.
- Used in one file: top of the file, grouped with its siblings.
- Used across files, or tuned per environment: the module's existing config/constants home. Do not create a global `constants.ts` grab-bag; a constant belongs with the code that would change when its reason changes.
- Name for meaning and unit, never for value: `SESSION_TIMEOUT_MS`, not `TIMEOUT_180000`. When the value changes, a value-named constant starts lying.

Branding time and money units into the type system (`Cents`, branded `Ms`) is [typescript-safety](../../typescript-safety/) territory; naming is the readability floor and is always required, branding is the extra safety when mix-ups are likely.

## Checklist

- [ ] Every duration, retry, threshold, limit, rate, and spec size is named or carries unit + why at the use site
- [ ] No comment merely restates its literal (`// 5000 ms` over `5000`)
- [ ] The same meaning never appears as a bare literal twice
- [ ] Constants are named for meaning + unit, defined where their reason would change them
- [ ] `0`, `1`, `-1`, labelled properties, fixtures, and self-evident math were left alone
