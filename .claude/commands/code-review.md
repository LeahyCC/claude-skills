# Code Review — Deep & Thorough

OWASP-mapped, skill-aware code review with autofix suggestions. Reviews the diff, not the world.

## Phase 1: Gather Context (30 seconds max)

Run these in parallel:
- `git diff --staged --unified=5` and `git diff --unified=5` — the actual changes
- `git diff --staged --name-only` and `git diff --name-only` — changed file list
- `git log --oneline -5` — recent commits for intent context
- If no diff exists, use `git diff HEAD~1 --unified=5` instead

**Scope rule:** Only review changed lines and their immediate context (5 lines above/below). Never flag issues in unchanged code unless they are CRITICAL security vulnerabilities introduced by the change's new dependencies.

## Phase 2: Classify Changed Files

For each changed file, tag it with applicable review domains:

| File Pattern | Tags | Review Focus |
|---|---|---|
| `route.ts`, `api/**` | `api`, `security` | OWASP API1-10, auth, input validation, CORS |
| `actions.ts`, `action.ts`, `**/actions/**` | `server-action`, `security` | Auth in every action, input validation, IDOR |
| `proxy.ts`, `middleware.ts` | `middleware`, `security` | Auth gate, CSP, rate limiting |
| `*.tsx`, `*.jsx` | `react` | Hooks, a11y, rendering, client/server boundary |
| `next.config.*` | `config`, `security` | Security headers, image domains, redirects |
| `data/**`, `lib/db*`, `lib/auth*` | `dal`, `security` | DAL pattern, parameterized queries, DTOs |
| `*.test.*`, `*.spec.*` | `test` | Coverage, assertion quality, mocking patterns |
| `package.json`, `pnpm-lock.*`, `package-lock.*` | `deps` | New dependencies, version changes, audit |
| `*.css`, `*.scss`, `tailwind.*` | `styles` | a11y (contrast, motion), reflow |
| `*.sql`, `migrations/**` | `database` | Injection, permissions, rollback safety |

## Phase 3: Security Review (OWASP-Mapped)

For every file tagged `security`, `api`, `server-action`, `middleware`, or `dal`, check against these OWASP categories. Cite the category ID in every finding.

### CRITICAL — Must Block

| Check | OWASP | What to Look For |
|---|---|---|
| **Auth in Server Actions** | API1, API2 | Every `'use server'` export must call `getCurrentUser()` or equivalent auth check. No exceptions. Server Actions are public HTTP endpoints. |
| **IDOR / BOLA** | API1 | User-supplied IDs used directly in queries without ownership verification. Look for route params or form data flowing into `WHERE id = ?` without `AND userId = ?`. |
| **Hardcoded secrets** | API8, A05 | API keys, tokens, passwords, connection strings in source. Regex: `(sk_live\|sk_test\|password\s*=\s*['"][^'"]+['"]|\bey[A-Za-z0-9_-]{20,}\b)` |
| **SQL injection** | A03 | String concatenation/interpolation in SQL. Look for `` `...${var}...` `` in raw SQL (tagged templates like `` sql`...${var}` `` are safe). |
| **XSS** | A03 | `dangerouslySetInnerHTML` without DOMPurify. User input in `href` attributes (javascript: protocol). |
| **Missing input validation** | API3, API8 | Route Handlers accepting `request.json()` without Zod/schema validation. Server Actions accepting unvalidated params. |
| **Mass assignment** | API3 | Spreading request body directly into database updates: `db.update().set(body)`. Must use `.strict()` Zod schema. |
| **SSRF** | API7 | Server-side `fetch()` with user-controlled URLs without allowlist validation. |
| **Path traversal** | A03 | User input in `fs.readFile()`, `path.join()` without `path.resolve()` + prefix check. |
| **Auth bypass** | API2, API5 | Route Handlers without auth checks. Admin endpoints without role verification. |

### HIGH — Should Fix

