# Metrics & Analytics

> Sources: Amplitude ("North Star Playbook"), Dave McClure (AARRR / Pirate Metrics), Reforge (growth loops, retention analysis), David Skok / ForEntrepreneurs (SaaS unit economics), Lenny Rachitsky (retention benchmarks), Kyle Poyar / OpenView (PLG benchmarks), Nir Eyal ("Hooked")

Metrics tell you if you're winning. But most products track too many metrics and act on none of them. Start with one North Star, add 3-5 input metrics, and ignore everything else until those are healthy.

## North Star Framework

### What Is a North Star Metric?

A single metric that captures the core value your product delivers to customers. It must be:

1. **A leading indicator of revenue** (not revenue itself)
2. **Reflective of customer value** (not just business value)
3. **Measurable and movable** by the product team

### Examples by Product Type

| Product Type | North Star Metric | Why |
|---|---|---|
| Marketplace | Transactions completed | Value exchange happened |
| SaaS (collaboration) | Weekly active teams | Teams = stickiness = retention |
| SaaS (productivity) | Tasks completed per user per week | Users getting value = retention |
| Content/media | Time spent consuming | Engagement = value = ad/subscription revenue |
| E-commerce | Purchases per buyer per month | Repeat purchases = product-market fit |
| Developer tool | Projects using the tool weekly | Integration = switching cost = retention |
| AI product | Successful AI outputs per user per week | Users getting value from AI = retention |

### Input Metrics

Your North Star is the lagging indicator. Input metrics are the leading indicators you can directly influence:

```
North Star: Weekly Active Teams
    │
    ├── Input 1: New team sign-ups per week (acquisition)
    ├── Input 2: % of teams that invite 2nd member within 7 days (activation)
    ├── Input 3: % of teams active in week 4 (retention)
    └── Input 4: Average team size (expansion)
```

Each team owns 1-2 input metrics. Changes to input metrics should move the North Star within weeks.

### FAIL vs. PASS

FAIL — North Star is a vanity or business metric:
```
North Star: Monthly page views
Problem: Page views ≠ customer value. A bot can generate page views.

North Star: MRR
Problem: MRR is a lagging business metric, not a product metric.
Teams can't move MRR directly in a sprint.
```

PASS — North Star reflects customer value:
```
North Star: Weekly users who complete a full WCAG audit
Why: Completing an audit = getting the core value. Correlates with
retention (validated) and revenue (users who audit → 3x more likely to upgrade).

Input metrics:
- New installs per week (acquisition)
- % of installs that run first audit within 24h (activation)
- % of users who audit in week 2+ (retention)
- Average criteria checked per audit (depth of engagement)
```

## AARRR (Pirate Metrics)

Dave McClure's funnel — the starting framework for understanding your growth engine:

```
Acquisition ──→ Activation ──→ Retention ──→ Revenue ──→ Referral
"How do users   "Do they have   "Do they     "Do they    "Do they
 find us?"       a great first   come back?"   pay?"      tell others?"
                 experience?"
```

### Metrics for Each Stage

| Stage | Metric | Good Signal | Bad Signal |
|---|---|---|---|
| **Acquisition** | Sign-ups, installs, visits from target segment | Growing from target channels | Growing but wrong audience |
| **Activation** | % who complete key action within [timeframe] | >25% activation in 24h | Users sign up but never use core feature |
| **Retention** | % active in week 2, week 4, week 8 | Retention curve flattens (not → 0) | Continuous decline — no sticky users |
| **Revenue** | Conversion rate, ARPU, expansion revenue | Willing to pay without heavy sales | Only convert with discounts |
| **Referral** | NPS, referral rate, viral coefficient | Users mention you without prompting | Need incentives for every referral |

### Where to Focus

| Symptom | Broken Stage | Fix |
|---|---|---|
| "We get lots of sign-ups but nobody sticks" | Activation | Fix onboarding. Reduce time-to-first-value |
| "Users love us but we can't grow" | Acquisition | Fix channel strategy. You have product-market fit, not channel-market fit |
| "Users activate but churn after month 1" | Retention | Find the engagement loop. What brings them back? |
| "Everyone uses the free tier" | Revenue | Fix value metric or upgrade trigger. Free tier may be too generous |
| "Growth has stalled" | Referral + Acquisition | Add a referral mechanism. Explore new channels |

