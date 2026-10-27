---
name: wcag-accessibility
description: WCAG 2.2 Level AA for web UI. Use when the task is accessibility, contrast, ARIA, keyboard access, focus, screen readers, alt text, or an accessibility audit. Do not use for styling, performance, or copy that is not an accessibility fix.
---

# WCAG 2.2 AA Accessibility

Accessibility guidance for web applications targeting WCAG 2.2 Level AA.

## Quick Reference

| Need to...                                | See                                                              |
| ----------------------------------------- | ---------------------------------------------------------------- |
| Fix color contrast failures               | [Color Contrast](./resources/color-contrast.md)                  |
| Add keyboard support to custom components | [Keyboard Navigation](./resources/keyboard-navigation.md)        |
| Choose correct ARIA roles and landmarks   | [Semantic HTML](./resources/semantic-html.md)                    |
| Build accessible forms with validation    | [Forms and Inputs](./resources/forms-and-inputs.md)              |
| Write good alt text, handle media         | [Images and Media](./resources/images-and-media.md)              |
| Handle animations and motion safely       | [Motion and Animation](./resources/motion-and-animation.md)      |
| Set up page lang, titles, reflow, zoom    | [Page Structure](./resources/page-structure.md)                  |
| Fix links, nav consistency, predictability| [Links and Navigation](./resources/links-and-navigation.md)      |
| Support drag alternatives, touch targets  | [Pointer and Touch](./resources/pointer-and-touch.md)            |
| Handle timeouts, auth, CAPTCHAs          | [Timing and Authentication](./resources/timing-and-authentication.md) |
| Set up automated a11y testing             | [Testing and Auditing](./resources/testing-and-auditing.md)      |

## Decision Matrix

### Text contrast (WCAG 1.4.3, 1.4.11)

Large text is a point size. 18pt is 24px. Bold 14pt is about 18.5px. Regular text at 18px is still normal text and needs 4.5:1.

| Text | AA | AAA |
| --- | --- | --- |
| Normal text (under 18pt / 24px, or bold under 14pt / 18.5px) | 4.5:1 | 7:1 |
| Large text (18pt / 24px and up, or bold 14pt / 18.5px and up) | 3:1 | 4.5:1 |
| UI components and graphics (1.4.11) | 3:1 | none |
| Disabled controls, decorative graphics, logos | none | none |

If someone has to read placeholder text, it needs the same ratio as normal text. Do not treat an opacity modifier as a passing color until the pair is measured. Token floors, Tailwind failures, and dark mode are in [Color Contrast](./resources/color-contrast.md).

### Interactive Element Requirements

| Element             | Keyboard | Focus Ring | ARIA           | Contrast |
| ------------------- | -------- | ---------- | -------------- | -------- |
| Button              | Enter/Space | Required | `button` role  | 4.5:1 text, 3:1 boundary |
| Link                | Enter    | Required   | `<a>` or `link` role | 4.5:1 + distinguishable |
| Action menu         | Arrow keys | Required | `menu`, `menuitem`. Site nav uses links, not `menu` | 4.5:1 |
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

### Hover/Focus Content (WCAG 1.4.13)

Tooltips, popovers, and any content triggered by hover or focus must be:

```tsx
// Dismissible — user can close without moving pointer (Escape key)
// Hoverable — user can move pointer over the tooltip without it disappearing
// Persistent — stays visible until user dismisses, moves focus, or info becomes invalid

// PASS — Radix UI Tooltip handles all three requirements
<Tooltip>
  <TooltipTrigger>Hover me</TooltipTrigger>
  <TooltipContent>
    This tooltip is dismissible, hoverable, and persistent
  </TooltipContent>
</Tooltip>

// FAIL — disappears when pointer moves away from trigger
<div
  onMouseEnter={() => setShow(true)}
  onMouseLeave={() => setShow(false)}  // Can't hover the tooltip content
>
  {show && <div className="absolute">Tooltip content</div>}
</div>

// PASS — tooltip stays visible when hovering its content
<div
  onMouseEnter={() => setShow(true)}
  onMouseLeave={() => setShow(false)}
>
  Trigger
  {show && (
    <div
      onMouseEnter={() => setShow(true)}   // Keep open when hovering content
      onMouseLeave={() => setShow(false)}
    >
      Tooltip content
    </div>
  )}
</div>
```

