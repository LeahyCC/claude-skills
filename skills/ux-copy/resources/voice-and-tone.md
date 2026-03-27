# Voice and Tone

Verified against: Nielsen Norman Group, Apple Human Interface Guidelines, Microsoft Writing Style Guide, Atlassian Design System, Shopify Polaris

## Key Distinction: Voice vs. Tone

**Voice** = your product's personality. Constant across all screens. Who you are.
**Tone** = emotional register. Shifts by context. How you sound right now.

A banking app has a confident, precise voice — but its tone shifts from reassuring (during a transfer) to celebratory (savings goal reached) to direct (session expired).

## Greenfield: Define Your Voice

### The Voice Worksheet

Answer these four dimensions. Place your product on each spectrum:

| Dimension | ← Left | Right → | Question to ask |
|-----------|--------|---------|-----------------|
| **Formality** | Casual | Formal | Would your user say "Hey" or "Dear Customer"? |
| **Humor** | Serious | Playful | Would a joke feel welcome or out of place? |
| **Authority** | Peer | Expert | Are you a teammate or a consultant? |
| **Warmth** | Neutral | Warm | Is the relationship transactional or personal? |

### Example Voice Profiles

**SaaS / Developer Tool** (e.g., Linear, Vercel, Stripe)
- Formality: 6/10 — professional but not stiff
- Humor: 2/10 — dry wit at most, never forced
- Authority: 8/10 — expert, opinionated
- Warmth: 4/10 — respectful, not effusive
- Voice in 3 words: **Confident, precise, direct**

```tsx
// This voice in an empty state:
<p className="text-muted-foreground">No issues yet. Create one to start tracking work.</p>

// This voice in an error:
<p className="text-destructive">Couldn't connect to the database. Check your connection string.</p>

// This voice in onboarding:
<p>Set up your first project to start deploying.</p>
```

**Consumer / Social App** (e.g., Duolingo, Headspace, Spotify)
- Formality: 2/10 — conversational, uses contractions
- Humor: 7/10 — playful, personality-driven
- Authority: 3/10 — peer, companion
- Warmth: 9/10 — personal, encouraging
- Voice in 3 words: **Friendly, energetic, supportive**

```tsx
// This voice in an empty state:
<p className="text-muted-foreground">Your playlist is empty — time to find some new favorites.</p>

// This voice in an error:
<p className="text-destructive">Hmm, that didn't work. Check your connection and try again.</p>

// This voice in onboarding:
<p>Welcome! Let's find what you're into.</p>
```

**Enterprise / Government** (e.g., GOV.UK, Salesforce, healthcare)
- Formality: 8/10 — professional, measured
- Humor: 0/10 — never
- Authority: 9/10 — authoritative, trustworthy
- Warmth: 3/10 — respectful, not cold
- Voice in 3 words: **Clear, authoritative, measured**

```tsx
// This voice in an empty state:
<p className="text-muted-foreground">No applications submitted. Start a new application to continue.</p>

// This voice in an error:
<p className="text-destructive">This form could not be submitted. Correct the highlighted fields and try again.</p>

// This voice in onboarding:
<p>Create your account to access services.</p>
```

**E-commerce / Marketplace** (e.g., Shopify, Etsy, Airbnb)
- Formality: 4/10 — approachable, warm
- Humor: 4/10 — light touches, not dominant
- Authority: 5/10 — knowledgeable guide
- Warmth: 7/10 — encouraging, supportive
- Voice in 3 words: **Encouraging, clear, approachable**

```tsx
// This voice in an empty state:
<p className="text-muted-foreground">Your store is ready. Add your first product to start selling.</p>

// This voice in an error:
<p className="text-destructive">We couldn't process this payment. Try a different card or contact your bank.</p>

// This voice in onboarding:
<p>Let's get your store set up. It takes about 10 minutes.</p>
```

### How to Use the Profile

Once defined, write 3 words that summarize your voice. Put these in your project's CLAUDE.md, README, or a `content/voice.md` file so every contributor (human and AI) writes consistently:

```markdown
## Voice
Confident, precise, direct.
Formality: 6/10. Humor: 2/10. Authority: 8/10. Warmth: 4/10.

Use contractions (don't, won't, can't).
Address the user as "you."
No exclamation marks in UI text.
```

## The Tone Spectrum Map

Voice stays constant. Tone shifts by context. This map shows which contexts allow flexibility and which are locked to the serious end:

```
Context                 Serious ◄────────────► Playful    Flexibility
─────────────────────────────────────────────────────────────────────
Error / failure         ████████░░                         Very low
Destructive action      ███████░░░                         Low
System status           ██████░░░░                         Low
Form validation         █████░░░░░                         Low-medium
Success confirmation    ████░░░░░░                         Medium
Empty state             ███░░░░░░░                         Medium-high
Loading / waiting       ███░░░░░░░                         Medium-high
Onboarding              ██░░░░░░░░                         High
Marketing / landing     █░░░░░░░░░                         Very high
```

**Rule**: Even the most playful brand pulls tone to the serious end for errors and destructive actions. Even the most formal brand can have some warmth in onboarding.

