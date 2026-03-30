# Product Strategy

> Sources: Marty Cagan / SVPG ("Transformed", "Empowered", "Inspired"), Gibson Biddle (DHM model), Ben Thompson (Aggregation Theory), Geoffrey Moore ("Crossing the Chasm"), Andrew Chen ("The Cold Start Problem")

Product strategy answers three questions: Where are we going? How will we win? What will we NOT do? Without strategy, you have a feature factory — a team that ships outputs without outcomes.

## Strategy vs. Vision vs. Mission

| Concept | Timeframe | Example |
|---|---|---|
| **Vision** | 3-5 years | "Every developer ships accessible apps by default" |
| **Mission** | Ongoing | "We provide the tools and knowledge to make accessibility effortless" |
| **Strategy** | 1-2 years | "Win the React/Next.js ecosystem first, then expand to other frameworks" |

Vision is aspirational. Mission is purpose. Strategy is the plan to get there — including what you deliberately ignore.

## Product Strategy Document

Every product should have a living strategy document. Here's the structure:

```markdown
# [Product Name] — Product Strategy

## Vision
[One paragraph. Where we're going in 3-5 years. Paints a picture of the
future state for our customers.]

## Mission
[One sentence. Why we exist. What we do for whom.]

## Current State
- Active users: [number]
- Revenue: [number]
- Key strength: [what we do better than anyone]
- Key weakness: [what's holding us back]
- Market position: [leader / challenger / niche / new entrant]

## Target Market
- Primary: [specific segment — job title, company size, use case]
- Secondary: [adjacent segment we'll expand to next]
- Anti-persona: [who we are NOT building for — and why]

## Strategic Pillars (3-5)
For each pillar:
1. **[Pillar name]** — [one-line description]
   - Bet: [what we're investing in]
   - Metric: [how we'll measure success]
   - Time horizon: [when we expect results]

## What We Will NOT Do
[Equally important as what you will do. List 3-5 things you're
deliberately choosing not to pursue, with brief rationale.]

## Competitive Landscape
[Who else serves this market? How do we differentiate?
See Competitive Analysis section below.]

## Key Risks
[Top 3-5 risks. For each: likelihood, impact, mitigation.]
```

## Competitive Analysis

### Feature Matrix

FAIL — listing features without insight:
```markdown
| Feature | Us | Competitor A | Competitor B |
|---|---|---|---|
| Dark mode | ✅ | ✅ | ❌ |
| API | ✅ | ✅ | ✅ |
| Mobile app | ❌ | ✅ | ✅ |
```

PASS — capturing differentiation and customer impact:
```markdown
## Competitive Landscape

### How customers currently solve this problem
1. [Alternative A] — [what it does well] / [where it falls short]
2. [Alternative B] — [what it does well] / [where it falls short]
3. [Manual workaround] — [what people cobble together]

### Our differentiation
| Dimension | Us | Closest Alternative | Why It Matters |
|---|---|---|---|
| [Key dimension 1] | [Our approach] | [Their approach] | [Customer impact] |
| [Key dimension 2] | [Our approach] | [Their approach] | [Customer impact] |
| [Key dimension 3] | [Our approach] | [Their approach] | [Customer impact] |

### Where competitors are stronger
[Be honest. Knowing where you lose helps you position around it.]
- [Competitor A] is stronger at [X] — we mitigate with [Y]
- [Competitor B] has [X] — we deliberately don't pursue this because [reason]
```

### Landscape Map (2x2)

Choose axes that reveal YOUR advantage:

```
                    High ease-of-use
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         │   Commodity    │    ★ Us ★     │
         │   (low power,  │  (high power, │
         │    easy)       │   easy)       │
         │               │               │
Low ─────┼───────────────┼───────────────┼──── High
power    │               │               │    power
         │   Dead zone   │   Complex     │
         │   (low power,  │  (high power, │
         │    hard)       │   hard)       │
         │               │               │
         └───────────────┼───────────────┘
                         │
                    Low ease-of-use
```

Pick axes where you're in the top-right. If you can't find axes that put you there, you have a positioning problem — see [Positioning & Messaging](positioning-and-messaging.md).

## Gibson Biddle's DHM Model

Evaluate every major product decision against three criteria:

| Criterion | Question | Example |
|---|---|---|
| **Delight** | Does it meaningfully improve the customer experience? | Netflix's personalized thumbnails |
| **Hard-to-copy** | Does it create a moat? (Brand, network effects, data, technology, economies of scale) | Recommendation algorithm trained on billions of ratings |
| **Margin-enhancing** | Does it improve unit economics over time? | Better retention = lower CAC payback period |

A feature that delights but is trivially copyable is a temporary win. A feature that's hard to copy but doesn't delight is an invisible moat. The best bets hit all three.

## Strategic Moats for Software Products

| Moat Type | How It Works | Example |
|---|---|---|
| **Network effects** | Product gets better as more people use it | Slack (more coworkers = more useful) |
| **Data moat** | Product improves from usage data | Waze (more drivers = better traffic data) |
| **Switching costs** | Hard to leave once invested | Salesforce (years of CRM data, custom workflows) |
| **Brand** | Trust, recognition, preference | Stripe (developer brand = "just use Stripe") |
| **Economies of scale** | Cost advantage at volume | AWS (infrastructure costs decrease with scale) |
| **Ecosystem/platform** | Third parties build on top of you | Shopify (app store, themes, integrations) |

Most software products have 1-2 moats. If you have zero, you're competing on execution speed alone — not sustainable.

## Technology Adoption Lifecycle (Moore)

```
Innovators → Early Adopters → [CHASM] → Early Majority → Late Majority → Laggards
   2.5%          13.5%                      34%             34%            16%
```

**The Chasm** is between early adopters (who buy vision) and early majority (who buy proven solutions). Most startups die here.

Crossing strategy:
1. **Pick one beachhead segment** — not "SMBs" but "Series A SaaS companies with 10-50 engineers who use Next.js"
2. **Dominate that segment** with a whole product (your product + services + integrations they need)
3. **Get references within the segment** — early majority buys when peers have bought
4. **Expand to adjacent segments** — one at a time, not all at once

## Strategy Anti-Patterns

| Anti-Pattern | Signal | Fix |
|---|---|---|
| **Strategy by committee** | "Let's get everyone's input on the strategy" | Strategy is a leadership decision. Gather input, but one person decides (Cagan) |
| **Strategy = roadmap** | Your strategy doc is a feature list with dates | Strategy explains WHY. Roadmap explains WHAT/WHEN. They're different documents |
| **Boiling the ocean** | "We serve all businesses of all sizes in all industries" | Pick a beachhead. Win it. Expand from strength |
| **Copycat strategy** | "Competitor X launched Y, so we need Y" | Competitor moves inform, they don't dictate. Does Y serve YOUR target customer's job? |
| **Strategy without trade-offs** | Every initiative is "high priority" | A strategy without "what we won't do" isn't a strategy — it's a wish list |
