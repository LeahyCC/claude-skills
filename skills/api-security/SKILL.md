---
name: api-security
description: OWASP API Security Top 10 (2023) with production Next.js App Router code — access control, authentication, input validation, rate limiting, security headers, data exposure, supply chain, SSRF
metadata:
  filePattern:
    - "src/app/api/**/*.ts"
    - "app/api/**/*.ts"
    - "src/app/**/actions.ts"
    - "src/app/**/action.ts"
    - "app/**/actions.ts"
    - "app/**/action.ts"
    - "src/actions/**/*.ts"
    - "actions/**/*.ts"
    - "src/data/**/*.ts"
    - "data/**/*.ts"
    - "src/lib/auth*.ts"
    - "lib/auth*.ts"
    - "src/proxy.ts"
    - "proxy.ts"
    - "src/middleware.ts"
    - "middleware.ts"
    - "route.ts"
    - "next.config.ts"
    - "next.config.js"
    - "next.config.mjs"
  bashPattern:
    - "npm audit"
    - "npx audit"
    - "pnpm audit"
    - "semgrep"
    - "snyk"
    - "trufflehog"
    - "gitleaks"
  priority: 60
---

# API Security — OWASP API Security Top 10 (2023) for Next.js

Production-grade API security patterns for Next.js App Router. Covers every category in the OWASP API Security Top 10 (2023) with cross-references to the OWASP Web Top 10 (2021). Verified against the official OWASP specifications.

## Architecture

```
Request → proxy.ts (auth gate) → Route Handler / Server Action
                                       ↓
                                  Input Validation (Zod)
                                       ↓
                                  Data Access Layer (auth + authz + DTO)
                                       ↓
                                  Database (parameterized queries)
                                       ↓
                                  Filtered Response (DTO, no raw records)
```

The **Data Access Layer (DAL)** is the central security architecture recommended by Next.js. All database access, authorization checks, and response filtering happen in one `server-only` module — never in components or actions directly.

## Quick Reference

| Resource | OWASP API | OWASP Web | What It Covers |
|----------|-----------|-----------|----------------|
| [Access Control](resources/access-control.md) | API1, API5 | A01 | BOLA/IDOR, function-level auth, ownership checks |
| [Authentication](resources/authentication.md) | API2 | A07, A02 | Session management, JWT, Clerk/Auth0, proxy.ts |
| [Input Validation](resources/input-validation.md) | API3, API8 | A03 | Zod schemas, SQL injection, XSS, Server Action validation |
| [Rate Limiting](resources/rate-limiting.md) | API4 | A04 | Per-endpoint limits, cost attacks, Upstash patterns |
| [Security Headers](resources/security-headers.md) | API8 | A05 | CSP, HSTS, CORS, Permissions-Policy, next.config |
| [Data Exposure](resources/data-exposure.md) | API3, API6 | A04 | DAL pattern, DTOs, error sanitization, response filtering |
| [Supply Chain](resources/supply-chain.md) | API9, API10 | A06, A08 | Dependencies, env vars, CI/CD, third-party APIs |
| [SSRF & Logging](resources/ssrf-and-logging.md) | API7 | A09, A10 | URL validation, fetch safety, secure logging, audit trails |

## Decision Matrix: "Where Do I Add Security?"

| Layer | What to Check | Why |
|-------|--------------|-----|
| `proxy.ts` | Auth redirect, CSP nonce, rate limit headers | First line — blocks unauthenticated requests early |
| Route Handler (`route.ts`) | Auth + authz, input validation, CORS, CSRF | Public HTTP endpoint — treat as untrusted |
| Server Action (`'use server'`) | Auth + authz, input validation, return filtering | **Also a public HTTP endpoint** — not protected by the UI |
| Data Access Layer (`data/*.ts`) | Ownership checks, field filtering, parameterized queries | Last line — defense in depth |
| `next.config.ts` | Security headers, redirects, allowed image domains | Static security baseline |

## The #1 Mistake: Server Actions Are Public Endpoints

Every exported `'use server'` function is reachable via direct POST request. Page-level auth does NOT protect actions on that page.

```tsx
// FAIL — no auth check, anyone can call this via POST
'use server'
export async function deleteAccount(userId: string) {
  await db.delete(users).where(eq(users.id, userId))
}

// PASS — validates auth AND ownership inside the action
'use server'
import { getCurrentUser } from '@/data/auth'

export async function deleteAccount() {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  await db.delete(users).where(eq(users.id, user.id))
}
```

