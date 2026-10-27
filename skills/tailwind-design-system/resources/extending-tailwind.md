# Extending Tailwind

Custom utilities, custom variants, safelists, and where CSS outside utilities belongs. In a design system each of these is public API: every app can type the class, so add them as carefully as a component prop.

Contents:

- [Which tool for which job](#which-tool-for-which-job)
- [`@utility`](#utility)
- [`@custom-variant`](#custom-variant)
- [`@apply` and component CSS](#apply-and-component-css)
- [`@source inline` and dynamic class names](#source-inline-and-dynamic-class-names)
- [`@reference` for CSS modules and style blocks](#reference-for-css-modules-and-style-blocks)
- [Plugins](#plugins)

## Which tool for which job

| Need | Use | Not |
| --- | --- | --- |
| A new value on an existing scale | A theme variable in `@theme` | `@utility` |
| A property Tailwind has no utility for | `@utility` | `@layer utilities { .x {} }`, which gets no variants in v4 |
| A multi-property style many components share (a text style, a focus ring) | `@utility` | A `.class` in `@layer components` |
| A state or context selector (`data-open`, a brand) | `@custom-variant` | Arbitrary variants copied across files |
| Styling third-party markup you do not control | `@layer components` with tokens | Utilities in a wrapper `div` |
| Element defaults (`body`, headings, links) | `@layer base` | Utilities on every element |
| A reusable piece of UI | A component | `@apply` |

## `@utility`

Custom utilities go into the utilities layer and work with every variant: `hover:`, `lg:`, `dark:`, `@md:`.

<!-- css-expect: focus-ring hover:focus-ring scrollbar-hidden -->
```css
@utility focus-ring {
  outline: 2px solid var(--color-ring);
  outline-offset: 2px;
}

@utility scrollbar-hidden {
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}
```

Functional utilities take a value, from the theme, a bare number, or an arbitrary value, resolved left to right. Since 4.3, `--default()` gives the bare class a value.

<!-- css-expect: elevation elevation-2 elevation-[7] -->
```css
@theme {
  --elevation-1: 0 1px 2px oklch(0 0 0 / 0.1);
  --elevation-2: 0 4px 8px oklch(0 0 0 / 0.12);
}

@utility elevation-* {
  box-shadow: --value(--elevation-*, [*]);
  z-index: --value(integer, [integer], --default(1));
}
```

| Rule | Why |
| --- | --- |
| Check the name is not taken | `tab-*` became a core utility in 4.3, while the docs still use it as the custom example. A custom name that a later release adds is silently replaced or merged. Prefix system utilities when in doubt. |
| Do not reuse a Tailwind prefix for a different property | `text-heading` as a text style collides with `text-*` colours in `tailwind-merge`. Use `type-heading`. |
| Read tokens with `var(--color-x)`, never literal values | The utility then follows themes |
| One utility, one job | Several jobs in one class cannot be overridden one at a time |

Prefixing helps when a name is generic: `ds-focus-ring` cannot collide with a future Tailwind utility. Register new utility names in `tailwind-merge` if they conflict with an existing group.

## `@custom-variant`

A variant names a selector or media query once, so every component writes the same condition the same way.

<!-- css-expect: data-open:opacity-100 brand-harbor:bg-primary any-hover:bg-accent -->
```css
@theme inline {
  --color-primary: var(--primary);
  --color-accent: var(--accent);
}

/* Matches Radix (data-state="open") and Base UI (data-open), so components survive a primitive swap */
@custom-variant data-open {
  &:where([data-state="open"]),
  &:where([data-open]:not([data-open="false"])) {
    @slot;
  }
}

@custom-variant brand-harbor (&:where([data-brand="harbor"], [data-brand="harbor"] *));

@custom-variant any-hover {
  @media (any-hover: hover) {
    &:hover {
      @slot;
    }
  }
}
```

The `data-open` variant is the one shadcn ships in `shadcn/tailwind.css`. A system that wraps a primitive library should define variants for the library's state attributes, so component classes do not depend on which library sets them.

Use `:where()` inside variants. It keeps specificity at zero, so a variant class never beats a plain utility by accident, and the order in the generated CSS decides. Primer's ADR on CSS layers makes the same argument: raising selector specificity in a minor release silently breaks consumers' overrides.

`@variant` applies a variant inside your own CSS. Since 4.3 it stacks and compounds:

```css
.legacy-widget {
  background: var(--color-card);

  @variant dark {
    background: var(--color-popover);
  }

  @variant hover, focus-visible {
    outline: 2px solid var(--color-ring);
  }
}
```

## `@apply` and component CSS

`@apply` copies utility declarations into a CSS rule. Tailwind's current "Styling with utility classes" page does not use it. Its custom CSS example writes plain properties with tokens:

```css
@layer components {
  .btn-legacy {
    background-color: var(--color-primary);
    color: var(--color-primary-foreground);
    padding-inline: --spacing(4);
    border-radius: var(--radius-md);
  }
}
```

| Use `@apply` | Avoid `@apply` |
| --- | --- |
| A few lines in `@layer base`, as shadcn's scaffold does (`body { @apply bg-background text-foreground; }`) | Rebuilding components as classes: `.btn { @apply ... }` then `<button class="btn">` |
| Styling third-party markup where you cannot add classes | CSS modules and Vue or Svelte `<style>` blocks, where each file is a separate Tailwind run |

Why components and not `@apply` classes: a `.btn` class hides which utilities it holds, cannot take a variant prop, cannot be type-checked, and breaks `tailwind-merge` because `cn("btn", "px-8")` does not know `.btn` sets padding. `@apply` is not deprecated. It is just rarely the right tool in a system built from components.

`@layer components` classes can still be overridden by utilities, because the utilities layer comes later. That is the correct home for styles you must write as CSS.

## `@source inline` and dynamic class names

Tailwind reads source files as plain text. A class it cannot see as a whole string is never generated.

<!-- classes: skip, FAIL sample on purpose -->
```tsx
// FAIL: bg-${tone} is never a whole string, so no CSS is generated for it
function Badge({ tone }: { tone: "primary" | "destructive" }) {
  return <span className={`bg-${tone} text-${tone}-foreground`} />
}
```

```tsx
// PASS: every class is a complete string Tailwind can find
const toneClasses = {
  primary: "bg-primary text-primary-foreground",
  destructive: "bg-destructive text-destructive-foreground",
} as const

function Badge({ tone }: { tone: keyof typeof toneClasses }) {
  return <span className={toneClasses[tone]} />
}
```

When a class only exists in data, such as a CMS that stores a tone name, safelist it:

<!-- css-expect: bg-success bg-warning -->
```css
@theme inline {
  --color-success: var(--success);
  --color-warning: var(--warning);
}

@source inline("bg-{success,warning}");
```

`@source not inline(...)` blocks a class even when Tailwind finds it. That is a way to retire a utility: the class stops compiling, and lint flags the leftovers.

## `@reference` for CSS modules and style blocks

A CSS module or a Vue, Svelte or Astro `<style>` block is compiled on its own, without your theme. To use `@apply` or `@variant` there, reference the theme. `@reference` emits no CSS.

<!-- css-check: skip, needs a second file to reference -->
```css
@reference "@acme/ui/theme.css";

.title {
  @apply text-foreground;
}
```

Tailwind's compatibility page recommends against CSS modules with Tailwind where you can avoid them. Each module is a separate Tailwind run, so 50 modules is 50 runs. Plain `var(--color-foreground)` in a module needs no `@reference` and lets Tailwind skip the file. Prefer that.

## Plugins

| Plugin | Status on v4 |
| --- | --- |
| `@tailwindcss/typography` | Works through `@plugin "@tailwindcss/typography";`. Options go in a block: `@plugin "@tailwindcss/typography" { className: wysiwyg; }`. Theme `prose` colours with `@utility prose-brand { --tw-prose-body: var(--color-foreground); }`. |
| `@tailwindcss/forms` | Works through `@plugin`. `strategy: "class"` adds `form-*` classes instead of resetting every input, which suits a system that styles its own controls. |
| `@tailwindcss/container-queries` | Obsolete. Container queries are in core since 4.0. |
| `tailwindcss-animate` | Replaced by `tw-animate-css`, imported as CSS (`@import "tw-animate-css";`) |
| A JS plugin you wrote for v3 | Loads through `@plugin "./plugin.js"`, but each new utility should become `@utility` and each variant `@custom-variant`. CSS-defined API is what the language server and linters read best. |

`@config` loads a v3 JavaScript config. It exists for migration. A system should not ship one: `corePlugins`, `safelist` and `separator` are not supported in v4.
