# WCAG Accessibility Skill

A comprehensive WCAG 2.2 AA accessibility skill for Claude Code. Provides guidance on color contrast, keyboard navigation, semantic HTML, ARIA, forms, media, motion, and testing.

## Install

```bash
npx skills add LeahyCC/claude-skills@wcag-accessibility
```

## What It Covers

Covers **all 50 WCAG 2.2 Level A + AA success criteria** across 11 resource files:

- **Color Contrast** — WCAG ratios, Tailwind opacity pitfalls, dark mode
- **Keyboard Navigation** — Focus management, tab order, skip links, WAI-ARIA patterns
- **Semantic HTML & ARIA** — Landmarks, headings, roles, live regions
- **Forms & Inputs** — Labels, error handling, validation, touch targets
- **Images & Media** — Alt text, SVG, video captions, audio transcripts
- **Motion & Animation** — prefers-reduced-motion, flash thresholds, auto-play
- **Page Structure** — Language, titles, reflow, zoom, text spacing, DOM order, orientation
- **Links & Navigation** — Link purpose, use of color, predictable behavior, consistent help
- **Pointer & Touch** — Drag alternatives, pointer cancellation, gestures, target size
- **Timing & Authentication** — Session timeouts, accessible auth, CAPTCHAs, redundant entry
- **Testing & Auditing** — axe-core, jest-axe, Playwright, Lighthouse, screen reader testing

Includes all **6 new WCAG 2.2 criteria**: Focus Not Obscured, Dragging Movements, Target Size, Consistent Help, Redundant Entry, and Accessible Authentication.

## When It Triggers

The skill activates when you're editing component files (`.tsx`, `.jsx`) or running accessibility testing tools (lighthouse, axe, pa11y).

## WCAG 2.2 AA Compliance

This skill targets **Level AA** conformance, which covers:

- 1.x — Perceivable (contrast, alt text, captions, adaptable)
- 2.x — Operable (keyboard, timing, seizures, navigation)
- 3.x — Understandable (readable, predictable, error handling)
- 4.x — Robust (compatible with assistive technologies)

## License

MIT
