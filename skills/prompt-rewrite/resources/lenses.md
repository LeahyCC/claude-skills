# Lenses

One block per kind of task. Each answers the four questions. Use them as a starting point, then ground every line in what the repo actually has. A tool listed here goes into the prompt only if the project uses it or can add it cheaply. Tests named under a method are kept only where the repo already keeps tests for that kind of change; otherwise they are scratch checks the run can throw away.

| Task | Jump |
| --- | --- |
| Refactoring | [Refactoring](#refactoring) |
| Performance | [Performance](#performance) |
| UI (how it looks) | [UI](#ui) |
| UX (how it works for a person) | [UX](#ux) |
| API design | [API](#api) |
| Frontend structure and state | [Frontend](#frontend) |
| Debugging | [Debugging](#debugging) |
| Tests | [Testing](#testing) |
| Security | [Security](#security) |
| Accessibility | [Accessibility](#accessibility) |

## Refactoring

- **Pros do:** pin current behaviour with tests before moving anything, then take small steps that each keep tests green. This is one of the few places where ordered steps belong in the prompt. They pick what to refactor by where change and bugs pile up, not by what looks ugly.
- **Raw material:** the code, an already clean module in the same repo as the exemplar, `git log` churn per file (the files changed most often), the bug history, call sites of the thing being changed, coverage for it.
- **Method and tools:** characterization tests (Feathers), Fowler's named refactorings, one per commit. `tsc --noEmit`, the linter, `knip` for unused exports, `madge` or `dependency-cruiser` for import cycles, `ts-morph` or `jscodeshift` for mechanical changes across many files.
- **Proof:** the same test suite passes before and after with no test edits. Type check clean. Public API unchanged (an API report or the exports list diffed). Cycle count or unused-export count goes down.

## Performance

- **Pros do:** name the moment a person feels (load, a click, typing, a scroll), measure it, set a budget, change one thing, measure again. Keep "one change at a time" here; it is noise in most other prompts.
- **Raw material:** a recorded performance trace, field data (real-user p75), a network waterfall. Not a Lighthouse score or "it feels slow".
- **Method and tools:** Chrome DevTools Performance panel, the `web-vitals` library (LCP, INP, CLS), Long Animation Frames, React Profiler, a bundle analyser. A scripted Playwright run repeated several times so numbers are comparable.
- **Proof:** the named metric from repeated runs, before and after, same device and build, median and worst case. A gain smaller than the spread between the baseline runs is not a gain. Pin the current output (a test on the rendered data) before optimizing, so faster does not mean wrong. Repo skills: `spa-performance`, `react-performance`.

## UI

- **Pros do:** build from the design system's tokens and check every state, not just the happy one.
- **Raw material:** the design file or tokens, screenshots of what exists now, real content (the longest name, an empty list, an error from the API).
- **Method and tools:** a state list per component (empty, loading, error, overflow, long text, disabled, focus). Storybook or a test page per state. Playwright screenshots at phone, tablet, and desktop width.
- **Proof:** screenshot diff at three widths with zero unexpected changes. No hard-coded colours or spacing outside the tokens (grep). axe reports no violations.

## UX

- **Pros do:** start from the person's task and watch where it breaks. Walk the whole flow, start to finish, not one screen.
- **Raw material:** session recordings, support tickets, funnel numbers per step, the user's own words. Not "users want X".
- **Method and tools:** task analysis, a cognitive walkthrough of each step, Nielsen's 10 heuristics as a checklist. Walk it in a real browser.
- **Proof:** a scripted walkthrough that reaches the goal with fewer steps or no dead ends. Funnel drop-off at the bad step goes down. Five users finishing the task (most problems show up by five). Repo skill: `ux-copy` for the words on screen.

## API

- **Pros do:** write the contract first, from how callers actually use it. Settle errors, pagination, versioning, and idempotency up front.
- **Raw material:** the callers' code, real request and response samples or logs, the existing schema (OpenAPI, GraphQL SDL, Zod).
- **Method and tools:** an OpenAPI or SDL contract, RFC 9457 problem details for errors, idempotency keys for writes that can be retried, cursor pagination. Spectral to lint the spec. Schemathesis to fuzz it. Pact for consumer contract tests.
- **Proof:** Spectral passes, consumer contract tests pass, fuzzing finds no 500s, existing callers compile against the new types. Access and transaction tests run against the real auth and a real test database; a stubbed `requireUser` or mocked `db` passes them regardless, so the prompt must say so. Repo skills: `api-security`, `nextjs-app-router`.

## Frontend

- **Pros do:** draw where data lives and how it flows before moving components. Keep server data and UI state apart.
- **Raw material:** the component tree, the network calls a page makes, where each piece of state is owned.
- **Method and tools:** React DevTools, the data library's devtools (TanStack Query, SWR), the Network panel. A short diagram of state ownership before and after.
- **Proof:** tests pass, type check clean, the page makes the expected number of requests (Network panel or a Playwright request count), no extra re-renders in the Profiler for the changed interaction.

## Debugging

- **Pros do:** reproduce first, shrink to the smallest case, list hypotheses, kill them one by one. Never fix what they cannot reproduce.
- **Raw material:** the exact error text, stack trace, logs around the time, the input that triggers it, the last version that worked.
- **Method and tools:** a failing test that reproduces it, `git bisect` between good and bad, logging or a debugger at the boundary where data goes wrong.
- **Proof:** the new test fails before the fix and passes after. The original repro no longer reproduces. The rest of the suite still passes. Before each change, the evidence must point at that specific cause, not just at the area.

## Testing

- **Pros do:** test behaviour a person or caller depends on, aim tests at where bugs have happened, and check the tests can actually fail.
- **Raw material:** past bugs, coverage report, the public surface of the module.
- **Method and tools:** the project's runner (Vitest, Jest, Playwright), property-based tests with `fast-check` for parsers and maths, mutation testing with Stryker.
- **Proof:** each new test fails when the bug it guards is put back. Mutation score goes up. No test asserts on implementation details that break on a safe refactor.

## Security

- **Pros do:** list who can call what, then try to break each check as an attacker would. For an audit, ask for every finding and rank them in a second pass.
- **Raw material:** the route list, the auth and permission code, the data each route returns.
- **Method and tools:** OWASP API Top 10 and ASVS as checklists, `semgrep`, dependency audit, a test per access rule using a second user's token.
- **Proof:** a test where user B cannot read or change user A's data, run and passing. Scanners clean or each finding answered. Repo skill: `api-security`.

## Accessibility

- **Pros do:** use the page with a keyboard only and a screen reader, not just run a scanner. For an audit, ask for every finding and rank them in a second pass.
- **Raw material:** the rendered page, its accessibility tree, the components with custom interaction.
- **Method and tools:** axe (DevTools or `@axe-core/playwright`), keyboard-only walkthrough, VoiceOver or NVDA, WCAG 2.2 AA criteria.
- **Proof:** axe reports zero violations, every action reachable and visible by keyboard, the screen reader announces name, role, and state. Repo skill: `wcag-accessibility`.
