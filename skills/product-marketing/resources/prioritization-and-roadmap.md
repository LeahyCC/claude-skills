# Prioritization & Roadmap

> Sources: Intercom (RICE), Sean Ellis (ICE), Don Reinertsen / SAFe (WSJF), John Doerr ("Measure What Matters"), Christina Wodtke ("Radical Focus"), Ryan Singer ("Shape Up"), Marty Cagan / SVPG

Prioritization is the most contentious part of product management. Every stakeholder thinks their request is the most important. Frameworks don't eliminate politics, but they make the reasoning visible and debatable.

## The Prioritization Ladder

Use frameworks appropriate to your context:

| Context | Framework | When |
|---|---|---|
| Quick triage, small team | **ICE** | Brainstorms, weekly planning |
| Cross-functional alignment, medium team | **RICE** | Quarterly planning, feature comparison |
| Enterprise, SAFe environment | **WSJF** | Program Increment planning |
| New initiative validation | **Assumption mapping** | Before committing resources |
| Workshop, visual alignment | **Value vs. Effort 2x2** | Team workshops, quick alignment |
| Release scoping | **MoSCoW** | Sprint/release planning |
| User delight analysis | **Kano** | Feature categorization |

## RICE Scoring

| Component | Definition | Scale |
|---|---|---|
| **R**each | How many users will this impact per quarter? | Actual number (100, 1000, 10000) |
| **I**mpact | How much will it impact each user? | 3 = massive, 2 = high, 1 = medium, 0.5 = low, 0.25 = minimal |
| **C**onfidence | How sure are you about R, I, and E estimates? | 100% = high, 80% = medium, 50% = low |
| **E**ffort | How many person-months? | Actual number (0.5, 1, 2, 5) |

**Score = (Reach × Impact × Confidence) / Effort**

### Example

| Feature | Reach | Impact | Confidence | Effort | Score |
|---|---|---|---|---|---|
| Onboarding tour | 5000 | 2 | 80% | 2 | 4000 |
| Dark mode | 3000 | 0.5 | 100% | 1 | 1500 |
| Team permissions | 500 | 3 | 50% | 3 | 250 |
| Search improvements | 4000 | 1 | 80% | 1.5 | 2133 |

Decision: Onboarding tour > Search > Dark mode > Permissions

### When RICE Fails

| Problem | Fix |
|---|---|
| Everyone gives Impact = 3 | Calibrate: force-rank the top 5 items, then assign scores relatively |
| Reach estimates are wild guesses | Use data: analytics for existing features, survey data for new ones |
| Effort estimates are optimistic | Add 50% buffer, or use T-shirt sizes mapped to person-months |
| Confidence is always "80%" | Force the question: "What evidence do we have?" — interviews, data, prototype tests, or just intuition? |

## ICE Scoring

Simpler than RICE. Use for rapid prioritization:

| Component | Scale |
|---|---|
| **I**mpact | 1-10 (how much will this move the metric?) |
| **C**onfidence | 1-10 (how sure are we?) |
| **E**ase | 1-10 (how easy is this to build?) |

**Score = Impact × Confidence × Ease**

Best for: growth experiments, brainstorming sessions, quick sorting.

## WSJF (Weighted Shortest Job First)

From Don Reinertsen / SAFe. The most theoretically rigorous framework — based on cost of delay economics.

**WSJF = Cost of Delay / Job Duration**

Cost of Delay = User Value + Time Criticality + Risk Reduction

| Component | Question | Scale |
|---|---|---|
| User Value | How much do users/customers need this? | 1, 2, 3, 5, 8, 13, 20 (Fibonacci) |
| Time Criticality | Is there a deadline or will value decay? | Same scale |
| Risk Reduction | Does this reduce business/technical risk? | Same scale |
| Job Duration | How long will this take? | Same scale |

Use relative sizing (compare items to each other), not absolute estimates.

## MoSCoW

For release scoping — deciding what's in vs. out:

| Priority | Meaning | Rule |
|---|---|---|
| **Must** | Release fails without this | Non-negotiable. If you can't deliver all Musts, rescope the release |
| **Should** | Important but workaround exists | Include if capacity allows. Painful to defer |
| **Could** | Nice to have | Include only if zero risk to Musts and Shoulds |
| **Won't** | Agreed to not do this time | Explicitly listed to prevent scope creep. May come later |

Rule: Must-haves should be <60% of capacity. If Musts consume 100%, you have no slack and will miss the deadline.

## Kano Model

Categorize features by customer reaction:

| Category | No Feature | Basic Feature | Excellent Feature | Example |
|---|---|---|---|---|
| **Basic** (must-be) | Angry | Neutral | Neutral | Login works, pages load |
| **Performance** (linear) | Dissatisfied | Satisfied | Very satisfied | Speed, coverage, accuracy |
| **Delight** (attractive) | Neutral | Neutral | Thrilled | Unexpected helpful feature |

Strategy: Cover ALL basics first. Then invest in performance features. Add delight features sparingly for differentiation.

## Roadmap Formats

### Now / Next / Later (Recommended Default)

```markdown
# Product Roadmap — Q2 2026

## Now (This Quarter — Committed)
Theme: Activation & onboarding

- [Initiative 1]: [Problem it solves] → [Metric we'll move]
- [Initiative 2]: [Problem it solves] → [Metric we'll move]
- [Initiative 3]: [Problem it solves] → [Metric we'll move]

## Next (Next Quarter — High Confidence)
Theme: Expansion & team features

- [Initiative 4]: [Problem it solves]
- [Initiative 5]: [Problem it solves]

## Later (Future — Exploratory)
Theme: Platform & ecosystem

- [Direction 1]: [Opportunity we're exploring]
- [Direction 2]: [Opportunity we're exploring]
```

