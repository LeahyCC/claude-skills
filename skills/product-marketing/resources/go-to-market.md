# Go-to-Market

> Sources: Wes Bush ("Product-Led Growth"), Kyle Poyar / OpenView (PLG benchmarks), Gabriel Weinberg ("Traction"), Geoffrey Moore ("Crossing the Chasm"), Patrick Campbell / ProfitWell (SaaS pricing), Emily Kramer / MKT1 (startup GTM), Lenny Rachitsky (launch benchmarks)

Go-to-market is how you get your product into customers' hands. The three decisions: GTM motion (how you sell), pricing (what you charge), and launch plan (how you announce).

## GTM Motions

### Choosing Your Motion

| Motion | Best For | Revenue Model | Key Metric | Team Needed |
|---|---|---|---|---|
| **Product-Led Growth (PLG)** | Self-serve products, developers, SMBs | Freemium / free trial → paid | Activation rate, PQL conversion | Product + growth eng |
| **Sales-Led (SLG)** | Enterprise, complex products, high ACV | Demo → pilot → contract | Pipeline, ACV, win rate | Sales, SE, CSM |
| **Community-Led (CLG)** | Dev tools, open source, creator tools | Community → adoption → enterprise | Community engagement, OSS → paid | DevRel, community mgr |
| **Product-Led Sales (hybrid)** | PLG products expanding to enterprise | Free → self-serve paid → sales-assisted | PQL → SQL conversion | Product + sales |

### Decision Matrix

