# Errors and Validation

Verified against: Nielsen Norman Group (13 error message guidelines), Shopify Polaris (error message patterns), Apple HIG, GOV.UK, Microsoft Writing Style Guide

## The Error Message Formula

Every error message answers three questions:

1. **What happened?** — describe the problem in plain language
2. **Why?** — explain the cause if it helps the user (skip if obvious)
3. **What can the user do?** — provide a specific recovery path

```tsx
// FAIL — answers none of the three
<p className="text-destructive">Error.</p>

// FAIL — answers only "what" (no recovery)
<p className="text-destructive">Your session has expired.</p>

// PASS — answers all three
<p className="text-destructive">
  Your session expired after 30 minutes of inactivity. Log in again to continue.
</p>
```

## Three Error Categories

Different error types need different copy approaches:

### 1. Form / Field Errors (user input)

**Placement**: Inline, adjacent to the field.
**Tone**: Helpful, specific. Never accusatory.
**Structure**: What's wrong + how to fix.

```tsx
// FAIL — vague, blaming
<p className="text-sm text-destructive">Invalid email address.</p>

// PASS — specific, guiding
<p className="text-sm text-destructive">This email needs an @ symbol.</p>
```

```tsx
// FAIL — robotic
<p className="text-sm text-destructive">Field must not exceed 100 characters.</p>

// PASS — human
<p className="text-sm text-destructive">Company name must be 100 characters or fewer.</p>
```

```tsx
// FAIL — tells them what they did wrong
<p className="text-sm text-destructive">You entered a password that is too short.</p>

// PASS — tells them what to do right
<p className="text-sm text-destructive">Choose a password with at least 8 characters.</p>
```

**Common field error patterns:**

| Field | Bad | Good |
|-------|-----|------|
| Email | "Invalid email" | "This email needs an @ symbol" |
| Password | "Password too short" | "Choose a password with at least 8 characters" |
| Phone | "Invalid phone number" | "Phone number must be 10 digits" |
| URL | "Invalid URL" | "Enter a full URL starting with https://" |
| Required field | "This field is required" | "Enter your [field name] to continue" or "Add a [field name]" |
| Number range | "Value out of range" | "Enter a number between 1 and 100" |
| Date | "Invalid date" | "Enter a date in MM/DD/YYYY format" |
| File upload | "Invalid file type" | "Upload a PNG, JPG, or SVG file (max 5 MB)" |
| Duplicate | "Already exists" | "An account with this email already exists. Log in instead?" |

### 2. System Errors (application/server failures)

**Placement**: Toast, banner, or modal depending on severity.
**Tone**: Honest, calm. Acknowledge the failure.
**Structure**: What happened + what to try + optional explanation.

```tsx
// FAIL — vague, no recovery
<Alert variant="destructive">
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>Something went wrong.</AlertDescription>
</Alert>

// PASS — specific, with recovery
<Alert variant="destructive">
  <AlertTitle>Couldn't save your changes</AlertTitle>
  <AlertDescription>
    Our server didn't respond. Your edits are still here — try saving again.
  </AlertDescription>
</Alert>
```

**Common system error patterns:**

| Scenario | Copy |
|----------|------|
| API failure | "Couldn't load [thing]. Refresh the page to try again." |
| Save failure | "Your changes weren't saved. They're still here — try again." |
| Timeout | "This is taking longer than usual. Try again in a few minutes." |
| Rate limited | "Too many requests. Wait a minute and try again." |
| Maintenance | "[Service] is temporarily down for maintenance. We'll be back by [time]." |
| Unknown error | "Something went wrong on our end. Try again, or contact support if it keeps happening." |

### 3. Network Errors (connectivity)

**Placement**: Banner (persistent) or toast.
**Tone**: Calm, informative. Not the user's fault.
**Structure**: Current state + what's preserved + what to do.

```tsx
// FAIL — alarming, no help
<Alert variant="destructive">
  <AlertTitle>Network Error</AlertTitle>
  <AlertDescription>Connection lost.</AlertDescription>
</Alert>

// PASS — calm, preserves trust
<Alert>
  <AlertTitle>You're offline</AlertTitle>
  <AlertDescription>
    Your changes are saved locally. They'll sync when you reconnect.
  </AlertDescription>
</Alert>
```

## Inline Validation Timing

When to show the error matters as much as what it says.

### Recommended: Validate on Blur, Then on Change

1. User fills in field and moves to next field (blur) → validate, show error if wrong
2. User returns to fix the field → validate on every keystroke so they see it resolve
3. Never validate while the user is still typing in a field for the first time

```
User types in email field → (no validation yet)
User tabs to next field → (blur triggers validation → "This email needs an @ symbol")
User goes back to fix → (each keystroke revalidates → error disappears when fixed)
```

Source: NN/g — "Never show errors while the user is still actively typing in a field for the first time"

### Timing by Field Type

| Field Type | When to Validate | Why |
|-----------|-----------------|-----|
| Email, URL | On blur, then on change | Partial input always looks "wrong" mid-typing |
| Password (strength) | On each keystroke | Strength meter is helpful feedback, not an error |
| Required fields | On blur (only after first interaction) | Don't show errors on fields the user hasn't reached yet |
| Character count | On each keystroke | "12/100 characters" is info, not an error until over limit |
| Cross-field (e.g., date ranges) | On submit | Can't validate "end after start" until both fields exist |
| Server-validated (e.g., username availability) | On blur with debounce | Avoid spamming the server on every keystroke |

