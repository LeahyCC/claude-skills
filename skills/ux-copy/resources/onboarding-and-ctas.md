# Onboarding and CTAs

Verified against: Nielsen Norman Group, Apple HIG, Shopify Polaris, Atlassian Design System

## CTA Button Labels

### The Rule: Verb + Specific Outcome

Every CTA tells the user exactly what happens when they act. "Submit" tells nothing. "Create account" tells everything.

| Bad | Good | Why |
|-----|------|-----|
| Submit | Create account | Names what's being created |
| Click here | Download report | Names what they get |
| Next, when the step isn't named | Review payment | "Next" is fine when the step name is already on screen |
| Continue | Start free trial | Names what starts |
| Learn more | View pricing | Names the destination |
| Go | Search projects | Names the action |
| Yes | Delete project | Names the specific action |

### Primary vs. Secondary CTAs

Every screen has at most one primary CTA. Supporting actions are secondary.

```tsx
// FAIL — two primary buttons compete for attention
<div className="flex gap-2">
  <Button>Start trial</Button>
  <Button>Contact sales</Button>
</div>

// PASS — clear hierarchy
<div className="flex gap-2">
  <Button>Start free trial</Button>
  <Button variant="outline">Talk to sales</Button>
</div>
```

### CTA Supporting Text

Microcopy below or near the CTA reduces perceived risk:

```tsx
// Without supporting text — user hesitates
<Button>Start free trial</Button>

// With supporting text — user's concerns addressed
<div className="flex flex-col items-center gap-2">
  <Button>Start free trial</Button>
  <p className="text-xs text-muted-foreground">
    No credit card required. Cancel anytime.
  </p>
</div>
```

**Common risk-reducers:**

| User concern | Copy |
|-------------|------|
| Will I be charged? | "No credit card required" or "Free for 14 days" |
| Is it reversible? | "Cancel anytime" or "You can change this later" |
| How long will this take? | "Takes about 2 minutes" or "3 quick steps" |
| Will it spam me? | "We'll only email you about your account" |
| Can I try first? | "No account needed to browse" |

Risk-reducers go in the small print, not in the button. "Try it free for 14 days" as a label makes the person read terms before they know what the button does. "Download free" with "No account, no card" under it says the same thing faster.

## Landing Page CTAs

A marketing page has a goal, and every button serves it. Most product home pages have two, in order:

1. **Get paid.** The visitor is ready, so let them buy.
2. **Get the download (or sign-up).** They are not ready to pay, so get the product in their hands.

Each button maps to one of those goals and says it in one plain word or two.

### Plain verbs win

| Weak | Strong | Why |
|------|--------|-----|
| Try it free for 14 days | Download free | Names the action. The trial length goes in the small print |
| Subscribe $9.99/yr (in the header) | Download | The header button is for the visitor who is not ready to pay yet |
| Purchase | Buy | Shorter and plainer. "Purchase" is formal |
| Subscribe for $9.99/year (under a big $9.99) | Buy | The price is already on the card. Don't make them read it twice |
| Get started | Download | Names what actually happens |

### A button goes where the action happens

Count the clicks from the button to the goal. A button that scrolls to another section only to show another button wastes a click and breaks the person's intent.

```
FAIL  hero "Try it free" -> #download section -> "Download free" -> /download -> "Download 1.0.0"   4 clicks
PASS  hero "Download free" -> /download -> "Download"                                               2 clicks
```

- A **button** never links to an anchor that holds another button for the same goal. Link straight to the page or action.
- Anchor links are fine for **browsing**: header nav (Features, Pricing, FAQ) and a secondary "See pricing" link when the visitor still has to pick a plan.
- When there is only one way to pay, the buy button can go straight to checkout. When there are plans to choose from, send them to the plans.

### Say it once per view

Count how many times one word shows on a single screen. An eyebrow "DOWNLOAD", a heading "Download IOSpec", a button "Download IOSpec 1.0.0" and a page title all saying the same word is noise.

```tsx
// FAIL: "Download" four times on one screen
<Eyebrow>Download</Eyebrow>
<h1>Download IOSpec</h1>
<p>Free for 14 days, no account and no card. Signed and notarized by Apple.</p>
<a href={dmg}>Download IOSpec 1.0.0</a>

// PASS: the button is the only "Download"
<h1>IOSpec</h1>
<a href={dmg}>Download</a>
<p className="text-xs">Version 1.0.0 · macOS 26 or later</p>
```

