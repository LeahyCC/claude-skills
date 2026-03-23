# Forms and Inputs

WCAG Success Criteria: 1.3.1 (Info and Relationships), 1.3.5 (Identify Input Purpose), 3.3.1 (Error Identification), 3.3.2 (Labels or Instructions), 3.3.3 (Error Suggestion), 3.3.4 (Error Prevention)

## Labels

Every form input must have a programmatically associated label:

```tsx
// Method 1: Explicit <label> with htmlFor (preferred)
<label htmlFor="email">Email address</label>
<input id="email" type="email" />

// Method 2: Wrapping <label>
<label>
  Email address
  <input type="email" />
</label>

// Method 3: aria-label (when no visible label)
<input type="search" aria-label="Search listings" />

// Method 4: aria-labelledby (reference existing text)
<h2 id="filter-heading">Filters</h2>
<fieldset aria-labelledby="filter-heading">
  ...
</fieldset>

// FAIL — no label association
<span>Email</span>
<input type="email" />    {/* Screen reader: "edit text" — no context */}

// FAIL — placeholder is NOT a label
<input type="email" placeholder="Email address" />  {/* Disappears on type */}
```

### Placeholder vs Label

Placeholders are **supplementary hints**, not replacements for labels:

```tsx
// CORRECT — label + placeholder
<label htmlFor="phone">Phone number</label>
<input id="phone" type="tel" placeholder="(555) 123-4567" />

// WRONG — placeholder as only label
<input type="tel" placeholder="Phone number" />
```

## Grouping Related Inputs

```tsx
// Fieldset + legend for related fields
<fieldset>
  <legend>Shipping Address</legend>
  <label htmlFor="street">Street</label>
  <input id="street" type="text" autoComplete="street-address" />
  <label htmlFor="city">City</label>
  <input id="city" type="text" autoComplete="address-level2" />
</fieldset>

// Radio groups
<fieldset>
  <legend>Transmission Type</legend>
  <label><input type="radio" name="transmission" value="auto" /> Automatic</label>
  <label><input type="radio" name="transmission" value="manual" /> Manual</label>
</fieldset>
```

## Input Purpose (autocomplete)

Use `autoComplete` to help browsers and assistive tech identify input purpose:

```tsx
<input type="text" autoComplete="name" />           // Full name
<input type="email" autoComplete="email" />          // Email
<input type="tel" autoComplete="tel" />              // Phone
<input type="text" autoComplete="street-address" />  // Street
<input type="text" autoComplete="postal-code" />     // ZIP/Postal
<input type="text" autoComplete="cc-number" />       // Credit card
<input type="password" autoComplete="new-password" /> // New password
<input type="password" autoComplete="current-password" /> // Login
```

## Error Handling

### Error Identification (3.3.1)

Errors must be identified in text, not just by color:

```tsx
// CORRECT — error message with icon and programmatic association
<div>
  <label htmlFor="email">Email</label>
  <input
    id="email"
    type="email"
    aria-invalid={!!error}
    aria-describedby={error ? "email-error" : undefined}
    className={error ? "border-destructive" : "border-input"}
  />
  {error && (
    <p id="email-error" className="mt-1 text-destructive text-sm" role="alert">
      <AlertCircle className="mr-1 inline size-4" aria-hidden="true" />
      Please enter a valid email address
    </p>
  )}
</div>

// WRONG — only red border, no text explanation
<input className={error ? "border-red-500" : ""} />
```

### Error Summary

For forms with multiple errors, provide a summary:

```tsx
{errors.length > 0 && (
  <div role="alert" className="rounded-md border-destructive bg-destructive/10 p-4">
    <h2 className="font-semibold">Please fix the following errors:</h2>
    <ul className="mt-2 list-disc pl-5">
      {errors.map((error) => (
        <li key={error.field}>
          <a href={`#${error.field}`}>{error.message}</a>
        </li>
      ))}
    </ul>
  </div>
)}
```

### Inline Validation Timing

- **Don't validate on every keystroke** — it's disorienting for screen reader users
- **Validate on blur** (when user leaves the field) for real-time feedback
- **Validate on submit** as the final check
- **Clear errors** when the user starts correcting the field

## Required Fields

```tsx
// Use aria-required and visual indicator
<label htmlFor="name">
  Full name <span aria-hidden="true" className="text-destructive">*</span>
</label>
<input id="name" type="text" aria-required="true" required />

// Explain the convention at the top of the form
<p className="text-muted-foreground text-sm">
  Fields marked with <span className="text-destructive">*</span> are required
</p>
```

## Disabled vs Read-Only

```tsx
// Disabled — not interactive, not submitted
<input disabled value="Cannot change" />
// Screen reader: "Cannot change, dimmed, edit text"

// Read-only — not editable, IS submitted
<input readOnly value="For reference" />
// Screen reader: "For reference, edit text, read only"

// aria-disabled — appears disabled, still focusable (better for screen readers)
<button aria-disabled={isSubmitting} onClick={isSubmitting ? undefined : handleSubmit}>
  {isSubmitting ? 'Saving...' : 'Save'}
</button>
```

## Touch Targets

WCAG 2.5.8 (AA): Interactive targets must be at least **24x24 CSS pixels**, with 44x44 recommended.

```tsx
// Mobile-friendly touch targets
<button className="min-h-11 min-w-11 px-4 py-2">  {/* 44px minimum */}
  Submit
</button>

// Small inline controls — use padding to increase target
<button className="p-2">  {/* Icon is 16px, but target is 16+16+16 = 48px */}
  <X className="size-4" />
</button>

// Checkbox/radio — increase clickable area
<label className="flex items-center gap-2 py-2">  {/* Padding increases target */}
  <input type="checkbox" className="size-4" />
  <span>Remember me</span>
</label>
```
