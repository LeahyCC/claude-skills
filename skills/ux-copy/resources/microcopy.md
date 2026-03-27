# Microcopy

Verified against: Nielsen Norman Group, Apple HIG, Microsoft Writing Style Guide, Shopify Polaris, Atlassian Design System, GOV.UK Content Design

## Buttons

### The Rule: Verb + Object

Every button label starts with a verb and names the specific action. 2-4 words.

```tsx
// FAIL — generic, tells nothing
<Button>Submit</Button>
<Button>OK</Button>
<Button>Next</Button>
<Button>Click here</Button>

// PASS — specific, tells the user what happens
<Button>Create project</Button>
<Button>Send invite</Button>
<Button>Save changes</Button>
<Button>Review payment</Button>
```

### Button Label Patterns by Action Type

| Action Type | Pattern | Examples |
|-------------|---------|----------|
| **Create** | "Create [thing]" | Create project, Create account |
| **Save** | "Save [thing]" | Save changes, Save draft |
| **Send** | "Send [thing]" | Send invite, Send message |
| **Delete** | "Delete [thing]" | Delete project, Delete 3 files |
| **Start a flow** | "Get started" or specific | Get started, Start free trial |
| **Continue a flow** | "[What the next step is]" | Review payment, Confirm details |
| **End a flow** | "Done" or specific result | Done, Publish post |
| **Cancel** | "Cancel" (alone is fine) | Cancel |
| **Navigate** | "View [thing]" or "Go to [thing]" | View pricing, Go to dashboard |
| **Download** | "Download [thing]" | Download report, Download CSV |
| **Upload** | "Upload [thing]" or "Choose file" | Upload photo, Choose file |

### Button Pairs

When two buttons sit together, the primary action should be visually prominent and the secondary should be clear:

```tsx
// FAIL — ambiguous pair
<div className="flex gap-2">
  <Button variant="outline">No</Button>
  <Button>Yes</Button>
</div>

// PASS — clear actions
<div className="flex gap-2">
  <Button variant="outline">Cancel</Button>
  <Button>Save changes</Button>
</div>
```

### Destination-Match Rule

The button label should match what the user sees next. If the button says "Review payment", the next screen should show payment details — not a shipping form.

Source: Nielsen Norman Group, Shopify Polaris — CTA labels should describe the destination, not just the mechanism

```tsx
// FAIL — button says "Next" but user doesn't know what's next
<Button>Next</Button>

// PASS — button tells the user what they'll do next
<Button>Choose a plan</Button>   // → plan selection screen
<Button>Review order</Button>    // → order summary screen
<Button>Add payment</Button>     // → payment form
```

## Labels

### Form Field Labels

Labels describe the field. They sit above or beside the input. They are not instructions.

```tsx
// FAIL — label is an instruction
<Label htmlFor="email">Enter your email address below</Label>
<Input id="email" />

// PASS — label names the field
<Label htmlFor="email">Email address</Label>
<Input id="email" />
```

```tsx
// FAIL — label is too vague
<Label htmlFor="name">Name</Label>

// PASS — label is specific
<Label htmlFor="name">Full name</Label>
// or
<Label htmlFor="first">First name</Label>
<Label htmlFor="last">Last name</Label>
```

### Label Capitalization

Use sentence case for labels (capitalize first word only). Title Case Looks Like A Form From 2005.

```tsx
// FAIL — title case
<Label>Email Address</Label>
<Label>Phone Number</Label>
<Label>Date Of Birth</Label>

// PASS — sentence case
<Label>Email address</Label>
<Label>Phone number</Label>
<Label>Date of birth</Label>
```

Source: Microsoft ("when in doubt, don't capitalize"), Atlassian ("sentence case for ALL titles, headings, menu items, labels, and buttons")

### Optional vs. Required Fields

If most fields are required, mark the optional ones — not the other way around:

```tsx
// FAIL — marks every required field (visual noise)
<Label>Email address *</Label>
<Label>Password *</Label>
<Label>Company name *</Label>
<Label>Phone number</Label>

// PASS — marks only the exception
<Label>Email address</Label>
<Label>Password</Label>
<Label>Company name</Label>
<Label>Phone number <span className="text-muted-foreground">(optional)</span></Label>
```

## Placeholders

### Placeholder vs. Label: Different Jobs

- **Label** = what the field is (always visible)
- **Placeholder** = format hint or example (disappears on focus)

Never use a placeholder as a label replacement — it vanishes when the user starts typing.

```tsx
// FAIL — placeholder is the only label
<Input placeholder="Email" />

// FAIL — placeholder repeats the label
<Label>Email address</Label>
<Input placeholder="Email address" />

// PASS — placeholder shows format
<Label>Email address</Label>
<Input placeholder="name@company.com" />

// PASS — placeholder shows example
<Label>Company name</Label>
<Input placeholder="Acme Inc." />
```

### When to Use Placeholders

| Use placeholder | Skip placeholder |
|-----------------|-----------------|
| Email fields ("name@company.com") | Simple text fields where format is obvious |
| Phone fields ("+1 (555) 000-0000") | Boolean toggles or checkboxes |
| Search fields ("Search by name or ID...") | Date pickers (format is set by the picker) |
| URL fields ("https://example.com") | Dropdowns/selects (they have their own prompt) |