### Tone by Context — What Changes

| Context | Serious end | Playful end | What's constant |
|---------|------------|-------------|-----------------|
| **Error** | "This form could not be submitted." | "Hmm, that didn't work." | Always includes what to do next |
| **Destructive** | "Permanently delete this account?" | "Delete your account? This can't be undone." | Always names the specific action |
| **Success** | "Payment processed." | "You're all set!" | Always brief, past tense or present |
| **Empty state** | "No applications submitted." | "Nothing here yet — let's fix that." | Always includes a path forward |
| **Onboarding** | "Create your account." | "Welcome! Let's get you set up." | Always leads to a single next step |

## Mature Codebase: Infer Existing Voice

When joining a project with existing copy, don't impose a new voice. Read the existing patterns first.

### Inference Checklist

Check these markers in the codebase:

| Marker | What to look for | What it tells you |
|--------|-----------------|-------------------|
| **Contractions** | "don't" vs "do not" | Formality level |
| **Exclamation marks** | "Welcome!" vs "Welcome." | Enthusiasm/energy level |
| **"Please"** | Used frequently or never | Formality level |
| **Humor** | Puns, emoji, playful language | Playfulness |
| **"We" vs passive** | "We couldn't save" vs "Save failed" | Warmth/personality |
| **Sentence length** | Short fragments vs full sentences | Density preference |
| **Error tone** | "Oops!" vs "Error:" vs helpful sentence | Overall personality |
| **Terminology** | Consistent terms or mixed | Maturity of copy system |

### Grep Patterns for Voice Inference

Run these to quickly understand a project's existing voice:

```bash
# Check formality — contractions indicate casual voice
grep -rn "don't\|can't\|won't\|isn't\|we're\|you'll" src/ --include="*.tsx" | head -20

# Check for "please" — frequent use indicates formal voice
grep -rn '"[Pp]lease ' src/ --include="*.tsx" | wc -l

# Check for exclamation marks in UI text — indicates enthusiasm
grep -rn '!['"'"'"`]' src/ --include="*.tsx" | head -20

# Check error message patterns
grep -rn 'error\|Error\|invalid\|Invalid\|failed\|Failed' src/ --include="*.tsx" | head -20

# Check empty state patterns
grep -rn -i 'no .* yet\|nothing\|empty\|get started\|create your first' src/ --include="*.tsx" | head -20

# Check for mixed terminology — look for synonyms
grep -rn '"[Pp]roject\|[Ww]orkspace\|[Ss]pace"' src/ --include="*.tsx" | head -20
```

### After Inference

Summarize what you found:

```
Existing voice: [3 words]
Formality: [1-10] — evidence: [uses/avoids contractions]
Humor: [1-10] — evidence: [specific examples or "none found"]
Consistency issues: [list any mixed terminology or tone shifts]
```

Then match new copy to the existing voice. Flag inconsistencies for the team to resolve — don't silently "fix" them, as they may be intentional variations.

## Voice Definition in Code

For projects that want to formalize their voice, create a content constants file:

```typescript
// content/voice.ts

/**
 * Project voice profile.
 * Voice: Confident, precise, direct.
 * Formality: 6/10 | Humor: 2/10 | Authority: 8/10 | Warmth: 4/10
 */

// Terminology glossary — one term per concept
export const terms = {
  mainEntity: 'project',     // not "workspace", "space", or "repo"
  user: 'member',            // not "user", "person", or "account holder"
  create: 'create',          // not "add", "new", or "make"
  remove: 'delete',          // not "remove", "destroy", or "trash"
  collection: 'team',        // not "organization", "group", or "company"
} as const

// Contractions — use these forms
// don't, won't, can't, isn't, aren't, we'll, you're, it's
// Exception: never contract in legal text or destructive action consequences
```

## Common Mistakes

| Mistake | Why it happens | Fix |
|---------|---------------|-----|
| Defining voice but not tone ranges | Teams write a voice doc and assume all copy should sound the same | Add tone spectrum map — errors need different tone than onboarding |
| "We're fun and quirky!" in error states | Voice doc says playful, so errors get jokes too | Lock errors to serious end regardless of voice |
| Different writers, different voices | No single reference for copy decisions | Create voice profile in CLAUDE.md or content/voice.ts |
| Copying a competitor's voice | Feels safe, but creates generic copy | Use the worksheet to find your own position on each dimension |
| Changing voice mid-project | Rebrand energy without a migration plan | Audit existing copy first, migrate systematically by component type |

## Sources

- Nielsen Norman Group — 3 C's framework (Clarity > Concision > Character)
- Apple Human Interface Guidelines — [Writing](https://developer.apple.com/design/human-interface-guidelines/writing)
- Microsoft Writing Style Guide — [Brand voice](https://learn.microsoft.com/en-us/style-guide/brand-voice-above-all-simple-human)
- Atlassian Design System — [Voice and tone](https://atlassian.design/foundations/content/voice-tone)
- Shopify Polaris — [Voice and tone](https://polaris.shopify.com/content/voice-and-tone)
- GOV.UK — [Content design](https://www.gov.uk/guidance/content-design/writing-for-gov-uk)
