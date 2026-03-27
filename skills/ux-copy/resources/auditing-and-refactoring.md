# Auditing and Refactoring

How to systematically find and fix copy problems in an existing codebase.

Verified against: Nielsen Norman Group (content inventory methodology), GOV.UK (post-publication checking), Microsoft Writing Style Guide

## When to Audit

- Joining a new project and need to understand the copy landscape
- Preparing for i18n / localization (need to find all hardcoded strings)
- Inconsistent user feedback ("the app is confusing", "error messages don't help")
- Post-rebrand (need to update voice across the product)
- Before a major release (quality gate)

## The Audit Workflow

### Phase 1: Inventory

Scan the codebase to find all user-facing copy. Build a picture of what exists.

```bash
# Find all TSX files with string literals (potential UI text)
grep -rn '"[A-Z][a-z].*"' src/ --include="*.tsx" | head -100

# Find content/constants files
find src/ \( -name "*.ts" -path "*/content/*" \) -o \( -name "*.ts" -path "*/constants/*" \) -o \( -name "*.ts" -path "*/messages/*" \)

# Find i18n/localization files
find src/ \( -name "*.json" -path "*/locales/*" \) -o \( -name "*.json" -path "*/messages/*" \)

# Count hardcoded strings vs. content constants
grep -rn '"[A-Z][a-z]' src/components/ --include="*.tsx" | wc -l
grep -rn 'content\.\|messages\.\|t(' src/components/ --include="*.tsx" | wc -l
```

### Phase 2: Classify Problems

Run these targeted searches to categorize issues by type:

**Terminology inconsistency:**
```bash
# Find terms that might be used inconsistently
# Replace with your project's key concepts
grep -rn '"[Pp]roject\|"[Ww]orkspace\|"[Ss]pace' src/ --include="*.tsx" | sort
grep -rn '"[Dd]elete\|"[Rr]emove\|"[Tt]rash' src/ --include="*.tsx" | sort
grep -rn '"[Uu]ser\|"[Mm]ember\|"[Aa]ccount' src/ --include="*.tsx" | sort
```

**Generic / low-quality copy:**
```bash
# Generic buttons
grep -rn '>[Ss]ubmit<\|>[Oo][Kk]<\|>[Yy]es<\|>[Nn]o<\|>[Cc]lick [Hh]ere' src/ --include="*.tsx"

# Generic errors
grep -rn '"[Ii]nvalid\|"[Ee]rror"\|"[Ff]ailed"\|"Something went wrong"\|"An error occurred"' src/ --include="*.tsx"

# Generic empty states
grep -rn '"No data"\|"No results"\|"Nothing here"\|"Empty"' src/ --include="*.tsx"

# Generic confirmations
grep -rn '"Are you sure"\|>[Cc]onfirm<' src/ --include="*.tsx"

# Unnecessary "please"
grep -rn '"[Pp]lease ' src/ --include="*.tsx"
```

**Tone problems:**
```bash
# Humor/interjections in error states (should be serious)
grep -rn '"[Oo]ops\|"[Uu]h.oh\|"[Ww]hoops\|"[Yy]ikes' src/ --include="*.tsx"

# Exclamation marks (often excessive)
grep -rn '".*!.*"' src/ --include="*.tsx" | head -30

# ALL CAPS (harder to read, signals shouting)
grep -rn '"[A-Z][A-Z][A-Z]' src/ --include="*.tsx" | head -20

# Passive voice markers
grep -rn '".*has been\|".*was \|".*were \|".*been ' src/ --include="*.tsx" | head -20
```

**Accessibility problems:**
```bash
# Error fields without aria-invalid
grep -rn 'text-destructive' src/ --include="*.tsx" -l | xargs grep -L 'aria-invalid'

# Images without alt text
grep -rn '<img\|<Image' src/ --include="*.tsx" | grep -v 'alt='

# Links without descriptive text
grep -rn '"[Cc]lick here"\|"[Hh]ere"\|"[Ll]earn more"' src/ --include="*.tsx"
```

### Phase 3: Prioritize

Not all copy problems are equal. Fix high-impact issues first:

| Priority | Category | Impact | Fix effort |
|----------|----------|--------|-----------|
| **P0 — Fix now** | Error messages without recovery paths | Users get stuck, support tickets | Low |
| **P0 — Fix now** | Missing empty states (blank screens) | Users think the app is broken | Low |
| **P1 — Fix this sprint** | "Are you sure?" / Yes/No dialogs | Users click without reading | Low |
| **P1 — Fix this sprint** | "Invalid [field]" errors | Blames users, no guidance | Low |
| **P1 — Fix this sprint** | "Submit" / "OK" / "Click here" buttons | Vague, uncommitted | Low |
| **P2 — Plan for** | Mixed terminology | Confusion accumulates over time | Medium |
| **P2 — Plan for** | Inconsistent capitalization | Looks unpolished | Medium |
| **P2 — Plan for** | Hardcoded strings (needs i18n extraction) | Blocks localization | High |
| **P3 — Backlog** | "Please" in instructions | Minor friction, not harmful | Low |
| **P3 — Backlog** | Verbose success messages | Cosmetic, not confusing | Low |
| **P3 — Backlog** | Title Case vs sentence case | Consistency, not usability | Medium |

