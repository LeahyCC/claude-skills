# Positioning & Messaging

> Sources: April Dunford ("Obviously Awesome", "Sales Pitch"), Andy Raskin ("The Greatest Sales Deck I've Ever Seen"), Emily Kramer / MKT1 (messaging hierarchy), Donald Miller ("Building a StoryBrand"), Al Ramadan et al. ("Play Bigger"), Ries & Trout ("Positioning")

Positioning is the foundation of everything — pricing, copy, sales, marketing, even what features you build. If your positioning is wrong, great execution makes it worse faster.

## Dunford's 5-Component Positioning

April Dunford's framework from "Obviously Awesome" is the current standard for B2B positioning. Work through the components in this order:

### Step 1: Competitive Alternatives

**What would customers do if you didn't exist?**

Not just direct competitors. Include:
- Spreadsheets / manual processes
- Hiring someone to do it
- Using a general-purpose tool (e.g., using Jira for something purpose-built tools do better)
- Doing nothing (living with the pain)

FAIL:
```
Competitive alternatives: Competitor A, Competitor B, Competitor C
```

PASS:
```
Competitive alternatives:
1. Manual code review for accessibility (current default — time-consuming, inconsistent)
2. axe-core + eslint-plugin-jsx-a11y (catches some issues, misses most WCAG criteria)
3. External accessibility audit firm ($5-20k per audit, point-in-time, not continuous)
4. Ignoring accessibility until a customer or legal team complains
```

### Step 2: Unique Attributes

**What do you have that alternatives don't?**

List concrete capabilities, not benefits. Benefits come in step 3.

```
Unique attributes:
- Covers all 50 WCAG 2.2 AA criteria (alternatives cover <20)
- Works inside the IDE/CLI at coding time (not post-deploy)
- Production code examples, not just warnings
- Zero dependencies (pure markdown, no runtime)
```

### Step 3: Value

**What capability do those attributes enable for customers?**

Map each attribute to a value that matters to the target customer:

| Attribute | Value (capability enabled) |
|---|---|
| 50/50 criteria coverage | Ship fully accessible products, not "partially compliant" |
| Works at coding time | Catch issues before they reach production or audit |
| Production code examples | Fix issues immediately instead of researching how |
| Zero dependencies | Install in seconds, no security review needed |

### Step 4: Target Customer Segments

**Who cares most about that value?**

Not "everyone." The segment that cares MOST, urgently, right now:

FAIL:
```
Target: Developers who want to build accessible websites
```

PASS:
```
Target: Frontend teams at Series A-C SaaS startups who have received
accessibility complaints from enterprise prospects or customers and need
to fix compliance gaps without hiring a dedicated accessibility engineer.

Why they care urgently:
- Enterprise deals require VPAT/accessibility statement
- One accessibility lawsuit costs more than years of tooling
- Team is too small for a dedicated a11y role
```

### Step 5: Market Category

**What context makes your value obvious?**

The category frames expectations. Choose carefully:

| Category choice | Expectation set | Risk |
|---|---|---|
| "Accessibility testing tool" | Compete with axe, Lighthouse | Commoditized, price pressure |
| "Accessibility compliance platform" | Compete with audit firms, Level Access | Enterprise sales cycle |
| "AI coding skills for accessibility" | New category | Requires education, but no direct comparison |

The right category makes your unique attributes feel like table-stakes expectations.

## The Positioning Statement

Once you've completed the 5 components, assemble them:

```
For [target customer]
who [key need/problem],
[product name] is a [market category]
that [key benefit].
Unlike [competitive alternative],
we [primary differentiator].
```

Example:
```
For frontend teams at growing SaaS companies
who need to ship accessible products without dedicated accessibility engineers,
claude-skills is a collection of AI coding skills
that provides production-ready code for every WCAG 2.2 AA criterion.
Unlike manual audits or linting tools that catch <20 criteria,
we cover all 50 criteria with real code examples that fix issues at coding time.
```

This statement is **internal**. It guides all external copy. You never paste it on a website verbatim.

## Messaging Hierarchy

The positioning statement feeds a messaging hierarchy. Each level serves a different context:

```
Level 1: Tagline (3-8 words)
    "Ship accessible products, effortlessly"

Level 2: Value Proposition (1-2 sentences)
    "Production-grade accessibility skills for Claude Code.
     Cover every WCAG 2.2 AA criterion with zero dependencies."

Level 3: Messaging Pillars (3-4 themes, each with proof)
    ├── Pillar 1: Complete coverage
    │     Proof: 50/50 WCAG 2.2 AA criteria mapped and verified
    │
    ├── Pillar 2: Production code, not checklists
    │     Proof: Real React/Next.js/Tailwind FAIL→PASS examples
    │
    └── Pillar 3: Zero friction
          Proof: One-command install, pure markdown, no runtime

Level 4: Per-Persona Variations
    ├── For tech leads: "Stop catching the same a11y issues in code review"
    ├── For founders: "Enterprise prospects require accessibility. Ship it without hiring"
    └── For developers: "Every WCAG criterion with copy-paste React code"

Level 5: Full Narrative (website, pitch deck, one-pager)
    [See Strategic Narrative section below]
```