The `<title>` tag can still say "Download IOSpec" for search. It's not on screen.

### Single-purpose pages carry no persuasion

A page the visitor reached by clicking "Download" has already made the sale. Cut the reassurance and the pitch. Keep the button, the version and the requirements, then the install steps.

### Let pictures speak

When a card shows a drawing, a chart or a working demo, don't caption it with a sentence that says what the picture already shows. Keep a short title (it names the card and gives screen readers a heading) and drop the paragraph. Labels that are part of the picture (axis labels, a legend, a threshold) stay.

| Picture shows | Caption to cut |
|---------------|----------------|
| A heat scale with Calm, Warm, Hot and their thresholds | "Warm and hot start at the same points every time." |
| A list of apps, each tagged "Keeping the Mac awake" | "Names the apps holding your Mac awake." |

Inside the picture, don't repeat one phrase on every row. "Keeping the Mac awake" three times becomes a heading once, or short tags ("Mac", "Display").

### Give a demo room

When a section holds an interactive demo next to its controls, stack them (demo on top, controls under) unless the demo is small. Side by side halves the demo's width on every screen.

## Sign-Up and Login Copy

### Sign-Up Forms

Keep sign-up forms minimal. Every extra field reduces conversion.

```tsx
// FAIL — asks too much upfront
<form className="space-y-4">
  <Input placeholder="First name" />
  <Input placeholder="Last name" />
  <Input placeholder="Email" />
  <Input placeholder="Password" />
  <Input placeholder="Company name" />
  <Input placeholder="Job title" />
  <Input placeholder="Phone number" />
  <Button>Sign up</Button>
</form>

// PASS — minimal, asks more later
<form className="space-y-4">
  <Label htmlFor="email">Email address</Label>
  <Input id="email" placeholder="name@company.com" />
  <Label htmlFor="password">Password</Label>
  <Input id="password" type="password" />
  <Button className="w-full">Create account</Button>
  <p className="text-xs text-center text-muted-foreground">
    No credit card required
  </p>
</form>
```

### Social Login Labels

Google's own button text is "Sign in with Google", "Sign up with Google", or "Continue with Google". "Continue with Google" is fine on both pages. Don't write "Log in with Google".

| Context | Label |
|---------|-------|
| Sign up | "Sign up with Google" or "Continue with Google" |
| Sign in | "Sign in with Google" or "Continue with Google" |

### Login vs. Sign Up Distinction

Make it clear which page the user is on and provide a path to the other:

```tsx
// Sign-up page
<Card>
  <CardHeader>
    <CardTitle>Create your account</CardTitle>
  </CardHeader>
  <CardContent>{/* form */}</CardContent>
  <CardFooter>
    <p className="text-sm text-muted-foreground">
      Already have an account? <a href="/login" className="underline">Log in</a>
    </p>
  </CardFooter>
</Card>

// Login page
<Card>
  <CardHeader>
    <CardTitle>Log in to your account</CardTitle>
  </CardHeader>
  <CardContent>{/* form */}</CardContent>
  <CardFooter>
    <p className="text-sm text-muted-foreground">
      Don't have an account? <a href="/signup" className="underline">Create one</a>
    </p>
  </CardFooter>
</Card>
```

### "Log in" vs. "Login" vs. "Sign in"

- **Log in** (two words) = verb. "Log in to your account."
- **Login** (one word) = noun/adjective. "The login page."
- **Sign in** = acceptable alternative. Pick one and use it consistently.

## Progressive Disclosure in Onboarding

### The Four-Stage Pattern

Guide users to their first success moment as fast as possible:

**Stage 1 — Minimal sign-up**: Ask only what you need (email + password).
**Stage 2 — Value demonstration**: Show the product working before asking for more.
**Stage 3 — Personalization**: Ask preferences that improve the experience.
**Stage 4 — Activation**: Guide to the first meaningful action.

### Onboarding Copy by Stage

```tsx
// Stage 1 — Minimal
<CardTitle>Create your account</CardTitle>
<CardDescription>Get started in under a minute.</CardDescription>

// Stage 2 — Value demonstration
<CardTitle>Here's your dashboard</CardTitle>
<CardDescription>This is where you'll track all your projects.</CardDescription>

// Stage 3 — Personalization
<CardTitle>What are you working on?</CardTitle>
<CardDescription>We'll customize your setup based on your answer.</CardDescription>

// Stage 4 — Activation
<CardTitle>Create your first project</CardTitle>
<CardDescription>Give it a name to get started.</CardDescription>
```

