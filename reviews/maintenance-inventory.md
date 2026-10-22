# Maintenance inventory, 2026-10-21

Baseline 23d07907948fc90427559f9916dc3c0353e3f07c, clean main. Checked live PR inventory (empty), checkpoint #15, merged PR history, skill/resource inventory, review records and references/callers. All seven existing skills already received a substantive or targeted correction pass. There is no untouched skill and no new skill is proposed.

| Skill | Existing pass | Remaining evidence / disposition |
| --- | --- | --- |
| wcag-accessibility | #8, count and contrast corrections | Pointer/drag resource already requires a non-drag single-pointer alternative. No new correction justified by this scan. |
| react-performance | #9, compiler setup, analyzer, measurement and transition claims | Assets was not touched by #9. It retains deprecated priority advice, invalid metadata.other.link preload, unqualified Script worker and a video ref timing issue. Entry/compiler resources contradict gradual adoption by instructing blanket removal. Focused follow-up. |
| seo | #10, canonical/crawl/structured data/GEO corrections | Performance still requires priority and says expensive synchronous filtering in startTransition is deferred. Focused follow-up. |
| ux-copy | #11, errors/auth button/readability claims | No evidenced new defect in this scope scan; retain prior pass rather than rewrite. |
| api-security | #12/#13, auth/input/security rules and select handling | Checkpoint explicitly left encryption and GraphQL sections. Build key timing/default and unconnected GraphQL validation example warrant focused follow-up. |
| product-marketing | #14 plus scoped source/cohort review | Known pricing/strategy heuristics remain outside those checks, but their presence/age alone does not prove error. No second broad rewrite in this pass. |
| nextjs-app-router | #16, complete pilot and dated source/evaluation records | Completed; no repeat benchmark or rewrite. |

The follow-ups address concrete incomplete sections, not a claim that all other content is freshly certified. For each, record section-level KEEP/REVISE/ADD/REMOVE and dated primary sources in its SOURCES.md. Preserve resource filenames/callers and custom metadata; do not merge sibling resources or sweep repository-wide trigger claims. Structure follows the existing focused-resource layout and concise routing principles established in the Next.js pilot; external skills are not technical authority.

No global dependencies, new skills or automation. Validation is proportional: compile/run changed examples where possible, check discovery metadata and links, and distinguish fixture checks from deployment/performance/security proof. Model selection was already tested in the pilot; unchanged descriptions do not justify another paid/limited subscription benchmark. Historical issue #15 is a checkpoint, not a current PR inventory.
