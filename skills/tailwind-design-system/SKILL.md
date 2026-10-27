---
name: tailwind-design-system
description: >
  Builds and maintains design systems on Tailwind CSS v4 for large codebases
  and dedicated design system repos. Token tiers mapped onto :root, @theme and
  @theme inline, closed scales, OKLCH palettes with measured WCAG contrast,
  dark mode, brands and density, component APIs with cva or tailwind-variants
  and a configured cn, monorepo packages where the system owns its @source,
  npm versus shadcn registries, lint rules and CI budgets that stop drift,
  Storybook visual and a11y tests, semver, token and component deprecation,
  docs, and migrating many apps from v3 and raw classes to tokens. Ships a
  contrast-checked starter theme and scripts that inspect a repo, measure
  contrast and count off-system classes. Use when creating or changing a
  design system, theme, tokens, a shared UI package, or the rules apps follow
  to use one. Not for styling one page or one-off visual design, a full WCAG
  audit (wcag-accessibility), or React rendering speed (react-performance).
---

# Tailwind design system

How to build a design system on Tailwind CSS v4 that many teams and many apps can use for years: one place to change a value, themes that swap at runtime, components that carry their own accessibility, and machines that stop drift. Checked against Tailwind 4.3.3. If `inspect.mjs` shows a newer version, check its changelog before relying on version-specific notes here.

**The system is the tokens and the rules, not the components.** Components are the easy part to copy. What makes a system hold at scale is a closed set of semantic tokens, and lint and CI that make going around them harder than using them.

**Measure, never assume.** Contrast is computed, classes are compiled, versions are read from the repo. Sources and check dates: [SOURCES.md](SOURCES.md).

## Procedure

1. Run `node scripts/inspect.mjs` from the repo root. It prints the installed Tailwind and related versions, every CSS entry with its `@source` lines, `@theme` blocks, dark variant and token counts, surfaces without a foreground token, and v3 leftovers. Work from that, not from memory.
2. Find the task in the table below and read that resource.
3. New system: copy [templates/theme.css](templates/theme.css), then change values, not structure.
4. Make the change.
5. Verify, and report each result:
   - The app or Storybook builds.
   - `node scripts/check-contrast.mjs <theme files>` passes, after any token change.
   - The Tailwind lint config passes, or `node scripts/audit-classes.mjs <dirs>` shows counts did not rise.

```text
tokens (DTCG JSON, optional)
   │ generate
   ▼
theme.css ── primitives    :root            --palette-*       never classes
          ── semantic      :root, dark,     --primary         swapped per theme
                           brand blocks
          ── utility map   @theme inline    --color-primary   the public classes
          ── scales        @theme           --text-sm         closed with --*: initial
          ── @source "./components"         the package says where its classes live
   │ @import "@acme/ui/theme.css"
   ▼
app.css  @import "tailwindcss";  one Tailwind build per app
   │
   ▼
lint + audit budgets + contrast + visual and a11y tests in CI
```

## Where to read

| Task | Resource |
| --- | --- |
| Token tiers, where each lives, `@theme` vs `@theme inline` vs `@theme static`, closing scales, naming, property-scoped colours, DTCG, Terrazzo, Figma | [tokens.md](./resources/tokens.md) |
| OKLCH palettes, surface and text pairs, measuring contrast, derived states, dark mode switch, brands, nested themes, high contrast, forced colours, chart colours | [color-and-themes.md](./resources/color-and-themes.md) |
| Type scale and text styles, spacing and density, control heights, radius, elevation, motion, z-index layers, breakpoints and container queries | [scales.md](./resources/scales.md) |
| `@utility`, `@custom-variant`, `@variant`, `@apply` policy, `@source inline`, `@reference`, plugins on v4 | [extending-tailwind.md](./resources/extending-tailwind.md) |
| Component anatomy, variants with cva or tailwind-variants, configuring `cn`, the `className` contract, styling from ARIA and data attributes, Base UI, Radix and React Aria, accessibility each component owns | [components.md](./resources/components.md) |
| Repo layout, package boundaries, the package owning its `@source`, three shipping models, `exports`, cascade layers, monorepo tools, editor and Prettier setup | [architecture.md](./resources/architecture.md) |
| npm package vs shadcn registry, `registry:base` and `registry:theme`, private and GitHub registries, versioning a registry | [distribution.md](./resources/distribution.md) |
| Closed scales, the lint config, budgets that only go down, contrast in CI, visual regression, axe in Storybook, the CI pipeline | [enforcement.md](./resources/enforcement.md) |
| Semver and Changesets, what counts as breaking, deprecating tokens, components and props, lifecycle stages, contribution, ADRs, adoption metrics | [governance.md](./resources/governance.md) |
| Diataxis for systems, the component page, token docs, generated reference, docs for coding agents | [documentation.md](./resources/documentation.md) |
| v3 to v4 with the upgrade tool, silent renames, JS config to CSS, moving apps from raw classes to tokens, many apps in sequence | [migration.md](./resources/migration.md) |

## Defaults, unless the repo has already decided

