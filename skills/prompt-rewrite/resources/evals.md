# Evals

Eight cases to run when this skill changes. Run each draft once with the skill and once without, on Haiku, Sonnet, and Opus. Keep an edit to the skill only if the rewrites get better on the checks below and no case gets worse.

| Case | Draft prompt | Repo state |
| --- | --- | --- |
| 1 | "add a loading state to the orders table" | A table component with a sibling that already has a skeleton |
| 2 | "make the dashboard faster" | A Next.js page with a slow data fetch and no perf tooling |
| 3 | "add an endpoint for orders" | An API folder with two existing routes and a Zod schema file |
| 4 | "In `src/lib/price.ts`, round `formatPrice` to 2 decimals like `formatTax` does. Proof: `npm test -- price` passes, with a new case for 1.005 that fails first." | The files and script exist |
| 5 | "fix the login bug" asked for a `claude -p` run in CI | A repo with an auth folder and a failing test in CI logs |
| 6 | "brief a subagent to find every place we read `process.env` directly" | A repo with a `config.ts` that wraps env |
| 7 | "update the README setup section" | A README whose install command no longer matches `package.json` |
| 8 | "just fix the typo in the header" (the user wants the task done, not a prompt) | Any repo |

## What a pass looks like

Cases 1 to 3:

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

Cases 4 to 8:

| Case | Pass |
| --- | --- |
| 4 | Says the draft is already good. Returns it with at most one line changed. |
| 5 | Asks no questions of a run that cannot answer. The prompt carries the failing test name, the proof, and what to do if the test itself looks wrong. |
| 6 | The brief names `config.ts` as what was already found, the search scope, and the shape of the list to send back. |
| 7 | Uses the Docs lens. The proof runs the setup steps from a fresh clone. Points at `plain-docs`. |
| 8 | Does not rewrite anything. Says this skill rewrites prompts and offers to just do the fix. |

## Recording results

Write the date, model, case, and pass or fail per check. A rewrite that fails "every path exists" fails the case, whatever else it gets right.

## Results

2026-10-22, Sonnet, fixture repos for the three cases. Baseline was a strong hand-written meta prompt (the four questions with "deeper, not bigger"), not a bare request.

| Check | Skill, first run | Baseline | Skill, after fixes |
| --- | --- | --- | --- |
| Shape matches size | 3 of 3 | 1 of 3 (case 1 ran to 50 lines) | 3 of 3 |
| Scope unchanged | 3 of 3 | 1 of 3 (added error states, extra endpoints) | 3 of 3 |
| Every command seen in the repo | 0 of 3 (wrote `pnpm` with no lockfile) | 3 of 3 | 3 of 3 |
| Proof can fail (tests fail first, noise, stubs named) | 0 of 3 | 3 of 3 | 3 of 3 |
| Names an exemplar file | 3 of 3 | 2 of 3 | 3 of 3 |

The baseline's proof ideas (tests fail first, gains inside noise do not count, a stubbed auth makes access tests hollow) were added to the skill after the first run. Not yet run on Haiku or Opus.

Cases 4 to 8 were added 2026-11-01 with the already-good shape, the Where it runs table, and the Docs and Planning lenses. They have not been run yet.
