# Empty and Loading States

Verified against: Nielsen Norman Group, Apple HIG, Shopify Polaris, Atlassian Design System

## Five Types of Empty States

Each type needs different copy and a different tone.

### 1. First-Use (Onboarding Empty State)

The user has never added data. This is your chance to explain and motivate.

**Formula**: [What this space is for] + [Why it matters or what they can do] + [Single CTA]

```tsx
// FAIL — unhelpful
<div className="flex flex-col items-center gap-4 py-12">
  <p className="text-muted-foreground">No data.</p>
</div>

// PASS — explains and guides
<div className="flex flex-col items-center gap-4 py-12">
  <h3 className="text-lg font-medium">No projects yet</h3>
  <p className="text-muted-foreground">
    Projects help you organize work and track progress.
  </p>
  <Button>Create your first project</Button>
</div>
```

**Tone**: Warmest end of your spectrum. This is where personality shines.

| Voice | First-use copy |
|-------|---------------|
| Confident, precise | "No projects yet. Create one to start tracking work." |
| Friendly, supportive | "Your project list is empty — let's fix that!" |
| Clear, authoritative | "No projects have been created. Create a project to begin." |

### 2. No Search Results

The user searched but nothing matched.

**Formula**: "No results for '[query]'" + [Suggestion to adjust] + [Alternative actions]

```tsx
// FAIL — dead end
<p className="text-muted-foreground">No results found.</p>

// PASS — helpful
<div className="flex flex-col items-center gap-4 py-12">
  <h3 className="text-lg font-medium">No results for "{query}"</h3>
  <p className="text-muted-foreground">
    Try a different search term or adjust your filters.
  </p>
  <Button variant="outline" onClick={clearFilters}>Clear filters</Button>
</div>
```

**Key rules**:
- Always echo back the search query so the user can spot typos
- Suggest specific alternatives (different term, fewer filters, broader date range)
- Provide a clear action to reset and try again
- Never leave the user at a dead end

### 3. Completed / Inbox Zero

The user has processed everything. This is a moment to acknowledge.

**Formula**: [Positive acknowledgment] + [Optional next action]

```tsx
// FAIL — states the obvious
<p className="text-muted-foreground">No notifications.</p>

// PASS — acknowledges the achievement
<div className="flex flex-col items-center gap-4 py-12">
  <p className="text-muted-foreground">You're all caught up.</p>
</div>
```

```tsx
// PASS — with optional next step
<div className="flex flex-col items-center gap-4 py-12">
  <p className="text-muted-foreground">
    All tasks complete. Nice work.
  </p>
  <Button variant="outline">View completed tasks</Button>
</div>
```

**Tone**: Brief and positive. Don't overdo it — a simple "You're all caught up" beats "Woohoo! Amazing! You crushed it! 🎉"

### 4. User-Cleared (Filters or Deletion)

The user's own actions created the empty state.

**Formula**: [Explain what happened] + [How to undo or reset]

```tsx
// FAIL — doesn't explain why it's empty
<p className="text-muted-foreground">No items.</p>

// PASS — explains and offers reset
<div className="flex flex-col items-center gap-4 py-12">
  <p className="text-muted-foreground">
    No items match your current filters.
  </p>
  <Button variant="outline" onClick={clearFilters}>Clear all filters</Button>
</div>
```

### 5. Error-Caused Empty State

Data should be here but failed to load. This is an error state, not a true empty state.

**Formula**: [What went wrong] + [What to try] + [Retry action]

```tsx
// FAIL — looks like a real empty state (user thinks there's no data)
<p className="text-muted-foreground">No projects.</p>

// PASS — makes the error clear
<div className="flex flex-col items-center gap-4 py-12">
  <AlertCircle className="h-8 w-8 text-muted-foreground" />
  <h3 className="text-lg font-medium">Couldn't load projects</h3>
  <p className="text-muted-foreground">
    Check your connection and try again.
  </p>
  <Button variant="outline" onClick={retry}>Retry</Button>
</div>
```

