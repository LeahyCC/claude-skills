# Scales

Type, spacing, radius, elevation, motion, layering, and responsive sizes. Each is a short, closed list of values that the whole system shares, so a change in one place moves every component together.

Contents:

- [Type](#type)
- [Spacing and density](#spacing-and-density)
- [Control heights](#control-heights)
- [Radius](#radius)
- [Elevation](#elevation)
- [Motion](#motion)
- [Layering](#layering)
- [Breakpoints and container queries](#breakpoints-and-container-queries)

## Type

Define sizes with their line height. Tailwind pairs `--text-sm` with `--text-sm--line-height`, and `text-sm` sets both. A leading utility (`leading-tight`) still overrides the paired value.

<!-- css-expect: text-sm text-base text-2xl font-sans -->
<!-- css-reject: text-4xl -->
```css
@theme {
  --font-sans: "Inter Variable", ui-sans-serif, system-ui, sans-serif;

  --text-*: initial;
  --text-sm: 0.875rem;
  --text-sm--line-height: 1.25rem;
  --text-base: 1rem;
  --text-base--line-height: 1.5rem;
  --text-2xl: 1.5rem;
  --text-2xl--line-height: 2rem;
}
```

| Rule | Why |
| --- | --- |
| Use `rem` for sizes | Text then follows the user's browser font size (WCAG 1.4.4) |
| Unitless or `rem` line heights, set per size | Large sizes need tighter leading than body text |
| A short scale, 6 to 9 steps | Each extra step is a decision every designer must make |
| Name sizes by scale (`sm`, `base`, `2xl`) for primitives, by role for composites | `text-2xl` is a size. A heading style is size, weight, tracking and leading together. |

Composite text styles (heading, label, caption) are several properties at once. Make them `@utility` classes, and give them a name that cannot be mistaken for a font size:

<!-- css-expect: type-heading-lg type-label text-sm -->
```css
@theme {
  --text-sm: 0.875rem;
  --text-sm--line-height: 1.25rem;
  --text-2xl: 1.5rem;
  --text-2xl--line-height: 2rem;
}

@utility type-heading-lg {
  font-size: var(--text-2xl);
  line-height: var(--text-2xl--line-height);
  font-weight: 600;
  letter-spacing: -0.01em;
}

@utility type-label {
  font-size: var(--text-sm);
  line-height: var(--text-sm--line-height);
  font-weight: 500;
}
```

Do not add composite styles as new `--text-*` keys such as `--text-heading`. `tailwind-merge` does not read your theme. It does not know `text-heading` is a size, so it treats it as a colour (its colour check accepts any name). Then `cn("text-heading", "text-muted-foreground")` drops one of the two. A `type-*` prefix has no Tailwind meaning, so it never collides. If you do add `--text-*` keys, register them with `tailwind-merge` (see [components.md](./components.md#merging-classes)).

## Spacing and density

Tailwind v4 has one spacing variable, `--spacing: 0.25rem`, and every spacing utility multiplies it: `p-4` compiles to `calc(var(--spacing) * 4)`. Any integer works, so `p-13` is valid and still on the 4px grid. There is no list to close.

| Keep | Restrict |
| --- | --- |
| The 4px multiplier | Arbitrary values such as `p-[13px]`, `mt-[7px]`, with a lint rule ([enforcement.md](./enforcement.md)) |
| Integer steps | Half steps (`p-1.5`) where design does not use them, by convention or a restricted-class pattern |

Because utilities read `--spacing` at runtime, a density mode is one variable. It has to stay in plain `@theme`, not `@theme inline`, or the value is written into each utility and the override does nothing.

<!-- css-expect: p-4 gap-2 -->
```css
@theme {
  --spacing: 0.25rem;
}

[data-density="compact"] {
  --spacing: 0.2rem;
}
```

Compact density scales padding, gaps and sizes built from spacing. It does not shrink text, so check that controls still fit their labels. Touch targets must stay at least 24 by 24 CSS pixels (WCAG 2.5.8). See the [pointer and touch](../../wcag-accessibility/resources/pointer-and-touch.md) resource.

## Control heights

Buttons, inputs, selects and toggles that sit in a row must share a height. Pick the heights once and write them down, because they are scattered through component files as `h-8`, `h-9`, `size-8`.

| Size | Height | Used by |
| --- | --- | --- |
| `sm` | `h-7` (28px) | Dense tables, toolbars |
| `default` | `h-9` (36px) | Forms and most buttons |
| `lg` | `h-10` (40px) | Marketing, touch-first screens |

shadcn's styles differ here: `base-nova` buttons are `h-8` (32px), `new-york-v4` buttons are `h-9` (36px). When changing the default, grep for every component that uses it and change them together, or move the height to a component token (`--control-height`) that each control reads with `h-(--control-height)`.

## Radius

One knob, every step derived from it. Changing `--radius` reshapes the whole system.

<!-- css-expect: rounded-sm rounded-lg rounded-xl rounded-full -->
```css
:root {
  --radius: 0.5rem;
}

@theme inline {
  --radius-*: initial;
  --radius-sm: calc(var(--radius) * 0.6);
  --radius-md: calc(var(--radius) * 0.8);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) * 1.4);
  --radius-full: calc(infinity * 1px);
}
```

Assign radius by component size, not by taste, and write the assignment down: for example `rounded-md` menu items, `rounded-lg` buttons and inputs, `rounded-xl` cards and dialogs, `rounded-full` pills and avatars. Nested corners look right when the inner radius is the outer radius minus the padding between them.

## Elevation

Shadows express how far a surface floats. Three or four steps is enough, and each step has a job.

| Step | Job |
| --- | --- |
| `shadow-sm` | Resting cards, inputs |
| `shadow-md` | Dropdowns, popovers |
| `shadow-lg` | Dialogs, toasts |

Define shadows in plain `@theme`. In dark mode a shadow on a dark page barely shows, so dark surfaces usually rise by getting lighter (`card` lighter than `background`) instead. A system that wants hairlines only can set `--shadow-*: initial` and use borders.

## Motion

Motion tokens are durations, easings, and named animations.

<!-- css-expect: animate-fade-in ease-standard duration-150 -->
```css
@theme {
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --animate-fade-in: fade-in 150ms var(--ease-standard);

  @keyframes fade-in {
    from {
      opacity: 0;
    }
  }
}
```

Keyframes inside `@theme` are emitted only when an `--animate-*` that uses them is used. Durations need no namespace: `duration-150` takes any number of milliseconds.

Reduced motion is a system rule, not a per-component choice. Either wrap motion in `motion-safe:` in every component, or shorten all animation and transition durations under `prefers-reduced-motion: reduce` in the base layer, as the starter theme does. The second is harder to forget. Movement that conveys meaning, such as a progress indicator, still needs a non-motion equivalent. See the [motion and animation](../../wcag-accessibility/resources/motion-and-animation.md) resource.

For enter and exit animations on popovers and dialogs, Tailwind v4 has `starting:` (`@starting-style`) and `transition-discrete`, so many animations need no JS library. shadcn's scaffold imports `tw-animate-css` for its `animate-in` and `fade-in-0` classes. `tailwindcss-animate` is the v3 plugin it replaced.

## Layering

Tailwind has no z-index namespace. `z-50` is a bare number, and every team invents its own. Name the layers once as variables and use them with `z-(--z-modal)`.

<!-- css-expect: z-(--z-modal) z-(--z-toast) -->
```css
:root {
  --z-dropdown: 1000;
  --z-sticky: 1100;
  --z-overlay: 1200;
  --z-modal: 1300;
  --z-toast: 1400;
}
```

Popover and dialog primitives that render in a portal or the browser's top layer (`<dialog>`, the `popover` attribute) escape stacking contexts entirely. Prefer them to z-index arms races.

## Breakpoints and container queries

Default breakpoints are `sm` 40rem, `md` 48rem, `lg` 64rem, `xl` 80rem, `2xl` 96rem. Keep them unless design owns a different set, and keep every breakpoint in the same unit: Tailwind's docs warn that mixed units can sort the generated variants out of order.

Components in a design system do not know how wide the page is. They know how wide their slot is. So components respond to their container, and pages respond to the viewport.

```tsx
// PASS: the card lays itself out by the space it is given, in a sidebar or a main column
<div className="@container">
  <div className="flex flex-col gap-4 @md:flex-row">...</div>
</div>
```

| Use | For |
| --- | --- |
| `md:`, `lg:` (viewport) | Page layout, navigation, which regions show |
| `@md:`, `@lg:` (container) | Anything inside a reusable component |
| `@container/name` and `@md/name:` | A component that must respond to a specific ancestor, not the nearest one |
| `@container-size` (4.3) | When children need `cqh` or `cqb` height units |

Container queries are in core since v4.0. The `@tailwindcss/container-queries` plugin is obsolete. Content must still reflow at 320 CSS pixels wide (WCAG 1.4.10).
