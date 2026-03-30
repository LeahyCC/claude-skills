# Templates

Production-ready templates for the most common PM and PMM artifacts. Copy, fill in the brackets, remove what doesn't apply. Every template cites the framework it's built on.

## PRD (Product Requirements Document)

> Framework: Notion-style lightweight PRD (industry standard, 2024-2026)

```markdown
# PRD: [Feature/Initiative Name]

## Overview
**One-paragraph summary**: What we're building, why, and for whom.

**Owner**: [PM name]
**Status**: Draft / In Review / Approved / In Progress / Shipped
**Target date**: [Quarter or specific date]
**OKR alignment**: [Which OKR does this serve?]

## Problem Statement
[What problem are we solving? Who has this problem? How do we know?
Link to research: interview notes, support tickets, data analysis.]

## Target User
[Which persona? What's their job-to-be-done?]
- Primary: [persona or segment]
- Secondary: [if applicable]

## Success Metrics
| Metric | Baseline | Target | How We'll Measure |
|---|---|---|---|
| [Primary metric] | [Current value] | [Target value] | [Analytics tool/method] |
| [Secondary metric] | [Current value] | [Target value] | [Analytics tool/method] |

## Solution
[High-level description of what we're building. NOT implementation details —
that's for the engineering design doc / RFC.]

### User Stories
1. As a [persona], I want to [action] so that [outcome].
   - AC: Given [context], when [action], then [result]
   - AC: Given [context], when [action], then [result]

2. As a [persona], I want to [action] so that [outcome].
   - AC: Given [context], when [action], then [result]

### User Flow
[Link to Figma, or describe the key screens/states:
Start → Step 1 → Step 2 → Success state / Error state]

## Scope
### In scope
- [Specific thing 1]
- [Specific thing 2]

### Out of scope (for this iteration)
- [Thing we're not doing and why]
- [Thing we're deferring to next iteration]

### Future consideration
- [Possible follow-up work]

## Non-Functional Requirements
- Performance: [e.g., page loads in <2s]
- Security: [e.g., auth required, input validation]
- Accessibility: [e.g., WCAG 2.2 AA compliance]
- Scalability: [e.g., must support X concurrent users]

## Dependencies
- [External team or service this depends on]
- [Third-party integration needed]

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| [Risk 1] | [H/M/L] | [H/M/L] | [What we'll do] |
| [Risk 2] | [H/M/L] | [H/M/L] | [What we'll do] |

## Open Questions
- [ ] [Question 1] — Owner: [name], Due: [date]
- [ ] [Question 2] — Owner: [name], Due: [date]

## Design
[Link to Figma designs or embed screenshots]

## Technical Design
[Link to engineering RFC/design doc, or note that it's pending]

## Launch Plan
[Link to launch plan, or brief summary: tier 1/2/3, key activities]
```

## Product Brief (One-Pager)

> For pitching an initiative to leadership or getting quick alignment

```markdown
# Product Brief: [Name]

## Problem
[1-2 sentences. What's broken and for whom?]

## Proposed Solution
[1 paragraph. What will we build?]

## Target User
[One persona. One sentence.]

## Success Metric
[One primary KPI. Current → Target.]

## Effort Estimate
[T-shirt size: S/M/L/XL — with rough person-weeks]

## Key Risks
1. [Risk 1 — and mitigation]
2. [Risk 2 — and mitigation]

## Recommendation
[Go / No-go / Needs more research. One sentence.]
```

## Amazon PR/FAQ (Working Backwards)

> Framework: Amazon "Working Backwards" process. Write the press release before building.

```markdown
# [Company Name] Announces [Product Name] to Help [Target Customer] [Achieve Outcome]

**[City, Date]** — [Company] today announced [Product Name], a [category]
that enables [target customer] to [key benefit].

## The Problem
[2-3 sentences. The customer's pain point in their language.]

## The Solution
[2-3 sentences. How the product solves it. Focus on customer outcome, not
technical implementation.]

## Quote from Leadership
> "[Vision statement. Why now. How this fits the company's mission.]"
> — [Name], [Title] at [Company]

## How It Works
1. [Step 1 — simple, user-facing]
2. [Step 2]
3. [Step 3 — the outcome]

## Quote from Early Customer
> "[Impact statement. What changed for them.]"
> — [Name], [Role] at [Company]

## Getting Started
[One sentence. Where to go, what to do first.]
[URL]

---

## FAQ — External (Customer-Facing)

**Q: What does [Product] do?**
A: [One sentence.]

**Q: Who is this for?**
A: [Target segment. Be specific.]

**Q: How much does it cost?**
A: [Pricing or "free" or "contact us".]

**Q: How is this different from [competitor/alternative]?**
A: [Positioning statement — the key differentiator.]

## FAQ — Internal

**Q: What's the estimated development cost?**
A: [Person-months and dollar estimate.]

**Q: What are the key risks?**
A: [Top 3 risks with mitigation.]

**Q: How will we measure success?**
A: [Primary metric, baseline, target, timeline.]

**Q: What's the go-to-market plan?**
A: [Brief GTM: PLG/SLG, channels, launch tier.]
```

## Positioning Document

> Framework: April Dunford, "Obviously Awesome"

