---
name: product-marketing
description: Product management and marketing strategy — positioning, discovery, go-to-market, prioritization, metrics, copywriting, and artifact generation. Verified against Cagan (SVPG), Dunford, Torres, Reforge, JTBD, and OWASP-grade rigor applied to PM/PMM decisions.
metadata:
  filePattern:
    - "src/app/**/page.tsx"
    - "app/**/page.tsx"
    - "src/app/**/layout.tsx"
    - "app/**/layout.tsx"
    - "src/app/pricing/**"
    - "app/pricing/**"
    - "src/app/blog/**"
    - "app/blog/**"
    - "src/content/**/*.ts"
    - "src/content/**/*.md"
    - "content/**/*.md"
    - "docs/**/*.md"
    - "src/app/(marketing)/**"
    - "app/(marketing)/**"
    - "src/app/(landing)/**"
    - "app/(landing)/**"
  bashPattern: []
  priority: 40
---

# Product & Marketing — Strategy Through Execution

Frameworks and production patterns for product management and product marketing. Every recommendation cites its source — no opinions disguised as best practice.

**This skill works in two modes:**
- **Builder** — you're shipping a product and need to figure out positioning, pricing, launch, and growth
- **Operator** — you're running a product org and need discovery, prioritization, roadmapping, and metrics

## Architecture Overview

```
[Strategy]
    ├── Vision & mission (where we're going)
    ├── Competitive landscape (who else, what's different)
    ├── Strategic pillars (3-5 focus areas)
    └── What we will NOT do
              ↓
[Discovery]
    ├── Customer interviews (weekly cadence)
    ├── JTBD analysis (functional, emotional, social jobs)
    ├── Opportunity Solution Trees (outcomes → opportunities → solutions)
    └── Assumption mapping → experiment design
              ↓
[Positioning & Messaging]
    ├── Dunford 5-component positioning
    ├── Messaging hierarchy (tagline → value prop → pillars → proof)
    ├── Strategic narrative (Raskin structure)
    └── Per-persona variations
              ↓
[Prioritization & Roadmap]
    ├── RICE / ICE / WSJF scoring
    ├── Now / Next / Later roadmap
    ├── OKRs (quarterly outcomes)
    └── Saying no (with a framework)
              ↓
[Go-to-Market]
    ├── GTM motion (PLG vs Sales-Led vs Community-Led)
    ├── Pricing strategy (Van Westendorp, anchoring, tiers)
    ├── Launch plan (tiered: major / feature / minor)
    └── Channel selection (Bullseye method)
              ↓
[Marketing Copy]
    ├── Landing pages (PAS / AIDA / BAB frameworks)
    ├── Pricing pages (tier structure, anchoring)
    ├── Email sequences (onboarding, launch, nurture)
    └── Case studies, changelogs, announcements
              ↓
[Metrics & Feedback Loop]
    ├── North Star + input metrics
    ├── AARRR funnel (Acquisition → Activation → Retention → Revenue → Referral)
    ├── Unit economics (CAC, LTV, payback)
    └── Experiment results → feed back into Discovery
```

## Quick Reference

| Need to... | See |
|---|---|
| Define product vision and strategy | [Strategy](resources/strategy.md) |
| Run customer interviews, map opportunities | [Discovery](resources/discovery.md) |
| Position your product against competitors | [Positioning & Messaging](resources/positioning-and-messaging.md) |
| Plan pricing, launch, and GTM motion | [Go-to-Market](resources/go-to-market.md) |
| Decide what to build next, manage roadmap | [Prioritization & Roadmap](resources/prioritization-and-roadmap.md) |
| Choose metrics, set OKRs, measure growth | [Metrics & Analytics](resources/metrics-and-analytics.md) |
| Write landing pages, emails, case studies | [Marketing Copy](resources/marketing-copy.md) |
| Generate PRDs, briefs, battle cards | [Templates](resources/templates.md) |

## Decision Matrix: "What Do I Do First?"

### By stage

| Stage | First Priority | Second Priority | Skip For Now |
|---|---|---|---|
| **Idea stage** | Discovery (interviews, JTBD) | Strategy (vision, landscape) | Metrics, Launch |
| **Pre-launch** | Positioning, Messaging | Pricing, Landing page copy | Roadmap, OKRs |
| **Launch** | GTM plan, Launch copy | Metrics setup, Activation | Long-term roadmap |
| **Growing** | Metrics (North Star, retention) | Prioritization, OKRs | Re-positioning (unless stalled) |
| **Scaling** | Strategy (pillars, what not to do) | Roadmap, Team OKRs | Discovery basics (should be habitual) |

### By question

