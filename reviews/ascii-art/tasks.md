# ASCII art skill tasks and acceptance criteria

Written 2026-10-24, before any model run. Run each prompt against Claude with the skill and without it. Score each criterion 0 or 1. One run per task is exploratory, not a statistical estimate.

Status: **not run.** Model runs need Colin's approval first. The automatic checks in `checks/check-skill.mjs` run in CI and do not need a model.

"Passes the checker" below means the drawing, saved to a file, gives exit 0 from `node skills/ascii-art/scripts/check.mjs`.

## Behaviour

| ID | Prompt | Acceptance criteria |
| --- | --- | --- |
| A1 | "Draw how a login request flows: browser to API to auth service to database, and what happens when the password is wrong." | Fenced as `text`. A sequence diagram or flowchart, not prose. Shows the failure path. Passes the checker. Under 80 wide. One line says what it shows. |
| A2 | "Add a diagram of the order states to the comment above `enum class OrderState`." Fixture: a C++ header with `Pending, Paid, Shipped, Cancelled` and a 100 column limit. | Plain ASCII only. No comment line ends in `\`. Within 100 columns. Passes the checker. |
| A3 | "Print a big DEPLOYED banner at the end of my deploy script." | Banner comes from `banner.mjs` (or figlet if installed), not typed by hand. Every letter reads correctly. Mentions `--ascii` or checks UTF-8 if the script may run in CI logs. |
| A4 | "Show these build times as a chart: build 42s, test 118s, lint 9s, deploy 63s." | Bar lengths come from `chart.mjs bar` or are exactly proportional. Bars start at zero. Each bar shows its value. Sorted, or the order is explained. |
| A5 | "Draw me a cat." | Fenced. Up to 20 lines and 40 wide. Recognisably a cat. No tabs or trailing spaces. |
| A6 | "Let's play tic-tac-toe, you go first." | Board has row and column labels. Full board redrawn after every move. Moves read as coordinates. |
| A7 | "Make me a maze to solve, and give me the answer after." | Maze from `art.mjs maze` with a `--seed`. The answer uses the same seed with `--solve`. Not drawn by hand. |
| A8 | "Add the src folder structure to the README." Fixture: a repo with nested `src/`. | Tree from `layout.mjs tree --paths` or `tree`, not typed. Each `│` stops at the last child. Fenced as `text`. |
| A9 | "Add a shrug kaomoji at the end of the PR description." | `¯\_(ツ)_/¯` in a code span, or with the backslash escaped, so it renders with both arms. |
| A10 | "Write the commit message for this refactor, with a small diagram of the new module layout." | Plain ASCII, 72 wide or less. No diagram line starts with `#`. Passes the checker. |

## Selection

The skill should load for the first ten and not for the last ten.

| ID | Prompt | Should load |
| --- | --- | --- |
| S1 | Draw an ASCII diagram of how these services talk to each other | yes |
| S2 | Sketch the folder structure as a tree for the README | yes |
| S3 | Make a big banner that says LAUNCH DAY for my terminal | yes |
| S4 | Show these numbers as a bar chart in the terminal | yes |
| S5 | Draw a little ASCII cat for my Slack status | yes |
| S6 | Give me a sparkline of last week's error counts for the standup notes | yes |
| S7 | Let's play chess in the chat, draw the board | yes |
| S8 | Generate a maze I can print for my kid | yes |
| S9 | Put a box around this warning in the CLI output | yes |
| S10 | What's the kaomoji for flipping a table? | yes |
| S11 | Make an SVG logo for the app | no (rendered image) |
| S12 | Build a Recharts line chart of signups for the dashboard | no (HTML chart, dataviz) |
| S13 | Create a Figma diagram of the user flow | no (figma) |
| S14 | Turn on `noUncheckedIndexedAccess` and fix the errors | no (typescript-safety) |
| S15 | Rewrite this README so it is shorter | no (plain-docs) |
| S16 | Check this table meets WCAG contrast | no (wcag-accessibility) |
| S17 | Write the error message for a failed upload | no (ux-copy) |
| S18 | Generate a photo of a cat in a spacesuit | no (image generation) |
| S19 | Convert this markdown table to CSV | no (data conversion) |
| S20 | Fix the flaky Playwright test in `checkout.spec.ts` | no |
