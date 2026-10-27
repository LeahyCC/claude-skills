# Governance

Versioning, deprecation, component lifecycle, contribution, and measuring adoption. A system used by many teams is a product with users, and these are its release and support policies. Write them down before the first breaking change, not after.

Contents:

- [Versioning](#versioning)
- [What counts as breaking](#what-counts-as-breaking)
- [Deprecating a token](#deprecating-a-token)
- [Deprecating a component or prop](#deprecating-a-component-or-prop)
- [Component lifecycle](#component-lifecycle)
- [Contribution](#contribution)
- [Decisions on record](#decisions-on-record)
- [Adoption and health](#adoption-and-health)

## Versioning

Semver, with Changesets (checked at 3.0.3, now the `latest` line). Each PR that changes a package adds a changeset describing the change for consumers. The release PR collects them into versions and changelogs.

| Strategy | Changesets option | Use when |
| --- | --- | --- |
| Independent | Default | Packages have different consumers. Tokens used by native apps, components by web. |
| Fixed | `"fixed": [["@acme/*"]]` (globs allowed) | Packages are always used together. One version number for the whole system is easier to support: "are you on 5.3?" |
| Linked | `"linked": [[...]]` | Share a version line, but only bump what changed. Rarely worth the confusion. |

Most large systems pick fixed for the core (`tokens`, `theme`, `ui`, `icons`) because consumers then think in one version, and bug reports carry one number.

## What counts as breaking

Write this table into the system's contribution guide. Teams disagree about the middle rows until it is written down.

| Change | Semver |
| --- | --- |
| Remove or rename a component, prop, variant, token, utility or custom variant | Major |
| Change a token's role (what it is for) | Major |
| Change a default variant | Major |
| Raise selector specificity of system CSS | Major. It silently breaks app overrides. |
| Change a token's value within its role (a new brand blue) | Minor, flagged in the changelog. Visual tests catch the rest. |
| Change a value so a contrast pair drops below its ratio | Not allowed. The contrast check blocks it. |
| Add a component, prop, variant or token | Minor |
| Bug and accessibility fixes that match documented behaviour | Patch |
| Experimental entry point (`@acme/ui/experimental`) | No promise. Say so in its docs. |

Raise the Tailwind peer range in a minor only when the new minimum adds nothing consumers must change. Moving to a new Tailwind major is a system major.

## Deprecating a token

Atlassian's lifecycle is the clearest model: active, then deprecated (a lint warning with the replacement suggested), then deleted (a lint error). Primer keeps the old name as an alias of the new one for a period, then removes it. Combine them:

| Step | Release | What happens |
| --- | --- | --- |
| 1. Mark it | Minor | `$deprecated: "Use {color.primary}. Removed in 6.0."` in DTCG. The old CSS variable becomes an alias: `--accent-legacy: var(--primary);`. |
| 2. Warn | Same minor | Add the old class to `no-restricted-classes` with a `fix` to the new one. Lint warns, autofix migrates. |
| 3. Migrate | Following weeks | Teams run `eslint --fix`. Track remaining uses with the audit script or lint output. |
| 4. Remove | Next major | Delete the alias and the theme key. `no-unknown-classes` now errors on any leftover. |

<!-- css-expect: bg-accent-legacy bg-primary -->
```css
:root {
  --primary: oklch(0.546 0.215 263);
  /* Deprecated in 5.4, removed in 6.0. Use --primary. */
  --accent-legacy: var(--primary);
}

@theme inline {
  --color-primary: var(--primary);
  --color-accent-legacy: var(--accent-legacy);
}
```

Never change what an existing token means. A token whose role changes gets a new name and the old one goes through these steps. Otherwise every use of it silently changes meaning.

## Deprecating a component or prop

Primer's ADR-019, "Deprecating Props", is a good process to copy:

1. Add a `@deprecated` JSDoc tag, so editors strike the name through.
2. Mark it deprecated in the docs, with the replacement.
3. Add a lint rule that warns on it.
4. Where the change is safe and mechanical, run the rule's autofix and open PRs for the owning teams.
5. Where it is large, add a disable comment at each use, so remaining usage can be counted.
6. Turn the rule to error.

Primer rejected console warnings as the main tool: they add "friction to product teams" and are "not as effective as the linting rule". Carbon ships codemods for migrations through `npx @carbon/upgrade`, run with jscodeshift, and says to run Prettier over the result. A breaking change in a large system ships with a codemod or an autofix rule, or it does not ship.

```ts
type ButtonProps = {
  /** @deprecated Use `variant="destructive"`. Removed in 6.0. */
  danger?: boolean
  variant?: "primary" | "secondary" | "destructive"
}
```

## Component lifecycle

| Stage | Promise | Where it lives |
| --- | --- | --- |
| Experimental | None. May change in any release. | `@acme/ui/experimental` |
| Stable | Semver. Breaking changes need a major and a migration path. | `@acme/ui` |
| Deprecated | Still works. Warns in lint. Has a documented replacement and a removal version. | `@acme/ui` until removed, or `@acme/ui/deprecated` |

Primer's lifecycle page now uses Experimental, Ready and Deprecated, and its package exposes `./experimental` and `./deprecated` entry points. Putting the stage in the import path means a code search answers "who depends on unstable API?", and the stage cannot be missed in review.

Criteria to leave Experimental, from Carbon's component checklist and Primer's lifecycle: only system tokens (no magic numbers or colours), every state designed and built (hover, focus, selected, disabled, read-only, error), keyboard and screen reader tested, an accessibility check passing in CI, works in every theme, responsive to 320px, documented with usage guidance, used in production by at least one team.

Keep a machine-readable list of components with their status and the date of their last accessibility review. Primer generates one (`@primer/react/generated/components.json`). Docs, lint rules and dashboards can all read it.

## Contribution

Nathan Curtis's team models describe who builds the system: solitary (one product team's library others use), centralized (a dedicated team serving others), federated (people from product teams decide together). Large organisations usually end up centralized at the core with federated contribution, and Curtis warns that a federated model still needs dedicated core staff.

GOV.UK's criteria for accepting a new component are short and work well:

| Stage | Criterion |
| --- | --- |
| Proposal | Useful: evidence that many teams need it. Unique: it does not replicate something already in the system. |
| Before publishing | Usable: shown to work with users, including disabled users. Consistent: reuses existing styles and components. Versatile: works across services, browsers, devices and assistive technology. |

Carbon starts new components in a separate labs repo and promotes them once the checklist passes. The experimental entry point does the same job inside one package.

The path for a team that needs something the system lacks: use the closest component, open a request, and build locally with system tokens only, so it can be promoted later without a rewrite.

## Decisions on record

Keep architecture decision records in the repo: one short markdown file per decision, with context, decision, consequences and status. Primer keeps 28 in `contributor-docs/adrs/`, covering prop naming, CSS layers, deprecating props and more. When someone asks why components use `data-slot`, or why the palette is closed, the answer is a link, not a meeting.

Decisions worth recording on day one: the dark mode switch, the token tiers, how the system ships (package, registry, or both), the primitive library, what counts as breaking.

## Adoption and health

| Measure | How | Tells you |
| --- | --- | --- |
| Off-system styling per app | `audit-classes.mjs --json` in each app's CI, charted | Token adoption. Component scanners miss this. |
| Lint violations of restricted classes | ESLint JSON output across apps | The same, with file and line |
| Component usage and versions | Omlet, or `react-scanner` (no release since 2024) | Which components and props teams use, who is on old versions, what is safe to remove |
| Figma detachments | Figma library analytics (REST API on the Enterprise plan) | Where designers leave the system, which is where the system is missing something |
| Accessibility debt | Stories with `a11y.test = "todo"` | What is known broken |

Use the numbers to decide what to build next, not to rank teams. A team with many arbitrary values is usually telling you a token is missing.