### Multiple Errors

When a form has multiple errors, tell the user how many and list them:

```tsx
// FAIL — vague count, no specifics
<Alert variant="destructive">
  <AlertDescription>There are errors on this page.</AlertDescription>
</Alert>

// PASS — specific count with actionable list
<Alert variant="destructive">
  <AlertTitle>Fix 2 issues to continue</AlertTitle>
  <AlertDescription>
    <ul className="list-disc pl-4">
      <li>Email address needs an @ symbol</li>
      <li>Choose a password with at least 8 characters</li>
    </ul>
  </AlertDescription>
</Alert>
```

Source: Shopify Polaris ("To save this product, make 2 changes: [list]")

## Words to Ban from Error Messages

| Banned Word | Why | Replace With |
|------------|-----|-------------|
| Invalid | Accusatory, vague | Describe what's actually wrong |
| Illegal | Alarming, legalistic | Describe what's allowed |
| Incorrect | Blaming | Describe the correct format |
| Wrong | Blaming | Describe what to do instead |
| Bad | Vague, judgmental | Describe the specific problem |
| Failed | Robotic | Describe what didn't happen |
| Error | Generic, adds nothing | Describe the actual problem |
| Forbidden | Alarming | "You don't have access" + who to contact |
| Unauthorized | Technical jargon | "Log in to continue" or "You don't have permission" |
| Oops / Uh-oh | Trivializes frustration | Skip interjections entirely |

Source: NN/g ("avoid 'invalid', 'illegal', 'incorrect'"), Apple HIG ("interjections like 'oops!' are typically unnecessary and can sound insincere"), Shopify Polaris

## Tone in Error States

Errors are always on the serious end of your tone spectrum. But the voice still comes through:

| Voice Profile | Error Copy | Why It Works |
|--------------|-----------|-------------|
| **Confident, precise** (SaaS) | "Couldn't connect to the database. Check your connection string." | Direct, no fluff, actionable |
| **Friendly, supportive** (Consumer) | "Hmm, that didn't work. Check your connection and try again." | Warm but still helpful |
| **Clear, authoritative** (Enterprise) | "This form could not be submitted. Correct the highlighted fields and try again." | Professional, complete |

What stays the same across all voices:
- Always includes recovery path
- Never blames the user
- Never uses banned words
- Never uses humor

## Error Message Anatomy (Component Structure)

```tsx
// Standard inline field error
<div className="space-y-2">
  <Label htmlFor="email">Email address</Label>
  <Input
    id="email"
    aria-invalid="true"
    aria-describedby="email-error"
    className="border-destructive"
  />
  <p id="email-error" className="text-sm text-destructive">
    This email needs an @ symbol.
  </p>
</div>
```

```tsx
// System error with Alert component
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Couldn't save your changes</AlertTitle>
  <AlertDescription>
    Check your connection and try again. Your edits are still here.
  </AlertDescription>
</Alert>
```

Key accessibility requirements:
- Use `aria-invalid="true"` on the field
- Use `aria-describedby` to connect the field to its error message
- Use `role="alert"` on dynamically appearing error containers
- Never rely on color alone — include an icon or prefix text

## Greenfield Checklist

1. Create error message templates for all three categories (form, system, network)
2. Define your banned words list (start with the table above)
3. Choose validation timing per field type
4. Decide on error summary behavior for multi-field forms
5. Write 404 and 500 error page copy with recovery paths

## Mature Codebase Checklist

```bash
# Find banned words in error messages
grep -rn '"[Ii]nvalid\|"[Ii]llegal\|"[Ii]ncorrect\|"[Ee]rror"\|"[Ff]ailed\|"[Oo]ops\|"[Uu]h.oh' src/ --include="*.tsx"

# Find vague error messages
grep -rn '"Something went wrong"\|"An error occurred"\|"Error!"\|"Please try again"' src/ --include="*.tsx"

# Find errors without recovery paths (errors with periods but no action verb after)
grep -rn 'text-destructive\|variant="destructive"' src/ --include="*.tsx"

# Check for aria-invalid on error fields
grep -rn 'text-destructive' src/ --include="*.tsx" -l | xargs grep -L 'aria-invalid'
```

## Sources

- Nielsen Norman Group — [Error-Message Guidelines](https://www.nngroup.com/articles/error-message-guidelines/)
- Nielsen Norman Group — [Errors in Forms](https://www.nngroup.com/articles/errors-forms-design-guidelines/)
- Shopify Polaris — [Error messages](https://polaris.shopify.com/content/error-messages)
- Apple HIG — [Writing](https://developer.apple.com/design/human-interface-guidelines/writing)
- Microsoft — [Top 10 tips](https://learn.microsoft.com/en-us/style-guide/top-10-tips-style-voice)
- Smashing Magazine — [Inline Validation in Forms](https://www.smashingmagazine.com/2022/09/inline-validation-web-forms-ux/)
