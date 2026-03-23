# Color Contrast

WCAG Success Criteria: 1.4.3 (AA), 1.4.6 (AAA), 1.4.11 (Non-text Contrast)

## Ratio Requirements

| Content Type                 | AA    | AAA   |
| ---------------------------- | ----- | ----- |
| Normal text (<18px, <14px bold) | 4.5:1 | 7:1   |
| Large text (>=18px, >=14px bold) | 3:1   | 4.5:1 |
| UI components and graphics   | 3:1   | N/A   |
| Disabled elements            | None  | None  |
| Logos and decorative images  | None  | None  |

## Calculating Contrast

Contrast ratio formula uses relative luminance:

```
ratio = (L1 + 0.05) / (L2 + 0.05)
```

Where L1 is the lighter color's luminance and L2 is the darker's.

### Tools

- **Browser DevTools**: Chrome/Firefox inspect → color picker shows ratio
- **Figma**: Stark or A11y plugins
- **CLI**: `npx wcag-contrast <fg> <bg>`
- **Online**: WebAIM Contrast Checker (webaim.org/resources/contrastchecker)
- **VS Code**: Color Highlight extension shows ratios

## Common Failures and Fixes

### Tailwind Opacity Modifiers

The most common failure pattern in Tailwind projects is reducing text opacity below safe thresholds:

```tsx
// FAIL — opacity drops muted-foreground below 4.5:1
<p className="text-muted-foreground/60 text-xs">Helper text</p>

// PASS — full muted-foreground is designed to pass AA
<p className="text-muted-foreground text-xs">Helper text</p>
```

**Safe opacity ranges** (varies by theme — always verify):

| Token                 | Min safe opacity (light bg) | Min safe opacity (dark bg) |
| --------------------- | --------------------------- | -------------------------- |
| `text-foreground`     | /30 (~4.5:1)                | /30 (~4.5:1)               |
| `text-muted-foreground` | /100 (no modifier)        | /80 (borderline)           |
| `text-primary`        | Depends on primary color    | Depends on primary color   |

### Gray Text on White/Light Backgrounds

```css
/* FAIL — #999999 on white = 2.85:1 */
color: #999;

/* PASS — #767676 on white = 4.54:1 (minimum safe gray) */
color: #767676;

/* PASS — #595959 on white = 7.0:1 (AAA) */
color: #595959;
```

### Placeholder Text

Placeholder text is NOT exempt from contrast requirements. WCAG treats it as regular text:

```tsx
// FAIL — low-opacity placeholder
<input className="placeholder:text-gray-300" />

// PASS — sufficient contrast placeholder
<input className="placeholder:text-muted-foreground" />
```

### Colored Backgrounds

When using colored backgrounds, verify both states:

```tsx
// Must check contrast of ALL text inside
<div className="bg-primary text-primary-foreground">
  <h3>Title</h3>                    {/* Check this contrast */}
  <p className="text-primary-foreground/70">Subtitle</p>  {/* AND this */}
</div>
```

### Dark Mode

Dark mode introduces different contrast challenges:

- Light text on dark backgrounds needs verification independently
- `text-muted-foreground` may have different luminance in dark mode
- Semi-transparent overlays shift effective background color

```tsx
// Verify BOTH themes
// Light: oklch(0.556 0.01 260) on white = ~5.2:1 ✓
// Dark:  oklch(0.708 0.008 260) on oklch(0.145 ...) = ~5.8:1 ✓
<p className="text-muted-foreground">Safe in both themes</p>
```

## Design System Recommendations

### Building a Contrast-Safe Palette

1. **Define a contrast floor**: `text-muted-foreground` should be the dimmest text token that passes AA
2. **Never go below the floor with opacity**: If you need lighter text, the answer is "don't" — use font size, weight, or spacing for hierarchy instead
3. **Test both themes**: Generate light and dark values independently, don't just invert
4. **Document ratios**: Add contrast ratios to your design token documentation

### CSS Variable Pattern

```css
:root {
  /* Passes 4.5:1 on --background */
  --muted-foreground: oklch(0.55 0.01 260);
}

.dark {
  /* Passes 4.5:1 on dark --background */
  --muted-foreground: oklch(0.71 0.008 260);
}
```

## Exceptions

These elements are **exempt** from contrast requirements:

- **Disabled controls** — must look obviously disabled but no ratio required
- **Decorative images/icons** — purely visual, no information conveyed
- **Logos and brand marks** — no contrast requirement
- **Inactive UI** — elements not currently available for interaction
- **Text in photographs** — incidental text within images

Even for exempt elements, consider making them visible enough for low-vision users where practical.

## Auditing a Codebase

Quick grep patterns to find potential contrast failures:

```bash
# Find all opacity-modified text colors
grep -rn "text-.*foreground/[0-9]" --include="*.tsx"

# Find low-opacity text specifically
grep -rn "text-.*foreground/[3-6]0" --include="*.tsx"

# Find placeholder contrast issues
grep -rn "placeholder:text-.*/" --include="*.tsx"

# Find opacity utilities on text elements
grep -rn "opacity-[0-9]" --include="*.tsx" | grep -i "text\|label\|hint\|caption"
```
