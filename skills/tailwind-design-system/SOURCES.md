# Sources

Checked 2026-10-26. When a file changes, update its row here. Check dates live in this file only.

## Versions

Read from the npm registry (`dist-tags.latest`) on 2026-10-26.

| Package | Version | Note |
| --- | --- | --- |
| `tailwindcss`, `@tailwindcss/node`, `@tailwindcss/cli`, `@tailwindcss/vite`, `@tailwindcss/postcss` | 4.3.3 (2026-07-16) | No 4.4 or 5.x prerelease. `v3-lts` is 3.4.19. `@tailwindcss/turbopack` is in the unreleased changelog only. |
| `@tailwindcss/typography`, `@tailwindcss/forms` | 0.5.20, 0.5.11 | `@tailwindcss/container-queries` 0.1.1 is obsolete on v4 |
| `shadcn` | 4.x (eject output names 4.8.3) | Base UI default since 2026-07-02, React Aria base since 2026-07-17, `cn` package since 2026-09-03 |
| `cn` | 0.5.0 | Installed and run |
| `class-variance-authority` | 0.7.1 | `cva@beta` is 1.0.0-beta.12 |
| `tailwind-variants` | 3.3.1 | Installed and run |
| `tailwind-merge` | 3.7.0 | Installed and run |
| `eslint`, `eslint-plugin-better-tailwindcss` | 10.13.0, 4.10.0 | Installed and run |
| `eslint-plugin-tailwindcss` | 4.4.0 | Supports v4 |
| `prettier-plugin-tailwindcss` | 0.8.1 | |
| `storybook` and addons | 10.6.4 | `addon-essentials` ends at 8.6.14 |
| `chromatic`, `@playwright/test` | 18.13.3, 1.64.1 | |
| `@changesets/cli` | 3.0.3 | v3 is `latest` |
| `turbo`, `pnpm`, `knip`, `syncpack`, `publint`, `@arethetypeswrong/cli` | 2.11.10, 12.15.0, 6.43.0, 15.3.3, 0.3.25, 0.18.5 | |
| `style-dictionary`, `@terrazzo/cli`, `@terrazzo/plugin-tailwind`, `@tokens-studio/sd-transforms` | 5.7.1, 2.10.0, 2.10.0, 2.0.3 | |
| `@adobe/leonardo-contrast-colors` | 1.1.0 | No OKLCH output |

## By file

