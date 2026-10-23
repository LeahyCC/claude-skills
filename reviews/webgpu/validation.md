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

## Selection

| Pass | Should load (10) | Should not load (10) |
| --- | --- | --- |
| 1, the shipped description | 9 loaded. S8 (struct offsets for a pasted struct) did not. | 0 loaded |
| 2, a reworded description naming struct offsets and padding | 8 loaded. S8 and S5 (port a short GLSL shader) did not. | 0 loaded |

The rewording did not help, so the shipped description is unchanged. The S5 and S8 answers given without the skill were correct. Short, self-contained questions seem to get answered without loading any skill. This was observed, not tested further. S17 (Canvas 2D bar chart) loaded the built-in `dataviz` skill, not this one.

## Limits

- One model. Anthropic suggests also checking Haiku and Sonnet. Not run, to keep usage down.
- No browser. Answers were read and graded, not executed. Code from the "with" runs was not compiled.
- Read-only tools meant no run could edit files or run the layout script, so T2 and T3 ended with code to paste.
- The author of the skill graded the answers.