```markdown
# Positioning: [Product Name]

## Date: [Last updated]

## 1. Competitive Alternatives
What would customers do if we didn't exist?
- [Alternative 1]: [description]
- [Alternative 2]: [description]
- [Alternative 3]: [description — include "do nothing" or manual workaround]

## 2. Unique Attributes
What do we have that alternatives don't?
- [Attribute 1]: [concrete capability]
- [Attribute 2]: [concrete capability]
- [Attribute 3]: [concrete capability]

## 3. Value
What do those attributes enable?
| Attribute | Value (customer benefit) |
|---|---|
| [Attribute 1] | [What it enables for the customer] |
| [Attribute 2] | [What it enables for the customer] |
| [Attribute 3] | [What it enables for the customer] |

## 4. Target Customer Segments
Who cares most about this value?
- **Primary**: [Specific segment — role, company type, size, context]
- **Why urgent**: [What trigger makes them need this NOW?]
- **Anti-persona**: [Who we're NOT targeting and why]

## 5. Market Category
What context makes our value obvious?
- **Category**: [The market category we're claiming]
- **Why this category**: [What expectations it sets]
- **Alternative categories considered**: [and why we rejected them]

## Positioning Statement
For [target customer] who [need/problem],
[product] is a [market category] that [key benefit].
Unlike [competitive alternative], we [primary differentiator].

## Messaging Implications
- **Tagline**: [3-8 words]
- **Value prop**: [1-2 sentences]
- **Elevator pitch**: [30-second version]
```

## Battle Card

> Framework: Klue competitive intelligence structure

```markdown
# Battle Card: [Competitor Name]

**Last Updated**: [Date]
**Confidence**: [High/Medium/Low — based on data recency]

## Quick Overview
| | |
|---|---|
| What they do | [1 sentence] |
| Target market | [Who they sell to] |
| Pricing | [Model + range] |
| Funding/Size | [If relevant] |

## Where We Win
1. **[Advantage]**: [Talk track — exact words to say]
2. **[Advantage]**: [Talk track]
3. **[Advantage]**: [Talk track]

## Where They Win
1. **[Their strength]**: Counter: [How to reframe]
2. **[Their strength]**: Counter: [How to reframe]

## Trap-Setting Questions
- "How important is [thing they lack] to your workflow?"
- "Have you tested how [competitor] handles [thing they do poorly]?"
- "What happens when you need [capability we have, they don't]?"

## Common Objections
| Objection | Response |
|---|---|
| "But they have [feature]" | "[Acknowledge]. The key difference is [reframe]..." |
| "They're cheaper" | "What's the total cost including [hidden costs]?" |
| "[Competitor] is the market leader" | "For [their segment], yes. For [your use case], we're purpose-built." |

## Win/Loss Patterns
- **We win when**: [Pattern from actual conversations/deals]
- **We lose when**: [Pattern]
- **Key differentiator in wins**: [What tipped the decision]
```

## OKR Document

> Framework: Doerr + Wodtke

```markdown
# OKRs — [Team Name] — [Quarter Year]

## Objective 1: [Qualitative, inspiring goal]
Confidence: [0.3-0.7 at start of quarter]

| Key Result | Baseline | Target | Current | Status |
|---|---|---|---|---|
| [KR1: measurable outcome] | [Number] | [Number] | [Number] | 🟡 |
| [KR2: measurable outcome] | [Number] | [Number] | [Number] | 🟢 |
| [KR3: measurable outcome] | [Number] | [Number] | [Number] | 🔴 |

### Initiatives
- [Initiative feeding KR1]
- [Initiative feeding KR2]
- [Initiative feeding KR3]

---

## Objective 2: [Qualitative, inspiring goal]
[Same structure as above]

---

## What We're NOT Doing This Quarter
- [Thing 1] — Reason: [why not now]
- [Thing 2] — Reason: [why not now]
```

## Customer Interview Summary

```markdown
# Interview: [Participant Name/ID] — [Date]

## Participant
- Role: [Job title]
- Company: [Type, size, industry]
- Context: [Why they qualified for this interview]

## Key Quotes
> "[Direct quote — strongest insight]"

> "[Direct quote — pain point or desire]"

## JTBD Identified
When [situation/trigger],
they want to [job/progress],
so they can [desired outcome].

## Current Workflow
1. [Step 1 — what they do today]
2. [Step 2]
3. [Step 3]

Pain points: [Where it breaks down]

## Opportunities (for Opportunity Solution Tree)
- [Opportunity 1: unmet need or pain point]
- [Opportunity 2]

## Surprises / Non-Obvious Insights
- [Something unexpected that challenges our assumptions]

## Follow-Up
- [ ] [Action item from this interview]
```

## Product Roadmap (Now/Next/Later)

```markdown
# Product Roadmap — [Quarter/Period]

Last updated: [Date]

## Now — [Theme]
*Committed. In progress or about to start.*

| Initiative | Problem | Metric | Status |
|---|---|---|---|
| [Name] | [What problem it solves] | [Metric it moves] | 🟢 On track |
| [Name] | [What problem it solves] | [Metric it moves] | 🟡 At risk |

## Next — [Theme]
*High confidence. Scoped but not started.*

| Initiative | Problem | Why Next |
|---|---|---|
| [Name] | [Problem] | [Evidence it should come next] |
| [Name] | [Problem] | [Evidence] |

## Later — [Theme]
*Exploratory. Direction, not commitment.*

| Direction | Opportunity | Open Questions |
|---|---|---|
| [Name] | [What we'd learn/gain] | [What we need to figure out first] |
| [Name] | [What we'd learn/gain] | [What we need to figure out first] |

## Not Doing
| Request | Why Not (This Period) |
|---|---|
| [Request] | [Rationale] |
| [Request] | [Rationale] |
```

## Experiment Log

```markdown
# Experiment Log — [Quarter]

| # | Name | Hypothesis | Method | Metric | Result | Decision |
|---|---|---|---|---|---|---|
| 1 | [Name] | [If we X, then Y] | [A/B, prototype, survey] | [Metric: baseline→target] | [Actual result] | ✅ Ship / 🔄 Iterate / ❌ Kill |
| 2 | [Name] | [If we X, then Y] | [Method] | [Metric] | [Result] | [Decision] |
```
