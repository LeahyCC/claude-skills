# Tailwind design system skill tasks and acceptance criteria

Written 2026-10-26, before any model run. Run each prompt against Claude with the skill and without it, as in the Next.js pilot. Score each criterion 0 or 1. One run per task is exploratory, not a statistical estimate.

Status: **not run.** Model runs need Colin's approval first.

## Behaviour

| ID | Prompt | Acceptance criteria |
| --- | --- | --- |
| T1 | "Set up a design system package for our monorepo. Three Next.js apps will use it." Fixture: pnpm workspace with `apps/web`, `apps/admin`, `apps/docs`, Tailwind 4.3.3 in each, no shared package. | Runs or asks to run `inspect.mjs` first. Creates a package with a theme file that has primitives in `:root`, semantic tokens in `:root` and a dark block, and an `@theme inline` map. Closes `--color-*`. Puts `@source` for the components in the package's theme file, and gives each app two import lines with no path into the package. Serves `theme.css` through `exports` with the `style` condition. Makes `tailwindcss` a peer dependency. Runs `check-contrast.mjs` and reports the result. |
| T2 | "The dark footer on our marketing page stays light even though it has `data-theme=\"dark\"`." Fixture: theme with semantic colours mapped in plain `@theme`, footer is a nested element. | Names plain `@theme` resolving `var()` at `:root` as the cause. Changes the map to `@theme inline`. Does not add `dark:` classes to the footer. |
| T3 | "Buttons lose their text colour when we pass `className=\"text-heading\"`." Fixture: `--text-heading` in `@theme`, `cn` from `clsx` and `tailwind-merge` with no config, a button with `text-primary-foreground` in its base. | Explains that `tailwind-merge` does not read `@theme` and treats `text-heading` as a colour. Either registers `heading` under `theme.text` in `extendTailwindMerge` (or `createCn`), or renames the style to a `type-*` utility. Puts the fix in the system's `cn`, not in the app. |
| T4 | "Our teams keep using `bg-blue-500` and random hex values. Stop it." Fixture: an app with 300 raw palette classes and 40 arbitrary colours, ESLint flat config, no Tailwind lint plugin. | Proposes closing the palette and adding `eslint-plugin-better-tailwindcss` with `entryPoint` and `cwd`, `no-unknown-classes`, and `no-restricted-classes` patterns for raw palette and arbitrary values. Does not turn the rule on as an error for all 340 at once: sets a budget with `audit-classes.mjs` or warnings, plus autofix mappings for unambiguous cases. Turns off the plugin's class order rule if Prettier sorts classes. |
| T5 | "Rename `--accent-legacy` to `--primary` across the system." Fixture: a system package used by 12 apps, Changesets configured. | Keeps the old variable as an alias of the new one, marks it deprecated with a removal version, adds a restricted-class rule with a `fix`, ships it as a minor with a changeset, and schedules removal for the next major. Does not delete the old token in a minor. |
| T6 | "Add a high-contrast theme and a second brand." Fixture: the starter theme from the skill. | Adds brand and contrast blocks with the same semantic names, no changes to components. Uses `prefers-contrast` or an attribute for high contrast. Measures every new block with `check-contrast.mjs` and fixes any pair under its ratio. Mentions forced colours separately from high contrast. |
| T7 | "Upgrade our 8 apps from Tailwind 3 to 4. They share a preset package." Fixture: v3 preset with `theme.extend.colors`, `darkMode: "class"`, a `safelist`, apps with `tailwind.config.js` using `presets`. | Separates the v4 upgrade from moving to tokens. Uses `npx @tailwindcss/upgrade` on a branch per app. Turns the preset into a CSS file apps import, with its own `@source`. Maps `safelist` to `@source inline`, `darkMode` to `@custom-variant`. Lists the silent renames that need visual review (`shadow-sm`, `ring`, border colour, `outline-none`). Plans for apps on v3 and v4 at once. |

## Selection

The skill should load for the first ten and not for the last ten.

| ID | Prompt | Should load |
| --- | --- | --- |
| S1 | Set up design tokens for our component library in Tailwind 4 | yes |
| S2 | How should we structure light and dark themes with CSS variables and @theme? | yes |
| S3 | Our shared UI package's classes are missing in the app's production CSS | yes |
| S4 | Write the ESLint rules that stop teams using raw Tailwind colours | yes |
| S5 | How do we version and deprecate tokens in our design system? | yes |
| S6 | Should we ship our design system as an npm package or a shadcn registry? | yes |
| S7 | Create a button component API with variants for our design system | yes |
| S8 | Add a second brand theme to our design system | yes |
| S9 | Our design system docs are out of date, how should we structure them? | yes |
| S10 | Migrate our Tailwind 3 preset package to Tailwind 4 | yes |
| S11 | Make this landing page hero look less generic | no (one-off visual design) |
| S12 | Audit this checkout page for WCAG 2.2 AA | no (wcag-accessibility) |
| S13 | Center this div with Tailwind | no |
| S14 | This React list re-renders too often | no (react-performance) |
| S15 | Fix the TypeScript error in this props type | no (typescript-safety) |
| S16 | Write the error message for a failed payment | no (ux-copy) |
| S17 | Add a sitemap to the Next.js app | no (seo) |
| S18 | Draw a diagram of our services | no (ascii-art) |
| S19 | Add Tailwind to a new Vite project | no |
| S20 | Change this card's padding from p-4 to p-6 | no |
