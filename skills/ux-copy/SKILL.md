---
name: ux-copy
description: Use when writing or reviewing UI text — buttons, error messages, empty states, onboarding, confirmation dialogs, notifications, tooltips, labels, and any user-facing copy in React/Next.js components. Covers voice and tone calibration, microcopy patterns, copy auditing, and refactoring existing copy for consistency and clarity.
metadata:
  filePattern:
    - "src/components/**/*.tsx"
    - "src/components/**/*.jsx"
    - "src/app/**/*.tsx"
    - "app/**/*.tsx"
    - "components/**/*.tsx"
    - "pages/**/*.tsx"
    - "src/content/**/*.ts"
    - "src/constants/**/*.ts"
    - "content/**/*.ts"
    - "messages/**/*.json"
    - "locales/**/*.json"
  bashPattern: []
  priority: 50
---

# UX Copy — UI Text That Works

Production-ready UX copy patterns for React and Next.js applications. Every pattern includes real JSX examples — not just advice, but copy you can use directly in components.

**This skill works in two modes:**
- **Greenfield** — establishing voice, writing first copy, setting up copy architecture
- **Mature codebase** — auditing existing copy, fixing inconsistencies, refactoring for clarity

## Architecture Overview

```
[Voice Definition]
    ├── Voice worksheet (4 dimensions: formality, humor, authority, warmth)
    ├── Tone spectrum map (which contexts allow flexibility)
    └── Project voice profile ("confident, precise, reassuring")
              ↓
[Component Copy Rules]
    ├── Buttons → verb-first, specific action, 2-4 words
    ├── Errors → what happened + why + what to do
    ├── Empty states → explain + guide + single CTA
    ├── Confirmations → name the action, never Yes/No
    ├── Notifications → severity determines tone and persistence
    ├── Labels → describe the field, not the format
    └── Tooltips → one sentence, answers "what is this?"
              ↓
[Writing]
    ├── Apply universal rules (plain language, active voice, front-load)
    ├── Modulate tone to context (errors serious, onboarding flexible)
    └── Match existing voice if mature codebase
              ↓
[Review]
    ├── 3 C's test: Clear → Concise → Character
    ├── Read aloud test
    └── Consistency check (1 entity = 1 term)
```

## Quick Reference

| Need to...                                         | See                                                              |
| -------------------------------------------------- | ---------------------------------------------------------------- |
| Define voice for a new project                     | [Voice and Tone](./resources/voice-and-tone.md)                  |
| Infer voice from existing copy                     | [Voice and Tone](./resources/voice-and-tone.md)                  |
| Write button labels, form labels, tooltips         | [Microcopy](./resources/microcopy.md)                            |
| Write error messages and validation text            | [Errors and Validation](./resources/errors-and-validation.md)    |
| Write empty states and loading indicators          | [Empty and Loading](./resources/empty-and-loading.md)            |
| Write CTAs, sign-up flows, onboarding              | [Onboarding and CTAs](./resources/onboarding-and-ctas.md)        |
| Write destructive confirmation dialogs             | [Confirmation and Danger](./resources/confirmation-and-danger.md)|
| Write toasts, banners, alerts, status messages     | [Notifications and Status](./resources/notifications-and-status.md) |
| Audit and fix copy across a mature codebase        | [Auditing and Refactoring](./resources/auditing-and-refactoring.md) |

## Decision Matrix: "What Should This Say?"

### By component type

