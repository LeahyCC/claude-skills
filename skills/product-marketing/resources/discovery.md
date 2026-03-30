# Discovery

> Sources: Teresa Torres ("Continuous Discovery Habits"), Clayton Christensen ("Competing Against Luck"), Tony Ulwick (Outcome-Driven Innovation), Marty Cagan / SVPG, Erika Hall ("Just Enough Research")

Discovery is how you learn what to build. Without it, you're guessing — and most guesses are wrong. Teresa Torres's core principle: product teams should talk to customers every week, not once a quarter.

## The Discovery System

```
Business Outcome (metric you're trying to move)
    │
    ├── Opportunity 1 (unmet need / pain point)
    │     ├── Solution A → Experiment → Learn
    │     └── Solution B → Experiment → Learn
    │
    ├── Opportunity 2
    │     └── Solution C → Experiment → Learn
    │
    └── Opportunity 3
          ├── Solution D → Experiment → Learn
          └── Solution E → Experiment → Learn
```

This is the **Opportunity Solution Tree** (OST). It connects business goals to customer needs to testable solutions. Every solution is an experiment, not a commitment.

## Customer Interviews

### Interview Guide Template

```markdown
# Interview Guide: [Research Question]

## Objective
What specific question are we trying to answer?
[e.g., "How do Series A startups currently handle accessibility compliance?"]

## Screener
Who qualifies:
- [Criterion 1: role, company size, etc.]
- [Criterion 2: must have experienced the problem]
Who does NOT qualify:
- [Anti-criterion: too advanced, wrong context, etc.]

## Warm-Up (5 min)
- Tell me about your role and what you're working on right now.
- Walk me through a typical week.

## Core Questions (25-30 min)
1. [Open-ended question about the problem space]
   Follow-up: "Can you walk me through the last time that happened?"
   Follow-up: "What did you do about it?"

2. [Question about current workflow/tools]
   Follow-up: "What's the most frustrating part of that?"
   Follow-up: "What have you tried to fix it?"

3. [Question about desired outcome]
   Follow-up: "What would 'great' look like for you?"
   Follow-up: "How would you know it was working?"

## Wrap-Up (5 min)
- Is there anything I didn't ask about that you think is important?
- Would you be open to trying an early version and giving feedback?

## Notes
- Duration: 30-45 minutes
- Record with permission
- Send thank-you within 24 hours
```

### Interview Rules

| Rule | Why | FAIL → PASS |
|---|---|---|
| **Ask about past behavior, not future intent** | People are terrible at predicting what they'll do | "Would you use X?" → "Tell me about the last time you dealt with X" |
| **Ask "how" and "what", not "why"** | "Why" triggers post-hoc rationalization | "Why did you switch?" → "Walk me through what happened when you decided to switch" |
| **Don't pitch your solution** | You'll get polite agreement, not honest feedback | "What if we built X?" → "What have you tried so far?" |
| **Follow the energy** | When someone gets animated (excited or frustrated), dig in | Pre-scripted flow → "You seem frustrated by that — tell me more" |
| **One topic per interview** | Broad interviews yield shallow insight | "Let's talk about everything" → "Today I want to understand how you handle [specific thing]" |

## Jobs-to-be-Done (JTBD)

Customers don't buy products — they "hire" them to make progress in their lives. A job has three dimensions:

| Dimension | Question | Example (Slack) |
|---|---|---|
| **Functional** | What task are they trying to accomplish? | "Coordinate with my team without scheduling meetings" |
| **Emotional** | How do they want to feel? | "Feel connected to my team even when remote" |
| **Social** | How do they want to be perceived? | "Be seen as responsive and collaborative" |

### JTBD Statement Format

```
When [situation/trigger],
I want to [job/progress],
so I can [desired outcome].
```

Examples:
- "When a customer reports a bug, I want to quickly understand what they experienced, so I can fix it before more users are affected."
- "When I'm planning the next quarter, I want to see which customer requests have the most demand, so I can justify my roadmap to stakeholders."

### Switch Interview (JTBD Discovery)

The Switch Interview maps the timeline of a customer's decision to change:

