# Validation evidence and limits

Run date: 2026-10-22. Author-graded against the criteria in [tasks.md](./tasks.md), which were written before the run. One run per prompt, so this is exploratory, not a statistical result.

## Setup

Claude Code 2.1.292 on Colin's subscription, model `claude-opus-5-5`, chosen to match his default. Each prompt ran as its own `claude -p` process in a fresh folder. Settings were project-only, with no MCP servers and auto-memory off. Tools were limited to Read, Glob, Grep, and Skill, with no edits, shell, or network. Budgets were capped at $1 per task prompt and $0.40 per selection prompt. Colin's personal skills did not load, which was checked in the session's init record. The skill was copied into `.claude/skills/webgpu` for the "with" runs and left out for the "without" runs. Fixtures are small source folders with the bug each task describes.

Raw outputs, skill calls, files read, and estimated costs are in [evaluation-results.json](./evaluation-results.json). Total estimated usage across both passes was about $4.95.

## Tasks

| Task | With skill | Without | What differed |
| --- | --- | --- | --- |
| T1 black canvas | 4/4 | 2/4 | Both found the `MAP_READ \| UNIFORM` usage and added a listener. Only the skill run added labels and said the first error is the real one. |
| T2 vec3 layout | 3/3 | 3/3 | Both gave offsets 0 and 16, size 32, and fixed the packing. The skill run pointed at the layout script but had no shell to run it. |
| T3 React Strict Mode | 4/4 | 4/4 | Both added a cancel flag after each await and destroyed the late device. |
| T4 WebGL depth range | 3/3 | 3/3 | Both named the -1..1 to 0..1 change and `perspectiveZO`. |
| T5 auto layout | 2/2 | 2/2 | Both moved to an explicit shared layout. The skill run also added labels, async creation with `Promise.all`, and a `catch`. |
| T6 blank page on laptops | 3/3 | 1/3 | Both filtered features. Only the skill run caught a rejected device and returned a logged reason for a fallback. |
| **Total** | **19/19** | **15/19** | |

The model without the skill was already strong on layout, React, depth range, and auto layouts. The skill's measurable gain was on silent failure: labels, reading the first error, and failing to a fallback with a reason. Skill runs also stated how far they had checked the code, which the skill asks for. Skill runs cost more, roughly $0.10 to $0.16 against $0.06.

## Other models

The six tasks were rerun on Sonnet 5.5 and Haiku 4.5 the same day, with the same setup and the committed runner. Estimated cost was $1.20.

| Model | With skill | Without |
| --- | --- | --- |
| Opus 5.5 | 19/19 | 15/19 |
| Sonnet 5.5 | 18/19 | 16/19 |
| Haiku 4.5 | 12/19 | 9/19 |

- **Sonnet.** Same pattern as Opus, with smaller gaps. Neither Sonnet run said the first error is the real one in T1. With the skill it added labels, a fallback, and a logged reason in T6. Without the skill T6 filtered features but left the rejected device to the caller.
- **Haiku with and without the skill missed T1.** Both runs blamed a missing `entryPoint`, which is not needed for a module with one entry point per stage, and left the `MAP_READ` flag on the uniform buffer. The skill loaded, but Haiku did not act on its "black canvas" row.
- **Haiku without the skill gave a wrong T4 fix.** It flipped `depthCompare` to `'greater'` and kept the WebGL projection. With the skill it read render-basics.md and used `perspectiveZO`.
- **Haiku with the skill gave a weaker T2.** It switched the struct to six `f32` fields, which works, but never explained the 16-byte `vec3` alignment. Without the skill it explained the alignment and fixed the packing.
- **Haiku T6.** With the skill it filtered features and logged a reason. Without it, it kept the hard-required features, which is the bug.

Grading follows the same criteria as the Opus run. Partial answers that leave a step to the caller were scored 0 for that step, except where the answer named the exact catch to add.

## Selection

| Pass | Should load (10) | Should not load (10) |
| --- | --- | --- |
| 1, the shipped description | 9 loaded. S8 (struct offsets for a pasted struct) did not. | 0 loaded |
| 2, a reworded description naming struct offsets and padding | 8 loaded. S8 and S5 (port a short GLSL shader) did not. | 0 loaded |

The rewording did not help, so the shipped description is unchanged. The S5 and S8 answers given without the skill were correct. Short, self-contained questions seem to get answered without loading any skill. This was observed, not tested further. S17 (Canvas 2D bar chart) loaded the built-in `dataviz` skill, not this one.

## Limits

- Selection prompts ran on Opus only.
- No browser. Answers were read and graded, not executed. Code from the "with" runs was not compiled.
- Read-only tools meant no run could edit files or run the layout script, so T2 and T3 ended with code to paste.
- The author of the skill graded the answers.

## Rerun

The prompts and fixtures are in [evals/](./evals/). This uses the signed-in Claude account.

```bash
node reviews/webgpu/evals/run.mjs                          # all 32 prompts on Opus
node reviews/webgpu/evals/run.mjs --model claude-sonnet-5-5 --only T1-with,T1-without
```

Results go to a temp folder, not the repo. Grade task answers by hand against [tasks.md](./tasks.md). Selection prompts are scored automatically.

## Automated checks

CI runs on every pull request ([validate.yml](../../.github/workflows/validate.yml)):

- `claude plugin validate . --strict` on the marketplace
- [checks/layout-selftest.mjs](./checks/layout-selftest.mjs), the layout script against the WGSL spec's worked examples
- [checks/check-wgsl-snippets.mjs](./checks/check-wgsl-snippets.mjs), every WGSL block in the skills compiled with naga. Fragments carry a `wgsl-prelude` or `wgsl-check: skip` comment in the markdown.

Both checks were shown to fail on a deliberate break: a wrong `vec3` alignment in the script, and a missing semicolon in a snippet.