Notice: the PASS version doesn't accept `userId` as a parameter — it derives it from the session. This prevents IDOR (Insecure Direct Object Reference).

## Decision Matrix: "Is This Secure?"

| Question | If No → | Resource |
|----------|---------|----------|
| Does every Server Action re-verify auth? | Add `getCurrentUser()` check | [Access Control](resources/access-control.md) |
| Does every Route Handler validate input with Zod? | Add schema validation | [Input Validation](resources/input-validation.md) |
| Are database queries parameterized? | Use tagged templates or ORM | [Input Validation](resources/input-validation.md) |
| Does the response return only needed fields? | Add DTO layer | [Data Exposure](resources/data-exposure.md) |
| Are rate limits in place for auth endpoints? | Add Upstash/Arcjet | [Rate Limiting](resources/rate-limiting.md) |
| Are security headers configured? | Add to next.config.ts | [Security Headers](resources/security-headers.md) |
| Is `proxy.ts` checking auth before page access? | Add auth middleware | [Authentication](resources/authentication.md) |
| Are env vars only accessed in the DAL? | Move to server-only module | [Supply Chain](resources/supply-chain.md) |
| Does `fetch()` in server code validate URLs? | Add URL allowlist | [SSRF & Logging](resources/ssrf-and-logging.md) |
| Are errors sanitized before returning to client? | Return generic messages | [Data Exposure](resources/data-exposure.md) |

## OWASP API Security Top 10 (2023) — Full Mapping

| # | Category | Severity | Resource |
|---|----------|----------|----------|
| API1 | Broken Object Level Authorization (BOLA) | Critical | [access-control](resources/access-control.md) |
| API2 | Broken Authentication | Critical | [authentication](resources/authentication.md) |
| API3 | Broken Object Property Level Authorization | High | [input-validation](resources/input-validation.md), [data-exposure](resources/data-exposure.md) |
| API4 | Unrestricted Resource Consumption | High | [rate-limiting](resources/rate-limiting.md) |
| API5 | Broken Function Level Authorization | Critical | [access-control](resources/access-control.md) |
| API6 | Unrestricted Access to Sensitive Business Flows | Medium | [data-exposure](resources/data-exposure.md) |
| API7 | Server Side Request Forgery | High | [ssrf-and-logging](resources/ssrf-and-logging.md) |
| API8 | Security Misconfiguration | Medium | [security-headers](resources/security-headers.md), [input-validation](resources/input-validation.md) |
| API9 | Improper Inventory Management | Medium | [supply-chain](resources/supply-chain.md) |
| API10 | Unsafe Consumption of APIs | Medium | [supply-chain](resources/supply-chain.md) |

## OWASP Web Top 10 (2021) — Cross-Reference

| # | Category | Mapped To |
|---|----------|-----------|
| A01 | Broken Access Control | [access-control](resources/access-control.md) |
| A02 | Cryptographic Failures | [authentication](resources/authentication.md) |
| A03 | Injection | [input-validation](resources/input-validation.md) |
| A04 | Insecure Design | [rate-limiting](resources/rate-limiting.md), [data-exposure](resources/data-exposure.md) |
| A05 | Security Misconfiguration | [security-headers](resources/security-headers.md) |
| A06 | Vulnerable & Outdated Components | [supply-chain](resources/supply-chain.md) |
| A07 | Auth Failures | [authentication](resources/authentication.md) |
| A08 | Software & Data Integrity Failures | [supply-chain](resources/supply-chain.md) |
| A09 | Logging & Monitoring Failures | [ssrf-and-logging](resources/ssrf-and-logging.md) |
| A10 | SSRF | [ssrf-and-logging](resources/ssrf-and-logging.md) |

## Code Review Checklist

When reviewing API code in Next.js, verify:

- [ ] Every `'use server'` function checks auth — no exceptions
- [ ] No user-supplied IDs used for ownership — derive from session
- [ ] All inputs validated with Zod before use
- [ ] Database queries use parameterized queries or ORM
- [ ] Responses return DTOs, not raw database records
- [ ] Error messages don't leak stack traces, SQL, or internal paths
- [ ] Security headers set in `next.config.ts` (CSP, HSTS, X-Frame-Options)
- [ ] Rate limiting on auth endpoints and expensive operations
- [ ] `proxy.ts` gates auth before page/action access
- [ ] Environment variables accessed only in `server-only` modules
- [ ] No `fetch()` to user-controlled URLs without allowlist
- [ ] Dependencies audited — no known vulnerabilities
- [ ] `.env*.local` in `.gitignore`