**Critical insight**: Fix in this order — Retention → Activation → Acquisition → Revenue → Referral. Acquiring users into a leaky bucket is waste. Charging users who don't retain is churn.

## Retention Analysis

### Cohort Analysis

Track weekly or monthly cohorts — group users by sign-up date, measure % still active over time:

```
         Week 0   Week 1   Week 2   Week 4   Week 8   Week 12
Jan cohort  100%    45%      30%      22%      18%      17%
Feb cohort  100%    50%      35%      28%      24%      --
Mar cohort  100%    55%      40%      --       --       --
```

What to look for:
- **Flattening curve**: Good. Some users stick permanently. Your product has value.
- **Continuous decline toward 0**: Bad. No user finds enough ongoing value.
- **Improving cohorts over time**: Great. Your product/onboarding is getting better.
- **Declining cohorts over time**: Alarming. Something changed (market, product, audience).

### Retention Benchmarks (Lenny Rachitsky, 2024-2025)

| Product Type | Good Day-1 | Good Day-7 | Good Day-30 |
|---|---|---|---|
| Consumer social | 50%+ | 30%+ | 20%+ |
| Consumer non-social | 35%+ | 15%+ | 8%+ |
| SaaS (SMB) | 70%+ | 50%+ | 35%+ |
| SaaS (Enterprise) | 90%+ | 80%+ | 70%+ |
| Developer tools | 50%+ | 30%+ | 20%+ |

These are approximate. Your specific market and use case matter more than benchmarks.

### Activation Metrics ("Aha Moment")

The activation metric is the behavior most correlated with long-term retention. Find it by:

