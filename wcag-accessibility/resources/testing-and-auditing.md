# Testing and Auditing

## Testing Pyramid

```
                 ┌─────────────┐
                 │   Manual    │  Screen readers, keyboard-only,
                 │   Testing   │  real user testing
                 ├─────────────┤
                 │  E2E Tests  │  Playwright + axe, full page audits
                 │  (axe-core) │
              ┌──┴─────────────┴──┐
              │  Integration Tests │  Component rendering + axe checks
              │   (jest-axe)       │
           ┌──┴───────────────────┴──┐
           │     Static Analysis      │  ESLint a11y plugin, TypeScript
           │  (eslint-plugin-jsx-a11y)│
           └─────────────────────────┘
```

## Static Analysis — ESLint

### Setup

```bash
npm install --save-dev eslint-plugin-jsx-a11y
```

```js
// eslint.config.js (flat config)
import jsxA11y from 'eslint-plugin-jsx-a11y'

export default [
  jsxA11y.flatConfigs.recommended,
  // or jsxA11y.flatConfigs.strict for stricter rules
]
```

### Key Rules

| Rule | What It Catches |
|------|-----------------|
| `alt-text` | Missing alt on img, area, input[type=image] |
| `anchor-has-content` | Empty `<a>` tags |
| `aria-props` | Invalid ARIA attributes |
| `aria-role` | Invalid ARIA roles |
| `click-events-have-key-events` | onClick without onKeyDown/onKeyUp |
| `heading-has-content` | Empty heading tags |
| `html-has-lang` | Missing lang attribute on `<html>` |
| `interactive-supports-focus` | Interactive elements without tabIndex |
| `label-has-associated-control` | Form inputs without labels |
| `no-autofocus` | autoFocus prop (disorienting for screen readers) |
| `no-noninteractive-element-interactions` | Click handlers on divs, spans |
| `no-redundant-roles` | `<button role="button">` |
| `tabindex-no-positive` | Positive tabindex values |

## Unit/Integration Testing — jest-axe

### Setup

```bash
npm install --save-dev jest-axe @testing-library/react @testing-library/jest-dom
```

### Usage

```tsx
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

describe('Button', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<Button>Click me</Button>)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

// Test specific scenarios
describe('Form', () => {
  it('should have no a11y violations in error state', async () => {
    const { container } = render(<LoginForm errors={{ email: 'Required' }} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
```

### Custom Rules

```tsx
// Disable specific rules when you have a valid reason
const results = await axe(container, {
  rules: {
    'color-contrast': { enabled: false }, // Testing in jsdom, no real rendering
    region: { enabled: false }, // Component tested outside page context
  },
})
```

## E2E Testing — Playwright + axe

### Setup

```bash
npm install --save-dev @axe-core/playwright
```

### Usage

```tsx
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('accessibility', () => {
  test('home page should have no a11y violations', async ({ page }) => {
    await page.goto('/')
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze()

    expect(results.violations).toEqual([])
  })

  test('should be navigable by keyboard', async ({ page }) => {
    await page.goto('/')

    // Tab through interactive elements
    await page.keyboard.press('Tab')
    const firstFocused = await page.evaluate(() => document.activeElement?.tagName)
    expect(firstFocused).toBeTruthy()

    // Verify skip link
    await page.keyboard.press('Enter') // Activate skip link
    const mainFocused = await page.evaluate(() => document.activeElement?.id)
    expect(mainFocused).toBe('main-content')
  })

  test('modal should trap focus', async ({ page }) => {
    await page.goto('/listings')
    await page.click('[data-testid="open-filter"]')

    // Tab through modal — focus should stay inside
    const focusableCount = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]')
      return dialog?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ).length
    })

    // Tab through all elements and verify focus stays in dialog
    for (let i = 0; i < (focusableCount || 0) + 2; i++) {
      await page.keyboard.press('Tab')
      const isInDialog = await page.evaluate(() => {
        return document.activeElement?.closest('[role="dialog"]') !== null
      })
      expect(isInDialog).toBe(true)
    }
  })
})
```

### CI Integration

```yaml
# .github/workflows/a11y.yml
name: Accessibility

on: [pull_request]

jobs:
  a11y:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npm run test:a11y
```

## Lighthouse

### CLI

```bash
# Run accessibility audit
npx lighthouse http://localhost:3000 --only-categories=accessibility --output=html --output-path=./a11y-report.html

# CI-friendly JSON output
npx lighthouse http://localhost:3000 --only-categories=accessibility --output=json --chrome-flags="--headless"
```

### Lighthouse CI

```bash
npm install -g @lhci/cli

# lighthouserc.js
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm start',
      url: ['http://localhost:3000/', 'http://localhost:3000/listings'],
    },
    assert: {
      assertions: {
        'categories:accessibility': ['error', { minScore: 0.9 }],
      },
    },
  },
}
```

## Manual Testing Checklist

### Keyboard Testing

- [ ] Tab through entire page — all interactive elements reachable
- [ ] Shift+Tab — reverse order works
- [ ] Focus indicator visible on every focused element
- [ ] Enter/Space activates buttons and links
- [ ] Escape closes modals, dropdowns, popovers
- [ ] Arrow keys navigate menus, tabs, and selects
- [ ] No keyboard traps (can always Tab away)
- [ ] Skip link present and functional
- [ ] Focus moves logically after dynamic changes (modal open, content load)

### Screen Reader Testing

| Platform | Screen Reader | Browser |
|----------|--------------|---------|
| macOS    | VoiceOver    | Safari  |
| Windows  | NVDA (free)  | Firefox |
| Windows  | JAWS         | Chrome  |
| iOS      | VoiceOver    | Safari  |
| Android  | TalkBack     | Chrome  |

**VoiceOver quick start (macOS):**
1. `Cmd+F5` to toggle VoiceOver
2. `VO` key = `Ctrl+Option`
3. `VO+Right/Left` — navigate elements
4. `VO+Space` — activate element
5. `VO+U` — open rotor (landmarks, headings, links)
6. `VO+Cmd+H` — next heading
7. `VO+Cmd+L` — next link

**Things to verify:**
- [ ] Page title announced on load
- [ ] Headings hierarchy makes sense when navigated
- [ ] All images have appropriate alt text
- [ ] Form inputs announce their labels
- [ ] Error messages announced when they appear
- [ ] Dynamic content changes announced (live regions)
- [ ] Decorative elements are skipped

### Visual Testing

- [ ] Zoom to 200% — no content lost, no horizontal scroll
- [ ] Zoom to 400% — content reflows to single column
- [ ] High contrast mode — content still visible (Windows)
- [ ] Text spacing override — no content overlap (WCAG 1.4.12)
- [ ] Forced colors mode — UI still functional (Windows)
- [ ] Dark mode — all text passes contrast requirements

### Color Testing

- [ ] No information conveyed by color alone
- [ ] Links distinguishable from surrounding text (not just by color)
- [ ] Form errors indicated by more than red color
- [ ] Charts/graphs have non-color differentiators (patterns, labels)

## Recommended Tool Stack

| Tool | Purpose | When |
|------|---------|------|
| `eslint-plugin-jsx-a11y` | Static analysis | Every save (IDE integration) |
| `jest-axe` | Component-level testing | Every PR (unit tests) |
| `@axe-core/playwright` | Page-level testing | Every PR (E2E tests) |
| Lighthouse CI | Performance + a11y scoring | Every PR (CI) |
| VoiceOver / NVDA | Manual screen reader testing | Before major releases |
| axe DevTools (browser extension) | Manual exploration | During development |
| WAVE (browser extension) | Visual a11y overlay | During development |
