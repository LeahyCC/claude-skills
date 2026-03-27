# Notifications and Status Messages

Verified against: Nielsen Norman Group, Atlassian Design System, Shopify Polaris, Carbon Design System

## Notification Type Decision Matrix

Choose the right notification component based on urgency, persistence, and context:

| Type | Use When | Persistence | Position | Component |
|------|----------|-------------|----------|-----------|
| **Toast** | Confirming a completed action; non-critical info | Auto-dismiss (3-8s) | Corner (bottom-right or top-right) | Toast / Sonner |
| **Banner** | System-wide issues; important updates; expiring trials | Until dismissed or resolved | Top of page, below nav | Alert |
| **Inline** | Field-level errors; contextual warnings for a specific section | Until condition is resolved | Adjacent to relevant content | Inline text / Alert |
| **Modal** | Critical errors requiring user decision; blocking issues | Until user responds | Center, with overlay | AlertDialog |

### When NOT to Use Each Type

| Type | Never use for |
|------|--------------|
| **Toast** | Errors (auto-dismisses before user can read), critical info, complex messages |
| **Banner** | Success confirmations (too prominent), single-field errors (too far from context) |
| **Inline** | System-wide issues (too localized), success for unrelated actions |
| **Modal** | Routine confirmations, non-blocking info, success messages |

## Copy by Severity

### Success Messages

**Tone**: Brief, confident, past tense. Confirm and get out of the way.

```tsx
// FAIL — verbose, redundant
<Toast>
  <ToastTitle>Success! Your changes have been successfully saved!</ToastTitle>
</Toast>

// PASS — brief, specific
<Toast>
  <ToastTitle>Changes saved</ToastTitle>
</Toast>
```

**Patterns for success toasts:**

| Action | Copy | Not |
|--------|------|-----|
| Saved | "Changes saved" | "Your changes were saved successfully!" |
| Created | "Project created" | "Success! New project created!" |
| Sent | "Invite sent" | "Your invitation has been sent successfully" |
| Copied | "Copied to clipboard" | "Text successfully copied!" |
| Deleted | "Project deleted" | "The project has been successfully removed" |
| Updated | "Settings updated" | "Your settings have been updated" |

**Rule**: Success toasts should be 2-4 words. Name what happened. No exclamation marks.

### Error Messages

**Tone**: Specific, helpful. Always include a next step. Never use toast for errors — they auto-dismiss before users can process them.

```tsx
// FAIL — toast disappears before user can act
<Toast variant="destructive">
  <ToastTitle>Error saving changes</ToastTitle>
</Toast>

// PASS — persistent, with recovery path
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Couldn't save changes</AlertTitle>
  <AlertDescription>
    Check your connection and try again. Your edits are still here.
  </AlertDescription>
</Alert>
```

**Error notification placement:**

| Error type | Component | Why |
|-----------|-----------|-----|
| Field validation | Inline text below field | Adjacent to the problem |
| Form submission failure | Alert above form or inline | Persistent, near the action |
| API / system failure | Banner at top of page | System-wide visibility |
| Auth expired | Modal (AlertDialog) | Requires user action to continue |
| Network lost | Banner (persistent) | System-wide, ongoing condition |

### Warning Messages

**Tone**: Forward-looking, preventive. Help users avoid a problem before it happens.

```tsx
// FAIL — generic alarm
<Alert>
  <AlertTitle>Warning!</AlertTitle>
  <AlertDescription>Be careful with this action.</AlertDescription>
</Alert>

// PASS — specific prevention
<Alert>
  <AlertTriangle className="h-4 w-4" />
  <AlertTitle>This will affect 12 team members</AlertTitle>
  <AlertDescription>
    Changing the workspace timezone updates meeting times for everyone.
    Notify your team before proceeding.
  </AlertDescription>
</Alert>
```

**Common warning patterns:**

| Scenario | Copy |
|----------|------|
| Unsaved changes | "You have unsaved changes" |
| Trial expiring | "Your trial expires in 3 days. Upgrade to keep your data." |
| Approaching limit | "You've used 8 of 10 seats. Add more seats to invite new members." |
| Irreversible upcoming | "Once published, this post can't be moved back to draft." |
| Affecting others | "This change will affect all 12 team members." |

### Informational Messages

**Tone**: Neutral, factual. Provide context without urgency.

```tsx
// FAIL — unnecessary urgency
<Alert>
  <AlertTitle>Important notice!</AlertTitle>
  <AlertDescription>We've updated our privacy policy.</AlertDescription>
</Alert>

// PASS — calm, informative
<Alert>
  <Info className="h-4 w-4" />
  <AlertTitle>Privacy policy updated</AlertTitle>
  <AlertDescription>
    We've updated our privacy policy effective March 1.
    <a href="/privacy" className="underline">Read the changes</a>
  </AlertDescription>
</Alert>
```

## Severity and Visual Design

