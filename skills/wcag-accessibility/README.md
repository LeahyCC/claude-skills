# wcag-accessibility

Complete WCAG 2.2 Level AA compliance guidance for Claude Code — **50/50 success criteria covered** across 11 resource files with production React, Next.js, and Tailwind CSS code examples.

## Install

```bash
npx skills add LeahyCC/claude-skills@wcag-accessibility
```

## What It Does

When you edit `.tsx` or `.jsx` component files, this skill auto-activates and provides WCAG 2.2 compliance guidance. It covers every Level A and AA success criterion — including the 6 criteria new in WCAG 2.2 that most resources miss.

**Auto-triggers on:**
- Component files: `src/components/**/*.tsx`, `src/app/**/*.tsx`, `app/**/*.tsx`
- CLI tools: `lighthouse`, `axe`, `pa11y`

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
| [testing-and-auditing.md](./resources/testing-and-auditing.md) | — | axe, jest-axe, Playwright, Lighthouse |

Plus: Hover/Focus Content (1.4.13) and Status Messages (4.1.3) in the main [SKILL.md](./SKILL.md).

### New in WCAG 2.2

All 6 criteria added in WCAG 2.2 are covered: Focus Not Obscured (2.4.11), Dragging Movements (2.5.7), Target Size (2.5.8), Consistent Help (3.2.6), Redundant Entry (3.3.7), and Accessible Authentication (3.3.8).

4.1.1 Parsing was removed in WCAG 2.2 — documented accordingly.

## Verified Against

[W3C WCAG 2.2 Recommendation](https://www.w3.org/TR/WCAG22/) (October 2023)

Last verified: March 2026

## License

[MIT](../../LICENSE)