| Decision | Default | Why |
| --- | --- | --- |
| Token tiers | Primitives in `:root`, semantic in `:root` and mode blocks, utility map in `@theme inline` | Primitives cannot become classes. Nested themes flip. |
| Colour names | shadcn's contract (`primary`, `primary-foreground`, `muted-foreground`, `border`, `input`, `ring`) plus your roles | Registry components drop in themed |
| Default palette | Closed: `--color-*: initial` | Raw palette classes stop compiling |
| Dark mode | `@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));` | Zero specificity, room for `data-brand` and `data-density` |
| Shipping | Source in a package, each app compiles, the package's theme declares its own `@source` | One Tailwind build per app, apps never hard-code the system's folders |
| Variants | `class-variance-authority` 0.7.1, or `tailwind-variants` for multi-part components | Ecosystem default, and slots where they pay off |
| Merging | `tailwind-merge` 3 or `cn` 0.5, configured once in the system with every custom key | Unregistered keys merge wrong in silence |
| Primitive library | Whatever the system already uses. New: Base UI (shadcn's default) or React Aria. | Never hand-build menu, dialog or combobox behaviour |
| Lint | `eslint-plugin-better-tailwindcss` with `entryPoint`, unknown, conflicting and restricted classes | Turns closed scales into errors with autofix |
| Versioning | Changesets, core packages fixed to one version | One number per bug report |
| Contrast bar | WCAG 2.2 AA, 4.5:1 text, 3:1 control boundaries and focus | WCAG 3 has no contrast algorithm yet. APCA is not a conformance target. |

## Traps

| Symptom | Cause | Fix |
| --- | --- | --- |
| Classes used only inside the shared UI package are missing in production | Tailwind skips `node_modules`, so the app never scans the package | `@source "./components";` in the package's theme file ([architecture.md](./resources/architecture.md#the-package-owns-its-source)) |
| A dark band or brand panel does not change colour | Semantic colours mapped in plain `@theme`, resolved once at `:root` | `@theme inline` ([tokens.md](./resources/tokens.md#why-theme-inline-for-anything-that-changes-per-theme)) |
| `cn()` drops a colour next to a custom text size | `tailwind-merge` and `cn` do not read `@theme`, and treat `text-heading` as a colour | Register custom keys, or name text styles `type-*` ([components.md](./resources/components.md#merging-classes)) |
| `bg-blue-500` renders nothing | The palette is closed, as intended | Use the semantic token. Lint's unknown-class rule makes this an error. |
| A class built with a template string never appears | Tailwind reads files as text and never sees `bg-${tone}` | A map of complete class strings ([extending-tailwind.md](./resources/extending-tailwind.md#source-inline-and-dynamic-class-names)) |
| A custom utility changed after a Tailwind upgrade | Core added the same name (`tab-*` in 4.3) | Prefix system utilities |
| `@apply` fails in a CSS module or a Vue or Svelte style block | That file is compiled without the theme | `@reference` the theme, or plain `var()` |
| Every system token is "unknown" in lint | No `entryPoint`, or a shared config's `cwd` pointing at the shared package | Pass `entryPoint` and `cwd: import.meta.dirname` from each app ([enforcement.md](./resources/enforcement.md#lint)) |
| Prettier sorts classes oddly or ignores tokens | No `tailwindStylesheet`, or one root config for several apps | One config per package, pointed at a file that imports Tailwind |
| Utilities cannot override a system component's CSS | System CSS is unlayered | `@layer components` and `:where()` ([architecture.md](./resources/architecture.md#cascade-layers-and-specificity)) |
| A density mode changes nothing | `--spacing` defined in `@theme inline`, so the value is baked in | Plain `@theme` ([scales.md](./resources/scales.md#spacing-and-density)) |
| Borders turned dark after upgrading to v4 | v4's default border colour is `currentColor` | A base rule setting `border-color: var(--color-border)` |
| The focus ring fails 3:1 | `outline-ring/50`, a faded ring | Full-strength `ring` with an offset |
| The page flashes light before dark | The theme attribute is set after first paint | An inline script in `<head>` ([color-and-themes.md](./resources/color-and-themes.md#dark-mode)) |
| Contrast passes on the page but fails in a card | `muted-foreground` measured only on `background` | Measure every surface it sits on |

## Review checklist

- [ ] `inspect.mjs` output is in the PR or the report, with the Tailwind version
- [ ] Primitives are not in `@theme`. Semantic colours go through `@theme inline`.
- [ ] `--color-*` is closed, and other scales the system owns are closed
- [ ] Every surface token has a `-foreground` partner, and `check-contrast.mjs` passes in every mode and brand
- [ ] No raw palette classes, arbitrary values, `dark:` colour overrides or `!important` in app code, enforced by lint
- [ ] Components use semantic classes only, take variants as typed props, and merge `className` last through the system's `cn`
- [ ] Custom theme keys are registered with the merge config
- [ ] The UI package's theme declares its `@source`, and `exports` serves `theme.css` with the `style` condition
- [ ] System CSS is in a layer, with `:where()` selectors
- [ ] Focus is visible at 3:1, targets are at least 24px, reduced motion is respected, in the components themselves
- [ ] Breaking changes ship with a major, a changeset, and a codemod or autofix rule
- [ ] Deprecated tokens are aliases with a removal version and a lint warning

## Related skills

Accessibility criteria in full: [wcag-accessibility](../wcag-accessibility/SKILL.md). Types for component props and variant maps: [typescript-safety](../typescript-safety/SKILL.md). Writing the docs pages: [plain-docs](../plain-docs/SKILL.md). Button and error text: [ux-copy](../ux-copy/SKILL.md).
