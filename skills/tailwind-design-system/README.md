# tailwind-design-system

Building and running a design system on Tailwind CSS v4, for large codebases and dedicated design system repos. Token tiers, closed scales, OKLCH palettes with measured contrast, themes and brands, component APIs, monorepo packaging, registries, lint and CI enforcement, versioning and deprecation, docs, and migration.

This is a skill for making design systems. It is not a design system. Accessibility criteria in full are in [wcag-accessibility](../wcag-accessibility/), which this skill links to wherever a component or token has to meet one.

## Install

```bash
npx skills add LeahyCC/claude-skills@tailwind-design-system
```

Or inside Claude Code:

```text
/plugin install tailwind-design-system --marketplace LeahyCC/claude-skills
```

## What it does

Use it when you create or change a design system, a theme, tokens, a shared UI package, or the rules apps follow to use one. The entry file starts with a script that reads the repo, then routes by task, sets defaults, and lists the traps that cost large teams the most time.

It ships three Node scripts with no dependencies, and a starter theme:

| File | Does |
| --- | --- |
| [scripts/inspect.mjs](./scripts/inspect.mjs) | Prints installed versions, every Tailwind CSS entry with its `@source` lines, `@theme` blocks and dark variant, surfaces without a foreground token, and v3 leftovers |
| [scripts/check-contrast.mjs](./scripts/check-contrast.mjs) | Measures WCAG 2.2 contrast for every foreground and surface pair in every mode and brand block. Reads OKLCH, hex, rgb and hsl, resolves `var()`, composites alpha. Exits 1 on a failure. |
| [scripts/audit-classes.mjs](./scripts/audit-classes.mjs) | Counts arbitrary values, raw palette classes, colour literals, inline styles, `!important` and `@apply`, per file. `--max-*` budgets for CI. |
| [templates/theme.css](./templates/theme.css) | A starter theme: three tiers, light and dark, a closed palette and scales, text styles, a focus ring, and a variant for Radix and Base UI open states. Every pair passes WCAG 2.2 AA. |

Version 0.1.0. 11 resource files.

## Coverage

| File | Topics |
| --- | --- |
| [tokens.md](./resources/tokens.md) | Tiers and where each lives, why `@theme inline`, closing scales, naming, property-scoped colours, when to add a tier, DTCG 2025.10, Terrazzo, Style Dictionary, Figma, anti-patterns |
| [color-and-themes.md](./resources/color-and-themes.md) | OKLCH palettes, surface pairs and the ratio each needs, measuring contrast, derived states, dark mode switches, brands and nested themes, high contrast and forced colours, chart colours |
| [scales.md](./resources/scales.md) | Type and text styles, spacing and density, control heights, radius, elevation, motion and reduced motion, z-index layers, breakpoints and container queries |
| [extending-tailwind.md](./resources/extending-tailwind.md) | `@utility` with values and defaults, `@custom-variant`, `@variant`, when `@apply` fits, dynamic class names and `@source inline`, `@reference`, plugins on v4 |
| [components.md](./resources/components.md) | Component anatomy, cva and tailwind-variants, configuring `cn` and `tailwind-merge`, the `className` contract, styling from ARIA and data attributes, Base UI, Radix and React Aria, accessibility each component owns, compound components and slots |
| [architecture.md](./resources/architecture.md) | Repo layout, package boundaries, the package owning its `@source`, three shipping models, `exports` and the `style` condition, cascade layers, monorepo tools, editor and Prettier setup |
| [distribution.md](./resources/distribution.md) | npm package or shadcn registry, `registry:base` and `registry:theme`, private and GitHub registries, versioning a registry, using both |
| [enforcement.md](./resources/enforcement.md) | Layers of enforcement, a tested ESLint config, budgets that only go down, contrast in CI, visual regression, axe in Storybook, the CI pipeline |
| [governance.md](./resources/governance.md) | Changesets strategies, what counts as breaking, deprecating tokens and props, lifecycle entry points, contribution criteria, ADRs, adoption metrics |
| [documentation.md](./resources/documentation.md) | Diataxis for systems, the component page, token docs, generated reference, docs for coding agents |
| [migration.md](./resources/migration.md) | Two migrations, the upgrade tool, silent renames, JS config to CSS, moving apps onto tokens, many apps in sequence |

## What's different

| Typical Tailwind skill | This skill |
| --- | --- |
| A utility class reference | How to build the system around the utilities: tiers, rules, releases |
| `tailwind.config.js`, or "v4" headings over v3 code | Tailwind 4.3.3 CSS-first config throughout. Every CSS sample compiles in CI. |
| Tokens in `@theme`, theory with no mechanics | Which tier goes in `:root`, `@theme inline` or `@theme`, and why nested themes break otherwise |
| One app | Monorepos and many apps. The package declares its own `@source`, tested on every run. |
| "Ensure 4.5:1" | A script that measures every pair in every theme, and a starter theme that passes it |
| `clsx` plus `tailwind-merge`, unconfigured | The merge trap shown, measured, and fixed with the registered config |
| No enforcement | A lint config tested against planted violations, and CI budgets |
| No releases | Semver rules, token and prop deprecation with autofix, lifecycle entry points |

## How it is checked

`node reviews/tailwind-design-system/checks/check-skill.mjs` installs Tailwind 4.3.3 and:

- compiles every CSS sample, and asserts the classes each one says exist or must not exist
- checks every class in every TSX and HTML sample against the starter theme, so samples cannot use a utility that does not exist
- runs the contrast script on the starter theme and on colours with known ratios
- runs the audit and inspect scripts on fixtures with known counts
- builds a fixture monorepo with the Tailwind CLI to prove a package's own `@source` is followed
- checks links, anchors, counts, and that no em dash slipped in

Sources and check dates are in [SOURCES.md](./SOURCES.md). Test prompts are in [reviews/tailwind-design-system/tasks.md](../../reviews/tailwind-design-system/tasks.md).

## License

[MIT](../../LICENSE)
