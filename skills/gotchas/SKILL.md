---
name: gotchas
description: >
  Catches silent bugs that look right in a diff, compile clean, and pass
  happy-path tests: 200 OK HTML stand-ins, swallowed exceptions, state
  written before the async point of no return, module singletons shared
  across requests, Web APIs that fail without throwing, fresh-clone gaps,
  and tests that pass for the wrong reason. Use when reviewing a diff,
  before opening a PR, when debugging "works in dev, breaks on a clean
  clone or in prod", or when the user asks for gotchas, footguns, blind
  spots, or what could go wrong. Not for type-system flags
  (typescript-safety), main-thread frame time (spa-performance), React
  re-renders (react-performance), or OWASP rules (api-security).
---

# Gotchas

The bugs that survive `tsc`, the linter, and the first green test run. Both humans and LLMs miss them for the same reason: the code is locally well-formed, and the failure lives in the gap between what a call looks like it does and what the runtime, network, or clean checkout actually does.

**If a failure path returns a valid-looking value, you do not have error handling. You have a bug that hides.**

**If state changes before the work that can fail, a failure leaves the UI and the data talking about different worlds.**

Source checks and dates: [SOURCES.md](SOURCES.md).

## Procedure

1. Read the diff or the files under review, plus `.gitignore`, `package.json` scripts, and the test files that cover the change.
2. Walk the five lenses in the table below. Only load the resource file for a lens that touches the code in front of you.
3. For every async action, trace two paths on paper before running anything:
   - What happens when the network, parser, or worker rejects halfway through?
   - What happens when the user clicks twice and the first call settles after the second?
4. Check the proof. A green test counts only if it ran after the last edit, hit the real code path, and fails when the fix is reverted.

```
read the diff
      |
      +-- calls fetch, fs, clipboard, timers, URL, worker, JSON? --> web-and-runtime.md
      |
      +-- sets state around an await, or shares module state? ----> state-and-async.md
      |
      +-- has try/catch, fallbacks, defaults, or quiet returns? ---> silent-failures.md
      |
      +-- touches build, public/, env, hooks, or package.json? ----> fresh-clone.md
      |
      +-- adds or edits tests, mocks, or assertions? --------------> false-green-tests.md
```

## Where to read

| Lens | Resource |
| --- | --- |
| Silent fallbacks, swallowed catches, partial batch drops, hidden UI actions | [silent-failures.md](./resources/silent-failures.md) |
| State committed before `await`, stale completions, module singletons across requests | [state-and-async.md](./resources/state-and-async.md) |
| `fetch` 200 HTML stand-ins, `FormData` headers, `URL` base rules, workers, Safari clipboard, `Date`, `sort` | [web-and-runtime.md](./resources/web-and-runtime.md) |
| Gitignored generated files, `.git` in `postinstall`, case-sensitive paths, hoisted imports, engines | [fresh-clone.md](./resources/fresh-clone.md) |
| Edited assertions, mocked units under test, 0-assertion tests, stale green runs, piped exit codes | [false-green-tests.md](./resources/false-green-tests.md) |

## The traps that slip past review most often

| Symptom | Usual cause | Read |
| --- | --- | --- |
| Missing file in `public/` reports `res.ok === true` in dev | Vite's SPA fallback returns `index.html` with `200 OK` and `text/html` when `Accept` allows `*/*` | [web-and-runtime.md](./resources/web-and-runtime.md) |
| Failed open or save leaves the UI showing the new name over the old document | Label, selection, or source ref was updated before `await parse()` instead of after commit | [state-and-async.md](./resources/state-and-async.md) |
| Feature works for three days, then someone notices the data is fake | `catch` returned sample data or `[]` instead of surfacing the failure | [silent-failures.md](./resources/silent-failures.md) |
| User A sees User B's session or filter under load | Helper hoisted a request-scoped object or cache to module scope during a refactor | [state-and-async.md](./resources/state-and-async.md) |
| Clicking a fast tab after a slow tab ends on the slow tab's data | Previous request was not aborted, or its `catch` / post-`await` path wrote state after losing the race | [state-and-async.md](./resources/state-and-async.md) |
| File upload fails on the server with "missing boundary" | Caller set `Content-Type: multipart/form-data` by hand on a `FormData` `fetch` | [web-and-runtime.md](./resources/web-and-runtime.md) |
| `new URL('/users', 'https://api.example.com/v1')` drops `/v1` | Leading slash in path or missing trailing slash on base URL | [web-and-runtime.md](./resources/web-and-runtime.md) |
| Copy to clipboard works in Chrome, throws `NotAllowedError` in Safari | `await` ran before `navigator.clipboard.write`, instead of passing a `Promise` inside `ClipboardItem` | [web-and-runtime.md](./resources/web-and-runtime.md) |
| `2026-10-23` displays as October 22 in US timezones | `new Date('YYYY-MM-DD')` parses as UTC midnight; `new Date(y, m - 1, d)` is local | [web-and-runtime.md](./resources/web-and-runtime.md) |
| `[10, 2, 1].sort()` returns `[1, 10, 2]` and mutates state in place | `Array.prototype.sort()` compares UTF-16 code units when given no comparator | [web-and-runtime.md](./resources/web-and-runtime.md) |
| `Object.fromEntries(formData)` loses multi-select values and files | Repeated keys collapse to the last one; convert with `formData.getAll(key)` | [web-and-runtime.md](./resources/web-and-runtime.md) |
| Removed toolbar button still fires when the user presses its key | The UI button was hidden, but the hotkey action or command entry stayed registered | [silent-failures.md](./resources/silent-failures.md) |
| `npm install` fails in a release tarball or Docker build | `prepare` or `postinstall` ran `husky` / `lefthook install` where `.git` does not exist | [fresh-clone.md](./resources/fresh-clone.md) |
| App works on the author's machine, fails on a reviewer's fresh clone | Code reads a gitignored file (`public/stress/`, local SQLite, `.env`) with no check or instruction | [fresh-clone.md](./resources/fresh-clone.md) |
| Build passes on macOS/Windows, fails in Linux CI with `Cannot find module` | File was renamed by case only (`Button.tsx` to `button.tsx`) without `git mv` | [fresh-clone.md](./resources/fresh-clone.md) |
| Bugfix PR is green, but the bug is still there in production | The test assertion was loosened to match the broken output, or the test mocked the broken function | [false-green-tests.md](./resources/false-green-tests.md) |

## Review checklist

- [ ] Every `catch` either rethrows with context, sets a visible error state, or documents why silence is safe
- [ ] No fallback returns fake or sample data that looks like live data
- [ ] State that describes the active resource updates only after the async load or mutation commits
- [ ] In-flight work is cancelled when superseded, and an aborted run writes no state in `then`, `catch`, or `finally`
- [ ] No request-scoped user, auth, or mutable query state lives at module scope on the server
- [ ] `fetch` checks both `response.ok` and, when probing static assets or binary files, `Content-Type`
- [ ] Removing a control from the UI also removes its keyboard shortcut and command-palette entry
- [ ] A fresh clone without gitignored build artifacts either generates them or disables the dependent controls with a clear hint
- [ ] Tests were run after the final edit, without piping away the exit code, and fail when the production fix is reverted