| Component | Copy Pattern | Length | Tone Range | Example |
|-----------|-------------|--------|------------|---------|
| **Button** | Verb + object | 2-4 words | Full range | "Create project" / "Send invite" |
| **Link** | Describes destination | 2-6 words | Full range | "View pricing" / "Learn more about plans" |
| **Label** | Describes the field | 1-3 words | Neutral | "Email address" / "Company name" |
| **Placeholder** | Shows format or example | 3-6 words | Neutral | "name@company.com" / "Search by title..." |
| **Tooltip** | Answers "what is this?" | 1 sentence | Neutral | "Messages older than 30 days are archived automatically." |
| **Toggle** | Describes the ON state | 2-5 words | Neutral | "Send email notifications" |
| **Error (inline)** | What's wrong + how to fix | 1 sentence | Serious | "Enter a password with at least 8 characters." |
| **Error (system)** | What happened + recovery path | 1-2 sentences | Serious | "We couldn't save your changes. Check your connection and try again." |
| **Empty state** | What goes here + how to start | 1-2 sentences + CTA | Flexible | "No projects yet. Create your first project to get started." |
| **Toast (success)** | Confirm what happened | 2-4 words | Brief | "Changes saved" / "Invite sent" |
| **Toast (error)** | What failed + next step | 1 sentence | Serious | "Couldn't save changes. Try again." |
| **Banner** | Awareness + optional action | 1-2 sentences | Informational | "Your trial expires in 3 days. Upgrade to keep your data." |
| **Confirmation dialog** | Consequence + specific action buttons | 1-3 sentences | Serious | "This will permanently delete 12 files. They can't be recovered." |
| **Onboarding** | Value + single next step | 1-2 sentences + CTA | Warm/flexible | "Track your team's work in one place. Create your first board." |

### "Is this copy good?" — The 3 C's Test

```
1. CLEAR — Can a new user understand this without context?
   ├── YES → continue
   └── NO → rewrite in plain language, remove jargon
              ↓
2. CONCISE — Can any words be removed without losing meaning?
   ├── NO, it's tight → continue
   └── YES → cut them (especially: "please", "in order to", "simply", "just")
              ↓
3. CHARACTER — Does the tone match the project's voice AND this context?
   ├── YES → ship it
   └── NO → adjust toward the right point on the tone spectrum
             (errors → serious end, onboarding → flexible end)
```

Source: Nielsen Norman Group — 3 C's framework (Clarity > Concision > Character, in that priority order)

## Core Principles

These 8 rules are universal — every major UX writing authority agrees on them regardless of brand, industry, or tone.

### 1. Plain language, always

Use "buy" not "purchase." Use "start" not "initiate." Use "end" not "terminate." This applies even to formal/enterprise products — plain is not casual, it's clear.

Source: GOV.UK (9-year-old reading age target), Microsoft ("simpler is better"), Shopify Polaris (7th-grade reading level)

### 2. Active voice, address the user as "you"

```tsx
// FAIL — passive, impersonal
<p>The password has been reset successfully.</p>

// PASS — active, direct
<p>You reset your password.</p>
```

Source: All 6 sources (NN/g, GOV.UK, Google, Microsoft, Apple, Atlassian)

### 3. Front-load important information

Users read in an F-pattern — they scan the first few words of each line. Put the critical information first.

```tsx
// FAIL — buries the action
<p>In order to access your dashboard, you need to verify your email first.</p>

// PASS — leads with what matters
<p>Verify your email to access your dashboard.</p>
```

Source: NN/g (users read only 20-28% of page content), GOV.UK (inverted pyramid)

### 4. One idea per copy unit

Every microcopy element has one job. A button label describes one action. An error message addresses one problem. A tooltip answers one question. If you need to convey two ideas, use two elements.

