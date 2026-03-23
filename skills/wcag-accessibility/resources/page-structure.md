# Page Structure and Layout

WCAG Success Criteria: 1.3.2 (Meaningful Sequence), 1.3.3 (Sensory Characteristics), 1.3.4 (Orientation), 1.4.4 (Resize Text), 1.4.10 (Reflow), 1.4.12 (Text Spacing), 2.4.2 (Page Titled), 3.1.1 (Language of Page), 3.1.2 (Language of Parts)

## Page Language (3.1.1, 3.1.2)

Every page must declare its language:

```tsx
// Next.js — layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

// Multi-language content — mark foreign-language sections
<p>
  The French term <span lang="fr">mise en place</span> means everything in its place.
</p>

// Dynamic language based on locale
<html lang={locale}>
```

### Common Language Codes

| Language | Code | Language | Code |
|----------|------|----------|------|
| English | `en` | Spanish | `es` |
| French | `fr` | German | `de` |
| Japanese | `ja` | Chinese (Simplified) | `zh-Hans` |
| Arabic | `ar` | Portuguese | `pt` |
| Korean | `ko` | Italian | `it` |

## Page Titles (2.4.2)

Every page must have a unique, descriptive `<title>`:

```tsx
// Next.js App Router — static metadata
export const metadata = {
  title: '2024 BMW M4 Competition | Carzilly',
}

// Next.js App Router — dynamic metadata
export async function generateMetadata({ params }: Props) {
  const listing = await getListing(params.id)
  return {
    title: `${listing.year} ${listing.make} ${listing.model} | Carzilly`,
  }
}

// Next.js — template pattern for consistent format
// layout.tsx
export const metadata = {
  title: {
    template: '%s | Carzilly',
    default: 'Carzilly — Find Your Next Car',
  },
}

// page.tsx — just provide the page-specific part
export const metadata = {
  title: 'Search Results', // Renders: "Search Results | Carzilly"
}
```

### Title Guidelines

| Do | Don't |
|----|-------|
| "Search Results for BMW M4 — Carzilly" | "Carzilly" (same title on every page) |
| "Edit Listing — 2024 BMW M4" | "Page" |
| "Messages (3 unread) — Carzilly" | "Home Page" |
| Put unique info first, site name last | Put site name first on every page |

## Meaningful Sequence (1.3.2)

DOM order must match visual reading order. Assistive tech reads the DOM, not the visual layout.

```tsx
// FAIL — CSS reorders visually but DOM order confuses screen readers
<div className="flex flex-col-reverse">
  <p>This is read FIRST by screen readers</p>
  <p>This appears FIRST visually</p>
</div>

// FAIL — CSS Grid or Flexbox order property
<div className="flex">
  <div className="order-2">Read second by screen reader, appears first visually</div>
  <div className="order-1">Read first by screen reader, appears second visually</div>
</div>

// PASS — DOM order matches visual order
<div className="flex">
  <div>First</div>
  <div>Second</div>
</div>

// PASS — responsive reorder is acceptable if reading order stays logical
<div className="flex flex-col lg:flex-row">
  <main className="lg:order-2">Main content</main>     {/* Main first in DOM */}
  <aside className="lg:order-1">Sidebar</aside>
</div>
```

### Common Pitfalls

- `flex-direction: column-reverse` / `row-reverse`
- CSS Grid `order` property or explicit grid placement
- `position: absolute` visually repositioning content
- `float: right` making visual order differ from DOM

**Rule**: If you must visually reorder, ensure the DOM reading order still makes logical sense.

## Sensory Characteristics (1.3.3)

Don't rely solely on shape, size, visual location, orientation, or sound:

```tsx
// FAIL — relies on visual position
<p>Click the button on the right to submit</p>

// PASS — identifies by name
<p>Click the "Submit" button to complete your order</p>

// FAIL — relies on color alone
<p>Fields in red are required</p>

// PASS — uses text + color
<p>Required fields are marked with an asterisk (*) and highlighted in red</p>

// FAIL — relies on shape
<p>Click the round icon to search</p>

// PASS — uses name
<p>Click the search icon (magnifying glass) to find listings</p>
```