### Status Messages (WCAG 4.1.3)

Dynamic status updates must be announced to screen readers without receiving focus:

```tsx
// Toast notifications
<div role="status" aria-live="polite">
  {toast && <p>{toast.message}</p>}
</div>

// Search result counts
<div role="status" aria-live="polite" aria-atomic="true">
  {results.length} listings found
</div>

// Form submission success
<div role="status">Listing saved successfully</div>

// Error alerts (urgent — use assertive)
<div role="alert">Payment failed. Please try again.</div>

// Loading progress
<div role="status" aria-live="polite">
  Uploading... {progress}% complete
</div>
```

| Situation | Role | aria-live | When |
|-----------|------|-----------|------|
| Success message | `status` | `polite` | After form submit |
| Error message | `alert` | `assertive` | On validation/server error |
| Search results count | `status` | `polite` | After search completes |
| Loading indicator | `status` | `polite` | When async operation starts |
| Toast notification | `status` | `polite` | On transient messages |
| Chat message received | `log` | `polite` | New messages in feed |

## WCAG 2.2 Complete Success Criteria Coverage

All 55 Level A and AA success criteria are covered across the skill resources:

### Principle 1: Perceivable (20 criteria)
| # | Name | Level | Resource |
|---|------|-------|----------|
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
| 1.4.13 | Content on Hover or Focus | AA | SKILL.md (above) |

### Principle 2: Operable (20 criteria)
| # | Name | Level | Resource |
|---|------|-------|----------|
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
| 2.4.11 | Focus Not Obscured | AA | keyboard-navigation [NEW 2.2] |
| 2.5.1 | Pointer Gestures | A | pointer-and-touch |
| 2.5.2 | Pointer Cancellation | A | pointer-and-touch |
| 2.5.3 | Label in Name | A | links-and-navigation |
| 2.5.4 | Motion Actuation | A | pointer-and-touch |
| 2.5.7 | Dragging Movements | AA | pointer-and-touch [NEW 2.2] |
| 2.5.8 | Target Size (Minimum) | AA | pointer-and-touch [NEW 2.2] |

### Principle 3: Understandable (13 criteria)
| # | Name | Level | Resource |
|---|------|-------|----------|
| 3.1.1 | Language of Page | A | page-structure |
| 3.1.2 | Language of Parts | AA | page-structure |
| 3.2.1 | On Focus | A | links-and-navigation |
| 3.2.2 | On Input | A | links-and-navigation |
| 3.2.3 | Consistent Navigation | AA | links-and-navigation |
| 3.2.4 | Consistent Identification | AA | links-and-navigation |
| 3.2.6 | Consistent Help | A | links-and-navigation [NEW 2.2] |
| 3.3.1 | Error Identification | A | forms-and-inputs |
| 3.3.2 | Labels or Instructions | A | forms-and-inputs |
| 3.3.3 | Error Suggestion | AA | forms-and-inputs |
| 3.3.4 | Error Prevention | AA | timing-and-authentication |
| 3.3.7 | Redundant Entry | A | timing-and-authentication [NEW 2.2] |
| 3.3.8 | Accessible Authentication | AA | timing-and-authentication [NEW 2.2] |

### Principle 4: Robust (2 criteria)
| # | Name | Level | Resource |
|---|------|-------|----------|
| 4.1.2 | Name, Role, Value | A | semantic-html |
| 4.1.3 | Status Messages | AA | SKILL.md (above) |

> Note: 4.1.1 Parsing was **removed** in WCAG 2.2 and is no longer required.

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
- [ ] Text resizes to 200% without loss of content or functionality (1.4.4)
- [ ] Content reflows at 320 CSS pixels wide without two-dimensional scrolling, except where the layout needs two dimensions (1.4.10)
- [ ] Touch targets are at least 24x24 CSS pixels (44x44 preferred)
- [ ] Drag operations have single-pointer alternatives
- [ ] Tooltips/popovers are dismissible, hoverable, and persistent
- [ ] `<html lang>` is set correctly
- [ ] Page has unique, descriptive `<title>`
- [ ] DOM order matches visual reading order
- [ ] Links have descriptive text (no "click here")
- [ ] Navigation is consistent across pages
- [ ] Paste is not blocked on password/code fields
- [ ] `prefers-reduced-motion` is respected for all animations