**Critical**: Never show a blank screen with no explanation. Users can't tell if the page is broken or genuinely empty.

## Empty State Copy Matrix

| Type | Heading | Body | CTA | Tone |
|------|---------|------|-----|------|
| First-use | "No [things] yet" | What they're for + value | "Create your first [thing]" | Warm |
| No results | "No results for '[query]'" | Suggestion to adjust | "Clear filters" | Helpful |
| Completed | "You're all caught up" | Optional acknowledgment | Optional "View completed" | Brief, positive |
| User-cleared | "No items match your filters" | — | "Clear all filters" | Neutral |
| Error | "Couldn't load [things]" | What to try | "Retry" | Calm, honest |

## Loading States

### What to Say While Loading

Replace generic "Loading..." with specific context about what's being loaded.

```tsx
// FAIL — generic
<p className="text-muted-foreground">Loading...</p>

// PASS — specific
<p className="text-muted-foreground">Loading your dashboard...</p>
<p className="text-muted-foreground">Fetching latest results...</p>
<p className="text-muted-foreground">Connecting to database...</p>
```

### Progress Indicators

For operations with known duration, be specific:

```tsx
// FAIL — vague
<p className="text-muted-foreground">Please wait...</p>

// PASS — specific progress
<p className="text-muted-foreground">Uploading 3 of 12 files...</p>
<p className="text-muted-foreground">Processing — about 2 minutes remaining</p>
```

For operations with unknown duration, set expectations:

```tsx
// PASS — sets time expectation
<p className="text-muted-foreground">
  Generating report. This usually takes 1-2 minutes.
</p>
```

### Skeleton States

Skeletons replace loading text when the layout is known. They don't need copy — but the content they're replacing should load with real copy, not placeholder text:

```tsx
// FAIL — skeleton resolves to placeholder text
<Skeleton className="h-4 w-48" />
{/* resolves to: */}
<p>Lorem ipsum dolor sit amet</p>

// PASS — skeleton resolves to real content
<Skeleton className="h-4 w-48" />
{/* resolves to: */}
<p>3 projects updated this week</p>
```

### Long-Running Operations

For operations that take more than a few seconds:

1. **0-2 seconds**: Show a spinner or skeleton. No text needed.
2. **2-10 seconds**: Add loading text: "Loading your dashboard..."
3. **10-30 seconds**: Set expectations: "This usually takes about 15 seconds."
4. **30+ seconds**: Offer to notify: "We'll email you when this is ready."
5. **Background operations**: Confirm with a toast: "Export started. We'll notify you when it's ready."

## Greenfield Checklist

1. Write first-use empty states for every list, table, and data view
2. Write no-results copy for every search and filter UI
3. Write error-caused empty states for every data-loading view
4. Create loading text templates for each major data type
5. Decide on completed/inbox-zero copy for task-like views

## Mature Codebase Checklist

```bash
# Find generic empty states
grep -rn '"No data"\|"No results"\|"Nothing here"\|"Empty"\|"0 items"' src/ --include="*.tsx"

# Find generic loading text
grep -rn '"Loading\.\.\."\|"Please wait"\|"Fetching"' src/ --include="*.tsx"

# Find empty states without CTAs (look for muted text without nearby Button)
grep -rn 'text-muted-foreground' src/ --include="*.tsx" -A 5 | grep -v 'Button\|button'
```

## Sources

- Nielsen Norman Group — [Empty State Interface Design](https://www.nngroup.com/articles/empty-state-interface-design/)
- Apple HIG — [Writing (empty states section)](https://developer.apple.com/design/human-interface-guidelines/writing)
- Atlassian Design System — [Designing Messages (empty states)](https://atlassian.design/foundations/content/designing-messages)
- Shopify Polaris — [Error messages](https://polaris.shopify.com/content/error-messages)
