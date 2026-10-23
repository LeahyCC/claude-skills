# Examples

Paths and commands below stand for what step 1 found in the repo. In a real rewrite they must be the project's own.

| Draft | Shape |
| --- | --- |
| [Short: "add a loading state to the orders table"](#short-add-a-loading-state-to-the-orders-table) | Short |
| [Performance: "make the dashboard faster"](#performance-make-the-dashboard-faster) | Full |
| [Refactoring: "clean up OrderForm, it's a mess"](#refactoring-clean-up-orderform-its-a-mess) | Full, ordered steps |
| [UX: "improve the checkout UX"](#ux-improve-the-checkout-ux) | Full, plan gate |

## Short: "add a loading state to the orders table"

The diff fits in one sentence, so the rewrite stays short.

```text
Add a loading state to src/components/OrdersTable.tsx while useOrders() is fetching.
Follow src/components/CustomersTable.tsx, which already shows a skeleton row set.
Proof: run `pnpm test OrdersTable` and `pnpm typecheck` and show the output.
```

## Performance: "make the dashboard faster"

- **Pros do:** name which moment is slow and set a budget. The draft never says load or interaction.
- **Raw material:** a recorded trace of opening the dashboard, not a Lighthouse score.
- **Tools:** DevTools Performance panel, `web-vitals`, React Profiler, a repeated Playwright run.
- **Proof:** LCP and INP from five runs, before and after, same build.

```xml
<context>
/dashboard in this Next.js app is used daily by ops staff on mid-range laptops. They report it is slow to show data after login.
</context>

<raw_material>
- app/dashboard/page.tsx and the components it imports
- A Performance trace of a cold load of /dashboard on a production build (`pnpm build && pnpm start`)
- The network waterfall for the same load
Quote the three longest tasks and the slowest request before proposing anything.
</raw_material>

<task>
Cut the time until dashboard data is visible.
</task>

<tools>
DevTools Performance and Network panels, the web-vitals library, React Profiler, the react-performance skill.
Measure, change one thing, measure again.
</tools>

<proof>
- LCP on /dashboard, median of 5 Playwright runs, goes from <baseline> to under 2.5 s
- INP for the filter dropdown stays under 200 ms
- `pnpm test` and `pnpm typecheck` pass unchanged
Show the before and after numbers and the commands that produced them.
</proof>

<constraints>
- Do not change what data is shown or the layout; ops staff rely on both.
- Non-goal: bundle work on other routes. Note anything you spot there as a follow-up.
</constraints>

<output>
A before and after table per metric, the diff, and follow-ups.
</output>
```

Questions worth asking first: is 2.5 s the right target, and does field data exist?

## Refactoring: "clean up OrderForm, it's a mess"

- **Pros do:** pin behaviour with tests before moving code. "Mess" needs a measurable meaning.
- **Raw material:** the file, its call sites, `git log --follow` on it, current tests, a clean form in the same repo.
- **Tools:** characterization tests, one Fowler refactoring per commit, `tsc --noEmit`, `knip`.
- **Proof:** the same tests pass with no test edits; the props type is unchanged.

Order matters here (tests before moves), so this one keeps ordered steps.

```xml
<context>
src/components/OrderForm.tsx is 900 lines and the file most often touched in bug fixes. New fields take a day to add.
</context>

<raw_material>
- src/components/OrderForm.tsx and every file that imports it
- `git log --oneline --follow src/components/OrderForm.tsx | head -30`
- Existing tests: src/components/__tests__/OrderForm.test.tsx
- Exemplar: src/components/SignupForm.tsx, which already keeps fields in a config array
</raw_material>

<task>
Restructure OrderForm so adding a field touches one place, with no change in behaviour.
Plan first and wait for my approval before editing.
</task>

<tools>
1. Add characterization tests for any behaviour not covered: each validation message, the submit payload, the error state.
2. Then apply one named refactoring per commit (Extract Function, Move Function). Run tests after each.
Also available: `pnpm typecheck`, `npx knip`.
</tools>

<proof>
- The suite passes before and after with no edits to existing tests
- `pnpm typecheck` and `npx knip` clean
- OrderForm's exported props type is identical (show the diff of the type)
</proof>

<constraints>
- Do not change markup or class names, because visual tests depend on them.
- Non-goal: switching form libraries.
- If an existing test looks wrong, stop and say so; do not change it to make the refactor pass.
</constraints>

<output>
The commit list with one line each, and the final file layout.
</output>
```

## UX: "improve the checkout UX"

- **Pros do:** find the step where people drop out and walk the whole flow, not polish one screen.
- **Raw material:** funnel numbers per step, support tickets about checkout, a recording or two.
- **Tools:** cognitive walkthrough per step, Nielsen's heuristics, a real browser at phone width.
- **Proof:** a Playwright run that completes checkout with fewer inputs; drop-off at the worst step after release.

```xml
<context>
Checkout has four steps. Analytics show most drop-off at the shipping step. Most users are on phones.
</context>

<raw_material>
<funnel>
<paste the per-step funnel export>
</funnel>
<tickets>
<paste 5 to 10 support tickets tagged checkout>
</tickets>
- The flow: app/checkout/**. Walk it at 390 px width in a real browser and screenshot each moment of doubt.
</raw_material>

<task>
Reduce drop-off at the shipping step.
Plan first and wait for my approval before editing.
</task>

<tools>
Playwright or the browser tool for the walkthrough, Nielsen's 10 heuristics as the checklist, the ux-copy skill for error and label text, axe for regressions.
</tools>

<proof>
- A Playwright test completes checkout at 390 px with no layout overflow
- The shipping step needs fewer inputs or decisions than before (count both)
- axe reports no new violations
Show the screenshots and the test output.
</proof>

<constraints>
- Do not change pricing, the payment provider, or step order without saying why first.
</constraints>

<output>
The walkthrough notes, what you changed and why, and what to watch in analytics after release.
</output>
```

Questions worth asking first: can you paste the funnel and tickets, and is step order open to change?
