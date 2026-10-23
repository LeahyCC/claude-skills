# Sources

Checked 2026-10-22.

## Anthropic

| Source | Read | Used for |
| --- | --- | --- |
| [Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices) | in full | Be explicit; give the reason; explicit action vs suggestion; XML tags; long inputs at the top; quote first; prefer general instructions over prescriptive steps; avoid test focus and hardcoding; read files before answering; overeagerness. Self-check: Opus 5 verifies without being told, and carried-over verification instructions cause over-verification. |
| Model pages: [Opus 5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5), Opus 5.5, Fable 5, [Fable 5.1](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-1), Sonnet 5.5 and Haiku 5.5 (sections) | mostly in full | Say a disagreement in a sentence and continue as asked. Follow-up bugs are reported, not fixed. Tests only where the repo keeps them. Report every finding, filter in a second pass. Tag each pasted block. Complete spec up front. Haiku 5.5 can report done without running a check, so a named proof matters there. |
| [Develop tests / success criteria](https://platform.claude.com/docs/en/test-and-evaluate/develop-tests) (the old define-success URL redirects here) | criteria and grading sections | Specific, measurable proof instead of "good performance". |
| [Claude Code best practices](https://code.claude.com/docs/en/best-practices) | in full | Give a check Claude can run; `/goal`, Stop hook, verification subagent; show evidence rather than asserting success; "If you could describe the diff in one sentence, skip the plan"; reference existing patterns (exemplar file); the interview prompt and SPEC.md; adversarial review limited to correctness. |
| Skill authoring best practices (platform.claude.com) and [Claude Code skills](https://code.claude.com/docs/en/skills) | in full / frontmatter sections | Third-person description with the use case first; one term per concept; table of contents over 100 lines; evaluations before shipping. |
| [Effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) (2025-09-29) | in full | "Minimal does not necessarily mean short": length follows the material. |

The old prompt generator, prompt improver, and prompt templates pages now redirect to best practices, so they could not be checked separately.

## Other tools compared

| Tool | Signal (2026-10-22) | Taken from it |
| --- | --- | --- |
| [severity1/claude-code-prompt-improver](https://github.com/severity1/claude-code-prompt-improver) | 1,962 stars | Read the repo first, then ask a few grounded questions; leave clear prompts alone. |
| dotneet prompt-improver (skills.sh) | 508 installs | Size the task before deciding whether it needs a plan step. |
| [obra/superpowers](https://github.com/obra/superpowers) brainstorming | 303.8k stars | One question at a time for open design work (the interview shape). |
| [OpenAI GPT-5.5 prompting guide](https://developers.openai.com/api/docs/guides/latest-model/gpt-5.5) | official | Describe the destination, not every step; contradictory instructions waste reasoning; absolute words only for invariants. |
| [Kiro feature specs](https://kiro.dev/docs/specs/feature-specs/) | n/a | Behaviour written as WHEN/SHALL lines maps straight to tests. Noted, not adopted: too much ceremony for most prompts. |

None of these had the raw-material rule or per-domain lenses with named tools, which is why this skill keeps both.

## Domain sources in lenses.md

Refactoring: Martin Fowler, *Refactoring*, 2nd ed. (2018); Michael Feathers, *Working Effectively with Legacy Code* (2004); Adam Tornhill, *Your Code as a Crime Scene*. UX: Nielsen Norman Group, 10 usability heuristics and "Why You Only Need to Test with 5 Users" (2000). API: RFC 9457 Problem Details (2023, obsoletes RFC 7807). Performance: web.dev LCP (2.5 s good) and INP (200 ms good). Security: OWASP API Security Top 10 (2023), OWASP ASVS. Accessibility: WCAG 2.2. Tools as each project documents them: Spectral, Schemathesis, Pact, Stryker, fast-check, knip, madge, dependency-cruiser, ts-morph, jscodeshift, axe-core.

## Not claimed

- No measured uplift yet. [evals.md](./resources/evals.md) holds the cases; until they have been run, the skill makes prompts specific and checkable and promises nothing more.