| File | Checked against |
| --- | --- |
| [SKILL.md](./SKILL.md) | The resources below. Traps were each reproduced or traced to a cited page. |
| [tokens.md](./resources/tokens.md) | Tailwind docs: Theme variables (namespaces, `@theme inline` and its reason, `@theme static`, resets, keyframes, sharing a theme file). Tailwind 4.3.3 source `index.ts` `parseThemeOptions` (`reference` and `default` exist but are undocumented, so not taught). Property-scoped namespaces found in the 4.3.3 build output (`["--background-color","--color"]` and 14 more) and confirmed with `candidatesToCss`; the background-color and text-color docs pages list only `--color-*`. Closed-scale behaviour run on 4.3.3. shadcn Theming page (pair convention, token table format). DTCG 2025.10 Format, Color and Resolver modules at designtokens.org. Terrazzo Tailwind integration docs. Style Dictionary DTCG page ("2025.10 does not have full support yet") and predefined formats. Figma help: Modes for variables (DTCG import and export, import limits). Figma Plugin API `Variable.codeSyntax`. Primer token names page, Atlassian design tokens and use-tokens-in-code pages, Spectrum design tokens page, Material Web theming docs. |
| [color-and-themes.md](./resources/color-and-themes.md) | WCAG 2.2 Recommendation (1.4.3, 1.4.11, large text). WCAG 3.0 Working Draft of 10 September 2026 (contrast algorithm "yet to be determined", "does not replace WCAG 2"). MDN `oklch()`, relative colours, `light-dark()` (needs `color-scheme`), `forced-color-adjust`. webstatus.dev Baseline data for relative colour syntax, `color-mix()`, `light-dark()`, `color-scheme`, `prefers-contrast`, `forced-colors`, `prefers-reduced-transparency`. Radix Colors "Understanding the scale" (step roles, APCA Lc 60 and 90). Leonardo contrast-colors README. Tailwind dark mode page (variants, the head script). shadcn Button source (`border-transparent`). Contrast numbers produced by `scripts/check-contrast.mjs`. |
| [scales.md](./resources/scales.md) | Tailwind docs: Theme variables (`--text-*--line-height`), Padding (spacing multiplier), Responsive design (breakpoints, units warning, container queries, `@container-size`). Tailwind 4.3.1 changelog (`m-1` emits `var(--spacing)`). Spacing compiled as `calc(var(--spacing) * 4)` under the starter theme, run on 4.3.3. shadcn style button sources (`base-nova` `h-8`, `new-york-v4` `h-9`). The text-style merge trap run on tailwind-merge 3.7.0 and cn 0.5.0. WCAG 1.4.4, 1.4.10, 2.5.8. |
| [extending-tailwind.md](./resources/extending-tailwind.md) | Tailwind docs: Adding custom styles (`@utility`, functional values, `@custom-variant`, `@variant`), Functions and directives (`@source`, `@reference`, `@apply`, `@config` limits, `--spacing()`, `--alpha()`), Detecting classes in source files (dynamic names, `@source inline`, `@source not inline`), Compatibility (CSS modules, style blocks, preprocessors), Styling with utility classes (custom CSS example, no `@apply`). Tailwind 4.3.0 changelog (`tab-*` core utility, stacked and compound `@variant`, `--default()`). `shadcn/tailwind.css` (`data-open` variant), from the shadcn eject docs. Primer ADR-021 CSS layers. Typography and forms plugin READMEs, container-queries README. |
| [components.md](./resources/components.md) | shadcn Button sources for `base-nova` and `new-york-v4` from ui.shadcn.com/r (data-slot, cva, `render` vs `asChild`, no `forwardRef`), shadcn Button docs "As Link" warning, shadcn changelog (Base UI default, React Aria, unified `radix-ui`, `cn` package, composition trees). tailwind-merge 3.7.0 README and configuration docs (does not read `@theme`, colour validator, theme keys). cn 0.5.0 README (`createCn` from `cn/config`). cva beta README ("not covered by semver") and `cva/tools` types. tailwind-variants 3.3.1 README and slots docs. Tailwind "Styling with utility classes" (props over outside classes). cva output, tv slot merging and the registered-key fix run locally. WCAG 2.2 criteria listed in the table. |
| [architecture.md](./resources/architecture.md) | Tailwind docs: Detecting classes in source files (`node_modules` and `.gitignore` skipped, paths relative to the stylesheet). The package-owned `@source` built with `@tailwindcss/cli` 4.3.3 through a `node_modules` link, with a control run without the line; repeated in CI. `@tailwindcss/node` 4.3.3 resolver (`conditionNames: ["style"]`). shadcn monorepo docs and `templates/next-monorepo` (`globals.css` `@source` lines, package exports). Turborepo Tailwind guide (`prefix(ui)`, compiled UI package) and internal packages page (just-in-time limits). Primer ADR-021. `@primer/react` exports (`./experimental`, `./deprecated`). pnpm catalogs page. publint and attw READMEs. Tailwind IntelliSense README (`experimental.configFile` map, `classFunctions`). prettier-plugin-tailwindcss 0.8.1 README (`tailwindStylesheet` relative to the config, must load last). |
| [distribution.md](./resources/distribution.md) | shadcn docs: registry getting started, registry.json, registry-item.json (item types, `cssVars` targets, `tailwind` deprecated, description guidance), namespaces (env expansion, resolution order, versioning by convention), authentication, GitHub registries (SHA refs, limits), CLI (`view`, `--dry-run`, `--diff`, `registry validate`). shadcn changelog entries for `registry:base`, GitHub registries and private GitHub registries. |
| [enforcement.md](./resources/enforcement.md) | eslint-plugin-better-tailwindcss README, settings docs (`entryPoint`, `cwd`), `no-restricted-classes` docs, 4.0 changelog renames. The full shared config run with ESLint 10.13.0 and the plugin 4.10.0 against planted violations. eslint-plugin-tailwindcss 4.4.0 README. Storybook 10.6 accessibility testing and autodocs docs, addon-themes API. Chromatic TurboSnap docs. Playwright visual comparisons docs. `audit-classes.mjs` and `check-contrast.mjs` behaviour from the CI fixtures. |
| [governance.md](./resources/governance.md) | Changesets config docs (fixed with globs, linked, independent). Atlassian `no-deprecated-design-token-usage` and use-tokens-in-code pages (lifecycle, recommended config). Primer primitives changelog (deprecated aliases, removals). Primer ADR-019 Deprecating Props, ADR-007, the ADR folder. Primer component lifecycle page and `generated/components.json`. Carbon component checklist, contributing page, `@carbon/upgrade` README. GOV.UK contribution criteria. Nathan Curtis "Team Models for Scaling a Design System": the Medium page returned 403, so the summary is from secondary sources (GOV.UK design notes, Jina Anne's talk slides, Center Centre) and is paraphrased, not quoted. Omlet site, react-scanner README, Figma library analytics docs. |
| [documentation.md](./resources/documentation.md) | Diataxis map and home page. GOV.UK Button page, Primer Button page, Carbon component checklist. Storybook autodocs docs. cva beta `getSchema`. shadcn changelog (markdown docs pages, composition trees) and registry guidance. Markdown and `llms.txt` availability checked by HTTP: shadcn serves both, tailwindcss.com returns 404 for both. |
| [migration.md](./resources/migration.md) | Tailwind upgrade guide (Node 20, new branch, renames, ring, border colour, important, prefix, hover media query, `space-y`, `resolveConfig` removed, `@utility container`). Compatibility page (browser floor, preprocessors). v4.1 blog post (older browser fallbacks). 4.2.0 changelog (`start-*` deprecated, webpack plugin). Functions and directives (`@config` limits, `theme()` deprecated). |
| [templates/theme.css](./templates/theme.css) | Every pair measured by `check-contrast.mjs` (36 pairs, both modes, all pass). Compiled on 4.3.3: the default palette, `text-4xl`, `rounded-3xl` and `shadow-xl` do not compile; semantic classes, `bg-transparent`, `text-current`, `z-(--z-modal)` and the custom utilities and variant do. |

## Scripts

| Script | Checked by |
| --- | --- |
| `check-contrast.mjs` | Known ratios in CI: `#767676` on white 4.54, `#999` on white 2.85, OKLCH red (sRGB `#ff0000`) on white 4.00, 50% black over white 3.98, white on black 21. The OKLCH conversion uses Björn Ottosson's OKLab matrices and reproduces Tailwind's `blue-600` (`oklch(0.546 0.245 262.881)`) as `#155dfc`. WCAG 2 relative luminance and ratio formulas. |
| `audit-classes.mjs` | A fixture with each kind of bypass planted a known number of times, plus `data-[...]` and `group-[...]` variants that must not count |
| `inspect.mjs` | A fixture monorepo with a package theme, a v3 config file, and a surface with no foreground token |

## Prior art

Read for ideas, not as authority.

| Source | Taken |
| --- | --- |
| shadcn's own agent skill (`npx skills add shadcn/ui`) and its design-system reference | Running a project inspector first. The control-heights table. The `type-*` text style reason. |
| jezweb `tailwind-theme-builder` | A symptom, cause, fix table. The dark mode "no flash, works in a private window" checks. |
| wshobson `tailwind-design-system` | `--color-*: initial` and `@theme static` as enforcement tools |
| dylantarre `tokens-structure` | "When to add each tier" and anti-pattern tables |
| Anthropic `skill-creator` | SKILL.md under 500 lines, details in resources, a contents list in long files |

## Not taken

| Claim seen elsewhere | Why not |
| --- | --- |
| `@apply` is deprecated in v4 | It is not. shadcn's own base layer uses it. The docs no longer recommend it for components. |
| `tw-animate-css` does not exist | It does. shadcn's manual install imports it. |
| Wrap colours in `hsl()` | shadcn moved to OKLCH values. |
| `@theme reference` as a public option | Present in the parser, absent from the docs |
| Class order in markup affects which class wins | It does not. CSS order does, which is why `cn` merges. |
| Radix step 11 and 12 meet WCAG 4.5:1 | Radix guarantees APCA values, not WCAG 2 ratios |
