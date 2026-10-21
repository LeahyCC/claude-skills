# api-security

OWASP API Security Top 10 (2023) with production Next.js App Router code. Covers access control, authentication, input validation, rate limiting, security headers, data exposure, supply chain, and SSRF — with FAIL/PASS examples for every pattern.

## Install

```bash
npx skills add LeahyCC/claude-skills@api-security
```

## What It Does

**When editing API code** (Route Handlers, Server Actions, middleware, auth modules, next.config), this skill provides:

- **Production Next.js patterns** — real `proxy.ts`, Route Handler, Server Action, and DAL code
- **OWASP API Security Top 10 (2023)** — every category covered with prevention code
- **OWASP Web Top 10 (2025)** — cross-referenced to API-specific resources
- **FAIL/PASS side-by-side** — see the vulnerability and the fix together
- **Audit commands**: grep and find patterns to scan your codebase for each vulnerability class

## What it catches

```tsx
// Public HTTP endpoint. The caller picks the id.
'use server'
export async function deleteAccount(userId: string) {
  await db.delete(users).where(eq(users.id, userId))
}

// User id comes from the session.
'use server'
export async function deleteAccount() {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  await db.delete(users).where(eq(users.id, user.id))
}
```

```tsx
// Unvalidated JSON. `{ "role": "admin" }` is written straight through.
export async function PATCH(request: Request) {
  const body = await request.json()
  await db.update(users).set(body)
}

// Explicit fields. Unknown keys are rejected.
const UpdateSchema = z.strictObject({
  name: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
})
```

## Coverage

| Resource | OWASP API | OWASP Web | Key Topics |
|----------|-----------|-----------|------------|
| [Access Control](resources/access-control.md) | API1 (BOLA), API5 (BFLA) | A01 | Ownership checks, IDOR prevention, RBAC, CORS, multi-tenant |
| [Authentication](resources/authentication.md) | API2 | A07, A04 | Session management, JWT, Clerk patterns, proxy.ts, CVE-2025-29927, webhooks |
| [Input Validation](resources/input-validation.md) | API3, API8 | A05 | Zod schemas, SQL injection, XSS, mass assignment, path traversal |
| [Rate Limiting](resources/rate-limiting.md) | API4 | A06 | Upstash patterns, per-endpoint limits, cost attacks, AI budget limiting |
| [Security Headers](resources/security-headers.md) | API8 | A02 | CSP (nonce + SRI + static), HSTS, CORS, CSRF, Cache-Control |
| [Data Exposure](resources/data-exposure.md) | API3, API6 | A06, A10 | DAL pattern, DTOs, error sanitization, response filtering, pagination |
| [Supply Chain](resources/supply-chain.md) | API9, API10 | A03, A08 | Dependency audit, env vars, CI/CD, third-party API validation |
| [SSRF & Logging](resources/ssrf-and-logging.md) | API7 | A01, A09 | URL validation, fetch safety, structured logging, log injection |

## What's Different

| Other security skills | api-security |
|---|---|
| Python-only or framework-agnostic pseudocode | **Production Next.js App Router code** (Server Actions, Route Handlers, proxy.ts) |
| OWASP Web Top 10 only | **Both** OWASP API Security Top 10 (2023) **and** Web Top 10 (2025) |
| Checklists and recommendations | **FAIL/PASS code examples** — see the vulnerability and the fix |
| No DAL coverage | **Data Access Layer** — Next.js's official security architecture |
| Audit/review focused | **Prevention focused** — write secure code from the start |
| No awareness of Server Actions as public endpoints | **#1 pattern covered** — every action must verify auth |

## OWASP API Security Top 10 (2023) — Full Mapping

| # | Category | Resource |
|---|----------|----------|
| API1 | Broken Object Level Authorization (BOLA) | [access-control](resources/access-control.md) |
| API2 | Broken Authentication | [authentication](resources/authentication.md) |
| API3 | Broken Object Property Level Authorization | [input-validation](resources/input-validation.md), [data-exposure](resources/data-exposure.md) |
| API4 | Unrestricted Resource Consumption | [rate-limiting](resources/rate-limiting.md) |
| API5 | Broken Function Level Authorization | [access-control](resources/access-control.md) |
| API6 | Unrestricted Access to Sensitive Business Flows | [data-exposure](resources/data-exposure.md) |
| API7 | Server Side Request Forgery | [ssrf-and-logging](resources/ssrf-and-logging.md) |
| API8 | Security Misconfiguration | [security-headers](resources/security-headers.md), [input-validation](resources/input-validation.md) |
| API9 | Improper Inventory Management | [supply-chain](resources/supply-chain.md) |
| API10 | Unsafe Consumption of APIs | [supply-chain](resources/supply-chain.md) |

## Verified Against

- [OWASP API Security Top 10 (2023)](https://owasp.org/API-Security/editions/2023/en/0x11-t10/)
- [OWASP Top 10 (2025)](https://owasp.org/Top10/2025/)
- [Next.js Security Guide](https://nextjs.org/docs/app/guides/data-security)
- [Next.js Security Blog — Server Components and Actions](https://nextjs.org/blog/security-nextjs-server-components-actions)
- [Vercel Conformance — Security Headers](https://vercel.com/docs/workflow-collaboration/conformance/rules/NEXTJS_MISSING_SECURITY_HEADERS)

Last verified: October 2026
