# Product marketing correction review

Checked 2026-10-21 (Pacific/Honolulu). Scope: the changes in PR #14, not a new full-skill audit. Historical benchmarks remain historical; a current check does not make them 2026 benchmark data.

| Source | Upstream date | Checked scope |
| --- | --- | --- |
| [WCAG 2.2 Recommendation](https://www.w3.org/TR/WCAG22/) | 2024-12-12 | Counted normative conformance levels: 31 A + 24 AA = 55. Updated marketing examples identify combined A/AA coverage, not 55 AA-only criteria. Coverage of guidance does not itself guarantee a compliant application. |
| [WebAIM Million](https://webaim.org/projects/million/) | 2026 report; exact publication/update date unknown | 95.9% of sampled home pages had automatically detectable failures; no claim that automated checks establish full accessibility. |
| [Seyfarth federal website filings](https://www.adatitleiii.com/2026/03/federal-court-website-accessibility-lawsuit-filings-bounce-back-in-2025/) | 2026-03-25 | 3,117 federal website accessibility suits in 2025, not settlement dollars, state cases or all accessibility lawsuits. |
| [Rachitsky/Poyar conversion study](https://www.lennysnewsletter.com/p/what-is-a-good-free-to-paid-conversion) | 2023-08-01 | Self-serve freemium bands, six-month account conversion window and cohort/sales-motion qualifications in go-to-market. |
| [Rachitsky retention study](https://www.lennysnewsletter.com/p/what-is-good-retention-issue-29) | 2020-06-09 | Six-month category retention bands with differing cohort denominators; 12-month bottom-up SaaS NRR in both go-to-market and metrics. |
| [Dunford positioning primer](https://www.aprildunford.com/post/a-quickstart-guide-to-positioning) | 2021-03-15 | Five components and criticism of using a fill-in statement as the positioning method. Existing Moore book attribution retained; this check is not a fresh verification of both books in full. |
| [Torres assumption testing](https://www.producttalk.org/assumption-testing/) | 2023-10-18 | Test assumptions with high importance and weak evidence first. Left/right orientation is arbitrary if the axis labels and quadrant agree. |

Locally recalculated the two LTV examples using monthly revenue, monthly churn and gross margin: 100 * .8 / .08 = 1,000 and 100 * .8 / .03 = 2,666.67. LTV:CAC rounds to .33 and 3.3; payback is 37.5 and 10 months. This is the simple steady-state illustrative formula, not a validation of forecasting assumptions.

Checked README named-source count (19, with Doerr and Wodtke separate), removed old changed figures, and preserved metadata.filePattern/bashPattern/priority. No behavioral model evaluation ran for this PR. Dates and numerical/source checks do not verify unrelated pricing, adoption, activation, statistical-testing or strategy claims that were intentionally left outside this correction.
