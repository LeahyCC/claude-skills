# Confirmation and Destructive Actions

Verified against: Nielsen Norman Group, Apple HIG, Shopify Polaris, Atlassian Design System

## The "Are You Sure?" Anti-Pattern

"Are you sure you want to do this?" is the most common confirmation dialog — and the least effective. The user just told you what they want to do. "Are you sure?" adds friction without adding information.

**The fix**: Replace the question with consequences. Tell the user what will happen, then let them decide.

```tsx
// FAIL — adds friction, no information
<AlertDialog>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>No</AlertDialogCancel>
      <AlertDialogAction>Yes</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

// PASS — specific consequences, specific actions
<AlertDialog>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete 3 projects?</AlertDialogTitle>
      <AlertDialogDescription>
        This will permanently delete all files, tasks, and comments in these projects.
        This can't be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Keep projects</AlertDialogCancel>
      <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
        Delete 3 projects
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

## The Confirmation Dialog Formula

### Title: Name the Action

State exactly what will happen. Include quantities when relevant.

| Bad | Good |
|-----|------|
| "Are you sure?" | "Delete 3 projects?" |
| "Confirm action" | "Remove Alex from the team?" |
| "Warning" | "Cancel your subscription?" |
| "Please confirm" | "Permanently delete your account?" |

### Body: Explain Consequences

Tell the user what they might not know. If the consequences are obvious, keep it short or skip the body entirely.

```tsx
// Obvious consequence — brief body
<AlertDialogDescription>
  This can't be undone.
</AlertDialogDescription>

// Non-obvious consequences — explain specifically
<AlertDialogDescription>
  This will permanently delete all 82 photos and videos.
  They'll be removed from all synced devices. Shared albums will lose these items.
</AlertDialogDescription>

// Multiple consequences — use a list
<AlertDialogDescription>
  Deleting this workspace will:
  <ul className="list-disc pl-4 mt-2 space-y-1">
    <li>Remove all 12 projects and their data</li>
    <li>Revoke access for 5 team members</li>
    <li>Cancel the active Pro subscription</li>
  </ul>
</AlertDialogDescription>
```

### Buttons: Name the Action, Never Yes/No

The confirmation button must name the specific destructive action. The cancel button should describe what happens if they back out.

| Bad pair | Good pair |
|----------|-----------|
| Yes / No | Delete 3 projects / Keep projects |
| OK / Cancel | Remove from team / Cancel |
| Confirm / Back | Cancel subscription / Keep subscription |
| Continue / Stop | Leave without saving / Save and leave |
| Delete / Don't delete | Delete account / Keep account |

## The Escalation Ladder

Match confirmation friction to the severity of the action:

### Tier 1: Low Severity (Reversible)

**No confirmation needed.** Provide undo instead.

Examples: archiving, moving to trash, removing from a list (not deleting), dismissing a notification.

```tsx
// Undo pattern — toast with recovery action
<Toast>
  <ToastTitle>Conversation archived</ToastTitle>
  <ToastAction altText="Undo">Undo</ToastAction>
</Toast>
```

**Why undo beats confirmation**: Undo is zero-friction for the 99% of cases where the action was intentional. Confirmation dialogs add friction to every single action.

### Tier 2: Medium Severity (Hard to Reverse)

**Simple confirmation dialog** with specific action button.

Examples: removing a team member, canceling a subscription, publishing to production, sending a mass email.

```tsx
<AlertDialog>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Remove Alex from the team?</AlertDialogTitle>
      <AlertDialogDescription>
        Alex will lose access to all team projects immediately.
        You can re-invite them later.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction>Remove from team</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Tier 3: High Severity (Irreversible)

**Confirmation dialog + type-to-confirm.**

Examples: deleting a repository, deleting an account, purging all data, revoking all API keys.

```tsx
<AlertDialog>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Permanently delete this repository?</AlertDialogTitle>
      <AlertDialogDescription>
        This will permanently delete <strong>acme/web-app</strong> and all of its
        files, issues, pull requests, and settings. This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <div className="space-y-2 py-4">
      <Label htmlFor="confirm">
        Type <strong>acme/web-app</strong> to confirm
      </Label>
      <Input
        id="confirm"
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        placeholder="acme/web-app"
      />
    </div>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction
        disabled={confirmText !== 'acme/web-app'}
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
      >
        Delete this repository
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Choosing the Right Tier

```
Is the action easily undoable?
├── YES → Tier 1: No dialog. Provide undo via toast.
└── NO
    ├── Can the user recover from this with some effort? (re-invite, re-subscribe, re-create)
    │   └── YES → Tier 2: Simple confirmation dialog.
    └── Is this truly permanent? (data loss, account deletion, key revocation)
        └── YES → Tier 3: Confirmation + type-to-confirm.
