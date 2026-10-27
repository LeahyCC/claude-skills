# wcag-accessibility

WCAG 2.2 Level AA for Claude Code. 11 resource files, with React, Next.js, and Tailwind examples.

## Install

```bash
npx skills add LeahyCC/claude-skills@wcag-accessibility
```

Or inside Claude Code:

```text
/plugin install wcag-accessibility --marketplace LeahyCC/claude-skills
```

## What It Does

WCAG 2.2 Level AA for web UI. It loads when the task is accessibility: contrast, ARIA, keyboard access, focus, screen readers, alt text, or an audit. It covers all 55 Level A and AA criteria, including the 6 added in WCAG 2.2.

## Coverage

| Resource | Criteria | Topics |
|----------|----------|--------|
| [color-contrast.md](./resources/color-contrast.md) | 1.4.3, 1.4.11 | Ratios, Tailwind opacity pitfalls, dark mode |
| [keyboard-navigation.md](./resources/keyboard-navigation.md) | 2.1.1, 2.1.2, 2.4.1, 2.4.3, 2.4.7, 2.4.11 | Focus, tab order, WAI-ARIA patterns |
| [semantic-html.md](./resources/semantic-html.md) | 1.3.1, 2.4.6, 4.1.2 | Landmarks, headings, ARIA roles |
| [forms-and-inputs.md](./resources/forms-and-inputs.md) | 1.3.5, 3.3.1, 3.3.2, 3.3.3 | Labels, errors, autocomplete |
| [images-and-media.md](./resources/images-and-media.md) | 1.1.1, 1.2.1–1.2.5, 1.4.5 | Alt text, SVG, captions |
| [motion-and-animation.md](./resources/motion-and-animation.md) | 2.2.2, 2.3.1 | Reduced motion, flash limits |
| [page-structure.md](./resources/page-structure.md) | 1.3.2–1.3.4, 1.4.4, 1.4.10, 1.4.12, 2.4.2, 3.1.1, 3.1.2 | Language, titles, reflow, zoom |
| [links-and-navigation.md](./resources/links-and-navigation.md) | 1.4.1, 2.4.4, 2.4.5, 2.5.3, 3.2.1–3.2.4, 3.2.6 | Link purpose, predictability |
| [pointer-and-touch.md](./resources/pointer-and-touch.md) | 2.5.1, 2.5.2, 2.5.4, 2.5.7, 2.5.8 | Drag alternatives, target size |
| [timing-and-authentication.md](./resources/timing-and-authentication.md) | 1.4.2, 2.1.4, 2.2.1, 3.3.4, 3.3.7, 3.3.8 | Timeouts, accessible auth |
| [testing-and-auditing.md](./resources/testing-and-auditing.md) |  | axe, jest-axe, Playwright, Lighthouse |

Plus: Hover/Focus Content (1.4.13) and Status Messages (4.1.3) in the main [SKILL.md](./SKILL.md).

### New in WCAG 2.2

| Criterion | What it requires |
| --- | --- |
| Focus Not Obscured (2.4.11) | The focused element is not fully hidden by sticky headers or footers |
| Dragging Movements (2.5.7) | A single-pointer alternative for every drag operation |
| Target Size (2.5.8) | 24×24 CSS pixel minimum for interactive targets |
| Consistent Help (3.2.6) | Help stays in the same place across pages |
| Redundant Entry (3.3.7) | Do not ask again for information the user already gave |
| Accessible Authentication (3.3.8) | No cognitive tests. Allow paste and password managers |

4.1.1 Parsing was removed in WCAG 2.2.

## What it catches

```tsx
// Fails 1.4.3. In the default shadcn theme the blend is about 2.3:1. AA needs 4.5:1.
<p className="text-muted-foreground/60 text-xs">Helper text</p>

// Passes 1.4.3 in the default theme at about 4.8:1. Measure your own tokens.
<p className="text-muted-foreground text-xs">Helper text</p>
```

```tsx
// Fails 3.3.8. Blocks password managers.
<input type="password" onPaste={(e) => e.preventDefault()} />

// Passes 3.3.8. Allows paste and autoComplete.
<input type="password" autoComplete="current-password" />
```

```tsx
// Fails 2.5.7. Reorder is drag-only.
<SortableList onDragEnd={handleReorder}>
  {items.map(item => <SortableItem key={item.id} />)}
</SortableList>

// Passes 2.5.7. Drag, plus buttons.
{items.map((item, i) => (
  <li key={item.id}>
    {item.name}
    <button onClick={() => moveUp(i)} aria-label={`Move ${item.name} up`}>↑</button>
    <button onClick={() => moveDown(i)} aria-label={`Move ${item.name} down`}>↓</button>
  </li>
))}
```