### Search Placeholder Patterns

```tsx
// FAIL — too generic
<Input placeholder="Search..." />

// PASS — tells what you can search
<Input placeholder="Search projects by name..." />
<Input placeholder="Search members..." />
<Input placeholder="Filter by status or assignee..." />
```

## Tooltips

### The Rule: One Sentence, Answers "What Is This?"

Tooltips clarify — they don't instruct, warn, or provide essential information. If the information is essential, it should be visible, not hidden in a tooltip.

```tsx
// FAIL — tooltip contains critical information
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger>
      <Label>API key</Label>
    </TooltipTrigger>
    <TooltipContent>
      Warning: sharing this key gives full access to your account.
      Rotate it immediately if compromised.
    </TooltipContent>
  </Tooltip>
</TooltipProvider>

// PASS — critical info is visible; tooltip adds context
<div>
  <Label>API key</Label>
  <p className="text-sm text-destructive">
    Keep this secret. Sharing it gives full access to your account.
  </p>
</div>
```

```tsx
// FAIL — tooltip is an instruction
<TooltipContent>Click this button to save your changes</TooltipContent>

// PASS — tooltip clarifies what something is
<TooltipContent>Saves all changes since your last save</TooltipContent>
```

### Tooltip Length

One sentence maximum. No periods if it's a single fragment. If you need more than one sentence, use a popover or inline help text instead.

```tsx
// FAIL — too long for a tooltip
<TooltipContent>
  This setting controls whether your profile is visible to other team members.
  When enabled, your name and avatar will appear in the team directory.
  You can change this at any time from your account settings.
</TooltipContent>

// PASS — concise
<TooltipContent>Makes your profile visible in the team directory</TooltipContent>
```

## Toggles and Switches

### The Rule: Describe the ON State

The label describes what happens when the toggle is on. Users infer the off state.

```tsx
// FAIL — ambiguous
<div className="flex items-center gap-2">
  <Switch id="notifications" />
  <Label htmlFor="notifications">Notifications</Label>
</div>

// PASS — describes what ON does
<div className="flex items-center gap-2">
  <Switch id="notifications" />
  <Label htmlFor="notifications">Send email notifications</Label>
</div>
```

```tsx
// FAIL — double negative when off
<div className="flex items-center gap-2">
  <Switch id="tracking" />
  <Label htmlFor="tracking">Disable tracking</Label>
</div>

// PASS — positive framing
<div className="flex items-center gap-2">
  <Switch id="tracking" />
  <Label htmlFor="tracking">Allow usage analytics</Label>
</div>
```

Source: Apple HIG ("describe what the setting does when turned on; people can infer the opposite")

## Select / Dropdown

### Default Option Copy

```tsx
// FAIL — generic
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
</Select>

// PASS — specific
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Choose a role" />
  </SelectTrigger>
</Select>
```

### Option Labels

Options should be scannable. Front-load the distinguishing information:

```tsx
// FAIL — buries the difference
<SelectItem value="monthly">Pay every month — $9/month</SelectItem>
<SelectItem value="yearly">Pay every year — $90/year</SelectItem>

// PASS — front-loads the difference
<SelectItem value="monthly">Monthly — $9/mo</SelectItem>
<SelectItem value="yearly">Yearly — $90/yr (save 17%)</SelectItem>
```

## Breadcrumbs and Navigation

Use the same terms in navigation that you use everywhere else. If the page heading says "Settings", the breadcrumb should say "Settings" — not "Preferences" or "Configuration."

```tsx
// FAIL — mixed terminology
<nav>Home / Preferences / Notifications</nav>
<h1>Notification Settings</h1>

// PASS — consistent terms
<nav>Home / Settings / Notifications</nav>
<h1>Notifications</h1>
```

## Greenfield Checklist

When writing copy for a new project from scratch:

1. Define your voice profile (see [Voice and Tone](./voice-and-tone.md))
2. Create a terminology glossary — one term per concept
3. Write button labels as verb + object, 2-4 words
4. Write labels as nouns in sentence case
5. Use placeholders for format hints, not as labels
6. Write tooltips as single-sentence clarifications
7. Describe toggle ON states, not the setting itself
8. Use sentence case everywhere (headings, labels, buttons, nav)

## Mature Codebase Checklist

When auditing existing copy:

1. Grep for "Submit", "OK", "Click here", "Please" — these are usually problems
2. Check for mixed terminology (same concept, different words)
3. Check capitalization consistency (Title Case vs sentence case)
4. Check that placeholders aren't being used as labels
5. Check that tooltips don't contain essential information
6. Check toggle labels describe the ON state

```bash
# Find generic button text
grep -rn '"Submit"\|"OK"\|"Ok"\|"Click here"\|"Click Here"' src/ --include="*.tsx"

# Find "please" in UI text (usually unnecessary)
grep -rn '"[Pp]lease ' src/ --include="*.tsx"

# Find potential label/placeholder confusion
grep -rn 'placeholder.*label\|label.*placeholder' src/ --include="*.tsx"
```
