# Keyboard Navigation

WCAG Success Criteria: 2.1.1 (Keyboard), 2.1.2 (No Keyboard Trap), 2.4.3 (Focus Order), 2.4.7 (Focus Visible), 2.4.11 (Focus Not Obscured)

## Core Requirements

1. **All interactive elements** must be reachable via keyboard (Tab, Shift+Tab)
2. **All actions** must be triggerable via keyboard (Enter, Space, Arrow keys)
3. **Focus must never be trapped** — user can always Tab away (except modal dialogs)
4. **Focus must be visible** — clear, high-contrast focus indicator
5. **Focus order must be logical** — follows visual/reading order

## Focus Management

### Focus Ring Styling

```tsx
// Good — visible in both themes, sufficient contrast
<button className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
  Click me
</button>

// Good — ring style (shadcn/ui default)
<button className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
  Click me
</button>

// BAD — removes focus indicator entirely
<button className="outline-none focus:outline-none">
  Click me
</button>
```

**Never remove focus indicators.** If the default browser outline doesn't match your design, replace it — don't remove it.

### Focus Indicator Requirements (WCAG 2.4.13 AA)

- Must have **3:1 contrast** against adjacent colors
- Must have at least **2px** of solid outline or equivalent area
- Must not be obscured by other content

### Tab Order

```tsx
// Natural tab order follows DOM order — preferred
<nav>
  <a href="/home">Home</a>        {/* Tab 1 */}
  <a href="/about">About</a>      {/* Tab 2 */}
  <a href="/contact">Contact</a>  {/* Tab 3 */}
</nav>

// Use tabIndex only when necessary
<div tabIndex={0}>Focusable div</div>     {/* Added to tab order */}
<div tabIndex={-1}>Programmatic only</div> {/* Focusable via JS, not Tab */}

// NEVER use positive tabIndex — it breaks natural order
<div tabIndex={5}>Don't do this</div>      {/* BAD */}
```

### Programmatic Focus

```tsx
// Move focus after dynamic changes
const dialogRef = useRef<HTMLDivElement>(null)

useEffect(() => {
  if (isOpen) {
    dialogRef.current?.focus()
  }
}, [isOpen])

// Return focus when closing
const triggerRef = useRef<HTMLButtonElement>(null)

const handleClose = () => {
  setIsOpen(false)
  triggerRef.current?.focus() // Return focus to trigger
}
```

## Common Keyboard Patterns (WAI-ARIA)

### Buttons

```
Enter or Space → Activate
```

```tsx
// Native <button> handles this automatically
<button onClick={handleClick}>Save</button>

// Custom button — must add keyboard handling
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }}
>
  Save
</div>

// Better: just use <button> — it's free
```

### Modal Dialogs (Focus Trap)

```
Tab → Cycle through focusable elements inside dialog
Shift+Tab → Cycle backward
Escape → Close dialog
```

```tsx
// Focus trap pattern
function Dialog({ isOpen, onClose, children }) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const dialog = dialogRef.current
    const focusable = dialog?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const first = focusable?.[0] as HTMLElement
    const last = focusable?.[focusable.length - 1] as HTMLElement

    first?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key !== 'Tab') return

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last?.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first?.focus()
      }
    }

    dialog?.addEventListener('keydown', handleKeyDown)
    return () => dialog?.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div role="dialog" aria-modal="true" ref={dialogRef} tabIndex={-1}>
      {children}
    </div>
  )
}
```

> **Note**: Use native `<dialog>` or Radix UI Dialog — they handle focus trapping automatically.

### Dropdown Menu

```
Enter/Space → Open menu, activate item
Arrow Down/Up → Move between items
Home/End → Jump to first/last item
Escape → Close menu
Character key → Jump to matching item
```

### Tabs

```
Arrow Left/Right → Switch tabs (horizontal)
Arrow Up/Down → Switch tabs (vertical)
Home/End → First/last tab
```

### Accordion

```
Enter/Space → Toggle section
Arrow Down/Up → Move between headers
Home/End → First/last header
```

## Skip Links

Allow keyboard users to bypass repetitive navigation:

```tsx
// First focusable element on the page
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-foreground focus:shadow-lg"
>
  Skip to main content
</a>

// Target
<main id="main-content" tabIndex={-1}>
  ...
</main>
```

## Common Failures

### Click-Only Handlers on Non-Interactive Elements

```tsx
// FAIL — div with onClick is not keyboard accessible
<div onClick={handleClick}>Click me</div>

// PASS — use a button
<button onClick={handleClick}>Click me</button>

// PASS — if you must use a div, add keyboard support
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }}
>
  Click me
</div>
```

### Hover-Only Interactions

```tsx
// FAIL — tooltip only appears on hover
<div onMouseEnter={show} onMouseLeave={hide}>
  <Tooltip>{content}</Tooltip>
</div>

// PASS — also triggers on focus
<div
  onMouseEnter={show}
  onMouseLeave={hide}
  onFocus={show}
  onBlur={hide}
  tabIndex={0}
>
  <Tooltip>{content}</Tooltip>
</div>
```

### Scroll Containers

```tsx
// Scrollable regions need to be keyboard accessible
<div
  className="overflow-auto"
  tabIndex={0}
  role="region"
  aria-label="Search results"
>
  {/* scrollable content */}
</div>
```
