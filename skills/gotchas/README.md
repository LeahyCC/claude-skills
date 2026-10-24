# gotchas

Silent bugs that compile, pass lint, and survive a quick read of the diff: `200 OK` HTML fallbacks, state committed before `await`, swallowed errors, module singletons shared across requests, Web APIs that fail without throwing, fresh-clone traps, and tests that go green for the wrong reason.

TypeScript compiler flags stay in [typescript-safety](../typescript-safety/). Main-thread frame time stays in [spa-performance](../spa-performance/). OWASP access control and injection stay in [api-security](../api-security/).

## Install

```bash
npx skills add LeahyCC/claude-skills@gotchas
```

## What it does

Use it before opening a PR, when reviewing an agent's diff, or when debugging a bug where every piece of code looks reasonable on its own. The entry file routes by what the diff touches. Each resource owns one failure class, with the broken pattern next to the fix.

Version 0.1.0. Five resources are written.

## Coverage

| Resource | Status | Topics |
| --- | --- | --- |
| [silent-failures.md](./resources/silent-failures.md) | written | Swallowed catches, fake fallback data, partial batch drops, hidden UI controls whose hotkeys still fire, persistence that restores half the state |
| [state-and-async.md](./resources/state-and-async.md) | written | Point-of-no-return state updates, stale async completions, `AbortController` gaps, module-scope singletons leaking across requests, reading unindexed live state |
| [web-and-runtime.md](./resources/web-and-runtime.md) | written | `fetch` 200 HTML stand-ins, `FormData` boundaries, `new URL` base paths, `Object.fromEntries(formData)`, Safari `ClipboardItem`, worker `window` globals, `Date` ISO parsing, `Array.prototype.sort`, `JSON.stringify` |
| [fresh-clone.md](./resources/fresh-clone.md) | written | Gitignored generated assets, `.git` hooks in archives and Docker, macOS/Windows case-insensitive renames, phantom hoisted imports, Node `engines` pins |
| [false-green-tests.md](./resources/false-green-tests.md) | written | Weakened assertions, mocking the unit under test, 0-assertion async tests, stale green claims after later edits, exit codes lost behind pipes |

5 resource files. 5 written.

## What's different

| Typical review advice | This skill |
| --- | --- |
| "Add error handling" | Forbid `catch` blocks that return sample data or `[]` to make a broken call look working. |
| "Check `response.ok`" | Check `Content-Type` too when probing static files: SPA dev servers return `200 text/html` for missing paths. |
| "Use `AbortController`" | Also guard state after `await` and in `catch`: an aborted or superseded run must not overwrite the document that stayed on screen. |
| "All tests pass" | Verify the test ran after the last edit, did not loosen the assertion, and fails when the code change is reverted. |

Checked sources are in [SOURCES.md](./SOURCES.md).

## License

[MIT](../../LICENSE)