| Check | OWASP | What to Look For |
|---|---|---|
| **Missing rate limiting** | API4 | Auth endpoints, password reset, OTP, AI/LLM, or file upload endpoints without rate limiting. |
| **Data over-exposure** | API3, API6 | Returning raw database records instead of DTOs. `SELECT *` in user-facing queries. Error messages exposing stack traces or SQL. |
| **Wildcard CORS** | API8, A05 | `Access-Control-Allow-Origin: *` or reflecting the Origin header back. |
| **Missing security headers** | API8, A05 | `next.config` without CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy. |
| **Insecure cookies** | API2 | Cookies set without `httpOnly`, `secure`, `sameSite`. |
| **Unverified webhooks** | API2 | Incoming webhook handlers without signature verification. |
| **Missing CSRF on Route Handlers** | A05 | State-changing Route Handlers (POST/PUT/DELETE) without Origin/Host verification. Server Actions have built-in CSRF — Route Handlers do not. |
| **Env var exposure** | API8 | `NEXT_PUBLIC_` prefix on secrets. `process.env` accessed outside `server-only` modules. |

## Phase 4: Code Quality Review

For all changed files:

### HIGH

| Check | Detect | Autofix Pattern |
|---|---|---|
| **Function > 50 lines** | Count lines between `function`/`=>` and closing brace | Suggest extraction with names |
| **File > 500 lines** | Line count | Suggest module split by responsibility |
| **Nesting > 4 levels** | Indent depth | Show early return refactor |
| **Empty catch blocks** | `catch {` or `catch (e) {` with empty body | Add `console.error` or rethrow |
| **Console.log in production** | `console.log(` but NOT `console.error(` or `console.warn(` | Remove or replace with structured logger |
| **Unused imports** | Import not referenced in file | Remove the import line |
| **Dead code** | Commented-out code blocks (>3 lines) | Remove entirely |

### React/Next.js (if tagged `react`)

| Check | Detect | Autofix |
|---|---|---|
| **Missing hook deps** | `useEffect`/`useMemo`/`useCallback` with `[]` but referencing outer variables | Add missing deps to array |
| **State update in render** | `setState` call outside event handler/effect | Move to useEffect or event handler |
| **Index as key** | `.map((item, i) => <X key={i}` with reorderable list | Use `item.id` |
| **Client directive in Server Component** | `useState`/`useEffect` without `'use client'` | Add directive or restructure |
| **Missing error boundary** | Async data fetching without `error.tsx` | Create error boundary |
| **Missing loading state** | `Suspense` usage without fallback, or async without loading UI | Add loading.tsx or Suspense fallback |

### Backend (if tagged `api`, `dal`, `database`)

| Check | Detect | Autofix |
|---|---|---|
| **N+1 queries** | Query inside a loop (`.map`, `for`, `forEach` containing `await db.`) | Show JOIN or batch alternative |
| **Unbounded queries** | `SELECT` / `findMany` without `.limit()` | Add pagination with server-side limit |
| **Missing timeout** | `fetch()` without `signal: AbortSignal.timeout()` | Add 5s timeout |
| **Error leakage** | `error.message` or `error.stack` in Response.json | Return generic message, log internally |

## Phase 5: Dependency Review (if `package.json` changed)

1. Run `npm audit --json 2>/dev/null | head -100` (or pnpm equivalent)
2. Check for new dependencies — are they necessary? Are there lighter alternatives?
3. Flag known problematic packages (e.g., `moment` → `date-fns`, `lodash` full import → specific imports)

## Phase 6: Autofix Suggestions

For every HIGH+ finding, provide a concrete fix as a diff:

```
[CRITICAL] API1: Server Action missing auth check
File: src/app/dashboard/actions.ts:15
OWASP: API1 (Broken Object Level Authorization)

- export async function deleteProject(projectId: string) {
-   await db.delete(projects).where(eq(projects.id, projectId))
- }
+ export async function deleteProject(projectId: string) {
+   const user = await getCurrentUser()
+   if (!user) throw new Error('Unauthorized')
+   await db.delete(projects).where(
+     and(eq(projects.id, projectId), eq(projects.ownerId, user.id))
+   )
+ }
```

## Phase 7: Pattern Detection

After completing the review, check for recurring patterns:

- If the same issue appears in 3+ files → suggest a lint rule or shared utility
  - Missing auth → suggest an `withAuth()` wrapper or middleware pattern
  - Missing validation → suggest a shared validation middleware
  - Raw DB access → suggest enforcing DAL pattern

## Output Format

### Finding Format

```
[SEVERITY] OWASP-ID: Short title
Risk: [risk assessment — see Risk Quality section below]
File: path/to/file.ts:line
Issue: What's wrong and why it matters.

- old code
+ fixed code

💡 Pattern: If this occurs in 3+ places, suggest lint rule or abstraction.
```

