# Pilot tasks and acceptance criteria

Established 2026-10-21 (Pacific/Honolulu), before rewriting. Baseline: 81328ac4b8b832d3bbca1e04c65665226e4ce0d2. Run identical prompts against baseline and revised copies. Score each criterion 0/1; report observed outputs separately from static coverage. One run per task is exploratory, not a reliable statistical estimate.

| ID | Realistic request / fixture | Observable acceptance criteria |
| --- | --- | --- |
| T1 | Next.js 16.0 App Router dashboard, Cache Components off. Add authenticated account data and a live job polling widget; no framework upgrade. | Preserve configuration/version; authenticate at data boundary; no shared personal cache; preserve appropriate client polling; no unconditional private-cache directive. |
| T2 | Next.js 16.4 App Router, Cache Components on. Cache public catalog; authenticated edit must show new values; signed CMS webhook can tolerate stale data. | Check exact installed docs/config; key cache by category; authenticate/authorize/validate action; updateTag only in action; webhook authenticated and revalidateTag with max; no session token as tag. |
| T3 | Incrementally migrate one Pages Router blog route while others remain on Next.js 15. | No forced major upgrade; preserve _app/_document for retained pages; no overlapping URL routes; async params; preserve ISR using supported cache mode; verify hard navigation and 404. |
| T4 | Review a feed/photo modal with direct /photo/123 URL and back/forward support; files supplied at app/feed/@modal/(.)photo. | Detect wrong interception level; propose coherent sibling route tree; default and clearing fallbacks; hard/soft/back/forward checks. |
| T5 | Next.js 16 app: add error recovery and optimize responsive hero. Exact minor initially unspecified. | Resolve installed minor before retry API; Client error boundary and correct placement; global document wrapper if needed; version-appropriate image prop; sizes and dimensions; no universal one-preload rule. |
| A1 | Fix authenticated Next.js App Router caching and server action stale UI. | Skill applies; loads relevant caching/data resource rather than all files. |
| A2 | Optimize a Vite React counter component's rerenders. | Does not apply App Router conventions or alter framework configuration. |
| A3 | Edit a marketing headline in app/page.tsx, with no routing/rendering work. | Does not activate solely because file glob matches. |
| A4 | Fix Pages Router getServerSideProps without migrating. | Does not impose App Router migration; distinguishes router. |

Behavioral evaluation budget: no paid API credits or global installation. Use existing Claude subscription only if no additional billing is required; otherwise record the limitation and complete static/example validation. Never equate this table or an author walkthrough with a model run.
