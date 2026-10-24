---
name: api-security
description: OWASP API Security Top 10 (2023) with production Next.js App Router code — access control, authentication, input validation, rate limiting, security headers, data exposure, supply chain, SSRF, and AI tools on those APIs
---

# API Security — OWASP API Security Top 10 (2023) for Next.js

Production-grade API security patterns for Next.js App Router. Covers every category in the OWASP API Security Top 10 (2023) with cross-references to the OWASP Web Top 10 (2025). AI tools attached to those APIs are in [AI Tools](resources/ai-tools.md). Verified against the official OWASP specifications.

## Architecture

```
Request → proxy.ts (logged-out redirect) → Route Handler / Server Action
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
| [Authentication](resources/authentication.md) | API2 | A07, A04 | Session management, JWT, Clerk/Auth0, proxy.ts |
| [Input Validation](resources/input-validation.md) | API3, API8 | A05 | Zod schemas, SQL injection, XSS, Server Action validation |
| [Rate Limiting](resources/rate-limiting.md) | API4 | A06 | Per-endpoint limits, cost attacks, Upstash patterns |
| [Security Headers](resources/security-headers.md) | API8 | A02 | CSP, HSTS, CORS, Permissions-Policy, next.config |
| [Data Exposure](resources/data-exposure.md) | API3, API6 | A06, A10 | DAL pattern, DTOs, error sanitization, response filtering |
| [Supply Chain](resources/supply-chain.md) | API9, API10 | A03, A08 | Dependencies, env vars, CI/CD, third-party APIs |
| [SSRF & Logging](resources/ssrf-and-logging.md) | API7 | A01, A09 | URL validation, fetch safety, secure logging, audit trails |
| [AI Tools](resources/ai-tools.md) | API1, API5 | A01 | Tool calls, session identity, signed approval, MCP |

## Decision Matrix: "Where Do I Add Security?"

| Layer | What to Check | Why |
|-------|--------------|-----|
| `proxy.ts` | Logged-out redirect, CSP nonce, rate limits | A cookie check here is not the authorization check |
| Route Handler (`route.ts`) | Auth + authz, input validation, CORS, CSRF | Public HTTP endpoint — treat as untrusted |
| Server Action (`'use server'`) | Auth + authz, input validation, return filtering | **Also a public HTTP endpoint** — not protected by the UI |
| Data Access Layer (`data/*.ts`) | Ownership checks, field filtering, parameterized queries | Last line — defense in depth |
| `next.config.ts` | Security headers, redirects, allowed image domains | Static security baseline |
| Tool `execute` (`lib/ai`) | Session user, one action, signed approval for writes | The model chooses the call. The session is the caller |

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
| Does the DAL reject a missing or revoked session? | Check in `getCurrentUser()`, not only in `proxy.ts` | [Authentication](resources/authentication.md) |
| Are env vars only accessed in the DAL? | Move to server-only module | [Supply Chain](resources/supply-chain.md) |
| Does `fetch()` in server code validate URLs? | Add URL allowlist | [SSRF & Logging](resources/ssrf-and-logging.md) |
| Are errors sanitized before returning to client? | Return generic messages | [Data Exposure](resources/data-exposure.md) |
| Does tool `execute` take the user from the session? | Remove `userId` from the tool schema | [AI Tools](resources/ai-tools.md) |
| Do write tools require an approval the client cannot forge? | Sign it, show the real arguments, spend it once for that user | [AI Tools](resources/ai-tools.md) |
| Is each MCP server pinned, with its own credential? | Name the tools. Do not forward the session | [AI Tools](resources/ai-tools.md) |

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

## OWASP Web Top 10 (2025) — Cross-Reference

| # | Category | Mapped To |
|---|----------|-----------|
| A01 | Broken Access Control (includes SSRF) | [access-control](resources/access-control.md), [ssrf-and-logging](resources/ssrf-and-logging.md) |
| A02 | Security Misconfiguration | [security-headers](resources/security-headers.md) |
| A03 | Software Supply Chain Failures | [supply-chain](resources/supply-chain.md) |
| A04 | Cryptographic Failures | [authentication](resources/authentication.md) |
| A05 | Injection | [input-validation](resources/input-validation.md) |
| A06 | Insecure Design | [rate-limiting](resources/rate-limiting.md), [data-exposure](resources/data-exposure.md) |
| A07 | Authentication Failures | [authentication](resources/authentication.md) |
| A08 | Software or Data Integrity Failures | [supply-chain](resources/supply-chain.md) |
| A09 | Security Logging and Alerting Failures | [ssrf-and-logging](resources/ssrf-and-logging.md) |
| A10 | Mishandling of Exceptional Conditions | [data-exposure](resources/data-exposure.md) |

## AI tools — where they map

The model is a component until it can call a tool. After that, the agentic list applies. This skill covers the tool call on a Next.js route, in [AI Tools](resources/ai-tools.md). Token spend stays in [rate-limiting](resources/rate-limiting.md).

| Risk | Resource |
|------|----------|
| LLM01 Prompt Injection, LLM03 Excessive Agency, LLM10 Improper Output Handling | [ai-tools](resources/ai-tools.md) |
| LLM06 Unbounded Consumption | [rate-limiting](resources/rate-limiting.md) |
| ASI01 Goal Hijack, ASI02 Tool Misuse, ASI03 Identity and Privilege Abuse, ASI05 Unexpected Code Execution, ASI09 Human-Agent Trust Exploitation | [ai-tools](resources/ai-tools.md) |
| ASI04 Agentic Supply Chain (MCP server, tool definitions) | [ai-tools](resources/ai-tools.md), [supply-chain](resources/supply-chain.md) |

Poisoned training data, embedding stores, cross-session memory, and agents talking to each other are outside this skill.

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
- [ ] `proxy.ts` may redirect logged-out page loads. Every action still checks the session
- [ ] Environment variables accessed only in `server-only` modules
- [ ] No `fetch()` to user-controlled URLs without allowlist
- [ ] Dependencies audited — no known vulnerabilities
- [ ] `.env*.local` in `.gitignore`
- [ ] Tool `execute` reads the user from the session, not from arguments
- [ ] Writes, payments, and sends use a signed tool approval, shown as the real arguments, and spent once for that user
- [ ] MCP tools are a named list. The server has its own credential, not the user's session
- [ ] Memory, compaction, install-time AI dependencies, and repo agent config follow [llm-agent-security](../llm-agent-security/SKILL.md)

For deployment-key, GraphQL enforcement and optional provider guidance, see the scoped [source review](SOURCES.md); use the target application's installed versions and configuration.