1. **List candidate behaviors** (completed onboarding, invited teammate, created first project, used feature X)
2. **Correlate each with 30-day retention** (users who did X retain at Y% vs. Z% for those who didn't)
3. **The behavior with the strongest correlation is your activation metric**

Famous examples:
| Product | Activation Metric | Source |
|---|---|---|
| Facebook (early) | 7 friends in 10 days | Chamath Palihapitiya |
| Slack | 2000 team messages sent | Slack growth team |
| Dropbox | 1 file saved in 1 folder on 1 device | Dropbox growth team |
| Hubspot | Using 5 features in first month | HubSpot |

Once you find yours, optimize the entire onboarding to get users there as fast as possible.

## Unit Economics

### Key Metrics

| Metric | Formula | Healthy Range (SaaS) | Source |
|---|---|---|---|
| **CAC** (Customer Acquisition Cost) | Total sales & marketing spend / New customers | Varies by ACV | Skok |
| **LTV** (Lifetime Value) | ARPA × Gross Margin × (1 / Churn Rate) | LTV:CAC > 3:1 | Skok |
| **CAC Payback** | CAC / (ARPA × Gross Margin) | < 12 months | Skok |
| **Net Revenue Retention** | (Start MRR + Expansion - Contraction - Churn) / Start MRR | > 100% (good), > 120% (great) | OpenView |
| **Gross Margin** | (Revenue - COGS) / Revenue | > 70% for SaaS | Industry standard |
| **Burn Multiple** | Net Burn / Net New ARR | < 2x (efficient), < 1x (excellent) | Bessemer |

### LTV:CAC by Growth Stage

| Stage | Acceptable LTV:CAC | Why |
|---|---|---|
| Pre-PMF (< $1M ARR) | Don't optimize yet | Focus on finding PMF, not efficiency |
| Early growth ($1M-$10M ARR) | > 2:1 | Investing in growth, some inefficiency OK |
| Scaling ($10M+ ARR) | > 3:1 | Must be efficient to reach profitability |
| Mature (public/late-stage) | > 5:1 | Investors expect efficiency |

### FAIL vs. PASS

FAIL — tracking revenue without understanding economics:
```
"We grew MRR from $10k to $50k!"
But: CAC is $3000, ACV is $1200, churn is 8%/month.
LTV = $1200 × 0.80 × (1/0.08) = $12,000
LTV:CAC = 4:1 ← looks OK
CAC payback = $3000 / ($100 × 0.80) = 37.5 months ← terrible

Reality: You'll run out of cash before customers pay back CAC.
```

PASS — tracking the full picture:
```
MRR: $50k (+$40k this quarter)
CAC: $800 (improved from $3000 via content marketing)
ACV: $1200
Monthly churn: 3%
LTV: $1200 × 0.80 × (1/0.03) = $32,000
LTV:CAC = 40:1
CAC payback = $800 / ($100 × 0.80) = 10 months ✓
Burn multiple: 0.8x ✓

Reality: Efficient growth. Sustainable path to profitability.
```

## Reforge Four Fits Framework

Brian Balfour's "Four Fits" model — all four must align for sustainable growth:

```
Market ←→ Product ←→ Channel ←→ Model
```

| Fit | Question | Misfit Signal |
|---|---|---|
| **Market-Product Fit** | Does the product solve a real problem for a defined market? | High churn, low NPS, users sign up but don't activate |
| **Product-Channel Fit** | Does the product naturally fit the channels you can use? | High CAC, channels don't convert, viral product but using sales team |
| **Channel-Model Fit** | Does the channel economics work with your revenue model? | CAC exceeds what the model can support (e.g., paid ads for $10/mo product) |
| **Model-Market Fit** | Does the revenue model match the market's buying behavior? | Market wants self-serve but you require sales calls. Or: market expects free but you have no freemium |

### How to Diagnose

| Symptom | Likely Broken Fit |
|---|---|
| "People love us but we can't grow" | Product-Channel Fit — right product, wrong distribution |
| "We get lots of traffic but nobody converts" | Market-Product Fit — wrong audience, or product doesn't match their need |
| "Growth is unprofitable" | Channel-Model Fit — channel is too expensive for your price point |
| "Enterprise wants us but won't buy" | Model-Market Fit — your model (self-serve) doesn't match their process (procurement) |

Fix order: Market-Product → Product-Channel → Channel-Model → Model-Market. Each builds on the previous.

## Growth Loops vs. Funnels

Reforge's key insight: sustainable growth comes from **loops** (output becomes input), not **funnels** (linear, require constant refilling).

### Loop Types

| Loop | How It Works | Example |
|---|---|---|
| **Viral** | User → invites others → new users → invite more | Dropbox (invite for storage), Calendly (recipient sees branding) |
| **Content** | User creates content → indexed/shared → new users find it → create more | Stack Overflow, Pinterest, Notion templates |
| **Paid** | Revenue → reinvest in ads → new users → more revenue | Performance marketing (sustainable only if LTV:CAC > 3:1) |
| **Sales** | Revenue → hire more reps → more deals → more revenue | Enterprise SaaS |
| **Product** | Users use product → data improves product → more users → more data | Waze (more drivers = better traffic), Spotify (more plays = better recs) |

### Identifying Your Loop

Ask: "If we stopped all marketing spend tomorrow, would we still grow?"
- **Yes** → You have a viral or product loop (strong position)
- **Slowly** → You have organic content or word-of-mouth (decent position)
- **No** → You're dependent on paid/sales loops (fragile position)

## Experiment Analysis

### Statistical Significance

For A/B tests, don't call results early:

| Metric Type | Minimum Sample per Variant | Duration |
|---|---|---|
| Conversion rate (high traffic) | 1,000+ conversions per variant | 2+ weeks |
| Conversion rate (low traffic) | 100+ conversions per variant | 4+ weeks |
| Engagement metric | 500+ users per variant | 2+ weeks |
| Revenue metric | 200+ transactions per variant | 4+ weeks |

Rules:
- **Never peek and stop early** when the result looks good — this inflates false positive rates
- **Set decision criteria before starting** — "We'll run for 3 weeks. If variant B has >10% lift with p<0.05, we ship it"
- **Account for weekly cycles** — always run in multiples of 7 days
- **Segment results** — an average improvement may hide regression in key segments

## Metrics Anti-Patterns

| Anti-Pattern | Why It Fails | Fix |
|---|---|---|
| **Vanity metrics** (total users, page views, downloads) | Don't reflect value delivered or business health | Focus on active users, retention, revenue per user |
| **Too many metrics** | Teams can't act on 50 numbers | One North Star + 3-5 input metrics per team |
| **Output metrics** ("features shipped", "story points") | Measure activity, not impact | Track outcome metrics: retention, activation, NPS |
| **Metrics without baseline** | "We improved retention" means nothing without the starting point | Always state: metric, baseline, target, current |
| **Annual NPS survey** | Too infrequent, too late to act | Continuous in-app NPS, triggered by milestones |
| **Averages without distributions** | Average session length of 10 min could mean 50% at 1 min, 50% at 19 min | Use medians, percentiles, cohort breakdowns |
