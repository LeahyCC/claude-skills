# Marketing Copy

> Sources: Andy Raskin (strategic narrative), Donald Miller ("Building a StoryBrand"), Emily Kramer / MKT1 (messaging hierarchy), April Dunford ("Sales Pitch"), Copyhackers (conversion copywriting), Amanda Natividad / SparkToro (zero-click content)

Copy is where positioning meets the customer. Great copy isn't clever — it's clear. It takes your messaging hierarchy and translates it into words that make the right person take the right action.

## Copywriting Frameworks

### PAS (Problem → Agitate → Solution)

Best for: short-form, pain-driven products, ads, email subject lines.

```
Problem:  Your AI-generated code isn't accessible.
Agitate:  Every inaccessible component is a potential lawsuit, a lost
          enterprise deal, and a user who can't use your product.
Solution: claude-skills covers all 50 WCAG 2.2 AA criteria with
          production React code. Install in one command.
```

### AIDA (Attention → Interest → Desire → Action)

Best for: landing pages, longer content, products that need education.

```
Attention: Over 96% of home pages have detectable WCAG failures (WebAIM Million, 2024).
Interest:  The usual fix — hire an auditor, get a report, spend 6 months
           remediating — costs $10-50k and is outdated the day after.
Desire:    What if every component was accessible from the first commit?
           No retrofitting, no audits, no surprises.
Action:    Install the WCAG skill → npx skills add LeahyCC/claude-skills@wcag-accessibility
```

### BAB (Before → After → Bridge)

Best for: case studies, email sequences, story-driven content.

```
Before: "We failed an enterprise accessibility audit. 200+ issues found.
         The deal was at risk."
After:  "Three months later, we passed with zero critical findings.
         The $500k deal closed."
Bridge: "We installed the WCAG accessibility skill and rewrote components
         using the FAIL→PASS patterns."
```

### Framework Selection

| Situation | Framework | Why |
|---|---|---|
| Landing page hero | PAS or Raskin narrative | Lead with the problem, not the product |
| Feature page | AIDA | Need education before desire |
| Case study | BAB | Story-driven, before/after is compelling |
| Email subject line | PAS (compressed) | Pain in 5 words gets opens |
| Social post | PAS | Short, punchy, problem-first |
| Sales page (long) | Raskin narrative | Big shift → promised land → your product |

## Landing Page Copy

### Hero Section

The hero has 5 seconds to communicate: what is this, who is it for, why should I care?

FAIL — clever but unclear:
```
Headline: "Reimagining digital experiences"
Subheadline: "An AI-powered platform for the modern web"
CTA: "Learn more"
```

PASS — clear and specific:
```
Headline: "Ship accessible products without accessibility experts"
Subheadline: "50/50 WCAG 2.2 AA criteria. Production React code.
One-command install for Claude Code."
CTA: "Install the skill"
Secondary CTA: "See the coverage" (transitional — for those not ready to commit)
```

### Hero Formula

```
Headline: [Outcome the customer wants] + [without the thing they want to avoid]
Subheadline: [How it works in one sentence] OR [Key proof point]
CTA: [Verb] + [object] (specific action, not "Learn more")
```

### Full Landing Page Structure

```markdown
1. HERO
   Headline + subheadline + primary CTA + secondary CTA
   Optional: hero image, demo GIF, or code snippet

2. SOCIAL PROOF BAR
   Logo bar ("Trusted by teams at...") or metric ("Used by X teams")

3. PROBLEM SECTION
   2-3 pain points your target customer recognizes immediately
   Use their language (from customer interviews)

4. SOLUTION SECTION
   How your product solves each pain point
   Feature → benefit mapping (feature is what it does, benefit is why it matters)

5. HOW IT WORKS
   3 steps. Simple. Visual.
   Step 1: [action] → Step 2: [action] → Step 3: [outcome]

6. FEATURES / DETAILS
   For each key feature:
   - Name
   - One-line benefit
   - Screenshot or code example
   - FAIL → PASS example (if applicable)

7. TESTIMONIAL / CASE STUDY
   One strong quote or mini case study
   Include name, role, company (real people > anonymous)

8. PRICING (if applicable)
   See Go-to-Market → Pricing Page Structure

9. FAQ
   Address the top 5-7 objections:
   - "How is this different from X?"
   - "Does it work with my stack?"
   - "How much does it cost?"
   - "Is it secure?"
   - "Can I try it before buying?"

10. FINAL CTA
    Repeat primary CTA with urgency or reassurance
    "Get started in 60 seconds. No credit card required."
```

### Copy Rules

| Rule | Why | FAIL → PASS |
|---|---|---|
| **Headline = benefit, not feature** | People care about outcomes | "AI-powered analysis" → "Find accessibility issues before your users do" |
| **Specific > vague** | Specificity builds trust | "Comprehensive coverage" → "50/50 WCAG 2.2 AA criteria" |
| **One CTA per section** | Multiple choices = no choice | "Sign up / Book demo / Read docs / Contact us" → "Install the skill" |
| **Address objections near CTA** | Reduce friction at decision point | CTA alone → CTA + "Free forever. No credit card." |
| **Use customer language** | If they call it "a11y audit", don't say "accessibility assessment" | Pull exact phrases from interview transcripts |
| **Front-load the value** | Readers scan, they don't read | "Our platform leverages AI to help you..." → "Ship accessible products in half the time" |