Source: NN/g (3 I's — each copy item either Informs, Influences, or facilitates Interaction), Kinneret Yifrah ("1 microcopy item = 1 idea")

### 5. Never blame the user

```tsx
// FAIL — accusatory
<p className="text-destructive">Invalid email address.</p>

// PASS — helpful
<p className="text-destructive">This email needs an @ symbol.</p>

// FAIL — scolding
<p className="text-destructive">You entered an incorrect password.</p>

// PASS — guides toward the fix
<p className="text-destructive">That password doesn't match. Try again or reset it.</p>
```

Words to avoid in error states: "invalid", "illegal", "incorrect", "wrong", "bad", "failed"

Source: NN/g (13 error message guidelines), Apple HIG, Shopify Polaris

### 6. Voice is constant, tone adapts to context

Your product's voice (personality) stays the same everywhere. Tone (emotional register) shifts based on what the user is experiencing:

| Context | Tone direction | Why |
|---------|---------------|-----|
| Error / failure | → Serious, direct | User is frustrated, not entertained |
| Destructive action | → Serious, careful | Consequences are real |
| Success | → Brief, confident | Confirm and get out of the way |
| Empty state | → Supportive, guiding | User needs direction |
| Onboarding | → Warm, encouraging | Most room for personality |
| Loading / waiting | → Calm, informative | Reduce anxiety |

Source: Apple HIG ("voice is constant; tone adapts"), Microsoft, Atlassian

### 7. One entity = one term

If you call it "project" in the sidebar, don't call it "workspace" in the settings page and "space" in the empty state. Pick one term per concept and use it everywhere.

Source: Kinneret Yifrah, Microsoft ("use one word for a concept consistently; avoid synonyms for the same feature")

### 8. Read it aloud

If it sounds unnatural spoken, rewrite it. This catches robotic phrasing, excessive formality, and awkward constructions faster than any other method.

Source: Apple HIG, Microsoft, Shopify Polaris ("Read it out loud. Does it sound like something a human would say? Ship it.")

## Anti-Patterns Checklist

When reviewing UI code, watch for these copy problems:

- [ ] **"Submit" buttons** — replace with specific action: "Create account", "Send message", "Save changes"
- [ ] **"Click here" links** — replace with descriptive text: "View pricing", "Read the docs"
- [ ] **"Are you sure?" dialogs** — replace with specific consequence: "Delete 3 projects?"
- [ ] **Yes/No/OK buttons** on dialogs — replace with action labels: "Delete" / "Keep", "Send" / "Cancel"
- [ ] **"An error occurred"** — replace with what happened and what to do about it
- [ ] **"Invalid [field]"** — replace with what's actually wrong: "Email needs an @ symbol"
- [ ] **"No data" empty states** — replace with what goes here and how to add it
- [ ] **"Please" in instructions** — usually unnecessary: "Enter your email" not "Please enter your email"
- [ ] **"Loading..."** without context — say what's loading: "Loading your dashboard..."
- [ ] **Mixed terminology** — same concept called different names in different places
- [ ] **Passive voice in actions** — "Your password has been reset" → "You reset your password"
- [ ] **Humor in error states** — stales on repetition, frustrates stuck users
- [ ] **ALL CAPS text** — harder to read, signals shouting
- [ ] **Jargon or internal terms** — "token expired" → "Your session ended. Log in again."
- [ ] **Vague success messages** — "Success!" → "Payment sent" (name what succeeded)
- [ ] **Long paragraphs in UI** — break into bullets, shorten sentences, let whitespace work

## When Reviewing Code

Run this checklist on any component with user-facing text:

- [ ] Every button label starts with a verb and names the specific action
- [ ] Error messages explain what went wrong AND what to do about it
- [ ] Empty states explain what belongs here AND offer a CTA to get started
- [ ] Confirmation dialogs name the destructive action in the button label (not "OK")
- [ ] The same concept uses the same term everywhere (check nav, headings, buttons, empty states)
- [ ] Placeholder text shows format or example, not the label ("name@company.com" not "Enter email")
- [ ] Toast messages are 2-5 words for success, 1 sentence with next step for errors
- [ ] No instances of "invalid", "illegal", "incorrect", "click here", "submit", or "are you sure"
- [ ] Sentences under 25 words, paragraphs under 3 sentences in UI text
- [ ] Copy reads naturally when spoken aloud
- [ ] Tone matches context (serious for errors, flexible for onboarding, brief for success)
- [ ] No hardcoded strings that should be in content constants or i18n files
