# Migration

Moving a large codebase to Tailwind v4 and to a token system, in steps that each ship. The upgrade tool does the mechanical part. The design system part, replacing raw classes with tokens, is a migration of its own and runs on a budget.

Contents:

- [Two migrations, not one](#two-migrations-not-one)
- [Upgrading to v4](#upgrading-to-v4)
- [Renames and behaviour changes](#renames-and-behaviour-changes)
- [From a JS config to CSS](#from-a-js-config-to-css)
- [Moving apps onto tokens](#moving-apps-onto-tokens)
- [Many apps, one at a time](#many-apps-one-at-a-time)

## Two migrations, not one

```text
1. v3 -> v4              mechanical, the upgrade tool, one PR per app
2. raw classes -> tokens  design work, lint with autofix, budgets, many small PRs
```

Do them separately. Mixing them makes a PR nobody can review, and a visual change you cannot attribute.

## Upgrading to v4

```bash
git switch -c chore/tailwind-v4
npx @tailwindcss/upgrade
```

The tool needs Node 20 or later. Tailwind's docs: "We recommend running the upgrade tool in a new branch." Review the diff file by file, then build and compare screenshots.

| Before upgrading | Why |
| --- | --- |
| Check the browser floor: Safari 16.4, Chrome 111, Firefox 128 | v4 depends on cascade layers, `@property` and `color-mix()`. Since 4.1 sites still render in older browsers, but are designed for these. If you must support older ones, Tailwind says to stay on v3.4, which is still maintained (`v3-lts`). |
| Remove Sass, Less and Stylus from Tailwind files | v4 is "not designed to be used with CSS preprocessors". Tailwind is the preprocessor. |
| Plan for CSS modules and `<style>` blocks | Each needs `@reference` to see the theme, or plain `var()` |
| Pick the build integration | `@tailwindcss/vite` for Vite, `@tailwindcss/postcss` for Next.js and other PostCSS setups, `@tailwindcss/webpack` (4.2+) for webpack and Rspack, `@tailwindcss/cli` otherwise. `postcss-import` and `autoprefixer` are no longer needed. |

## Renames and behaviour changes

The ones that change how things look without an error:

| v3 | v4 | Notes |
| --- | --- | --- |
| `shadow-sm`, `shadow` | `shadow-xs`, `shadow-sm` | The scale shifted down one name. Same for `blur`, `rounded`, `drop-shadow`. |
| `outline-none` | `outline-hidden` | `outline-none` now really sets `outline-style: none`, which also hides it in forced colours mode |
| `ring` (3px, blue) | `ring-3`, colour required | `ring` is now 1px `currentColor` |
| Border colour `gray-200` by default | `currentColor` | Borders with no colour class turn dark. A theme base rule (`* { border-color: var(--color-border) }`) restores a default. |
| `bg-opacity-50` | `bg-black/50` | Opacity utilities are gone |
| `bg-gradient-to-r` | `bg-linear-to-r` | |
| `!flex` | `flex!` | Important goes at the end |
| `tw-flex` (prefix) | `tw:flex` | Prefix reads like a variant, always first |
| `hover:` everywhere | `hover:` only under `@media (hover: hover)` | No sticky hover on touch |
| `space-y-4` selector | `:not(:last-child)` margin-bottom | Prefer `flex flex-col gap-4` |
| `start-*`, `end-*` | `inset-s-*`, `inset-e-*` | Deprecated in 4.2 |
| `theme(spacing.4)` | `var(--spacing)` or `--spacing(4)` | `theme()` still works, deprecated |

## From a JS config to CSS

`@config "./tailwind.config.js"` loads an old config so the upgrade can land first. Then move each part across and delete the file. A design system should not ship a JS config: v4 does not support `corePlugins`, `safelist` or `separator` in it, and editor tools read the CSS.

| v3 config | v4 CSS |
| --- | --- |
| `theme.extend.colors.brand` | `--color-brand` in `@theme`, or the semantic tier in [tokens.md](./tokens.md) |
| `theme.colors` (replacing) | `--color-*: initial;` then your colours |
| `theme.extend.fontSize` with line height | `--text-x` and `--text-x--line-height` |
| `darkMode: "class"` | `@custom-variant dark (&:where(.dark, .dark *));` |
| `content: [...]` | Automatic detection, plus `@source` for what it skips |
| `safelist` | `@source inline("...")` |
| `plugins: [plugin(({ addUtilities }) => ...)]` | `@utility` |
| `addVariant` | `@custom-variant` |
| `presets: [acmePreset]` | `@import "@acme/ui/theme.css";` |
| `resolveConfig()` in JS | Read the CSS variable: `getComputedStyle(document.documentElement).getPropertyValue("--color-primary")` |

The preset row is the one large codebases care about. A v3 preset package becomes a CSS file the apps import, with its own `@source` (see [architecture.md](./architecture.md#the-package-owns-its-source)).

## Moving apps onto tokens

After v4 lands, the app still uses `bg-blue-600` everywhere. Move it to tokens without a freeze:

1. Map raw values to tokens with design. Each common raw class gets a semantic replacement, or a decision that it needs a new token. Many raw classes have no single answer (`text-gray-500` might be `muted-foreground` or a disabled state), so the map has a "review" column.
2. Encode the unambiguous mappings as `no-restricted-classes` rules with `fix`. `eslint --fix` rewrites them across the app.
3. Measure what is left with `audit-classes.mjs`, set the counts as budgets in CI, and lower them each sprint.
4. Close the palette (`--color-*: initial`) once the count of raw palette classes is zero. From then on a raw class does not compile.

<!-- classes: skip, FAIL sample on purpose -->
```tsx
// FAIL: the starting point, raw palette and dark: pairs
<button className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400">Save</button>
```

```tsx
// PASS: after the autofix, then by hand: one variant, the theme does the rest
<Button variant="primary">Save</Button>
```

Every rewrite changes pixels a little, because tokens rarely equal the old raw values. Run visual tests on the affected screens and get design to sign off the differences in batches, not one at a time.

## Many apps, one at a time

| Step | Done when |
| --- | --- |
| The system package ships v4 theme CSS, alongside the old preset if needed | Both v3 and v4 apps can consume it |
| Apps upgrade to v4 one at a time | Each app's build and visual tests pass |
| The old preset is removed in a system major | No app imports it. Search for the import before cutting the release. |
| Each app moves onto tokens | Its audit counts reach zero, and its palette is closed |

During the overlap the system supports both, which costs the team time. Set an end date for the v3 preset when it is announced, and track which apps remain with the inspect script's output from each repo.
