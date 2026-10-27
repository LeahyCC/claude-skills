# Distribution

Two ways to get a design system into apps: install it as a package, or copy its source in through a shadcn registry. They give different answers to one question: who owns the code after it lands?

Contents:

- [Package or registry](#package-or-registry)
- [A registry for a design system](#a-registry-for-a-design-system)
- [Private registries](#private-registries)
- [Versioning a registry](#versioning-a-registry)
- [Using both](#using-both)

## Package or registry

| | npm package (`@acme/ui`) | shadcn registry (`npx shadcn add @acme/button`) |
| --- | --- | --- |
| Who owns the code in the app | The system team | The app team, from the moment it is copied |
| Updates | `pnpm up @acme/ui`, semver, changelog | Re-run `add`, review a diff with `--diff`, merge by hand |
| Customising one component | A variant request, or wrap it | Edit the file |
| Drift between apps | Low: one version per app | High: every copy can change |
| Fixing a bug everywhere | One release | A PR per app, or a codemod |
| Fits | Many apps that should look the same, a central team | A small number of apps that need to diverge, or a starter that teams then own |

For a large system with many consuming apps, the package is the default. A bug fix or an accessibility fix reaches every app in one release, and drift is visible as a version number. Copied components cannot be updated centrally, so a fix in the source does not reach the copies.

A registry fits around the package: templates, blocks, and starter screens that teams are expected to change, and new apps bootstrapped with the system's theme in one command.

## A registry for a design system

A registry is a `registry.json` listing items. Each item is a JSON document with files, dependencies and CSS. `shadcn build` writes one JSON file per item.

<!-- json-check: parse -->
```json
{
  "$schema": "https://ui.shadcn.com/schema/registry.json",
  "name": "acme",
  "homepage": "https://design.acme.com",
  "include": ["registry/ui/registry.json", "registry/blocks/registry.json"]
}
```

The item types that matter for a system:

| Type | Use |
| --- | --- |
| `registry:base` | A whole design system in one payload: components, dependencies, CSS variables, fonts, config. shadcn's docs describe it but do not yet document its payload shape. |
| `registry:theme` | Tokens only. Apps keep their components and take your colours. |
| `registry:style` | A style that other items build on |
| `registry:ui`, `registry:component`, `registry:block` | A primitive, a simple component, a multi-file block |
| `registry:font` | A font, with `family`, `provider` (`google` only today), `variable` |

A theme item carries tokens in `cssVars`: `theme` goes into `@theme`, `light` into `:root`, `dark` into `.dark`. The `tailwind` field is deprecated for v4.

<!-- json-check: parse -->
```json
{
  "$schema": "https://ui.shadcn.com/schema/registry-item.json",
  "name": "acme-theme",
  "type": "registry:theme",
  "title": "Acme theme",
  "description": "Acme semantic colour tokens for light and dark, contrast-checked to WCAG 2.2 AA.",
  "cssVars": {
    "light": {
      "primary": "oklch(0.546 0.215 263)",
      "primary-foreground": "oklch(1 0 0)"
    },
    "dark": {
      "primary": "oklch(0.714 0.143 254)",
      "primary-foreground": "oklch(0.13 0.028 262)"
    }
  }
}
```

The `cssVars` mapping writes dark values under `.dark`, so an app installing from a registry gets shadcn's class switch. If your system uses `[data-theme="dark"]`, say so in the item's `docs` field, or ship the theme as a file instead.

Write a real `description` on every item. shadcn's guidance: it "helps LLMs understand the component and its purpose." `shadcn registry validate` checks the schema, includes, duplicate names and file paths without a build, so run it in CI.

## Private registries

`components.json` maps a namespace to a URL. Environment variables in `${VAR}` form are expanded in URLs, headers and params.

<!-- json-check: parse -->
```json
{
  "registries": {
    "@acme": {
      "url": "https://registry.acme.com/r/{name}.json",
      "headers": { "Authorization": "Bearer ${ACME_REGISTRY_TOKEN}" },
      "params": { "version": "${ACME_REGISTRY_VERSION}" }
    }
  }
}
```

Since August 2026 a private GitHub repo can be a registry with no server: `npx shadcn add acme/design-system/button#<sha>`, authenticated through `gh auth login` or `GH_TOKEN`. A full commit SHA is the most reproducible reference. GitHub Enterprise is not supported, and files are limited to 5 MiB.

Before installing from any registry, look at what an item will write: `npx shadcn view @acme/button`, then `add --dry-run` or `--diff`. An item can add dependencies, environment variables and files anywhere under the project.

## Versioning a registry

The shadcn CLI has no lockfile and no semver resolution. Versioning is a convention your server implements: a `version` param, a `{style}` placeholder, or a separate namespace per channel (`@acme`, `@acme-next`). Record what each app installed, for example in a comment at the top of each copied file, or the app cannot tell which fixes it is missing.

When resolving, the CLI fetches an item and its dependencies, sorts them, de-duplicates files by target path with the last one winning, and deep-merges `cssVars` and `css`. So an item that lists another in `registryDependencies` and then overrides its `cssVars` is a supported way to brand a vendor's component.

## Using both

```text
@acme/ui (npm)             components, theme.css, cn, variants      updated centrally
@acme registry (shadcn)    registry:base  -> bootstrap a new app with theme + ui
                           registry:block -> screens teams copy and own
                           registry:theme -> tokens for apps not on @acme/ui yet
```

Blocks copied from the registry import components from the package (`import { Button } from "@acme/ui/button"`), not from copied files. The parts teams should own are copied. The parts that must stay consistent are installed.
