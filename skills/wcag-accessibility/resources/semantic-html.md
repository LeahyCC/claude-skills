# Semantic HTML and ARIA

WCAG Success Criteria: 1.3.1 (Info and Relationships), 4.1.2 (Name, Role, Value), 1.3.6 (Identify Purpose)

## First Rule of ARIA

> **No ARIA is better than bad ARIA.** Use native HTML elements whenever possible — they come with built-in accessibility for free.

```tsx
// PREFER native HTML
<button>Save</button>           // Has role, keyboard, focus built-in
<a href="/about">About</a>     // Navigable, announced as link
<input type="checkbox" />       // Toggle state announced automatically
<select>...</select>            // Full keyboard support built-in
<details><summary>FAQ</summary>...</details>  // Expand/collapse built-in

// AVOID ARIA when native works
<div role="button" tabIndex={0} onClick={...}>Save</div>  // Unnecessary
<span role="link" tabIndex={0} onClick={...}>About</span> // Unnecessary
```

## Landmark Regions

Screen readers use landmarks to navigate page structure:

```tsx
<header>              {/* banner landmark */}
  <nav>               {/* navigation landmark */}
    ...
  </nav>
</header>

<main>                {/* main landmark — exactly one per page */}
  <section aria-label="Featured products">  {/* region landmark */}
    ...
  </section>
  <aside>             {/* complementary landmark */}
    ...
  </aside>
</main>

<footer>              {/* contentinfo landmark */}
  ...
</footer>
```

### Rules

- Every page must have exactly **one `<main>`**
- Multiple `<nav>` elements need distinct `aria-label`
- `<section>` only becomes a landmark if it has `aria-label` or `aria-labelledby`
- Don't nest landmarks of the same type

## Heading Hierarchy

```tsx
// CORRECT — logical hierarchy, no skipped levels
<h1>Product Catalog</h1>
  <h2>Electronics</h2>
    <h3>Laptops</h3>
    <h3>Phones</h3>
  <h2>Clothing</h2>
    <h3>Men's</h3>
    <h3>Women's</h3>

// WRONG — skipped from h1 to h3
<h1>Product Catalog</h1>
  <h3>Electronics</h3>    {/* Skipped h2! */}

// WRONG — styled h3 used as visual heading without structure
<p className="text-2xl font-bold">Not a real heading</p>
```

### Rules

- Exactly **one `<h1>`** per page
- **Never skip levels** (h1 → h3)
- Don't use headings for styling — use CSS
- Hidden headings are fine for screen reader context: `<h2 className="sr-only">Navigation</h2>`

## ARIA Attributes

### Essential Attributes

```tsx
// Labels for elements without visible text
<button aria-label="Close">
  <X className="size-4" />
</button>

// Reference visible label
<h2 id="cart-heading">Shopping Cart</h2>
<section aria-labelledby="cart-heading">...</section>

// Descriptions for additional context
<input aria-describedby="password-hint" />
<p id="password-hint">Must be at least 8 characters</p>

// State attributes
<button aria-expanded={isOpen} aria-controls="menu-panel">
  Menu
</button>
<div id="menu-panel" hidden={!isOpen}>...</div>

// Current page in navigation
<nav>
  <a href="/" aria-current="page">Home</a>
  <a href="/about">About</a>
</nav>
```

### Live Regions

For content that updates dynamically:

```tsx
// Polite — announced at next pause (status updates, results counts)
<div aria-live="polite" aria-atomic="true">
  {searchResults.length} results found
</div>

// Assertive — interrupts immediately (errors, urgent alerts)
<div role="alert">
  Payment failed. Please try again.
</div>

// Status — polite live region with role
<div role="status">
  Saving...
</div>
```

### Common ARIA Roles

| Role          | Use When                          | Native Alternative      |
| ------------- | --------------------------------- | ----------------------- |
| `button`      | Clickable non-button element      | `<button>`              |
| `link`        | Navigable non-anchor element      | `<a href>`              |
| `dialog`      | Modal or non-modal dialog         | `<dialog>`              |
| `alert`       | Important, time-sensitive message | None (use `role="alert"`) |
| `status`      | Status update, not urgent         | None (use `role="status"`) |
| `tablist`     | Tab container                     | None                    |
| `tab`         | Individual tab                    | None                    |
| `tabpanel`    | Tab content panel                 | None                    |
| `menu`        | Action menu (not navigation)      | None                    |
| `menuitem`    | Item in a menu                    | None                    |
| `tree`        | Hierarchical list                 | None                    |
| `treeitem`    | Item in a tree                    | None                    |
| `switch`      | On/off toggle                     | `<input type="checkbox">` |
| `progressbar` | Progress indicator                | `<progress>`            |
| `img`         | Image on non-img element          | `<img>`                 |
| `none`/`presentation` | Remove semantic meaning   | None                    |

## Lists

Use semantic lists for groups of related items:

```tsx
// Navigation links
<nav>
  <ul>
    <li><a href="/">Home</a></li>
    <li><a href="/about">About</a></li>
  </ul>
</nav>

// Definition/description pairs
<dl>
  <dt>Mileage</dt>
  <dd>45,000 miles</dd>
  <dt>Color</dt>
  <dd>Midnight Blue</dd>
</dl>
```

## Tables

```tsx
<table>
  <caption>Monthly Sales Report</caption>    {/* Describes table purpose */}
  <thead>
    <tr>
      <th scope="col">Month</th>             {/* Column header */}
      <th scope="col">Revenue</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">January</th>           {/* Row header */}
      <td>$50,000</td>
    </tr>
  </tbody>
</table>
```

## Hiding Content

| Technique                            | Visible? | Screen Reader? | Use For                    |
| ------------------------------------ | -------- | -------------- | -------------------------- |
| `className="sr-only"`               | No       | Yes            | Screen reader-only context |
| `aria-hidden="true"`                | Yes      | No             | Decorative visuals         |
| `hidden` attribute                   | No       | No             | Completely hidden content  |
| `display: none`                      | No       | No             | Completely hidden content  |
| `visibility: hidden`                | No       | No             | Hidden but keeps layout    |

```tsx
// Icon button — icon is decorative, label is for screen readers
<button>
  <Search className="size-4" aria-hidden="true" />
  <span className="sr-only">Search</span>
</button>

// Decorative separator
<hr aria-hidden="true" />

// Skip decorative images
<img src="decorative-swirl.svg" alt="" aria-hidden="true" />
```