| Signal | Recommended Motion |
|---|---|
| Users can get value in <5 minutes without help | PLG |
| Product requires configuration, training, or integration | SLG |
| Target audience gathers in communities (Discord, GitHub, Reddit) | CLG |
| ACV < $1k/year | PLG (sales can't justify CAC) |
| ACV > $25k/year | SLG (relationship selling justifies CAC) |
| ACV $1k-$25k | PLG → Product-Led Sales hybrid |

### PLG Fundamentals

The PLG engine:

```
Free entry point (trial / freemium / open source)
    ↓
Activation (user reaches "aha moment" — first value)
    ↓
Habit formation (repeated use, integrated into workflow)
    ↓
Expansion (more users, more usage, upgrade trigger)
    ↓
Conversion (free → paid, triggered by limit or team need)
```

Key PLG metrics:
| Metric | Good | Great | Source |
|---|---|---|---|
| Free → paid conversion (freemium) | 2-5% | 5-10% | OpenView 2025 |
| Trial → paid conversion (free trial) | 10-20% | 25%+ | OpenView 2025 |
| Time to activation | < 1 day | < 1 hour | Wes Bush |
| Net revenue retention | 100-110% | 120%+ | OpenView 2025 |

### PLG Anti-Patterns

| Anti-Pattern | Why It Fails | Fix |
|---|---|---|
| Free tier too generous | No conversion pressure. Users never hit limits | Make the free tier valuable but limited (e.g., usage caps, team limits, not feature removal) |
| Free tier too restrictive | Users can't experience value before paying | Give enough to reach the "aha moment" for free |
| No upgrade trigger | Users don't know when or why to pay | Clear usage-based limits with in-app prompts when approaching |
| Self-serve only at scale | Enterprise buyers need procurement, security, SSO | Add sales assist for accounts above $X ARR |

## Pricing Strategy

### Pricing Principles

| Principle | Why | Source |
|---|---|---|
| **Price on value, not cost** | Your costs are irrelevant to the customer. Their willingness-to-pay is based on the value they receive | Campbell / ProfitWell |
| **Pricing is a process, not a one-time decision** | Review pricing every 6 months. Most companies underprice at launch | Campbell |
| **Three tiers is the default** | Anchoring effect: middle tier looks reasonable next to expensive tier | Behavioral economics |
| **Annual discount = cash flow** | 10-20% discount for annual is standard. Improves cash flow and retention | SaaS standard |
| **Price to the value metric** | Charge based on what scales with customer value (users, usage, features) | OpenView |

### Value Metric Selection

| Value Metric | Good For | Example |
|---|---|---|
| **Per seat / per user** | Collaboration tools, team products | Slack, Figma, Linear |
| **Per usage** | API products, infrastructure, AI | Vercel, OpenAI, Twilio |
| **Per feature tier** | Products with distinct use cases by segment | GitHub (Free/Team/Enterprise) |
| **Per resource** | Storage, compute, data products | AWS, Cloudinary |
| **Flat rate** | Simple products, content, early-stage | Basecamp, most SaaS MVPs |

FAIL — charging per feature you find important:
```
Free: 5 projects
Pro ($10/mo): 50 projects
Enterprise ($50/mo): Unlimited projects

Problem: Nobody needs 50 projects. The value metric is wrong.
```

PASS — charging on what correlates with value:
```
Free: 3 team members
Pro ($10/user/mo): Unlimited members + advanced features
Enterprise (custom): SSO, audit log, dedicated support

Why: More team members = more value from the product.
```

### Van Westendorp Price Sensitivity

Ask these four questions to a sample of target customers:

1. **Too cheap**: "At what price would you consider this too cheap and question the quality?"
2. **Cheap/bargain**: "At what price would you consider this a bargain — great value for money?"
3. **Expensive**: "At what price would you consider this getting expensive but still worth considering?"
4. **Too expensive**: "At what price would you consider this too expensive to consider?"

Plot the four curves. The intersections give you:
- **Point of marginal cheapness**: lower bound of acceptable range
- **Point of marginal expensiveness**: upper bound
- **Optimal price point**: highest conversion point
- **Indifference price point**: equal bargain/expensive perception

### Pricing Page Structure

```
[Headline — clear value prop, not "Pricing"]
[Subheadline — who it's for or key reassurance]

[Toggle: Monthly / Annual (save X%)]

┌─────────────────┬──────────────────┬─────────────────┐
│     Starter      │    ★ Pro ★       │   Enterprise    │
│                  │   MOST POPULAR   │                 │
│  Free / $X/mo   │    $XX/mo        │   Contact us    │
│                  │                  │                 │
│  For individuals │  For teams       │  For orgs       │
│                  │                  │                 │
│  • Feature A     │  Everything in   │  Everything in  │
│  • Feature B     │  Starter, plus:  │  Pro, plus:     │
│  • Feature C     │  • Feature D     │  • SSO/SAML     │
│  • Usage limit   │  • Feature E     │  • Audit log    │
│                  │  • Higher limits │  • SLA           │
│                  │                  │  • Dedicated CSM │
│                  │                  │                 │
│  [Get started]   │  [Start trial]   │  [Contact sales]│
└─────────────────┴──────────────────┴─────────────────┘

[Feature comparison table — expandable]
[FAQ section — address pricing objections]
[Social proof — logos, testimonial, customer count]
```

## Launch Planning

### Launch Tiers

Not every release needs a press campaign. Match effort to impact:

| Tier | What Changed | Activities | Example |
|---|---|---|---|
| **Tier 1: Major** | New product, major rebrand, pivotal feature | Blog + email + social + press + Product Hunt + event + sales enablement | "We're launching v2.0 with a new pricing model" |
| **Tier 2: Feature** | Significant new capability | Blog + email + in-app announcement + social + changelog | "New: team collaboration features" |
| **Tier 3: Update** | Improvement, fix, minor feature | Changelog + in-app tooltip + social post | "Improved: 2x faster search" |

### Tier 1 Launch Plan Template

```markdown
# Launch Plan: [Product/Feature Name]

## Goals
- Primary: [e.g., 500 sign-ups in first week]
- Secondary: [e.g., 3 press mentions, 100 Product Hunt upvotes]

## Timeline
- T-4 weeks: Positioning and messaging finalized
- T-3 weeks: Landing page, blog post, email draft
- T-2 weeks: Sales/CS briefed, battle cards updated
- T-1 week: Beta feedback incorporated, social content queued
- Launch day: Blog live, email sent, social posted, PH live
- T+1 week: Performance review, sales feedback
- T+2 weeks: Iteration on messaging based on data

## Assets Needed
- [ ] Landing page (hero + features + pricing + CTA)
- [ ] Blog post (announcement, 800-1200 words)
- [ ] Email (to existing users/subscribers)
- [ ] Social posts (Twitter/X, LinkedIn, platform-specific)
- [ ] Changelog entry
- [ ] Demo video / GIF (60-90 seconds)
- [ ] Product Hunt listing (if applicable)
- [ ] Sales one-pager / battle card update
- [ ] Internal FAQ (for support team)

## Rollback Plan
If [failure condition], we will [action].
```

### Product Hunt Launch

Key factors (current as of 2025-2026):
- **Launch between 00:01-00:15 Pacific** — the earlier, the more accumulation time
- **Build audience before launch** — have people ready to upvote and comment genuinely
- **Maker comment** — post a thoughtful first comment explaining what you built and why
- **Respond to every comment** — engagement signals matter
- **Don't ask for upvotes** — PH penalizes coordinated voting
- **Expectation setting**: PH is one channel. A top-5 finish drives ~500-2000 visits. It's a credibility signal, not a growth engine

## Channel Selection (Bullseye Framework)

From "Traction" by Gabriel Weinberg — find your one channel that works, not spread thin across all:

### Step 1: Brainstorm (all possible channels)

| Channel | Potential for Your Product |
|---|---|
| SEO / Content marketing | |
| Social media (organic) | |
| Social media (paid) | |
| Community / Forums | |
| Email marketing | |
| Partnerships / Integrations | |
| Developer relations / DevRel | |
| Direct sales / Outbound | |
| Referral program | |
| Product Hunt / Launch platforms | |
| Conference talks / Events | |
| PR / Press | |
| Influencer / Creator partnerships | |
| Programmatic / Marketplace SEO | |
| Open source / Community-led | |

### Step 2: Test (pick top 3, run cheap experiments)

For each channel, run a 2-week test:
- **Budget**: $500-1000 or 20 hours of time
- **Metric**: CAC estimate and volume potential
- **Decision**: Channel is promising / not promising / needs more data

### Step 3: Focus (double down on #1)

The #1 mistake in marketing is doing 10 channels at 10% effort each. Find the one that works and invest 80% of effort there. Add channels only after the first one is predictable.

### Channel-Product Fit

| Product Type | High-probability Channels |
|---|---|
| Developer tools | Content (technical blog), Community (GitHub/Discord), DevRel |
| B2B SaaS (SMB) | Content marketing, SEO, social (LinkedIn), product-led |
| B2B SaaS (Enterprise) | Direct sales, events, partnerships, content |
| Consumer app | Social (paid + organic), influencer, referral, ASO |
| Marketplace | Supply-side outreach, demand-side SEO, community |
| Open source | GitHub, community, DevRel, conference talks |

## Battle Cards

### Template

```markdown
# Battle Card: [Competitor Name]

## Quick Overview
- What they do: [1 sentence]
- Target market: [who they sell to]
- Pricing: [model and approximate range]
- Strengths: [2-3 bullet points]
- Weaknesses: [2-3 bullet points]

## Where We Win
- [Advantage 1]: [Talk track — what to say to the customer]
- [Advantage 2]: [Talk track]
- [Advantage 3]: [Talk track]

## Where They Win
- [Their advantage 1]: [How to counter — reframe, not deny]
- [Their advantage 2]: [How to counter]

## Trap-Setting Questions
Questions that expose their weaknesses without mentioning them directly:
- "How important is [thing they lack] to your team?"
- "Have you evaluated how [competitor] handles [thing they do poorly]?"

## Common Objections
- "But [competitor] has [feature]"
  Response: "[Acknowledge]. The difference is [reframe to your value]..."
- "[Competitor] is cheaper"
  Response: "What's the total cost including [hidden costs they have]?"

## Win/Loss Patterns
- We win when: [pattern from actual deals]
- We lose when: [pattern from actual deals]

## Last Updated: [Date]
```
