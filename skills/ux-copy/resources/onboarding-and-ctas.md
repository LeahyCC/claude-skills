# Onboarding and CTAs

Verified against: Nielsen Norman Group, Apple HIG, Shopify Polaris, Atlassian Design System

## CTA Button Labels

### The Rule: Verb + Specific Outcome

Every CTA tells the user exactly what happens when they act. "Submit" tells nothing. "Create account" tells everything.

| Bad | Good | Why |
|-----|------|-----|
| Submit | Create account | Names what's being created |
| Click here | Download report | Names what they get |
| Next | Review payment | Names what's on the next screen |
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

| Context | Label | Not |
|---------|-------|-----|
| Registration flow | "Continue with Google" | "Sign in with Google" (implies existing account) |
| Login flow | "Log in with Google" | "Continue with Google" (ambiguous) |
| Either/both | "Continue with Google" | "Sign up with Google" (wrong on login page) |

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
grep -rn '"Submit"\|"Click here"\|"Next"\|"Continue"\|"Go"\|"Learn more"' src/ --include="*.tsx"

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
- Shopify Polaris — [Actionable language](https://polaris.shopify.com/content/actionable-language)
- Atlassian Design System — [Designing Messages](https://atlassian.design/foundations/content/designing-messages)
- Microsoft Writing Style Guide — [Top 10 tips](https://learn.microsoft.com/en-us/style-guide/top-10-tips-style-voice)
