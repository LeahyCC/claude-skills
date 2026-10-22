# Validation evidence and limits

Run date: 2026-10-21, Pacific/Honolulu. Author-reviewed results; no independent human grading or repeated-run variance estimate.

## Actual Claude behavioral comparison

Used local Claude Code **2.1.292**, signed-in Max subscription/OAuth, provider firstParty. Removed API/provider credential environment overrides for the child process; no separate API credentials or billing settings were added. CLI USD values in the JSON are estimated usage telemetry, not a statement of paid charges. The initial zero-dollar probe failed because the CLI requires a positive budget; it made no model request. User then explicitly approved the subscription pilot.

The CLI chose **claude-fable-5-1** from the user's existing default; the harness did not override the model. Each invocation had a $1 estimated-usage cap, 180s timeout, read-only Read/Glob/Grep/Skill tools, dontAsk permissions, empty strict MCP configuration, disabled hooks/memory, project settings only, and no session persistence. No shell/edit/network tools were offered. Skills were copied into isolated project-local `.claude/skills` folders, not user-wide installations. Other global Claude implementation behavior was not audited; this is bounded isolation, not a security sandbox.

Each variant got the same five maintenance prompts and four selection prompts, recorded before revision in tasks.md. Technical requests were advisory/code-sketch tasks with stated project versions/configuration; there was no full application in the model fixture. Therefore this tests use of instructions, not successful execution of a real app change. Skill calls and resource reads were observed in the stream traces. Exact final outputs/tool selections and CLI telemetry are in evaluation-results.json. Raw traces remain in the chat's work/nextjs-pilot/eval scratch directory.

An initial combined baseline technical prompt hit its $1 cap and produced no final result. The corresponding combined revised result is excluded too. Both are retained as evidence, not scored as a fair pair. Five smaller task prompts then completed for both variants. The first revised T5 answer overgeneralized boundary placement and blurred image API introduction with error API versions. A narrow clarification was added and T5 rerun; both outputs are retained. This tuning on a known case is not a held-out test.

| Predeclared case | Baseline observed | Revised observed / limit |
| --- | --- | --- |
| T1: 16.0, no Cache Components, personal account + polling | Preserved config, checked auth near data, kept polling; incorrectly claimed updateTag unavailable with the flag off and prescribed additional Proxy | Preserved mode, no unnecessary Proxy, protected handler ownership and personal reads; correctly said no invalidation needed for uncached data. No real endpoint/auth helper executed by Claude |
| T2: cached catalog, action and signed webhook | Correct action updateTag and webhook max; insisted explicit cacheLife always | Correct freshness split, ownership/input checks, raw-body signature boundary; default lifetime permitted. Exact app config inspection untestable in empty fixture for both |
| T3: one Next 15 Pages route migration | Preserved wrappers and no immediate upgrade; incorrectly said a future 16 upgrade requires swapping ISR to use cache | Preserved wrappers, async params, hourly fetch ISR and supported mode without feature adoption. Did not build a Next 15 application |
| T4: feed/photo modal | Repeated incorrect (.) prefix under feed for root /photo; omitted a clearing catch-all | Correctly detected wrong path, proposed root slot tree/default/catch-all, tested scenario list includes history and reload. Concrete tree independently built and browser-smoked below |
| T5: unspecified 16 minor, recovery + hero | Recognized minor uncertainty, but recommended priority as universal, exactly one priority image and overstated layout stability | After clarification correctly separated reset / 16.2 unstable_retry / 16.3 retry and all-16 priority deprecation; correct same-segment page boundary and parent-layout distinction. Still adds a categorical “don't ship unstable_retry” recommendation not required by the skill: model output is not error-free |
| A1: App Router stale action cache | Skill invoked; caching resource read | Skill invoked; caching resource read |
| A2: Vite rerenders | No Skill invocation | No Skill invocation |
| A3: copy-only headline in app/page.tsx | No Skill invocation | No Skill invocation |
| A4: Pages null check, no migration | No Skill invocation | No Skill invocation |

Residuals in revised T5 are graded as model overstatements, not endorsed guidance: “sibling layout” is ambiguous without saying it is the same segment's layout; always showing digest rather than message overreaches (safe client messages may be appropriate, and a digest may be absent); deprecation does not guarantee a development warning; and the optimizer quality sentence fails to distinguish Image component mapping to an allowed quality from direct optimizer requests returning 400. The skill itself distinguishes these scopes more carefully. No further retries were used to erase these residuals.

Observed selection accuracy on these four prompts was 4/4 for each variant. There is no demonstrated selection improvement; the revised description makes scope clearer while retaining these observed decisions. No numeric aggregate quality score is claimed for subjective technical answers. Baseline already handled several tasks well; improvements are specific corrections, not proof of general superiority.

## Static and example execution

- Bundled skill-creator quick_validate.py: PASS using PyYAML 6.0.3 in a work-local venv. Initial system Python lacked yaml; no global package was installed.
- Frontmatter valid; retained metadata patterns/priority unchanged. All 34 local Markdown links resolved in the repository; optional SEO/license/maintenance links are outside the single-skill folder and have runtime official-source fallbacks where relevant.
- Both JSON catalogs parse; this does not validate their existing Claude plugin schema. Only this skill's description/source claim changed.
- Extracted all **13 TypeScript/TSX code fences**, compiled with TypeScript **5.9.3**, Next **16.4.2**, React/React DOM **19.2.0** and local type packages. PASS. Application DB/auth/CMS helpers are explicitly typed fixture stubs: compilation proves syntax/API shapes, not real auth, ORM semantics or provider signature correctness.
- Production webpack build of a concrete root-slot photo/feed fixture: PASS with Cache Components off, then PASS with cacheComponents + partialPrefetching on. Build logs retained. The build includes documented root modal layout and 16.3+ error boundary. It does not execute every documentation snippet as a route.
- Browser smoke against cache-on next start: /feed link opens /photo/123 as Modal 123 over feed; Back closes; Forward restores; reload shows full Photo 123. PASS. Focus trapping/escape/close controls and soft navigation to an unrelated route were not exercised; this fixture is routing-only, not an accessible dialog implementation.
- Direct HTTP: feed/photo 200, unmatched URL 404, two request cookie identities show only their own fixture account text, and no cookie shows Sign in. PASS. This is an uncached personalization rendering check, not production authentication or a private-cache isolation test. Cookie identities are disposable test labels.
- git diff --check: PASS. Other skill content and pending PR branches were not changed. Branch has no upstream; no commit or push created.

## Reproduce and remaining checks

The output bundle includes the example fixture sources, package manifest/lock, copied evaluation harness and exact prompts. Install its dependencies locally with npm ci --ignore-scripts; use the recorded Node/runtime and local package manager as appropriate. Run tsc --noEmit, next build --webpack with PILOT_CACHE unset, then PILOT_CACHE=1, followed by next start. CLI evaluation depends on available Claude subscription and limits; inspect billing context before repeating. Runtime tests use 127.0.0.1 port 32419 in this run.

Before broad adoption, run held-out repository editing tasks and repeat across intended Claude models. Exercise actual project DB/auth/provider webhook integration, cached write freshness/expiry across instances, private-cache behavior including sign-out, and older supported Next minors/Next 15. Benchmark token usage/reliability over repeated runs before attributing gains to shorter instructions. Full installer/plugin schema compatibility and repo-wide trigger-claim cleanup remain separate scoped work.
