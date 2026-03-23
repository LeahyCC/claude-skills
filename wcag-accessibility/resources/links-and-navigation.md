# Links, Navigation, and Predictability

WCAG Success Criteria: 1.4.1 (Use of Color), 2.4.4 (Link Purpose in Context), 2.4.5 (Multiple Ways), 2.5.3 (Label in Name), 3.2.1 (On Focus), 3.2.2 (On Input), 3.2.3 (Consistent Navigation), 3.2.4 (Consistent Identification), 3.2.6 (Consistent Help) [NEW 2.2]

## Use of Color (1.4.1)

Color must never be the **only** way to convey information:

```tsx
// FAIL — status conveyed only by color
<span className="text-green-500">Active</span>
<span className="text-red-500">Inactive</span>

// PASS — color + text/icon
<span className="text-green-600">
  <CheckCircle className="mr-1 inline size-4" aria-hidden="true" />
  Active
</span>
<span className="text-red-600">
  <XCircle className="mr-1 inline size-4" aria-hidden="true" />
  Inactive
</span>

// FAIL — links only distinguished by color
<p>
  Visit our <a href="/about" className="text-blue-500">about page</a> for details.
</p>

// PASS — links distinguished by color + underline
<p>
  Visit our <a href="/about" className="text-blue-500 underline">about page</a> for details.
</p>

// FAIL — form errors only by red border
<input className="border-red-500" />

// PASS — error by red border + icon + text message
<input className="border-destructive" aria-invalid="true" aria-describedby="email-error" />
<p id="email-error" className="text-destructive text-sm">
  <AlertCircle className="mr-1 inline size-4" aria-hidden="true" />
  Please enter a valid email
</p>

// FAIL — chart uses only color for data series
// PASS — chart uses color + patterns + labels
```

### Link Distinguishability

Links within body text must be distinguishable from surrounding text by more than color alone:

```tsx
// Recommended: underline (simplest, most universally understood)
<a href="/terms" className="text-primary underline underline-offset-4">
  Terms of Service
</a>

// Alternative: underline on hover + 3:1 contrast between link and surrounding text
<a href="/terms" className="text-primary hover:underline">
  Terms of Service
</a>
// NOTE: if using this pattern, the link color must have 3:1 contrast
// against BOTH the background AND the surrounding text color
```

## Link Purpose (2.4.4)

Link text must describe the destination or purpose:

```tsx
// FAIL — ambiguous link text
<a href="/listing/123">Click here</a>
<a href="/listings">Read more</a>
<a href="/docs">Learn more</a>

// PASS — descriptive link text
<a href="/listing/123">View 2024 BMW M4 details</a>
<a href="/listings">Browse all listings</a>
<a href="/docs">Read the documentation</a>

// PASS — link purpose clear from context (aria-label)
<article>
  <h3>2024 BMW M4 Competition</h3>
  <p>Alpine White, 12,000 miles...</p>
  <a href="/listing/123" aria-label="View details for 2024 BMW M4 Competition">
    View details
  </a>
</article>

// PASS — link purpose clear from aria-describedby
<h3 id="listing-title">2024 BMW M4 Competition</h3>
<a href="/listing/123" aria-describedby="listing-title">View details</a>

// Links that open in new window — warn the user
<a href="/external" target="_blank" rel="noopener noreferrer">
  External resource
  <span className="sr-only">(opens in new tab)</span>
  <ExternalLink className="ml-1 inline size-3" aria-hidden="true" />
</a>
```

## Multiple Ways to Find Pages (2.4.5)

Provide at least two ways to locate any page:

```tsx
// Method 1: Navigation menu
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/">Home</a></li>
    <li><a href="/listings">Listings</a></li>
    <li><a href="/filters">Saved Filters</a></li>
  </ul>
</nav>

// Method 2: Search
<form role="search" aria-label="Site search">
  <label htmlFor="search" className="sr-only">Search listings</label>
  <input id="search" type="search" placeholder="Search..." />
</form>

// Method 3: Sitemap
<footer>
  <a href="/sitemap">Sitemap</a>
</footer>

// Method 4: Breadcrumbs
<nav aria-label="Breadcrumb">
  <ol className="flex gap-2">
    <li><a href="/">Home</a></li>
    <li aria-current="page">2024 BMW M4</li>
  </ol>
</nav>
```