```
First Thought ──→ Event 1 ──→ Event 2 ──→ Purchase/Switch
     │                │             │              │
     └── Trigger      └── Research  └── Decide     └── Act
```

Questions for each phase:

**Push** (what's wrong with the current state):
- "When did you first start thinking about looking for something new?"
- "What was happening that made the old way not work anymore?"

**Pull** (what attracted them to the new solution):
- "What caught your attention about [product]?"
- "What did you think it would do for you?"

**Anxiety** (what almost stopped them):
- "What concerns did you have before switching?"
- "What almost stopped you from making the change?"

**Habit** (what kept them on the old way):
- "What did you like about the way you were doing it before?"
- "Was there anything about the old way that was hard to give up?"

## Opportunity Solution Tree (OST)

### How to Build One

1. **Start with a business outcome** — a metric your team owns (e.g., "Increase 30-day retention from 40% to 55%")
2. **Map opportunities from research** — unmet needs and pain points from interviews. NOT solutions.
3. **Generate solutions for each opportunity** — at least 3 per opportunity to avoid falling in love with the first idea
4. **Design experiments for the riskiest assumptions** — don't build the full solution, test the critical unknowns first

### FAIL vs. PASS

FAIL — jumping from outcome to feature:
```
Outcome: Increase retention
    └── Solution: Add email reminders
        └── Build email system
```

PASS — discovering opportunities first:
```
Outcome: Increase retention (30-day: 40% → 55%)
    │
    ├── Opportunity: Users don't discover key features in first week
    │     ├── Solution: Interactive onboarding tour
    │     │     └── Experiment: Prototype test with 5 users
    │     ├── Solution: Contextual feature tips
    │     │     └── Experiment: Fake door test on 3 features
    │     └── Solution: "Getting started" email sequence
    │           └── Experiment: A/B test vs. control (no emails)
    │
    ├── Opportunity: Users lose context between sessions
    │     ├── Solution: "Pick up where you left off" dashboard
    │     └── Solution: Weekly digest email with activity summary
    │
    └── Opportunity: Users feel isolated (no team adoption)
          ├── Solution: Team invite flow during onboarding
          └── Solution: Shareable templates/examples
```

## Assumption Mapping

Before building anything, list your assumptions and test the riskiest ones first.

### Assumption Categories

| Category | Question | Example |
|---|---|---|
| **Desirability** | Do customers want this? | "Developers care enough about accessibility to use a tool for it" |
| **Viability** | Can we sustain a business around this? | "Teams will pay $X/month for this" |
| **Feasibility** | Can we build this? | "We can reliably detect WCAG violations with static analysis" |
| **Usability** | Can users figure it out? | "Developers will understand how to interpret our audit results" |

### Assumption Prioritization

Plot each assumption on a 2x2:

```
              High importance
                    │
         ┌──────────┼──────────┐
         │          │          │
         │  Monitor │ TEST     │
         │          │ FIRST    │
         │          │          │
Weak ────┼──────────┼──────────┼──── Strong
evidence │          │          │    evidence
         │  Ignore  │ Validate │
         │          │          │
         │          │          │
         └──────────┼──────────┘
                    │
              Low importance
```

**Test first**: High importance, weak evidence. These are your biggest risks.

## Experiment Design

### Template

```markdown
# Experiment: [Name]

## Hypothesis
We believe [action/change] will result in [measurable outcome]
for [target user segment].

## Riskiest Assumption
[Which assumption from the assumption map are we testing?]

## Method
[One of: prototype test, fake door, A/B test, survey, concierge, Wizard of Oz]

## Metric
- Primary: [what we'll measure]
- Baseline: [current number]
- Target: [number that would validate the hypothesis]

## Sample Size
[How many users/responses we need for statistical significance]

## Duration
[How long we'll run the experiment]

## Decision Criteria
- If [metric] ≥ [target]: proceed to build
- If [metric] is between [low] and [target]: iterate on the approach
- If [metric] < [low]: kill the idea and explore the next solution
```

### Experiment Types (Cheapest to Most Expensive)

| Type | Effort | What You Learn | When to Use |
|---|---|---|---|
| **Customer interviews** | Hours | Desirability, problem validation | Always start here |
| **Survey** | Days | Quantitative desirability, sizing | Validate patterns from interviews |
| **Fake door test** | Days | Demand signal (click-through on non-existent feature) | Before building anything |
| **Concierge** | Days-weeks | Full experience value, manually delivered | Service-heavy features |
| **Wizard of Oz** | Days-weeks | Full experience value, human behind the curtain | Complex automation features |
| **Prototype test** | 1-2 weeks | Usability, comprehension, task completion | Before detailed engineering |
| **A/B test** | 2-4 weeks | Quantitative impact on real metric | After initial validation, need statistical proof |

## Survey Design

### Rules

| Rule | Why | FAIL → PASS |
|---|---|---|
| **5-10 minutes max** | Completion rates drop 20% for each additional minute past 5 | 30-question survey → 8-question survey |
| **No leading questions** | Biased input = useless data | "Don't you think X is important?" → "How important is X to you?" (1-5 scale) |
| **One concept per question** | Double-barreled questions confuse respondents | "How satisfied are you with speed and reliability?" → Two separate questions |
| **Specific timeframe** | "Usually" means different things to different people | "How often do you exercise?" → "How many times did you exercise last week?" |
| **Open-ended sparingly** | Most people skip long-answer fields | All open-ended → Mix of structured + 1-2 open-ended at the end |

### Standard Structure

```
1. Screener (1-2 questions — filter out unqualified respondents)
2. Usage context (2-3 questions — current behavior)
3. Core topic (3-5 questions — the thing you're researching)
4. Priority/preference (1-2 questions — forced ranking)
5. Open-ended (1 question — "Anything else we should know?")
6. Demographics (optional — only if segmentation matters)
7. Follow-up opt-in ("Would you be open to a 20-minute interview?")
```

## User Personas

### Modern Persona Format

FAIL — demographic-heavy, fictional:
```markdown
## Sarah
- Age: 34
- Location: San Francisco
- Income: $150k
- Hobbies: yoga, reading
- Quote: "I just want things to work!"
```

PASS — behavior-heavy, research-backed:
```markdown
## The Scaling Tech Lead
**Role**: Senior engineer or tech lead at a Series A-B startup (10-50 engineers)
**Context**: Responsible for frontend architecture decisions. Team is growing
fast, code quality is slipping, and they need to ship features without
accumulating more tech debt.

**Jobs to be done**:
- When onboarding new engineers, they want to enforce consistent patterns
  so new code doesn't diverge from existing architecture
- When planning sprints, they want to quickly assess which features have
  accessibility or performance implications so they can allocate time

**Current workflow**:
- Uses ESLint + manual code review
- Accessibility is checked ad-hoc, usually when a customer complains
- Performance is noticed when users report slowness, not proactively

**Frustrations**:
- "Every code review I catch the same issues. There has to be a way to automate this."
- "I know we're not accessible but I don't know where to start."

**What would make them switch**:
- Tool that works in their existing workflow (not a separate dashboard)
- Catches real issues, not noise (high signal-to-noise ratio)
- Doesn't require learning a new ecosystem

**What would stop them**:
- Anxiety: "Will this slow down my team?"
- Habit: "We've gotten by without it so far"
```

Build 3-5 personas max. Include at least one anti-persona (who you're NOT building for and why).

## Pre-Mortem

Before committing to a major initiative, run a pre-mortem:

```markdown
## Pre-Mortem: [Initiative Name]

Imagine it's [date 6 months out]. This initiative has failed completely.

### What went wrong? (Each team member writes independently, then share)

1. [Failure mode 1]
   - Likelihood: [High/Medium/Low]
   - Mitigation: [What we'd do to prevent this]

2. [Failure mode 2]
   - Likelihood: [High/Medium/Low]
   - Mitigation: [What we'd do to prevent this]

### Top 3 risks we'll actively monitor:
1. [Risk] — Check-in: [frequency] — Owner: [person]
2. [Risk] — Check-in: [frequency] — Owner: [person]
3. [Risk] — Check-in: [frequency] — Owner: [person]
```
