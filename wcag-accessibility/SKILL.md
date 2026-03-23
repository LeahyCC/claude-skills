---
name: wcag-accessibility
description: Use when building UI components, reviewing color contrast, adding ARIA attributes, handling keyboard navigation, writing alt text, creating forms, or ensuring WCAG 2.2 AA compliance. Covers color contrast ratios, semantic HTML, focus management, screen reader support, motion preferences, and accessibility auditing.
metadata:
  filePattern:
    - "src/components/**/*.tsx"
    - "src/components/**/*.jsx"
    - "src/app/**/*.tsx"
    - "app/**/*.tsx"
    - "components/**/*.tsx"
    - "pages/**/*.tsx"
  bashPattern:
    - "lighthouse"
    - "axe"
    - "pa11y"
  priority: 50
---

# WCAG 2.2 AA Accessibility

Comprehensive accessibility guidance for web applications targeting WCAG 2.2 Level AA conformance.

## Architecture Overview

```
[Component Authoring]
    ├── Semantic HTML (landmarks, headings, lists)
    ├── ARIA attributes (roles, states, properties)
    ├── Keyboard interaction (focus, tab order, shortcuts)
    └── Visual design (contrast, spacing, motion)
              ↓
[Automated Testing]
    ├── axe-core / jest-axe (unit)
    ├── Lighthouse CI (integration)
    └── pa11y (page-level)
              ↓
[Manual Testing]
    ├── Keyboard-only navigation
    ├── Screen reader walkthrough (VoiceOver, NVDA)
    └── Zoom to 200% / reflow check
              ↓
[Continuous Compliance]
    ├── CI gate (axe failures block merge)
    ├── Design token enforcement (contrast-safe palette)
    └── Periodic audit (quarterly full review)
```

## Quick Reference

| Need to...                                | See                                                            |
| ----------------------------------------- | -------------------------------------------------------------- |
| Fix color contrast failures               | [Color Contrast](./resources/color-contrast.md)                |
| Add keyboard support to custom components | [Keyboard Navigation](./resources/keyboard-navigation.md)      |
| Choose correct ARIA roles and landmarks   | [Semantic HTML](./resources/semantic-html.md)                  |
| Build accessible forms with validation    | [Forms and Inputs](./resources/forms-and-inputs.md)            |
| Write good alt text, handle media         | [Images and Media](./resources/images-and-media.md)            |
| Handle animations and motion safely       | [Motion and Animation](./resources/motion-and-animation.md)    |
| Set up automated a11y testing             | [Testing and Auditing](./resources/testing-and-auditing.md)    |

## Decision Matrix

### Text Contrast Requirements (WCAG 1.4.3 / 1.4.6)

| Text Type              | AA Minimum | AAA Target | How to Check                   |
| ---------------------- | ---------- | ---------- | ------------------------------ |
| Normal text (<18px)    | 4.5:1      | 7:1        | Foreground vs background color |
| Large text (>=18px)    | 3:1        | 4.5:1      | Foreground vs background color |
| Bold text (>=14px)     | 3:1        | 4.5:1      | Counts as "large"              |
| UI components / icons  | 3:1        | N/A        | Against adjacent colors        |
| Decorative / disabled  | No req     | No req     | Must look obviously disabled   |
| Placeholder text       | 4.5:1      | 7:1        | Treated as normal text by WCAG |

### Common Tailwind Opacity Pitfalls

Opacity modifiers on semantic color tokens (e.g., `text-muted-foreground/60`) reduce contrast below WCAG thresholds. Common failures:

| Pattern                          | Typical Ratio | Verdict    | Fix                          |
| -------------------------------- | ------------- | ---------- | ---------------------------- |
| `text-foreground`                | 15:1+         | Passes AA  | No change needed             |
| `text-muted-foreground`         | 5-6:1         | Passes AA  | No change needed             |
| `text-muted-foreground/80`      | 4-5:1         | Borderline | Use `text-muted-foreground`  |
| `text-muted-foreground/70`      | 3.5-4:1       | Fails AA   | Use `text-muted-foreground`  |
| `text-muted-foreground/60`      | 2.5-3:1       | Fails AA   | Use `text-muted-foreground`  |
| `text-muted-foreground/50`      | 2-2.5:1       | Fails AA   | Use `text-muted-foreground`  |
| `text-muted-foreground/40`      | 1.5-2:1       | Fails AA   | Use `text-muted-foreground`  |
| `placeholder:text-*/40`         | 1.5-2:1       | Fails AA   | Use full `text-muted-foreground` |

**Rule of thumb**: Never apply opacity below `/80` to text tokens. If you need visual hierarchy below `text-muted-foreground`, the design system's contrast floor has been reached — use size, weight, or spacing instead.

### Interactive Element Requirements

| Element             | Keyboard | Focus Ring | ARIA           | Contrast |
| ------------------- | -------- | ---------- | -------------- | -------- |
| Button              | Enter/Space | Required | `button` role  | 4.5:1 text, 3:1 boundary |
| Link                | Enter    | Required   | `<a>` or `link` role | 4.5:1 + distinguishable |
| Menu / Dropdown     | Arrow keys | Required | `menu`, `menuitem` | 4.5:1 |
| Tab                 | Arrow keys | Required | `tablist`, `tab`, `tabpanel` | 4.5:1 |
| Modal / Dialog      | Trap focus | Required | `dialog`, `aria-modal` | 4.5:1 |
| Toggle / Switch     | Space    | Required   | `switch` or `checkbox` | 3:1 boundary |
| Accordion           | Enter/Space | Required | `region`, `button` | 4.5:1 |
| Form input          | Tab      | Required   | `<label>` + error | 3:1 boundary |
| Custom widget       | Follows WAI-ARIA pattern | Required | Match closest pattern | All ratios |

### Screen Reader Essentials

```tsx
// Visually hidden but screen-reader accessible
<span className="sr-only">Close dialog</span>

// Live regions for dynamic content
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>

// Assertive for errors
<div aria-live="assertive" role="alert">
  {errorMessage}
</div>
```

## Core Principles

1. **Perceivable** — Content must be presentable in ways all users can perceive (contrast, alt text, captions)
2. **Operable** — UI must be operable via keyboard, with enough time, no seizure triggers
3. **Understandable** — Content and UI behavior must be understandable (labels, errors, consistent navigation)
4. **Robust** — Content must be interpreted reliably by assistive technologies (semantic HTML, valid ARIA)

## When Reviewing Code

Run this checklist on every component:

- [ ] Color contrast meets 4.5:1 for text, 3:1 for UI components
- [ ] No information conveyed by color alone (use icons, patterns, or text too)
- [ ] All interactive elements reachable and operable by keyboard
- [ ] Focus order is logical and visible
- [ ] Images have meaningful `alt` text (or `alt=""` + `aria-hidden` if decorative)
- [ ] Form inputs have associated `<label>` elements
- [ ] Error messages are programmatically associated with inputs (`aria-describedby`)
- [ ] Dynamic content updates announced via `aria-live` regions
- [ ] No content flashes more than 3 times per second
- [ ] Page works at 200% zoom without horizontal scrolling
- [ ] Touch targets are at least 24x24 CSS pixels (44x44 preferred)
