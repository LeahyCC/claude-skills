# Enforcement

A design system that relies on people remembering rules drifts within a quarter. This file turns each rule into something a machine checks: the compiler, the linter, a budget in CI, a contrast script, and visual and accessibility tests.

Contents:

- [The layers of enforcement](#the-layers-of-enforcement)
- [Make off-system classes not exist](#make-off-system-classes-not-exist)
- [Lint](#lint)
- [Budgets that only go down](#budgets-that-only-go-down)
- [Contrast in CI](#contrast-in-ci)
- [Visual regression](#visual-regression)
- [Accessibility tests](#accessibility-tests)
- [The CI pipeline](#the-ci-pipeline)

## The layers of enforcement

```text
cheapest, earliest                                          slowest, latest
compiler           lint             budget         contrast      visual + a11y
closed scales  ->  restricted   ->  audit counts -> every pair -> every story,
(class does        classes,         per app,       in every      every theme
 not exist)        unknown          only down      theme
                   classes
```

Each layer catches what the one before cannot. A closed palette stops `bg-blue-500` but not `bg-[#3b82f6]`. Lint stops the arbitrary value but not a token pair that fails contrast. The contrast script measures tokens, not rendered pages. Visual and accessibility tests see the page.

## Make off-system classes not exist

Close the namespaces in the theme (`--color-*: initial`, `--text-*: initial`, `--radius-*: initial`). An off-system class then generates no CSS. See [tokens.md](./tokens.md#close-the-scales). This costs nothing and runs in every build, but it fails silently: the element just loses its colour. Lint makes it loud.

## Lint

Use one Tailwind lint plugin. `eslint-plugin-better-tailwindcss` (checked at 4.10.0) has the rules a system needs: unknown classes, conflicts, and a restricted-class rule with autofix. It also runs under Oxlint and has a `cwd` setting for monorepos. `eslint-plugin-tailwindcss` 4.x also supports v4 now, with `no-arbitrary-value` and `no-custom-classname`. Do not run both.

```js
// packages/eslint-config/tailwind.js: every app extends this
import betterTailwindcss from "eslint-plugin-better-tailwindcss"

const paletteNames = "red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone|taupe|mauve|mist|olive"

export function tailwind({ entryPoint, cwd }) {
  return {
    extends: [betterTailwindcss.configs.recommended],
    settings: { "better-tailwindcss": { entryPoint, cwd } },
    rules: {
      // prettier-plugin-tailwindcss owns order and wrapping. Two tools reordering classes fight.
      "better-tailwindcss/enforce-consistent-class-order": "off",
      "better-tailwindcss/enforce-consistent-line-wrapping": "off",
      "better-tailwindcss/no-unknown-classes": "error",
      "better-tailwindcss/no-conflicting-classes": "error",
      "better-tailwindcss/no-restricted-classes": [
        "error",
        {
          restrict: [
            {
              pattern: `^(.*:)?(bg|text|border|ring|fill|stroke|outline|from|via|to)-(${paletteNames})-\\d{2,3}(\\/\\d+)?$`,
              message: "Raw palette colour. Use a semantic token such as bg-primary or text-muted-foreground.",
            },
            {
              pattern: "\\[([^\\[\\]]*?)\\](?!:)",
              message: "Arbitrary value. Add a token, or ask the design system team.",
            },
            {
              pattern: "^dark:(bg|text|border)-",
              message: "Dark colours come from the theme. Use one semantic class.",
            },
            {
              pattern: "^.*!$",
              message: "No !important. Fix the order or the specificity instead.",
            },
          ],
        },
      ],
    },
  }
}
```

```js
// apps/web/eslint.config.js
import { defineConfig } from "eslint/config"
import { tailwind } from "@acme/eslint-config/tailwind"

export default defineConfig([tailwind({ entryPoint: "app/globals.css", cwd: import.meta.dirname })])
```

| Setting or rule | Why |
| --- | --- |
| `entryPoint` | For v4 the plugin reads your CSS, not a JS config. Without it, it checks against Tailwind's defaults, so your tokens look unknown. |
| `cwd: import.meta.dirname`, set in each app | Inside the shared config, `import.meta.dirname` is the shared package's folder. Each app passes its own. |
| `no-unknown-classes` | Turns the closed palette's silent failure into an error |
| `no-conflicting-classes` | `px-2 px-4` on one element is a bug |
| `no-restricted-classes` with `fix` | Migration: an autofix can rewrite `text-green-700` to `text-success` across a codebase. Old token names after a rename go here too. |
| `enforce-consistent-class-order`, `enforce-consistent-line-wrapping` off | Both are on in `recommended`. Leave order and wrapping to `prettier-plugin-tailwindcss`. Turn them on only in a repo without it. |

Verified with ESLint 10.13.0 and the plugin at 4.10.0, using the starter theme as the entry point: the theme's own classes, `type-label`, `focus-ring` and the `data-open:` variant pass; `text-gray-700`, `bg-blue-500`, `w-[320px]`, `dark:bg-card`, `mt-2!` and `px-2 px-4` are each reported as errors; `data-[state=open]:` is not mistaken for an arbitrary value. TSX files need a parser that reads JSX, such as `typescript-eslint`'s.

Scope the strict rules. The design system package itself may need arbitrary values inside primitives. Apps should not. Apply the restricted patterns to `apps/**` and to product packages, and relax them for `packages/ui/**` with a comment saying why.

A lint plugin that reads names from your CSS is the place to retire a class: when `bg-legacy-accent` is removed from the theme, `no-unknown-classes` lists every use.

## Budgets that only go down

A large codebase has thousands of existing violations. Turning a rule on as an error blocks everyone. Measure, set the current number as the budget, and lower it.

```bash
node scripts/audit-classes.mjs apps/web --json > audit.json
node scripts/audit-classes.mjs apps/web --max-arbitrary 412 --max-palette 1280 --max-literal 96
```

`audit-classes.mjs` counts arbitrary values, raw palette classes, colour literals outside the theme, inline styles, `!important` and `@apply`, per file and in total. With `--max-*` it exits 1 when a count goes over, so CI holds the line while teams migrate. Lower the budget in the same PR that removes violations.

The same numbers per app, charted over time, are the system's token adoption metric. Component scanners such as Omlet or `react-scanner` count component usage. They do not see raw classes, so they miss half of adoption.

ESLint can do the same job with `--max-warnings` and the restricted rules set to `warn`. The script exists for repos where the lint config cannot change yet, and for the per-file report.

## Contrast in CI

```bash
node scripts/check-contrast.mjs packages/theme/src/theme.css packages/theme/src/brands/*.css
```

It measures every foreground and surface pair in every mode and brand block and exits 1 on a failure. Run it on any PR that touches token files. A token change that breaks contrast in one brand's dark mode is invisible in review and obvious to this script. Details in [color-and-themes.md](./color-and-themes.md#measure-do-not-eyeball).

## Visual regression

Tokens change many components at once. Screenshots per story are how you see what a token change did.

| Tool | Version checked | Notes |
| --- | --- | --- |
| Storybook | 10.6.4 | `addon-essentials` stopped at 8.6. Do not list it in a v10 `main.ts`, though some addon docs still do. |
| Chromatic | CLI 18.13.3 | TurboSnap snapshots only stories affected by a change, but any file imported by `preview.ts` triggers all stories. The theme CSS is imported there, so a token change re-snapshots everything. That is correct, and it is the cost to plan for. |
| Playwright `toHaveScreenshot` | 1.64.1 | Self-hosted. Generate baselines in the same environment CI uses, because fonts and rendering differ by OS. |

Render every story in every theme that ships. With `@storybook/addon-themes`, `withThemeByDataAttribute({ themes: { light: "light", dark: "dark" }, defaultTheme: "light", attributeName: "data-theme" })` matches the starter theme's dark variant. Add a brand axis the same way.

## Accessibility tests

`@storybook/addon-a11y` runs axe on every story. With `@storybook/addon-vitest`, stories with `parameters.a11y.test = "error"` fail the test run in CI. Set `"error"` globally in `preview.ts`, and give a component that is still being fixed `"todo"` at its meta level. The list of `"todo"` stories is then the accessibility debt list, visible in code review.

axe catches roughly the machine-checkable part: contrast on rendered text, missing names, invalid ARIA. Keyboard behaviour, focus order and screen reader output still need the manual checks in the WCAG skill's [testing and auditing](../../wcag-accessibility/resources/testing-and-auditing.md) resource.

## The CI pipeline

| Step | Runs on | Fails when |
| --- | --- | --- |
| `node scripts/inspect.mjs` | Every PR, as a log | Never. It records what the setup is. |
| Build each app | Every PR | A CSS syntax error, a missing import |
| ESLint with the Tailwind config | Every PR | Unknown, conflicting or restricted classes |
| `audit-classes.mjs --max-*` | Every PR | A count rises above its budget |
| `check-contrast.mjs` | PRs touching tokens or theme | Any pair under its ratio |
| Storybook tests with a11y | PRs touching `packages/ui` | An axe violation in a story set to `"error"` |
| Visual regression | PRs touching `packages/ui` or tokens | An unreviewed visual change |
| `publint`, `attw` on the packed tarball | Release PRs | The package does not resolve somewhere |
