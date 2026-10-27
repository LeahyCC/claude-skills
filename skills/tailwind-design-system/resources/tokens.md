# Tokens

How to structure design tokens so a large system can change a value in one place, swap themes at runtime, and stop app code from reaching past the system. The theory is short. Most of this file is where each tier lands in Tailwind v4.

Contents:

- [The tiers and where each lives](#the-tiers-and-where-each-lives)
- [Why `@theme inline` for anything that changes per theme](#why-theme-inline-for-anything-that-changes-per-theme)
- [Close the scales](#close-the-scales)
- [Naming](#naming)
- [Property-scoped colours](#property-scoped-colours)
- [When to add a tier](#when-to-add-a-tier)
- [A source of truth outside CSS](#a-source-of-truth-outside-css)
- [Anti-patterns](#anti-patterns)

## The tiers and where each lives

```text
primitives          semantic                 utilities              component
--palette-blue-600  --primary                bg-primary             --button-height
raw values          what a value is for      what Tailwind emits    one component only
:root               :root + mode blocks      @theme inline          the component file
never a class       swapped per theme        the only public API    optional
```

| Tier | Lives in | Becomes a class? | Changes per theme? | Who may use it |
| --- | --- | --- | --- | --- |
| Primitive | `:root`, prefixed `--palette-*` | No | No | Semantic tokens only |
| Semantic | `:root`, `[data-theme="dark"]`, brand blocks | No | Yes | The `@theme inline` map, component CSS |
| Utility map | `@theme inline { --color-x: var(--x) }` | Yes | Through the semantic value | App and component markup |
| Static scale | `@theme { --text-sm: ... }` (type, radius, shadow, ease) | Yes | Rarely. Density can swap `--spacing`. | App and component markup |
| Component | A local custom property or `@utility` | Only if you make it one | Sometimes | That component |

The starter theme in [templates/theme.css](../templates/theme.css) is built this way. Copy it, then change values, not structure.

Primitives stay out of `@theme`. Anything in `@theme` becomes a utility and shows in editor autocomplete. Teams then use `bg-palette-blue-600` and the semantic layer is bypassed. In `:root` a primitive is still a variable, so the semantic tier can point at it, and nothing else can reach it from a class.

<!-- css-expect: bg-primary text-primary-foreground -->
<!-- css-reject: bg-palette-brand-600 -->
```css
:root {
  --palette-brand-600: oklch(0.546 0.215 263);
  --palette-neutral-0: oklch(1 0 0);

  --primary: var(--palette-brand-600);
  --primary-foreground: var(--palette-neutral-0);
}

@theme inline {
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
}
```

## Why `@theme inline` for anything that changes per theme

Tailwind's docs: "When defining theme variables that reference other variables, use the `inline` option." The reason is how CSS resolves `var()`.

With plain `@theme`, `bg-primary` compiles to `background-color: var(--color-primary)`, and `--color-primary: var(--primary)` is declared on `:root`. A custom property's value is computed where it is declared, then inherited. So `--color-primary` is fixed at the root value. A dark section lower in the page redefines `--primary`, but `--color-primary` already holds the light colour, and the section does not flip.

With `@theme inline`, Tailwind writes the value into the utility: `background-color: var(--primary)`. The utility reads `--primary` on the element itself, so any subtree that redefines it, such as a dark band, a brand area, or a high-contrast region, changes every utility inside it.

<!-- css-check: skip, FAIL sample: compiles, but nested themes do not flip -->
```css
/* FAIL: bg-primary reads --color-primary, which was resolved once at :root */
@theme {
  --color-primary: var(--primary);
}
```

<!-- css-expect: bg-primary dark:bg-primary -->
```css
/* PASS: bg-primary reads --primary wherever it is used */
@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));

:root { --primary: oklch(0.546 0.215 263); }
[data-theme="dark"] { --primary: oklch(0.714 0.143 254); }

@theme inline {
  --color-primary: var(--primary);
}
```

Use plain `@theme` for values that are the same in every theme: type sizes, shadows, easing. Tailwind emits those as variables only when something uses them. Override a shadow scale in plain `@theme`, not `@theme inline`, so `shadow-md` stays a variable your docs and JS can read.

`@theme static` emits every variable even when no class uses it. Use it in the package that documents tokens, or when JS reads a variable no class touches.

## Close the scales

A namespace reset removes Tailwind's defaults for that namespace. After it, only the values you define compile. This is the cheapest enforcement there is: an off-system class does not exist, so it renders nothing and the linter's unknown-class rule flags it.

<!-- css-expect: bg-primary rounded-lg text-sm -->
<!-- css-reject: bg-blue-500 text-gray-700 rounded-3xl text-4xl -->
```css
:root { --primary: oklch(0.546 0.215 263); --radius: 0.5rem; }

@theme inline {
  --color-*: initial;
  --color-white: #fff;
  --color-black: #000;
  --color-primary: var(--primary);

  --radius-*: initial;
  --radius-sm: calc(var(--radius) * 0.6);
  --radius-lg: var(--radius);
}

@theme {
  --text-*: initial;
  --text-sm: 0.875rem;
  --text-sm--line-height: 1.25rem;
}
```

| Namespace | Close it? | Why |
| --- | --- | --- |
| `--color-*` | Yes, always | Raw palette classes are the most common way apps drift. `bg-transparent` and `text-current` still work after the reset. |
| `--text-*` | Yes | A closed type scale is the point of a type scale |
| `--radius-*`, `--shadow-*` | Yes | Few steps, all chosen |
| `--font-*` | Yes, once fonts are chosen | Stops ad hoc families |
| `--spacing` | No | One multiplier, and `p-13` is still on the 4px grid. Restrict arbitrary values with lint instead. |
| `--breakpoint-*`, `--container-*` | Usually not | The defaults are sensible. Close them only if design owns a different set. |
| `--*` | Rarely | Removes everything, including easing and animation defaults. Only for a system that defines every namespace. |

Verified behaviour on 4.3.3: after `--color-*: initial`, `bg-blue-500` and `text-gray-700` do not compile, and `bg-transparent`, `text-current`, `bg-white` (when redefined) do.

## Naming

A semantic name says what the value is for, never what it looks like. `--danger` survives a rebrand to orange. `--red` does not.

The Tailwind utility already says which property a colour is for: `bg-`, `text-`, `border-`. So a colour token names a role, not a property. Writing the property into the name doubles it: `--color-bg-surface` gives `bg-bg-surface`.

| System | Pattern | Example |
| --- | --- | --- |
| shadcn/ui | role, plus a `-foreground` partner | `--primary`, `--primary-foreground` |
| Material 3 | role, plus an `on-` partner | `--md-sys-color-primary`, `--md-sys-color-on-primary` |
| Primer | namespace, pattern, variant, property, variant, scale | `fgColor-muted`, `bgColor-accent-emphasis`, `button-primary-bgColor-hover` |
| Atlassian | foundation, property, modifier | `color.background.neutral`, emitted as `--ds-background-neutral` |
| Spectrum | concept, object, state | `accent-background-color-hover` |

For a Tailwind system, use the shadcn contract as the base and extend it. shadcn registry components, and most of the ecosystem, read those exact names, so keeping them means third-party components drop in themed. Add your own roles with the same pairing rule.

| Rule | Use | Avoid |
| --- | --- | --- |
| Every surface a text colour sits on has a partner | `--warning`, `--warning-foreground` | `--warning` alone, with text colour picked per use |
| Roles, not hues | `--destructive`, `--success` | `--red`, `--green` |
| Emphasis as a suffix, one vocabulary | `--muted`, `--muted-foreground` | `--light-gray-text`, `--secondary-text`, `--subtle` mixed |
| State as a suffix only when it is its own value | `--primary-hover` when hover is not derivable | One token per state for every role |
| Kebab case, no property prefix inside colour names | `--color-surface` gives `bg-surface` | `--color-bg-surface` gives `bg-bg-surface` |

Write the role of every token down once, in a table with "controls" and "used by" columns. The shadcn theming page does this, and it is the format to copy: `accent` controls "interactive hover, focus, and active surfaces", used by "ghost buttons, menu highlight states, hovered rows, and selected items".

## Property-scoped colours

Undocumented, and real in Tailwind 4.3.3. Each colour utility reads a property-specific namespace before `--color-*`. A colour declared in `--background-color-*` produces only `bg-*`. One in `--text-color-*` produces only `text-*`.

<!-- css-expect: bg-surface text-subtle border-strong -->
<!-- css-reject: text-surface bg-subtle -->
```css
@theme inline {
  --background-color-surface: var(--surface);
  --text-color-subtle: var(--subtle);
  --border-color-strong: var(--strong);
}
```

The namespaces in the 4.3.3 source: `--background-color`, `--text-color`, `--border-color`, `--outline-color`, `--ring-color`, `--ring-offset-color`, `--box-shadow-color`, `--drop-shadow-color`, `--text-shadow-color`, `--text-decoration-color`, `--accent-color`, `--caret-color`, `--placeholder-color`, `--fill`, `--stroke`.

This makes `text-surface`, a text colour meant for a background, impossible to write. That is a real gain in a system with many surface and text roles. The cost is that it is not in the docs and could change in any release. If you use it, the CI class check in [enforcement.md](./enforcement.md) catches a release that drops it, because the classes stop compiling. Note that `border-color` does not feed `outline-*`, so a focus colour needs `--outline-color-*` as well.

For most systems the shadcn pairing is enough. Reach for scoped namespaces when the role list passes about 30 colours.

## When to add a tier

| Situation | Tiers |
| --- | --- |
| One product, one theme | Semantic only. Primitives are optional. |
| Light and dark | Primitives and semantic. Dark redefines semantic only. Primitives never change. |
| Several brands | Primitives per brand, one shared semantic contract, a brand block per brand |
| A component needs a value no other component shares | A component token, local to that component |
| A component token would equal a semantic token | Use the semantic token. A component tier that only renames adds a lookup and nothing else. |

Spectrum notes that component tokens "play a much smaller role than reusable semantic tokens". Primer: component tokens "should only be used in component CSS". Start without them.

## A source of truth outside CSS

The CSS file is the source of truth until a second consumer appears: a native app, an email renderer, Figma, a docs site that prints token tables. Then keep tokens in [DTCG](https://www.designtokens.org/tr/2025.10/format/) JSON and generate the CSS.

DTCG 2025.10 is the first stable format. A token is an object with `$value`, and optionally `$type`, `$description`, `$deprecated` and `$extensions`. Aliases are `{color.brand.600}`. Colours are objects with a `colorSpace`, so OKLCH is first class:

<!-- json-check: parse -->
```json
{
  "color": {
    "$type": "color",
    "brand": {
      "600": {
        "$value": { "colorSpace": "oklch", "components": [0.546, 0.215, 263], "hex": "#2663eb" },
        "$description": "Primary actions and links on light surfaces"
      }
    },
    "primary": { "$value": "{color.brand.600}" },
    "accent-legacy": {
      "$value": "{color.brand.600}",
      "$deprecated": "Use {color.primary}. Removed in 5.0."
    }
  }
}
```

The 2025.10 Resolver module describes light, dark and high-contrast as modifiers with contexts, so one token set produces every theme without copies.

| Tool | Tailwind v4 output | Notes |
| --- | --- | --- |
| [Terrazzo](https://terrazzo.app/docs/integrations/tailwind/) (`@terrazzo/plugin-tailwind`) | Yes, an `@theme` block, first party | Reads Resolver contexts for dark mode. The best fit for a DTCG plus Tailwind v4 system. |
| [Style Dictionary](https://styledictionary.com/) 5 | No Tailwind format | `css/variables` writes `:root` blocks, which is all the semantic tier needs. Its own docs say 2025.10 support is not complete. |
| Figma Variables | Native DTCG export and import | Import accepts only sRGB and HSL colours, `px` dimensions and `s` durations. Keep OKLCH in the token repo and let Figma receive hex. |

Whatever generates the CSS also generates the `tailwind-merge` theme extension. The two then cannot drift. See [components.md](./components.md#merging-classes).

In Figma, set each variable's WEB code syntax to the CSS name, for example `var(--primary)`. Dev Mode then shows the token the code uses, not a Figma path.

## Anti-patterns

| Anti-pattern | What goes wrong | Instead |
| --- | --- | --- |
| Primitives in `@theme` | `bg-palette-blue-600` compiles, autocompletes, and spreads | Primitives in `:root` |
| Semantic tokens in plain `@theme` | Nested dark or brand sections do not flip | `@theme inline` |
| A dark theme that redefines primitives | Every semantic token moves at once, including ones that should not | Dark redefines semantic tokens only |
| Semantic pointing at semantic | Chains that break when the middle one changes | Semantic points at primitives |
| Hue names in semantic tokens | A rebrand renames half the system | Role names |
| A component token per property per component | Thousands of tokens, no reuse | Semantic first, component tokens by exception |
| `dark:` colour overrides in app code (`bg-white dark:bg-black`) | Dark mode lives in every file instead of one | One semantic class, the theme swaps the value |
| Opacity modifiers to make a token lighter (`text-foreground/60`) | The result is never contrast-checked | A real `-muted` token, measured |