## Strategic Narrative (Raskin)

Andy Raskin's framework for B2B storytelling. Use for your website hero section, pitch deck, and sales presentations:

### Structure

1. **Name a big, relevant shift in the world**
   Not about you. About the world your customer lives in.
   "AI is changing how code gets written. But AI-generated code isn't accessible by default."

2. **Show there will be winners and losers**
   Create urgency. The shift rewards some and punishes others.
   "Companies that ship accessible products win enterprise deals. Those that don't face lawsuits and lost revenue."

3. **Tease the promised land**
   Paint the future state — what life looks like for winners. Don't mention your product yet.
   "Imagine every component your team ships is accessible from the first commit. No retrofitting, no audits, no surprises."

4. **Introduce features as 'magic gifts' that enable the promised land**
   NOW you talk about your product. Each feature is a tool that gets them to the promised land.
   "50/50 WCAG criteria covered. Production code examples. One-command install."

5. **Present evidence you can deliver**
   Social proof, data, case studies.
   "Verified against the W3C specification. Used by X teams."

### FAIL vs. PASS

FAIL — leading with features:
```
"We built an accessibility skill for Claude Code. It covers 50 WCAG criteria
and has production code examples."
```

PASS — leading with the shift:
```
"AI is writing more code than ever. But AI doesn't check for accessibility
by default — and accessibility lawsuits hit $13.8B in settlements last year.
The teams that win enterprise deals are the ones shipping accessible products
from day one. [Product] makes that happen: 50/50 WCAG criteria, production
React code, one-command install."
```

## StoryBrand Framework (Miller)

For B2C or consumer-facing products, the StoryBrand 7-part framework works better than Raskin:

```
1. CHARACTER — Your customer (not you) is the hero
2. PROBLEM — They have a problem (external, internal, philosophical)
3. GUIDE — You are the guide (empathy + authority)
4. PLAN — You give them a clear plan (3 steps)
5. CALL TO ACTION — You call them to action (direct + transitional)
6. FAILURE — Show what happens if they don't act
7. SUCCESS — Show what happens when they do
```

Example:
```
1. CHARACTER: A developer shipping a SaaS product
2. PROBLEM:
   - External: "My app isn't accessible"
   - Internal: "I feel guilty and overwhelmed"
   - Philosophical: "Everyone deserves to use the web"
3. GUIDE: "We've mapped every WCAG criterion so you don't have to"
4. PLAN: 1. Install the skill  2. Write code  3. Ship accessible products
5. CTA: "Install now" (direct) / "See the coverage" (transitional)
6. FAILURE: Lawsuits, lost enterprise deals, excluded users
7. SUCCESS: Confident, compliant, inclusive product
```

## Category Design

From "Play Bigger" — for genuinely novel products that don't fit an existing category:

### When to Create a Category

| Signal | Do It | Don't Do It |
|---|---|---|
| Customers struggle to compare you to existing tools | ✅ They need a new frame | |
| You're 10x better in a specific dimension | ✅ Define a category around that dimension | |
| Your biggest competitor is "do nothing" | ✅ The problem needs naming | |
| There's an established category with clear leaders | | ❌ You'll spend more on education than acquisition |
| Your differentiation is incremental | | ❌ A new category overpromises |

### Category Naming Rules

| Rule | Example |
|---|---|
| 2-3 words | "Sales Engagement" (Outreach), "Revenue Intelligence" (Gong) |
| Describes the outcome, not the technology | "Conversational AI" ✅, "NLP Chatbot Platform" ❌ |
| Feels inevitable in hindsight | "Cloud Data Warehouse" (Snowflake) |

## Competitive Positioning Cheat Sheet

| Your Situation | Positioning Approach | Source |
|---|---|---|
| Established category, strong leader | **Against**: explicitly position against the leader | Ries & Trout |
| Established category, no clear leader | **Best-in-class**: claim the #1 spot on a dimension that matters | Dunford |
| No existing category, novel approach | **Category creation**: name and evangelize a new space | Play Bigger |
| Existing category but different buyer | **Adjacent market**: same tech, different use case | Moore |
| Premium product in a price-sensitive market | **Subcategory**: "[Category] for [specific segment]" | Dunford |

## Messaging Testing

Before committing to positioning, test it:

| Method | Effort | What You Learn |
|---|---|---|
| **5-second test** | Minutes | Show landing page for 5 seconds. Ask: "What does this product do? Who is it for?" If they can't answer, your messaging is unclear |
| **Preference test** | Hours | Show 2-3 positioning variations. Ask which resonates more and why |
| **Landing page A/B test** | 2-4 weeks | Test different headlines/value props. Measure click-through or sign-up rate |
| **Sales conversation** | Ongoing | When a prospect says "oh, that's exactly what I need" — note what you said right before. That's your positioning |
