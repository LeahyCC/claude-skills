# Colour and themes

Building a palette in OKLCH, pairing every surface with a text colour that passes, and swapping light, dark, brand and contrast themes without touching component code. Contrast rules come from WCAG 2.2. The [wcag-accessibility](../../wcag-accessibility/resources/color-contrast.md) skill owns the full criteria. This file owns how a token system meets them.

Contents:

- [Build the palette in OKLCH](#build-the-palette-in-oklch)
- [Pair every surface](#pair-every-surface)
- [Measure, do not eyeball](#measure-do-not-eyeball)
- [Derived states](#derived-states)
- [Dark mode](#dark-mode)
- [Brands and nested themes](#brands-and-nested-themes)
- [High contrast and forced colours](#high-contrast-and-forced-colours)
- [Charts and data colours](#charts-and-data-colours)

## Build the palette in OKLCH

OKLCH has three numbers: lightness (0 to 1), chroma (0 to about 0.4), hue (an angle). Lightness tracks what the eye sees, so two colours with the same L look equally light across hues. That is why Tailwind v4's default palette is OKLCH, and why a palette built in it needs less hand-tuning for contrast.

| Do | Why |
| --- | --- |
| Fix a lightness ladder first (for example 0.985, 0.967, 0.928 ... 0.21, 0.13) and reuse it for every hue | Same step, same perceived lightness, so contrast behaviour is similar across hues |
| Vary chroma per hue, lower at the ends of the ladder | Very light and very dark colours cannot hold much chroma in sRGB |
| Give neutrals a little chroma toward the brand hue (0.002 to 0.03) | Neutrals that sit with the brand instead of against it |
| Expect high-chroma reds, greens and ambers to fall outside sRGB | They clip on most screens. Measure the clipped value, which is what users see. |

Tools that start from contrast targets instead of hand-picked values: [Adobe Leonardo](https://leonardocolor.io/) generates colours for a list of contrast ratios against a background, and regenerates a dark theme by changing one lightness value. Its output formats do not include OKLCH, so convert. [Radix Colors](https://www.radix-ui.com/colors) defines 12-step scales with a role per step: 1 and 2 backgrounds, 3 to 5 component backgrounds, 6 to 8 borders, 9 and 10 solid fills, 11 and 12 text. Its contrast guarantee for steps 11 and 12 is in APCA (Lc 60 and Lc 90 on step 2), not WCAG 2 ratios, so measure before relying on it.

## Pair every surface

Every colour that text or icons sit on gets a partner that passes on it. The pair is the unit you design and measure.

| Pair | Measured against | Needs |
| --- | --- | --- |
| `foreground` on `background`, `card`, `popover` | Each surface | 4.5:1 |
| `muted-foreground` on `background`, `card`, `muted` | Each surface it can appear on | 4.5:1 |
| `X-foreground` on `X`, for every role | Its own surface | 4.5:1 |
| `input` (a control's boundary) on `background` | The page | 3:1, WCAG 1.4.11 |
| `ring` (the focus indicator) on `background` | The page | 3:1 |
| `primary` used as a solid fill or icon on `background` | The page | 3:1 |
| `border` used only to decorate (dividers, card edges) | none | No requirement |

WCAG 1.4.11 asks for 3:1 for the parts of a control needed to identify it. A card edge is decoration. A text field's outline, when it is the only thing showing where to type, is not. That is why the starter theme splits `--border` (decorative) from `--input` (identifies a control).

Large text, 24px or 18.5px bold and up, needs 3:1 instead of 4.5:1. Do not design pairs for the large-text floor. A token does not know what size it will be used at.

## Measure, do not eyeball

```bash
node scripts/check-contrast.mjs packages/theme/src/theme.css
```

The script reads every `:root`, mode and brand block, resolves `var()` chains, composites alpha over the background, and measures the pairs above. It exits 1 when any pair fails, so it runs in CI. Add pairs your system relies on with `--pair warning-foreground:card`.

It measures in sRGB after clipping, which is what WCAG and most screens use. A wide-gamut OKLCH value looks a little more saturated on a P3 display than the measured value, and the clipped measure is the conservative one.

WCAG 3 is a working draft. Its latest draft (10 September 2026) says "the contrast algorithm used in WCAG 3 is yet to be determined" and "WCAG 3 does not replace WCAG 2". APCA is not a conformance target. Measure WCAG 2.2 ratios. APCA can be a second opinion.

Where contrast breaks in practice:

| Pattern | Problem | Fix |
| --- | --- | --- |
| `text-muted-foreground/60` | Opacity lowers contrast, and nothing measures the blend | A token for the lighter text, measured |
| `outline-ring/50` as the focus style | A half-strength ring often falls under 3:1 | Full-strength `ring`, with an offset |
| `muted-foreground` measured on `background` only | It also sits on `muted` and `card`, which are darker | Measure every surface it appears on |
| Dark mode tuned by eye | Light text on a mid-grey surface fails quietly | The same script, same pairs, dark block |
| A brand colour as `primary` that cannot carry white text | `primary-foreground` fails | Pick `primary-foreground` dark, or darken `primary` |

## Derived states

Hover and pressed colours derived in CSS stay in step with the base token, so a rebrand needs no state tokens.

<!-- css-expect: hover:bg-primary-hover -->
```css
:root {
  --primary: oklch(0.546 0.215 263);
  --primary-hover: oklch(from var(--primary) calc(l - 0.06) c h);
}

@theme inline {
  --color-primary: var(--primary);
  --color-primary-hover: var(--primary-hover);
}
```

Relative colour syntax (`oklch(from ...)`) is Baseline newly available since September 2024 (Safari 18), so it is not in every browser Tailwind v4 supports. For a wider floor, `color-mix(in oklch, var(--primary), black 10%)` has been widely available since November 2025. A derived state still needs measuring: darkening `primary` raises its contrast with white text, lightening it lowers it.

Opacity modifiers (`bg-primary/10`) are fine for tinted backgrounds with no text requirement. Tailwind compiles them to `color-mix(in oklab, ...)`. Text on a tinted background needs the composite measured, which the script does when the alpha is in the token.

## Dark mode

Dark mode is a second set of semantic values, not a second set of classes.

<!-- classes: skip, FAIL sample on purpose -->
```tsx
// FAIL: dark mode written into every component, raw palette, no contrast check
<div className="bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">...</div>
```

```tsx
// PASS: one semantic class, the theme swaps the value
<div className="bg-card text-card-foreground">...</div>
```

Pick the switch once, for the whole system:

| Switch | Variant | Use when |
| --- | --- | --- |
| OS preference only | Tailwind's default `dark:` (`prefers-color-scheme`) | No user toggle |
| Data attribute on `<html>` | `@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));` | A toggle, and room for `data-brand`, `data-density` beside it. The starter theme uses this. |
| Class on any element | `@custom-variant dark (&:where(.dark, .dark *));` | Matching shadcn's examples, or `next-themes` with `attribute="class"` |

`:where()` has zero specificity, so `dark:` classes never win a specificity fight against plain utilities. Both forms also match the element that carries the attribute, not only its descendants. shadcn's scaffold uses `&:is(.dark *)`, which matches only descendants and has class-level specificity. Pick one and use it in every package.

Set `color-scheme` in each mode block. It switches native form controls and scrollbars, and `light-dark()` only works when it is set:

```css
:root { color-scheme: light; }
[data-theme="dark"] { color-scheme: dark; }
```

`light-dark(light, dark)` follows `color-scheme`, not a class or attribute. It is a neat way to write one token with two values, but it cannot express a third theme, so it does not scale to brands or high contrast. Use mode blocks.

Avoid a flash of the wrong theme. Set the attribute before first paint, from an inline script in `<head>`, reading the stored choice and falling back to `matchMedia('(prefers-color-scheme: dark)')`. Tailwind's dark mode page shows the script. Test it in a private window, where storage is empty.

## Brands and nested themes

Brands are more blocks with the same names. Components never change.

<!-- css-expect: bg-primary text-primary-foreground -->
```css
:root {
  --primary: oklch(0.546 0.215 263);
  --primary-foreground: oklch(1 0 0);
}

[data-brand="harbor"] {
  --primary: oklch(0.52 0.12 195);
  --primary-foreground: oklch(1 0 0);
}

[data-brand="harbor"][data-theme="dark"],
[data-theme="dark"] [data-brand="harbor"] {
  --primary: oklch(0.78 0.11 195);
  --primary-foreground: oklch(0.13 0.028 262);
}

@theme inline {
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
}
```

Because the utility map is `@theme inline`, a `data-brand` or `data-theme` attribute on any element re-themes everything inside it: a dark footer, a partner's co-branded panel, a preview of another brand in the admin.

Keep the brand blocks in their own files (`brands/harbor.css`) and import only the brands an app ships. The contrast script takes several files and measures each brand block.

## High contrast and forced colours

| Mode | What happens | What the system does |
| --- | --- | --- |
| `prefers-contrast: more` (Tailwind `contrast-more:`) | The user asked for more contrast. Nothing changes unless you change it. | Add a high-contrast block: stronger `border`, `input`, `muted-foreground`. Widely available since November 2024. |
| `forced-colors: active` (Tailwind `forced-colors:`) | Windows High Contrast and similar. The browser replaces your colours with the user's system colours. | Make sure meaning survives without your colours: real borders on controls (not shadows or background alone), a visible focus outline, icons with text. Widely available since March 2025. |
| `forced-color-adjust: none` | Opts an element out of forced colours | Only for content where colour is the content, such as a colour swatch. MDN: it "should not be used to prevent user choices being respected". Not Baseline. |
| `prefers-reduced-transparency` | Chromium only | An enhancement, never the only path |

A transparent border keeps a control visible in forced colours, where the browser paints it in the system text colour. That is why shadcn's buttons carry `border border-transparent`.

## Charts and data colours

Data colours are their own semantic group, `--chart-1` to `--chart-5` in shadcn's naming, with light and dark values. Two rules apply that do not apply to UI colours. Lines and bars need 3:1 against the chart background (1.4.11, graphical objects). And colour cannot be the only way to tell series apart (1.4.1): add labels, patterns, or markers. Measure chart colours with `--pair chart-1:background`.