```

## Destructive Button Styling

The initial trigger button should NOT be red. Save red for the confirmation step.

```tsx
// FAIL — trigger button is red (alarms user before they've decided)
<Button variant="destructive">Delete project</Button>

// PASS — trigger is neutral, confirmation is red
<Button variant="outline">Delete project</Button>
{/* ...which opens a dialog where the confirm button IS destructive: */}
<AlertDialogAction className="bg-destructive text-destructive-foreground">
  Delete project
</AlertDialogAction>
```

**Exception**: When the destructive action IS the primary purpose of the page (e.g., account deletion settings), the trigger can be red to signal the page's purpose.

## "Leave Without Saving" Pattern

A special case: the user tries to navigate away with unsaved changes.

```tsx
// FAIL — generic
<AlertDialogTitle>Are you sure you want to leave?</AlertDialogTitle>
<AlertDialogDescription>You have unsaved changes.</AlertDialogDescription>

// PASS — specific, offers both paths
// Note: AlertDialog supports two buttons (cancel + action). For three buttons, use Dialog.
<DialogHeader>
  <DialogTitle>Leave without saving?</DialogTitle>
  <DialogDescription>
    You have unsaved changes to this document. They'll be lost if you leave now.
  </DialogDescription>
</DialogHeader>
<DialogFooter className="gap-2 sm:gap-0">
  <DialogClose asChild>
    <Button variant="ghost">Keep editing</Button>
  </DialogClose>
  <Button variant="outline" onClick={leaveWithoutSaving}>Leave without saving</Button>
  <Button onClick={saveAndLeave}>Save and leave</Button>
</DialogFooter>
```

**Three-button pattern**: When you need Save + Leave, Leave without saving, and Keep editing, use `Dialog` (not `AlertDialog`) since `AlertDialog` only supports a cancel/action pair. This handles all user intents.

## Common Patterns

| Scenario | Title | Body | Confirm | Cancel |
|----------|-------|------|---------|--------|
| Delete items | "Delete 3 files?" | "They'll be permanently removed." | "Delete 3 files" | "Keep files" |
| Remove member | "Remove Alex?" | "Alex will lose access immediately." | "Remove from team" | "Cancel" |
| Cancel plan | "Cancel your Pro plan?" | "You'll keep access until [date]. After that, you'll be on the free plan." | "Cancel plan" | "Keep Pro" |
| Discard draft | "Discard this draft?" | "Your draft will be permanently deleted." | "Discard draft" | "Keep draft" |
| Sign out | "Log out?" | (no body needed — obvious action) | "Log out" | "Cancel" |
| Revoke access | "Revoke all API keys?" | "All existing integrations will stop working immediately." | "Revoke all keys" | "Keep keys" |

## Greenfield Checklist

1. Categorize every destructive action by severity tier (1, 2, or 3)
2. Write specific dialog titles for each Tier 2 and Tier 3 action
3. Write consequence descriptions for non-obvious destructive actions
4. Name every button (never Yes/No/OK)
5. Implement undo via toast for all Tier 1 actions
6. Reserve red button styling for the confirmation step only

## Mature Codebase Checklist

```bash
# Find "Are you sure" dialogs
grep -rn '"Are you sure"\|"Are You Sure"' src/ --include="*.tsx"

# Find Yes/No/OK button labels
grep -rn '>[Yy]es<\|>[Nn]o<\|>[Oo][Kk]<\|>OK<' src/ --include="*.tsx"

# Find "This action cannot be undone" (generic, should be specific)
grep -rn '"This action cannot be undone"\|"This cannot be undone"' src/ --include="*.tsx"

# Find Confirm/Cancel without specific action names
grep -rn '>Confirm<' src/ --include="*.tsx"
```

## Sources

- Nielsen Norman Group — [Confirmation Dialogs](https://www.nngroup.com/articles/confirmation-dialog/)
- Apple HIG — [Alerts](https://developer.apple.com/design/human-interface-guidelines/alerts)
- Shopify Polaris — [Error messages](https://polaris.shopify.com/content/error-messages)
- Atlassian Design System — [Designing Messages](https://atlassian.design/foundations/content/designing-messages)