| Severity | Color Token | Icon | Auto-dismiss | Requires action |
|----------|------------|------|-------------|-----------------|
| **Success** | Green / `text-green-*` | Check circle | Yes (3-5s) | No |
| **Error** | `destructive` | Alert circle | No | Usually |
| **Warning** | Yellow / `text-yellow-*` | Triangle | No | Sometimes |
| **Info** | Blue / `text-blue-*` or muted | Info circle | No | No |

Source: Atlassian ("Align message type, component, color, and icon for clarity")

## Actionable Notifications

The best notifications include a direct action that resolves the situation:

```tsx
// Without action — user must figure out what to do
<Toast>
  <ToastTitle>Export complete</ToastTitle>
</Toast>

// With action — one click to the result
<Toast>
  <ToastTitle>Export complete</ToastTitle>
  <ToastAction altText="Download">Download</ToastAction>
</Toast>
```

```tsx
// Without action — user must navigate manually
<Alert>
  <AlertTitle>New team member request</AlertTitle>
  <AlertDescription>Alex wants to join your team.</AlertDescription>
</Alert>

// With action — resolve inline
<Alert>
  <AlertTitle>Alex wants to join your team</AlertTitle>
  <AlertDescription className="flex items-center gap-2">
    <Button size="sm">Approve</Button>
    <Button size="sm" variant="outline">Decline</Button>
  </AlertDescription>
</Alert>
```

## Auto-Dismiss Rules

| Content | Auto-dismiss | Duration | Why |
|---------|-------------|----------|-----|
| Success confirmation | Yes | 3-5 seconds | User already saw the result in UI |
| Undo opportunity | Yes | 5-8 seconds | Enough time to undo, not so long it clutters |
| Non-critical info | Yes | 5-8 seconds | Optional reading |
| Error | Never | — | User needs time to read and act |
| Warning | Never | — | Condition persists until resolved |
| Action required | Never | — | User must take action |

**Accessibility**: Pause auto-dismiss on hover/focus so users with motor or cognitive disabilities have time to read.

## Notification Copy Patterns

### Progress Updates

For multi-step or long-running operations:

```tsx
// Phase 1 — Started
<Toast>
  <ToastTitle>Export started</ToastTitle>
  <ToastDescription>We'll notify you when it's ready.</ToastDescription>
</Toast>

// Phase 2 — Complete (new notification, not an edit)
<Toast>
  <ToastTitle>Export complete</ToastTitle>
  <ToastAction altText="Download">Download CSV</ToastAction>
</Toast>
```

**Send a new notification when a long task completes** — don't update the original. New notifications trigger push notifications and grab attention. Updates don't.

### Stacking / Grouping

When multiple notifications arrive, group them:

```tsx
// FAIL — separate toasts for each
// "File uploaded" × 5 toasts

// PASS — grouped
<Toast>
  <ToastTitle>5 files uploaded</ToastTitle>
</Toast>
```

### Permission Requests

When requesting system permissions (notifications, location, camera):

```tsx
// FAIL — OS permission dialog with no context (user declines reflexively)
// Immediately triggers: "example.com wants to send notifications"

// PASS — explain value first, then request
<Alert>
  <AlertTitle>Get notified when your team mentions you</AlertTitle>
  <AlertDescription>
    Turn on notifications to stay in the loop.
    <Button size="sm" onClick={requestPermission}>Turn on</Button>
    <Button size="sm" variant="ghost" onClick={dismiss}>Not now</Button>
  </AlertDescription>
</Alert>
```

**Why**: Permission priming (explaining value before triggering the OS prompt) significantly improves opt-in rates compared to showing the OS dialog cold.

## Greenfield Checklist

1. Choose a toast library (Sonner is common with shadcn)
2. Define auto-dismiss duration per severity (success: 3-5s, undo: 5-8s)
3. Write success toast templates as 2-4 word confirmations
4. Use Alert (not toast) for all error notifications
5. Add actions to notifications where possible
6. Implement pause-on-hover for auto-dismissing notifications

## Mature Codebase Checklist

```bash
# Find errors shown as toasts (should be persistent Alerts instead)
grep -rn 'toast.*error\|toast.*fail\|toast.*destructive' src/ --include="*.tsx" -i

# Find generic notification text
grep -rn '"Success!"\|"Error!"\|"Warning!"\|"Important"' src/ --include="*.tsx"

# Find verbose success messages
grep -rn 'successfully\|has been.*saved\|has been.*created\|has been.*sent' src/ --include="*.tsx"

# Find notifications without actions
grep -rn 'ToastTitle\|AlertTitle' src/ --include="*.tsx" -A 5 | grep -v 'Action\|Button\|action'
```

## Sources

- Nielsen Norman Group — [Indicators, Validations, and Notifications](https://www.nngroup.com/articles/indicators-validations-notifications/)
- Atlassian Design System — [Designing Messages](https://atlassian.design/foundations/content/designing-messages)
- Shopify Polaris — [Error messages](https://polaris.shopify.com/content/error-messages)
- Apple HIG — [Notifications](https://developer.apple.com/design/human-interface-guidelines/notifications)