## Label in Name (2.5.3)

The accessible name of a component must **contain** its visible label text:

```tsx
// PASS — aria-label matches visible text
<button aria-label="Search listings">
  <Search className="size-4" aria-hidden="true" />
  Search
</button>

// FAIL — aria-label doesn't contain the visible text
<button aria-label="Find vehicles">
  Search    {/* Visible text says "Search" but accessible name is "Find vehicles" */}
</button>

// PASS — no aria-label, visible text IS the accessible name
<button>Search</button>

// PASS — aria-label starts with visible text (additional context is fine)
<button aria-label="Search listings by make and model">
  Search
</button>
```

**Rule**: If a component has visible text, the `aria-label` or `aria-labelledby` value must include that visible text as a substring (ideally at the start).

## Predictable Behavior (3.2.1 - 3.2.4)

### On Focus (3.2.1)

Receiving focus must not cause unexpected changes:

```tsx
// FAIL — navigates away on focus
<select onFocus={() => window.location.href = '/other'}>

// FAIL — opens modal on focus
<input onFocus={() => setModalOpen(true)} />

// PASS — focus only shows visual indicator
<input onFocus={() => setIsFocused(true)} className="focus:ring-2" />
```

### On Input (3.2.2)

Changing a form value must not cause unexpected context changes unless the user is warned:

```tsx
// FAIL — select navigates on change without warning
<select onChange={(e) => router.push(e.target.value)}>
  <option value="/en">English</option>
  <option value="/es">Spanish</option>
</select>

// PASS — select has explicit submit button
<select value={language} onChange={setLanguage}>
  <option value="en">English</option>
  <option value="es">Spanish</option>
</select>
<button onClick={() => router.push(`/${language}`)}>Apply</button>

// PASS — behavior is described before the control
<p>Selecting a language will reload the page in that language.</p>
<select onChange={(e) => router.push(e.target.value)}>
  <option value="/en">English</option>
  <option value="/es">Spanish</option>
</select>

// PASS — filtering a list (not a context change — content updates in place)
<input
  type="search"
  onChange={(e) => setFilter(e.target.value)}
  aria-label="Filter listings"
/>
```

### Consistent Navigation (3.2.3)

Navigation menus must appear in the same relative order on every page:

```tsx
// PASS — same order everywhere (via shared layout)
// layout.tsx
<nav>
  <a href="/">Home</a>
  <a href="/listings">Listings</a>
  <a href="/filters">Filters</a>
  <a href="/messages">Messages</a>
</nav>

// FAIL — different order on different pages
// Page A: Home, Listings, Filters, Messages
// Page B: Home, Messages, Listings, Filters
```

### Consistent Identification (3.2.4)

Same functionality = same label across the site:

```tsx
// FAIL — inconsistent labels for the same action
// Page A: <button>Search</button>
// Page B: <button>Find</button>
// Page C: <button>Look up</button>

// PASS — same label everywhere
// All pages: <button>Search</button>
```

## Consistent Help (3.2.6) [NEW in WCAG 2.2]

Help mechanisms must appear in the same relative location across pages:

```tsx
// PASS — help link in footer on every page (via layout)
<footer>
  <a href="/help">Help Center</a>
  <a href="/contact">Contact Us</a>
</footer>

// PASS — chat widget in same position on every page
<div className="fixed bottom-4 right-4">
  <ChatWidget />   {/* Same position on every page */}
</div>

// FAIL — help link in header on some pages, footer on others
```

### Help Mechanisms That Must Be Consistent

- Contact information (phone, email)
- Help/FAQ links
- Chat widgets
- Contact forms
- Social media support links

They don't all need to be present on every page, but when present, they must be in the same relative position.
