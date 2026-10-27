# Documentation

What a design system's docs contain, how to keep them true, and how to make them readable by coding agents as well as people. For writing the prose itself, the [plain-docs](../../plain-docs/SKILL.md) skill has the page shape and the cuts.

Contents:

- [Four kinds of page](#four-kinds-of-page)
- [The component page](#the-component-page)
- [Token docs](#token-docs)
- [Generate, do not copy](#generate-do-not-copy)
- [Docs for coding agents](#docs-for-coding-agents)

## Four kinds of page

Diataxis splits docs by what the reader is doing. Design system docs fail most often by mixing usage guidance into the props reference, so that neither is findable.

| Kind | Reader is | Design system pages |
| --- | --- | --- |
| Tutorial | Learning | Build your first screen with the system |
| How-to | Doing a task | Add a brand theme. Consume the system from a repo outside the monorepo. Migrate from 5.x to 6.0. |
| Reference | Looking something up | Component props, token tables, the list of utilities and variants. Generated. |
| Explanation | Understanding why | Why semantic tokens. Why the palette is closed. The ADRs. |

## The component page

Built from GOV.UK's and Primer's pages and Carbon's documentation requirements:

| Section | Contains |
| --- | --- |
| Status | Experimental, stable or deprecated, the version it changed, the date of its last accessibility review |
| When to use, when not to | Which other component to use instead, and why |
| Examples | Live stories per variant and state, with the code |
| Anatomy | The parts (`data-slot` names) and how they compose. A composition tree. |
| Props | Generated from types. Deprecated props marked inline with their replacement. |
| Tokens | The semantic tokens and utilities it uses, so a theme author knows what changing a token touches |
| Accessibility | Keyboard interaction, what a screen reader announces, contrast pairs, target size, what the app must still provide (a label, an error message) |
| Content | How to write its labels and messages. The [ux-copy](../../ux-copy/SKILL.md) skill covers button and error text. |
| Changes | Recent changes, linked to the changelog |
| Help | Where to ask, how to request a variant |

GOV.UK ends each component page with a link to a public discussion for that component. That is where requests and research collect, and it makes the system's backlog visible.

## Token docs

Document each semantic token by role, not by value. The value changes with the theme.

| Token | Controls | Used by | Pair |
| --- | --- | --- | --- |
| `--primary` | The main action on a screen | Primary buttons, selected tabs, links on light surfaces | `--primary-foreground` |
| `--muted-foreground` | Secondary text | Descriptions, helper text, placeholders, timestamps | Passes on `--background`, `--card`, `--muted` |
| `--input` | The boundary that shows where a control is | Text fields, selects, checkboxes | 3:1 on `--background` |

Show each value per theme and brand, with its measured contrast. Generate this table from the token source and the contrast script's JSON output (`check-contrast.mjs --json`), so the numbers on the page are the numbers CI measured.

`@theme static` makes Tailwind emit every theme variable even when no class uses it, which a token docs page needs if it reads values with `getComputedStyle`.

## Generate, do not copy

Anything copied into docs by hand is wrong within a release. Generate what can be generated.

| Doc content | Source |
| --- | --- |
| Props tables | Storybook autodocs (`tags: ['autodocs']` in `preview.ts`) from TypeScript types |
| Variant options | The variant definition. `cva@beta`'s `getSchema()` reads them back for Storybook controls. With `cva` 0.7, export the variant keys as a typed constant. |
| Token tables and contrast numbers | The DTCG source and `check-contrast.mjs --json` |
| Component status list | A generated manifest, as Primer's `generated/components.json` |
| Changelog | Changesets |
| Live examples | The stories themselves, embedded |

## Docs for coding agents

Agents now write much of the UI that consumes a system. They follow docs literally and do not know what changed since their training data. A system that is easy for agents to use correctly gets used correctly more often.

| Practice | Why |
| --- | --- |
| An `AGENTS.md` or `CLAUDE.md` at the system repo root, and a short one that consuming apps can copy | States the rules agents break most: no raw palette classes, no arbitrary values, use the system's `cn`, which import path for each component |
| Every docs page available as markdown, plus an `llms.txt` index | shadcn serves every docs page as `.md` (since October 2026) and an `llms.txt`, for this reason. Tailwind's docs do neither yet. |
| A composition tree per compound component | shadcn's changelog: agents "compose elements more reliably when they can see the full structure" |
| Real `description` fields on registry items | shadcn: it "helps LLMs understand the component and its purpose" |
| Lint errors that name the fix | `no-restricted-classes` messages that say "use `bg-primary`" are read by agents and acted on |
| The installed version stated, not assumed | Agents default to whatever version they saw most in training. `inspect.mjs` prints what is installed. |

Keep these rules short. A long rules file is skimmed by people and agents alike.
