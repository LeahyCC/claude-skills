# Tailwind design system validation

Run on 2026-10-26 with Node 26.12.1 on Windows, Tailwind CSS 4.3.3.

## The checker

`node reviews/tailwind-design-system/checks/check-skill.mjs`

```text
ok    installed tailwindcss 4.3.3
ok    20 css blocks compiled (6 skipped by marker)
ok    10 markup blocks, 82 classes checked against the starter theme
ok    templates/theme.css: 36 contrast pairs pass
ok    contrast #767676 on white = 4.54
ok    contrast #999 on white = 2.85
ok    contrast oklch red on white = 4
ok    contrast black at 50% over white = 3.98
ok    contrast white on black = 21
ok    starter theme closes the palette and keeps the semantic classes
ok    audit-classes counts every planted bypass, and no data-[...] or group-[...] variant
ok    audit-classes exits 1 over budget
ok    inspect finds tailwindcss in package.json
ok    inspect reads @source from the package theme
ok    inspect sees --color-*: initial
ok    inspect flags tailwind.config.js
ok    inspect flags a surface with no foreground
ok    an app that imports the package theme scans the package through its own @source
ok    the app still scans its own files
ok    160 relative links resolve
ok    README says 11 resource files
ok    marketplace.json resource count matches
ok    description is 963 characters
ok    SKILL.md is 126 lines

All checks pass.
```

`claude plugin validate . --strict` passes.

## The checker can fail

Each defect was planted on its own, the checker run, and the file restored.

| Planted defect | Result |
| --- | --- |
| A PASS sample in components.md uses `text-subtle`, which the starter theme does not define | `class "text-subtle" does not exist under templates/theme.css`, exit 1 |
| tokens.md marks `bg-primary` as a class that must not compile | `class bg-primary should not compile but does`, exit 1 |
| A CSS sample defines `@utility scrollbar-` | `does not compile: ... defines an invalid utility name`, exit 1 |
| The starter theme's light `--muted-foreground` moved to `neutral-400` | `templates/theme.css has 3 failing contrast pairs`, exit 1 |
| The fixture package theme loses its `@source` line | `package @source not followed: .bg-brand,.px-7`, exit 1 |
| SKILL.md links to `scales.md#density`, which is not a heading | `links to missing anchor`, exit 1 |

The first run of the checker also found a bug in itself: the starter theme's header comment contains the text `@import "tailwindcss"`, so the checker did not prepend the import, and the theme compiled without Tailwind's defaults. That made the closed-palette test pass for the wrong reason. Comments are now stripped before the check.

## Claims checked by running them

| Claim | Run |
| --- | --- |
| Semantic colours in plain `@theme` compile to `var(--color-x)`, in `@theme inline` to `var(--x)` | `candidatesToCss` on 4.3.3 |
| `--color-*: initial` removes the default palette, keeps `bg-transparent` and `text-current` | 4.3.3 |
| Property-scoped namespaces (`--background-color-*`, `--text-color-*`, `--border-color-*`) limit a colour to one utility family, and `--border-color-*` does not feed `outline-*` | 4.3.3, and the 15 theme keys read from the build output |
| A `@source` in a package's CSS, imported from `node_modules`, is resolved relative to the package | `@tailwindcss/cli` 4.3.3 through a directory junction, with a control run without the line |
| `p-4` compiles to `calc(var(--spacing) * 4)`, so a density override of `--spacing` works | 4.3.3 |
| `transition-discrete`, `starting:`, `contrast-more:`, `forced-colors:`, `@container-size`, `inset-s-0` exist | 4.3.3 |
| An unregistered `text-heading` makes `twMerge` and `cn` drop the colour beside it. Registering it under `theme.text` keeps both. A `type-` prefix never collides. | tailwind-merge 3.7.0, cn 0.5.0 |
| `cva` does not merge a `className` passed to it. tailwind-variants slot functions merge a per-call `class`. | class-variance-authority 0.7.1, tailwind-variants 3.3.1 |
| The shared ESLint config in enforcement.md reports raw palette, arbitrary, `dark:` colour, trailing `!`, closed-palette and conflicting classes, passes the theme's own classes and custom utilities, and does not flag `data-[state=open]:` | ESLint 10.13.0, eslint-plugin-better-tailwindcss 4.10.0, the starter theme as `entryPoint` |
| The OKLCH conversion in check-contrast.mjs reproduces Tailwind's `blue-600` as `#155dfc` and OKLCH red as `#ff0000` | Node |
| shadcn serves docs as markdown and `llms.txt`. tailwindcss.com does neither. | HTTP status of each URL |

## Not run

- `npx skills add LeahyCC/claude-skills@tailwind-design-system` needs the branch on GitHub.
- The model runs in tasks.md need Colin's approval.
- Storybook, Chromatic and Playwright configurations in enforcement.md are from their docs, not run.