| Question | Framework | Resource |
|---|---|---|
| "Who is this for?" | User personas + JTBD | [Discovery](resources/discovery.md) |
| "Why would they pick us?" | Dunford positioning | [Positioning](resources/positioning-and-messaging.md) |
| "What should we build next?" | RICE + Opportunity Solution Tree | [Prioritization](resources/prioritization-and-roadmap.md) |
| "How do we price this?" | Van Westendorp + competitive anchoring | [Go-to-Market](resources/go-to-market.md) |
| "How do we know it's working?" | North Star + AARRR | [Metrics](resources/metrics-and-analytics.md) |
| "What should the landing page say?" | PAS framework + messaging hierarchy | [Marketing Copy](resources/marketing-copy.md) |
| "How do we launch?" | Tiered launch plan | [Go-to-Market](resources/go-to-market.md) |
| "Should I write a PRD?" | Yes — use lightweight Notion-style format | [Templates](resources/templates.md) |

## The #1 Mistake: Building Before Positioning

Most builders skip positioning and go straight to "what features should we build?" This is backwards. If you can't complete this sentence, you don't have positioning:

> For **[target customer]** who **[key need/problem]**, **[product name]** is a **[market category]** that **[key benefit]**. Unlike **[competitive alternative]**, we **[primary differentiator]**.

If that sentence feels forced or generic, start with [Positioning & Messaging](resources/positioning-and-messaging.md) before anything else.

## Common Anti-Patterns

| Anti-Pattern | Why It Fails | What To Do Instead |
|---|---|---|
| "We're for everyone" | No positioning = no differentiation. You compete on price alone | Pick a beachhead segment. Dominate it. Expand later (Moore, "Crossing the Chasm") |
| Feature roadmap shared publicly | Commits you to outputs, not outcomes. Competitors copy. Customers wait instead of buying | Now/Next/Later roadmap with themes, not features |
| Pricing based on costs | Ignores willingness-to-pay. Leaves money on the table | Value-based pricing. Start with Van Westendorp research |
| "We'll launch when it's ready" | Perfectionism kills momentum. You learn nothing without users | Ship to a small cohort. Iterate. Launch is marketing, not engineering |
| Measuring everything | Dashboard with 50 metrics = no focus. Teams optimize for their own metric, not the product | One North Star + 3-5 input metrics. That's it |
| Copying competitor pricing | Their costs, market, and positioning are different from yours | Price based on YOUR value proposition to YOUR target segment |
| Annual roadmap with specific features | World changes quarterly. Roadmap becomes fiction | Quarterly OKRs + Now/Next/Later. Commit to outcomes, not outputs |

## Verified Against

This skill synthesizes frameworks from authoritative, primary sources:

| Source | What We Cite | Publication |
|---|---|---|
| Marty Cagan / SVPG | Product operating model, empowered teams, product strategy | "Transformed" (2024), "Empowered" (2020), "Inspired" (2018) |
| April Dunford | 5-component positioning, sales pitch structure | "Obviously Awesome" (2019), "Sales Pitch" (2023) |
| Teresa Torres | Continuous discovery, Opportunity Solution Trees, assumption mapping | "Continuous Discovery Habits" (2021) |
| Clayton Christensen | Jobs-to-be-Done theory | "Competing Against Luck" (2016) |
| Tony Ulwick | Outcome-Driven Innovation (quantitative JTBD) | "Jobs to be Done" (2016) |
| Reforge | Growth loops, Four Fits, retention analysis | Courses and essays (2018–2026) |
| Andy Raskin | Strategic narrative structure | "Greatest Sales Deck" (2016, updated through 2024) |
| Emily Kramer / MKT1 | Startup marketing architecture, messaging hierarchy | MKT1 Newsletter (2021–2026) |
| Geoffrey Moore | Technology adoption lifecycle, chasm crossing | "Crossing the Chasm" (3rd ed, 2014) |
| John Doerr / Christina Wodtke | OKRs | "Measure What Matters" (2018), "Radical Focus" (2nd ed, 2021) |
| Intercom | RICE prioritization | Intercom blog (2018) |
| Amplitude | North Star framework | "North Star Playbook" (2019) |
| Dave McClure | AARRR / Pirate Metrics | "Startup Metrics for Pirates" (2007) |
| Ryan Singer | Shape Up (appetite-based development) | "Shape Up" (2019) |
| Gabriel Weinberg | Traction channels, Bullseye framework | "Traction" (2015) |
| David Skok | SaaS unit economics | ForEntrepreneurs blog (2010–2026) |
| Patrick Campbell | SaaS pricing strategy | ProfitWell / Paddle content archive |
| Donald Miller | StoryBrand narrative framework | "Building a StoryBrand" (2017) |

Last verified: March 2026