## Criteria map

<details>
<summary>Every Level A and AA criterion in the tables above</summary>

#### Principle 1: Perceivable (20 criteria)

| # | Name | Level | Resource |
| --- | --- | --- | --- |
| 1.1.1 | Non-text Content | A | images-and-media |
| 1.2.1 | Audio-only/Video-only | A | images-and-media |
| 1.2.2 | Captions (Prerecorded) | A | images-and-media |
| 1.2.3 | Audio Description or Alternative | A | images-and-media |
| 1.2.4 | Captions (Live) | AA | images-and-media |
| 1.2.5 | Audio Description (Prerecorded) | AA | images-and-media |
| 1.3.1 | Info and Relationships | A | semantic-html |
| 1.3.2 | Meaningful Sequence | A | page-structure |
| 1.3.3 | Sensory Characteristics | A | page-structure |
| 1.3.4 | Orientation | AA | page-structure |
| 1.3.5 | Identify Input Purpose | AA | forms-and-inputs |
| 1.4.1 | Use of Color | A | links-and-navigation |
| 1.4.2 | Audio Control | A | timing-and-authentication |
| 1.4.3 | Contrast (Minimum) | AA | color-contrast |
| 1.4.4 | Resize Text | AA | page-structure |
| 1.4.5 | Images of Text | AA | images-and-media |
| 1.4.10 | Reflow | AA | page-structure |
| 1.4.11 | Non-text Contrast | AA | color-contrast |
| 1.4.12 | Text Spacing | AA | page-structure |
| 1.4.13 | Content on Hover or Focus | AA | SKILL.md |

#### Principle 2: Operable (20 criteria)

| # | Name | Level | Resource |
| --- | --- | --- | --- |
| 2.1.1 | Keyboard | A | keyboard-navigation |
| 2.1.2 | No Keyboard Trap | A | keyboard-navigation |
| 2.1.4 | Character Key Shortcuts | A | timing-and-authentication |
| 2.2.1 | Timing Adjustable | A | timing-and-authentication |
| 2.2.2 | Pause, Stop, Hide | A | motion-and-animation |
| 2.3.1 | Three Flashes | A | motion-and-animation |
| 2.4.1 | Bypass Blocks | A | keyboard-navigation |
| 2.4.2 | Page Titled | A | page-structure |
| 2.4.3 | Focus Order | A | keyboard-navigation |
| 2.4.4 | Link Purpose (In Context) | A | links-and-navigation |
| 2.4.5 | Multiple Ways | AA | links-and-navigation |
| 2.4.6 | Headings and Labels | AA | semantic-html |
| 2.4.7 | Focus Visible | AA | keyboard-navigation |
| 2.4.11 | Focus Not Obscured | AA | keyboard-navigation |
| 2.5.1 | Pointer Gestures | A | pointer-and-touch |
| 2.5.2 | Pointer Cancellation | A | pointer-and-touch |
| 2.5.3 | Label in Name | A | links-and-navigation |
| 2.5.4 | Motion Actuation | A | pointer-and-touch |
| 2.5.7 | Dragging Movements | AA | pointer-and-touch |
| 2.5.8 | Target Size (Minimum) | AA | pointer-and-touch |

#### Principle 3: Understandable (13 criteria)

| # | Name | Level | Resource |
| --- | --- | --- | --- |
| 3.1.1 | Language of Page | A | page-structure |
| 3.1.2 | Language of Parts | AA | page-structure |
| 3.2.1 | On Focus | A | links-and-navigation |
| 3.2.2 | On Input | A | links-and-navigation |
| 3.2.3 | Consistent Navigation | AA | links-and-navigation |
| 3.2.4 | Consistent Identification | AA | links-and-navigation |
| 3.2.6 | Consistent Help | A | links-and-navigation |
| 3.3.1 | Error Identification | A | forms-and-inputs |
| 3.3.2 | Labels or Instructions | A | forms-and-inputs |
| 3.3.3 | Error Suggestion | AA | forms-and-inputs |
| 3.3.4 | Error Prevention | AA | timing-and-authentication |
| 3.3.7 | Redundant Entry | A | timing-and-authentication |
| 3.3.8 | Accessible Authentication | AA | timing-and-authentication |

#### Principle 4: Robust (2 criteria)

| # | Name | Level | Resource |
| --- | --- | --- | --- |
| 4.1.2 | Name, Role, Value | A | semantic-html |
| 4.1.3 | Status Messages | AA | SKILL.md |

</details>

## Verified Against

[W3C WCAG 2.2 Recommendation](https://www.w3.org/TR/WCAG22/) (October 2023)

Last verified: October 2026

## License

[MIT](../../LICENSE)