### Phase 4: Fix Systematically

Fix by category, not by file. This ensures consistency across the fix.

**Round 1 — Error messages** (highest user impact)
1. Search for all error display patterns (`text-destructive`, `variant="destructive"`, `role="alert"`)
2. For each, check: Does it say what happened? Does it say what to do?
3. Replace banned words ("invalid", "error", "failed") with specific descriptions
4. Add `aria-invalid` and `aria-describedby` where missing

**Round 2 — Empty states** (users think the app is broken)
1. Search for list/table/grid components
2. Check what renders when data is empty
3. Add first-use copy + CTA for every empty view

**Round 3 — Buttons and dialogs** (vague interactions)
1. Replace "Submit" / "OK" / "Yes" / "No" with specific action labels
2. Replace "Are you sure?" with specific consequence descriptions
3. Ensure every destructive dialog names the action in the button

**Round 4 — Terminology** (consistency)
1. Create a glossary: one term per concept
2. Search for all variants of each concept
3. Replace with the canonical term
4. Consider creating a content constants file (see [Voice and Tone](./voice-and-tone.md))

## The 3 C's Audit Test

For any piece of copy, run this quick evaluation:

### 1. Clear? (Priority 1)

- Can a new user understand this without context?
- Does it use plain language? (no jargon, no technical terms)
- Is the meaning unambiguous?

**Red flags**: Technical terms ("token expired", "403"), ambiguous pronouns ("it"), assumed knowledge ("see the docs")

### 2. Concise? (Priority 2)

- Can any words be removed without losing meaning?
- Is it under 25 words (for single sentences)?
- Are there filler phrases?

**Filler phrases to cut:**

| Remove | Replace with |
|--------|-------------|
| "In order to" | "To" |
| "Please note that" | (delete entirely) |
| "At this time" | "Now" or (delete) |
| "It is important to" | (delete, just say the thing) |
| "Due to the fact that" | "Because" |
| "In the event that" | "If" |
| "Prior to" | "Before" |
| "Subsequently" | "Then" or "After" |
| "Utilize" | "Use" |
| "Commence" | "Start" |
| "Terminate" | "End" |
| "Facilitate" | "Help" |
| "Implement" | "Use" or "Add" |

### 3. Character? (Priority 3)

- Does the tone match the project's voice?
- Does the tone match this specific context? (serious for errors, flexible for onboarding)
- Is it consistent with copy in similar components?

## Measuring Improvement

Track these metrics before and after a copy audit:

| Metric | How to measure | Good target |
|--------|---------------|-------------|
| Support tickets mentioning confusion | Tag/search support tickets | Decrease after fixes |
| Form completion rate | Analytics on form pages | Increase after error message fixes |
| Error recovery rate | % of users who fix errors vs. abandon | Increase after specific error messages |
| Time to first action | Analytics on onboarding flow | Decrease after CTA improvements |
| Copy consistency score | Grep for term variants / total occurrences | 95%+ use canonical term |

Source: NN/g ("track measurable indicators: product/content team satisfaction, late-stage content requests, usage of standards, user satisfaction, error and conversion rates")

## Copy Architecture for Scale

When a codebase grows, hardcoded strings become unmaintainable. Consider extracting copy into a structured system:

### Level 1: Content Constants (Minimum Viable)

```typescript
// content/errors.ts
export const errors = {
  network: {
    offline: "You're offline. Your changes are saved locally.",
    timeout: "This is taking longer than usual. Try again in a few minutes.",
    generic: "Something went wrong on our end. Try again.",
  },
  auth: {
    expired: "Your session ended. Log in again to continue.",
    unauthorized: "You don't have access to this page.",
  },
} as const
```

### Level 2: Template Functions (Dynamic Copy)

```typescript
// content/messages.ts
export const messages = {
  deleteConfirm: (count: number, thing: string) =>
    `Delete ${count} ${thing}${count === 1 ? '' : 's'}?`,
  searchNoResults: (query: string) =>
    `No results for "${query}"`,
  itemsRemaining: (count: number) =>
    `${count} item${count === 1 ? '' : 's'} remaining`,
} as const
```

### Level 3: i18n-Ready (Localization)

```typescript
// messages/en.json
{
  "errors.network.offline": "You're offline. Your changes are saved locally.",
  "errors.auth.expired": "Your session ended. Log in again to continue.",
  "actions.delete": "Delete {count, plural, one {# item} other {# items}}",
  "search.noResults": "No results for \"{query}\""
}
```

### When to Extract

| Signal | Action |
|--------|--------|
| Same string appears in 3+ places | Extract to constants |
| Copy includes dynamic values (counts, names) | Extract to template function |
| Product will be localized | Extract to i18n files from the start |
| Non-developers need to edit copy | Consider a headless CMS |

## Sources

- Nielsen Norman Group — [Content Inventory and Audit](https://www.nngroup.com/articles/content-audits/)
- Nielsen Norman Group — [Brevity Techniques](https://www.nngroup.com/articles/ux-writing-concise/)
- GOV.UK — [Content design: post-publication](https://www.gov.uk/guidance/content-design/writing-for-gov-uk)
- Microsoft Writing Style Guide — [Top 10 tips](https://learn.microsoft.com/en-us/style-guide/top-10-tips-style-voice)