## Email Sequences

### Onboarding Sequence (5-7 emails, 14 days)

| Day | Email | Subject Line Formula | Content |
|---|---|---|---|
| 0 | Welcome | "Welcome — here's your first step" | Quick win: the ONE thing to do right now |
| 1 | Core feature | "[Product] + [their use case] — how it works" | Walk through the core workflow. Screenshot/GIF |
| 3 | Tip / use case | "The [specific thing] most people miss" | One non-obvious feature or pattern. Be helpful, not salesy |
| 5 | Social proof | "How [company] [achieved outcome]" | Mini case study or testimonial |
| 7 | Check-in | "Quick question about [product]" | Ask if they're stuck. Offer help. Human tone |
| 10 | Advanced feature | "Ready for [next level thing]?" | Feature they haven't tried yet |
| 14 | Upgrade prompt | "You've [used X, done Y] — unlock [next tier]" | Tied to their actual usage. Don't prompt if they haven't activated |

### Launch Announcement (3 emails)

| Timing | Email | Content |
|---|---|---|
| T-3 days | Teaser | "Something new is coming [day]" — build anticipation, don't reveal everything |
| Launch day | Announcement | What's new + why it matters + CTA to try it |
| T+3 days | Follow-up | Use case / demo / social proof + CTA for those who missed launch day |

### Email Copy Rules

| Rule | Why | Example |
|---|---|---|
| Subject line < 50 characters | Mobile truncation | "Your first WCAG audit in 60 seconds" |
| One CTA per email | Clarity | Don't link to 5 different things |
| Plain text > heavy HTML | Deliverability and trust | Simple formatting, no heavy images |
| From a person, not a brand | Higher open rates | "From: Sarah at [Product]" not "From: [Product] Team" |
| Unsubscribe is fine | Legal requirement + list hygiene | Don't hide it. Disengaged subscribers hurt deliverability |

## Case Studies

### Structure

```markdown
# How [Company] [Achieved Specific Outcome]

## At a Glance
| | |
|---|---|
| Company | [Name, industry, size] |
| Challenge | [One sentence] |
| Solution | [One sentence] |
| Result | [Key metric: "X% improvement in Y"] |

## The Challenge
[2-3 paragraphs. What was the situation? What triggered the need for change?
Use the customer's words where possible.]

## The Solution
[2-3 paragraphs. How did they use the product? Which specific features
or patterns? Include screenshots or code if relevant.]

## The Results
[Quantified. Before/after table:]

| Metric | Before | After |
|---|---|---|
| [Metric 1] | [Number] | [Number] |
| [Metric 2] | [Number] | [Number] |
| [Metric 3] | [Number] | [Number] |

## Quote
> "[Direct quote from the customer about the impact]"
> — [Name], [Role] at [Company]
```

### Case Study Rules

| Rule | Why |
|---|---|
| Lead with the result in the title | "How X saved 200 hours" gets read. "X is a customer" doesn't |
| Use real numbers | "Significant improvement" is worthless. "3x faster" is credible |
| Include the customer's voice | Direct quotes > your paraphrase |
| Show the before state | Contrast makes the after state more impressive |
| Get approval before publishing | Legal requirement. Send draft for review |

## Changelog / "What's New"

### Format

```markdown
## [Date] — [Headline: benefit, not feature name]

[1-2 sentence description. What can the user do now that they couldn't before?]

[Screenshot or GIF showing the change]

**Also improved:**
- [Secondary improvement 1]
- [Secondary improvement 2]
- [Bug fix — brief description]
```

### FAIL vs. PASS

FAIL — developer-focused release notes:
```
v2.3.1
- Fixed issue #234
- Updated dependency versions
- Refactored authentication module
- Added new endpoint for user preferences
```

PASS — user-focused changelog:
```
March 2026 — Dark mode is here

Your dashboard now supports dark mode. It follows your system preferences
automatically, or you can set it manually in Settings → Appearance.

[Screenshot of dark mode dashboard]

Also improved:
- Login is now 2x faster
- Fixed: notifications not clearing after being read
```

## Social Media Copy

### Platform-Specific Patterns

| Platform | Length | Tone | Best Formats |
|---|---|---|---|
| **Twitter/X** | < 200 chars for engagement | Direct, opinionated, concise | Hot takes, thread hooks, before/after |
| **LinkedIn** | 150-300 words | Professional but personal | Stories, lessons learned, data-backed insights |
| **Product Hunt** | Tagline + description | Excited but factual | Feature-benefit pairs, social proof |

### Zero-Click Content (Natividad)

In 2024-2026, platforms suppress outbound links. Create content that delivers full value in the post:

FAIL:
```
"We wrote a blog post about accessibility. Read it here: [link]"
```

PASS:
```
"Over 96% of home pages have detectable WCAG failures (WebAIM Million, 2024).

The 3 criteria most teams miss:
1. Focus Not Obscured (2.4.11) — sticky headers hide focused elements
2. Dragging Movements (2.5.7) — drag-only reorder with no keyboard alternative
3. Accessible Auth (3.3.8) — blocking paste in password fields

Most a11y tools catch <20 of 50 criteria. We built a skill that covers all 50.

[optional link for those who want more]"
```

The post delivers value on its own. The link is optional, not the point.
