# Architecture

How to lay out a design system repo, how apps consume it, and how each app's Tailwind build finds the system's classes. This is where large codebases most often go wrong, and where neither the Tailwind nor the shadcn docs say much.

Contents:

- [The default shape](#the-default-shape)
- [Packages and their boundaries](#packages-and-their-boundaries)
- [The package owns its `@source`](#the-package-owns-its-source)
- [Three ways to ship, and when each fits](#three-ways-to-ship-and-when-each-fits)
- [Package exports](#package-exports)
- [Cascade layers and specificity](#cascade-layers-and-specificity)
- [Monorepo tooling](#monorepo-tooling)
- [Editor and formatter setup in a monorepo](#editor-and-formatter-setup-in-a-monorepo)

## The default shape

```text
design-system/                     one repo, many packages, versioned together or not
├── packages/
│   ├── tokens/        DTCG JSON, the source of truth once there is a second consumer
│   ├── theme/         theme.css generated from tokens: :root, modes, brands, @theme
│   ├── ui/            components, source shipped, owns its @source
│   ├── icons/         SVG components
│   ├── eslint-config/ the restricted-class rules every app extends
│   └── docs/          Storybook or a docs site, built from the packages
└── apps/              optional: in-repo consumers, or playgrounds

product app (any repo)
  app.css:  @import "tailwindcss";
            @import "@acme/ui/theme.css";     ← brings tokens and the @source for ui
```

One Tailwind build per app. The app compiles every class it uses, from its own files and from the system's components, into one stylesheet. No duplicated utilities, no second Preflight, no specificity fights between two Tailwind outputs.

Small systems can start as one package (`@acme/ui` holding the theme and components) and split later. Splitting `tokens` out matters when a non-web consumer appears. Splitting `theme` out matters when apps that do not use the components still want the tokens.

## Packages and their boundaries

| Package | Contains | Depends on | Must not |
| --- | --- | --- | --- |
| `tokens` | DTCG JSON, the build that emits CSS and the merge config | nothing at runtime | Contain CSS written by hand |
| `theme` | `theme.css` (or generated output), brand files | `tokens` at build time | Import `tailwindcss`. The app does that, once. |
| `ui` | Components, `cn`, variants, custom variants and utilities in CSS | `theme`, a primitive library, `tailwindcss` as a peer | Ship compiled Tailwind CSS (in the default model) |
| `icons` | Icon components | nothing | Hard-code colours. Use `currentColor`. |
| `eslint-config` | Shared lint rules | the lint plugins | Hold app-specific rules |

`tailwindcss` is a peer dependency of `ui` and `theme`, with a range (`^4.3.0`). Each app installs one version. In a pnpm monorepo, put it in the default catalog so every package compiles with the same Tailwind.

## The package owns its `@source`

Tailwind's automatic detection skips `.gitignore`d paths and `node_modules`. A workspace package usually resolves through `node_modules`, so an app's build does not see the system's component files, and every class used only inside the system is missing in production. This is the most common Tailwind monorepo bug.

The usual fix is a path in every app:

<!-- css-check: skip, FAIL sample: works, but every app hard-codes the system's folder layout -->
```css
/* FAIL at scale: each app knows the system's internal folders */
@import "tailwindcss";
@import "@acme/ui/theme.css";
@source "../../../packages/ui/src";
```

Better: put the `@source` in the system's own CSS. A path in `@source` is relative to the stylesheet that contains it, including a stylesheet pulled in by `@import` from `node_modules`. So the package states where its classes live, and apps never mention it.

<!-- css-check: skip, needs the package's own folder to resolve -->
```css
/* packages/ui/src/theme.css */
@source "./components";

:root { /* semantic tokens */ }
@theme inline { /* utility map */ }
```

<!-- css-check: skip, needs the package installed -->
```css
/* apps/web/app/globals.css: two lines, no knowledge of the system's folders */
@import "tailwindcss";
@import "@acme/ui/theme.css";
```

Verified on Tailwind 4.3.3 with the CLI: an app that only imports the package theme generates the package's classes, through a `node_modules` link to the workspace. With the `@source` line removed, those classes disappear. The skill's CI check builds this fixture on every run, so a Tailwind release that changes the behaviour fails the check.

When the system is published to npm and ships compiled JavaScript, point `@source` at what is in the tarball (`@source "../dist";`) and make sure `files` in `package.json` includes it. Class strings survive compilation. Minifiers do not rewrite string literals.

Do the opposite for anything an app should not scan: `@source not "./stories";` keeps Storybook-only classes out of every app.

## Three ways to ship, and when each fits

| | A: source, the app compiles | B: compiled CSS with a prefix | C: published package, the app compiles |
| --- | --- | --- | --- |
| Who documents it | shadcn monorepo template | Turborepo's Tailwind guide | Tailwind's detecting-classes docs |
| Tailwind builds per page | One | Two (system and app) | One |
| Duplicate utilities and Preflight | None | Likely | None |
| App overrides with `className` | Yes, merged by `cn` | Harder: different prefix, merge needs `prefix` config | Yes |
| Tailwind version | Must match across apps | Free per app | Peer range |
| Consumers not on Tailwind | No | Yes | No |
| Cached system build | No (just in time) | Yes | JS only |

Pick A inside one monorepo where every consumer is on Tailwind 4. Pick C for many repos on Tailwind 4: the same as A, with the package published and a peer range. Pick B only when some consumers are not on Tailwind or cannot match its version. Turborepo's guide uses `@import "tailwindcss" prefix(ui);` for B, so system classes are written `ui:flex` and cannot collide with the app's.

shadcn's monorepo template is a variant of A with one stylesheet in the UI package that scans every app (`@source "../../../apps/**/*.{ts,tsx}"`). It works for one product. For many apps, give each app its own entry and let the package own its `@source`, so a new app needs no change in the system.

## Package exports

Tailwind's CSS `@import` resolver reads the `style` export condition (verified in `@tailwindcss/node` 4.3.3). `tailwindcss` and `tw-animate-css` both ship CSS this way.

<!-- json-check: parse -->
```json
{
  "name": "@acme/ui",
  "type": "module",
  "sideEffects": ["**/*.css"],
  "exports": {
    ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
    "./button": { "types": "./dist/button.d.ts", "default": "./dist/button.js" },
    "./experimental": { "types": "./dist/experimental.d.ts", "default": "./dist/experimental.js" },
    "./theme.css": { "style": "./src/theme.css", "default": "./src/theme.css" },
    "./package.json": "./package.json"
  },
  "files": ["dist", "src"],
  "peerDependencies": { "react": "^19.0.0", "tailwindcss": "^4.3.0" }
}
```

| Field | Why |
| --- | --- |
| `sideEffects: ["**/*.css"]` | `false` lets bundlers drop a CSS import as unused |
| One export per component, or a barrel with care | Per-component entries keep app bundles small without relying on tree shaking |
| `./experimental` entry | Lifecycle in the import path, as Primer does with `@primer/react/experimental`. See [governance.md](./governance.md). |
| `./theme.css` with `style` | `@import "@acme/ui/theme.css"` resolves from CSS |
| `files` includes what `@source` points at | Otherwise published apps scan nothing |

Check the published shape before release: `pnpm pack`, then `publint` and `attw` (`@arethetypeswrong/cli`) on the tarball. `attw --pack` only supports npm, so pack with pnpm first and pass the tarball. Exclude CSS entries with `--exclude-entrypoints theme.css`.

## Cascade layers and specificity

Tailwind v4 puts output in `@layer theme, base, components, utilities`. Utilities come last, so a utility beats any `@layer components` rule regardless of specificity. Keep it that way.

| Rule | Why |
| --- | --- |
| System CSS goes in `@layer base` or `@layer components`, never unlayered | Unlayered CSS beats every layer, so app utilities can no longer override it |
| Selectors in system CSS use `:where()` | Specificity zero means order decides, and a minor release cannot raise specificity and break overrides. Primer's ADR on CSS layers makes the same call. |
| No `!important` in system CSS | It escapes layers in the wrong direction. Tailwind's `important` import flag is for coexisting with legacy CSS, not for a system. |
| Legacy CSS in a named layer before Tailwind's | `@layer legacy, theme, base, components, utilities;` lets utilities win while the old CSS still loads |

Coexisting with an old stylesheet during migration:

<!-- css-check: skip, imports a file that does not exist here -->
```css
@layer legacy, theme, base, components, utilities;
@import "./legacy/bootstrap.css" layer(legacy);
@import "tailwindcss";
```

## Monorepo tooling

| Tool | Version checked | Job |
| --- | --- | --- |
| pnpm workspaces and catalogs | pnpm 12.15.0 | `catalog:` pins one version of `tailwindcss`, `react`, `typescript` across packages. Replaced with the real range on publish. `catalogMode: strict` refuses versions outside the catalog. |
| Turborepo | 2.11.10 | Task graph and caching. A just-in-time UI package has no build to cache. |
| Changesets | 3.0.3 | Versions, changelogs, publishing. See [governance.md](./governance.md#versioning). |
| knip | 6.43.0 | Unused files, exports and dependencies per workspace |
| syncpack | 15.3.3 | Consistent dependency ranges, and migration to catalogs |
| publint, attw | 0.3.25, 0.18.5 | The published package resolves in every environment |

## Editor and formatter setup in a monorepo

Every tool that understands Tailwind classes needs the CSS entry for the code it is reading. In a monorepo there are several, so one root setting is wrong.

VS Code Tailwind IntelliSense maps entries to folders:

```jsonc
// .vscode/settings.json
{
  "tailwindCSS.classFunctions": ["cva", "cn", "tv", "cx", "twMerge"],
  "tailwindCSS.experimental.configFile": {
    "packages/ui/.storybook/preview.css": "packages/ui/**",
    "apps/web/app/globals.css": "apps/web/**",
    "apps/admin/src/app.css": "apps/admin/**"
  }
}
```

`prettier-plugin-tailwindcss` sorts classes and needs `tailwindStylesheet` for v4, resolved from the Prettier config file. Give each package its own config, or use Prettier `overrides`. It must be the last plugin in the list.

```jsonc
// packages/ui/.prettierrc
{
  "plugins": ["prettier-plugin-tailwindcss"],
  "tailwindStylesheet": "./.storybook/preview.css",
  "tailwindFunctions": ["cva", "cn", "tv", "cx"]
}
```

Point these tools at a file that imports `tailwindcss` and the theme. A theme file with no Tailwind import gives them no utilities to sort or check against, so the Storybook preview CSS or an app entry is the right target.

The lint setup for the same problem is in [enforcement.md](./enforcement.md).