Why this format:
- Communicates **commitment levels** — stakeholders know "Later" doesn't mean "promised"
- Organized by **themes/outcomes**, not features — harder to nitpick implementation
- No dates for Next/Later — prevents false precision

### Outcome-Based Roadmap

```markdown
# Outcome Roadmap — 2026

## Outcome 1: Increase 30-day retention from 40% to 55%
Current: 40% | Target: 55% | Owner: [team]

Bets:
- [Bet A]: Interactive onboarding → reduce time-to-first-value
- [Bet B]: Weekly digest email → re-engagement

## Outcome 2: Grow to $500k ARR
Current: $200k | Target: $500k | Owner: [team]

Bets:
- [Bet C]: Team/enterprise tier → increase ACV
- [Bet D]: Referral program → reduce CAC
```

### Roadmap Anti-Patterns

| Anti-Pattern | Why It Fails | Fix |
|---|---|---|
| Feature roadmap with dates | Creates commitments to outputs, not outcomes | Use Now/Next/Later with themes |
| Public roadmap with specific features | Competitors copy, customers wait instead of buying | Share themes and directions, not features |
| "Everything is P0" | If everything is a priority, nothing is | Force-stack-rank: if you could only ship one thing this quarter, what is it? |
| Stakeholder-driven roadmap | Loudest voice wins, not best opportunity | Use RICE/ICE with data. Present the scoring, not just the decision |
| No "what we won't do" section | Scope creep. No strategic focus | Explicitly list what you're saying no to and why |

## OKRs (Objectives and Key Results)

### Structure

```markdown
## Objective: [Qualitative, inspiring, time-bound]
"Make onboarding so good that new users become weekly active users"

### Key Results:
- KR1: Increase activation rate (core action within 24h) from 30% to 50%
- KR2: Reduce median time-to-first-value from 45 min to 10 min
- KR3: Increase 7-day retention from 35% to 50%

### Confidence: 0.5 (stretch goal — healthy range is 0.3-0.7)

### Initiatives (inputs, not measured):
- Build interactive onboarding tour
- Simplify first-run experience (reduce steps from 7 to 3)
- Send "getting started" email sequence
```

### OKR Rules

| Rule | Why |
|---|---|
| 3-5 objectives per quarter | Focus. More = dilution |
| 2-4 key results per objective | Measurable, not overwhelming |
| Key results are outcomes, not outputs | "Launch feature X" is an output. "Increase metric from A to B" is an outcome |
| Confidence 0.3-0.7 at start of quarter | Too low = unrealistic. Too high = sandbagging |
| Score at end of quarter (0.0-1.0) | 0.7 = successful. 1.0 = goal was too easy |
| Separate OKRs from performance reviews | If OKRs affect compensation, people sandbag |

### FAIL vs. PASS

FAIL — output-focused OKRs:
```
Objective: Improve the product

KR1: Launch dark mode
KR2: Ship 10 features
KR3: Reduce bugs by 50%
```

PASS — outcome-focused OKRs:
```
Objective: Make our product the default choice for Series A startups

KR1: Increase monthly active users from 500 to 1,500
KR2: Achieve NPS > 50 among target segment
KR3: 3 inbound enterprise inquiries per month (from 0)
```

## Saying No

The hardest PM skill. A framework for declining requests without destroying relationships:

### The Saying-No Framework

1. **Acknowledge the request**: "I understand why X would be valuable."
2. **Share the context**: "Here's what we're optimizing for this quarter: [OKR/metric]."
3. **Explain the trade-off**: "If we do X, we'd need to cut [Y] which directly impacts [metric]."
4. **Offer an alternative**: "What if we [smaller version / workaround / later timeline]?"
5. **Document the decision**: Add to "Won't do (this quarter)" in the roadmap.

### Common Stakeholder Requests and Responses

| Request | Response Framework |
|---|---|
| "Customer X needs this or they'll churn" | "Let's verify: what's their ARR? Have they confirmed in writing? Can we solve it differently?" |
| "Our competitor just launched this" | "Are our customers asking for it? Does it serve our target segment's job?" |
| "The CEO wants this" | "Let me understand the goal behind the request. Often there's a faster way to achieve it." |
| "This is a quick win" | "How do we measure 'win'? Quick to build ≠ impactful. Let's score it." |
| "We promised this to the board" | "What was the outcome promised? There may be a better way to deliver that outcome." |

## Shape Up (Alternative to Scrum)

Ryan Singer's framework from Basecamp — an alternative to sprint-based development:

| Concept | Shape Up | Scrum |
|---|---|---|
| Work period | 6-week cycle | 2-week sprint |
| Planning | Shaping (senior) → Betting (leadership) | Backlog grooming → Sprint planning |
| Scope management | Fixed time, variable scope | Fixed scope, variable time (in theory) |
| Backlog | No backlog. If it matters, it'll come up again | Maintained backlog |
| Tracking | Hill charts (uphill = figuring out, downhill = executing) | Burndown charts |

Use Shape Up when: small team (<20), product-led, can commit to 6-week chunks.
Use Scrum when: larger teams, external deadlines, regulatory requirements, need sprint-level predictability.