## Orientation (1.3.4)

Don't lock to portrait or landscape unless essential:

```tsx
// FAIL — CSS locks orientation
@media (orientation: portrait) {
  .app {
    /* Don't hide or disable content in landscape */
  }
}

// FAIL — JavaScript orientation lock
screen.orientation.lock('portrait')  // Only acceptable if essential

// PASS — responsive to both orientations
<div className="flex flex-col landscape:flex-row">
  {/* Content adapts to orientation */}
</div>
```

Essential exceptions: piano keyboard app, check deposit (needs specific orientation for camera).

## Resize Text (1.4.4)

Text must be resizable to 200% without loss of content or functionality:

```tsx
// PASS — relative units scale with zoom
<p className="text-base">Normal text</p>           {/* 1rem = scales */}
<div className="max-w-prose">Content</div>          {/* Relative max-width */}
<div className="py-4 px-6">Padded content</div>     {/* rem-based spacing */}

// FAIL — fixed pixel sizes prevent scaling
<p style={{ fontSize: '14px' }}>Fixed text</p>      {/* Doesn't scale in some browsers */}
<div style={{ height: '300px', overflow: 'hidden' }}> {/* Clips when text grows */}
  Content that may overflow
</div>

// FAIL — fixed height containers clip enlarged text
<div className="h-16 overflow-hidden">
  This text will be clipped when zoomed
</div>

// PASS — min-height allows growth
<div className="min-h-16">
  This text can grow when zoomed
</div>
```

### Guidelines

- Use `rem` or `em` for font sizes, not `px`
- Use `min-height` instead of fixed `height` on containers with text
- Never use `overflow: hidden` on containers with text content
- Avoid `max-height` that could clip enlarged text
- Test at 200% browser zoom (Cmd/Ctrl + +)

## Reflow (1.4.10)

Content must reflow at 320px CSS width (equivalent to 400% zoom on 1280px viewport) without horizontal scrolling:

```tsx
// PASS — responsive single-column layout
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>

// PASS — fluid width with max constraint
<div className="w-full max-w-prose mx-auto px-4">
  <p>Content reflows naturally</p>
</div>

// FAIL — fixed-width layout
<div style={{ width: '1200px' }}>
  Content won't reflow — causes horizontal scroll
</div>

// FAIL — horizontal overflow on tables
<table style={{ minWidth: '800px' }}>...</table>

// PASS — responsive table pattern
<div className="overflow-x-auto" role="region" aria-label="Data table" tabIndex={0}>
  <table>...</table>
</div>
```

### Exceptions

Horizontal scrolling is acceptable for:
- Data tables (with scrollable container)
- Maps and diagrams
- Toolbars with icon groups
- Code blocks

## Text Spacing (1.4.12)

Content must remain readable when users override text spacing:

- Line height: at least 1.5x font size
- Paragraph spacing: at least 2x font size
- Letter spacing: at least 0.12x font size
- Word spacing: at least 0.16x font size

```tsx
// PASS — flexible containers that accommodate spacing changes
<p className="leading-relaxed">
  This text has adequate line height and will handle spacing overrides
</p>

// FAIL — fixed-height containers that clip with increased spacing
<div className="h-24 overflow-hidden">
  <p>Text here will be clipped if user increases line-height</p>
</div>

// PASS — use min-height or auto height
<div className="min-h-24">
  <p>Text here can expand with increased spacing</p>
</div>
```

### Testing

Users can override text spacing with browser extensions or custom CSS:

```css
/* Text spacing override test (paste in browser DevTools) */
* {
  line-height: 1.5em !important;
  letter-spacing: 0.12em !important;
  word-spacing: 0.16em !important;
}
p {
  margin-bottom: 2em !important;
}
```

No content should be clipped, overlap, or become inaccessible with these overrides applied.