## Risk Quality

Every finding MUST include a risk assessment that explains the real-world impact. This is what separates a useful review from a checkbox exercise.

### Risk Dimensions

For each finding, evaluate and state:

| Dimension | Question | Examples |
|---|---|---|
| **Exploitability** | How easy is this to exploit? | "Trivially exploitable via browser DevTools" vs "Requires network access + valid session" |
| **Blast Radius** | What's the worst-case damage? | "Full database read" vs "One user's display name leaked" |
| **Likelihood** | How likely is this to be hit? | "Every unauthenticated request" vs "Only if attacker knows internal API shape" |
| **Detectability** | Would we know if it was exploited? | "No logging — silent exfiltration" vs "Would trigger 500 errors in monitoring" |

### Severity Definitions with Risk Context

**CRITICAL** — Exploitable now, high blast radius, likely to be found.
```
Risk: Exploitable by any unauthenticated user via direct POST. Full database
write access. No logging would detect this. This is a P0 — attackers actively
scan for unprotected Server Actions.
```

**HIGH** — Exploitable with some effort, significant impact, plausible attack path.
```
Risk: Requires authenticated session but allows horizontal privilege escalation
to any other user's data. Moderate blast radius (single user's PII per request).
Detectable in access logs if monitored.
```

**MEDIUM** — Exploitable in specific conditions, limited impact, or defense-in-depth gap.
```
Risk: Missing rate limit on search endpoint. Low individual impact but enables
scraping at scale. Unlikely to cause data breach but could increase infrastructure
costs 10-50x under sustained automated abuse.
```

**LOW** — Theoretical risk, minimal impact, or already mitigated by other controls.
```
Risk: Console.log includes request ID which could aid debugging by an attacker
who already has server log access. Mitigated by Vercel's log retention policy.
Cleanup issue, not a vulnerability.
```

### Risk-Aware Consolidation

When consolidating repeated issues, aggregate the risk:
```
[HIGH] API1: 5 Server Actions missing auth checks
Risk: Each action is independently exploitable via direct POST. Combined blast
radius: full CRUD on projects, teams, and billing tables. Estimated 12 distinct
data operations exposed. This is a systemic pattern — recommend withAuth() wrapper
to prevent recurrence.
Files: actions/projects.ts:15, actions/teams.ts:8, actions/teams.ts:22,
       actions/billing.ts:11, actions/billing.ts:35
```

### Risk Escalation Signals

Automatically escalate severity by one level if:
- The vulnerability is in an **auth/payment/PII** code path
- There is **no logging** that would detect exploitation
- The endpoint is **publicly reachable** (no auth required)
- The same class of vulnerability appears in **3+ locations** (systemic, not a typo)

Automatically de-escalate severity by one level if:
- Another control already mitigates the risk (e.g., proxy.ts auth check covers the route)
- The code is behind a feature flag that's currently disabled
- The endpoint is internal-only (not exposed to the internet)

### Summary

```
## Review Summary

| Severity | Count | Status | Top Risk |
|----------|-------|--------|----------|
| CRITICAL | 0     | pass   | — |
| HIGH     | 2     | warn   | Unauthed Server Actions — full DB write access |
| MEDIUM   | 3     | info   | Missing rate limits on auth endpoints |
| LOW      | 1     | note   | Debug logging in production path |

Risk Profile: [ATTACK SURFACE — e.g., "3 public endpoints, 5 authed endpoints, 2 internal"]
Verdict: APPROVED / WARNING / BLOCKED

OWASP Coverage: [list which OWASP categories were checked based on file types]
Files Reviewed: X changed files (Y lines added, Z lines removed)
```

## Confidence Rules

- **Report** only findings >85% confidence (higher bar than default — precision over recall)
- **Never flag** style preferences unless they violate project CLAUDE.md conventions
- **Consolidate** repeated issues: "5 Server Actions missing auth" not 5 separate findings
- **Distinguish** intentional patterns from bugs — check if the "issue" is handled elsewhere in the file
- **Check imports** before flagging missing auth — the function may use a wrapper that handles it

## Verdict Criteria

- **APPROVED** — No CRITICAL or HIGH findings
- **WARNING** — HIGH findings only, with autofixes provided. Can proceed with fixes.
- **BLOCKED** — CRITICAL findings. Must fix before any commit.
