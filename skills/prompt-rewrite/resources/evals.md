# Evals

Three cases to run when this skill changes. Run each draft once with the skill and once without, on Haiku, Sonnet, and Opus. Keep an edit to the skill only if the rewrites get better on the checks below and no case gets worse.

| Case | Draft prompt | Repo state |
| --- | --- | --- |
| 1 | "add a loading state to the orders table" | A table component with a sibling that already has a skeleton |
| 2 | "make the dashboard faster" | A Next.js page with a slow data fetch and no perf tooling |
| 3 | "add an endpoint for orders" | An API folder with two existing routes and a Zod schema file |

## What a pass looks like

| Check | Case 1 | Case 2 | Case 3 |
| --- | --- | --- | --- |
| Shape matches size | Short, 3 to 6 lines | Full | Full or interview |
| Every path exists in the repo, or is a marked placeholder | yes | yes | yes |
| Names an exemplar file from the repo | the sibling table | any page that loads fast, or a placeholder | an existing route |
| The proof is a runnable command or a number | test + typecheck | a named metric with baseline and target | contract or route test, typecheck |
| Scope unchanged, no extra features | yes | yes | yes |
| No filler ("robust", "best-in-class", "double-check") | yes | yes | yes |
| Asks questions only where the answer changes the prompt | none needed | target number | auth and pagination, if not in the repo |

## Recording results

Write the date, model, case, and pass or fail per check. A rewrite that fails "every path exists" fails the case, whatever else it gets right.