### Step Indicators

When onboarding has multiple steps, tell users where they are:

```tsx
// FAIL — no progress context
<CardTitle>Choose a plan</CardTitle>

// PASS — user knows where they are and how much is left
<p className="text-sm text-muted-foreground">Step 2 of 3</p>
<CardTitle>Choose a plan</CardTitle>
```

Keep step descriptions actionable:

| Bad | Good |
|-----|------|
| Step 1: Account | Step 1: Create your account |
| Step 2: Settings | Step 2: Set up your workspace |
| Step 3: Done | Step 3: Invite your team |

## Feature Discovery

### Introducing New Features

When a feature is new, use a short inline callout — not a modal that blocks the user:

```tsx
// FAIL — modal blocks the user from doing what they came to do
<Dialog open>
  <DialogContent>
    <DialogTitle>New feature: Dark mode!</DialogTitle>
    <DialogDescription>
      We've added dark mode to make your experience more comfortable.
      Click Settings to try it out.
    </DialogDescription>
    <Button>Got it</Button>
  </DialogContent>
</Dialog>

// PASS — non-blocking inline callout
<Alert>
  <AlertTitle>New: Keyboard shortcuts</AlertTitle>
  <AlertDescription>
    Press <kbd>?</kbd> to see all shortcuts.
    <Button variant="link" className="p-0 h-auto" onClick={dismiss}>Dismiss</Button>
  </AlertDescription>
</Alert>
```

### Tooltip-Based Discovery

For features in existing UI:

```tsx
// First time user sees this area
<TooltipContent>
  <p className="font-medium">Quick filters</p>
  <p className="text-muted-foreground">
    Filter by status, assignee, or priority — all without leaving this view.
  </p>
</TooltipContent>
```

### Upgrade / Upsell Copy

When nudging users toward a paid plan:

```tsx
// FAIL — aggressive, makes free users feel punished
<Alert variant="destructive">
  <AlertTitle>Feature locked</AlertTitle>
  <AlertDescription>Upgrade to Pro to access this feature.</AlertDescription>
</Alert>

// PASS — shows value, respects the user
<Alert>
  <AlertTitle>Available on Pro</AlertTitle>
  <AlertDescription>
    Custom domains let your customers see your brand, not ours.
    <Button variant="link" className="p-0 h-auto">See plans</Button>
  </AlertDescription>
</Alert>
```

**Rules for upsell copy:**
- Explain the value, not just the paywall
- Never make the free tier feel broken or punitive
- Use "Available on [plan]" not "Feature locked" or "Upgrade required"
- Lead with the benefit, then the plan name

## Greenfield Checklist

1. Write sign-up form with minimal fields and specific CTA ("Create account")
2. Add risk-reducing supporting text below primary CTAs
3. Plan onboarding stages — aim for activation in under 3 steps
4. Write step indicator copy as actions ("Create your account", "Set up your workspace")
5. Choose "Log in" or "Sign in" — use consistently everywhere
6. Prepare feature discovery patterns (inline callout, not modal)
7. Write upsell copy that leads with value, not limitation

## Mature Codebase Checklist

```bash
# Find generic CTAs
grep -rn '"Submit"\|"Click here"\|"Continue"\|"Go"\|"Learn more"' src/ --include="*.tsx"

# Find aggressive upsell copy
grep -rn '"[Uu]pgrade required"\|"[Ff]eature locked"\|"[Pp]ay to"\|"[Uu]nlock"' src/ --include="*.tsx"

# Check sign-up/login consistency
grep -rn '"[Ss]ign in\|"[Ll]og in\|"[Ss]ign up\|"[Ll]ogin\|"[Ss]ignup"' src/ --include="*.tsx"

# Find onboarding without step context
grep -rn '"Step\|"step' src/ --include="*.tsx"
```

## Sources

- Nielsen Norman Group — [UX Copy Sizes](https://www.nngroup.com/articles/ux-copy-sizes/)
- Apple HIG — [Writing](https://developer.apple.com/design/human-interface-guidelines/writing)
- Shopify Polaris — [Voice and tone](https://shopify.dev/docs/apps/design/content/voice-and-tone)
- Atlassian Design System — [Designing Messages](https://atlassian.design/foundations/content/designing-messages)
- Microsoft Writing Style Guide — [Top 10 tips](https://learn.microsoft.com/en-us/style-guide/top-10-tips-style-voice)
