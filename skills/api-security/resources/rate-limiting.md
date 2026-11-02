# Rate Limiting

> OWASP API4:2023 (Unrestricted Resource Consumption), A06:2025 (Insecure Design)

APIs without rate limits are vulnerable to brute force, credential stuffing, cost attacks (SMS/email abuse), and denial of service. Next.js does not include built-in rate limiting — you must implement it.

The numbers below are starting points. OWASP does not publish them.

## Contents

- [Where to Rate Limit](#where-to-rate-limit)
- [Upstash Redis Rate Limiting](#upstash-redis-rate-limiting)
- [Per-Account Login Throttling](#per-account-login-throttling)
- [Rate Limiting in proxy.ts](#rate-limiting-in-proxyts)
- [Cost Attack Prevention](#cost-attack-prevention)
- [Algorithm Comparison](#algorithm-comparison)
- [Rate Limit Headers](#rate-limit-headers)
- [GraphQL Rate Limiting](#graphql-rate-limiting)
- [Audit Patterns](#audit-patterns)
- [Sources](#sources)

## Where to Rate Limit

| Endpoint Type | Why | Strictness |
|---------------|-----|------------|
| Login / auth | Brute force, credential stuffing | Strict (5-10/min) per IP, plus failures per account |
| Password reset | Account takeover, SMS/email cost | Very strict (3-5/hour) |
| Signup | Spam accounts | Moderate (10-20/hour) |
| OTP / verification | Cost attack (SMS at $0.05 each) | Very strict (3/hour) |
| File upload | Storage abuse, compute cost | Moderate (20-50/hour) |
| AI / LLM endpoints | Token cost ($$$) | Budget-based |
| Search / list | Scraping, compute cost | Moderate (60-120/min) |
| General API | Fair usage | Lenient (100-1000/min) |

## Upstash Redis Rate Limiting

The standard approach for Vercel deployments. Serverless-compatible, per-region.

```bash
npm install @upstash/ratelimit @upstash/redis
```

### Basic Setup

```tsx
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

// Different limiters for different endpoints
export const authLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),  // 5 requests per minute
  analytics: true,
  prefix: 'ratelimit:auth',
})

export const resetLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 h'),  // 5 password resets per hour
  analytics: true,
  prefix: 'ratelimit:reset',
})

export const apiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '1 m'),  // 60 requests per minute
  analytics: true,
  prefix: 'ratelimit:api',
})

export const uploadLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(20, '1 h'),  // 20 uploads per hour
  analytics: true,
  prefix: 'ratelimit:upload',
})

// Vercel overwrites x-forwarded-for, so a single value is the client.
// Off Vercel the left-most value is client-controlled. Take the right-most, the one the proxy appended.
// A missing header uses the shared key 'unknown'.
export function clientIp(headerList: Headers): string {
  const forwarded = headerList.get('x-forwarded-for')
  if (!forwarded) return 'unknown'
  const parts = forwarded.split(',').map((part) => part.trim()).filter(Boolean)
  return parts.at(-1) ?? 'unknown'
}
```

### Rate Limiting in Route Handlers

```tsx
// app/api/auth/login/route.ts
import { authLimiter, clientIp } from '@/lib/rate-limit'
import { headers } from 'next/headers'

export async function POST(request: Request) {
  const headerList = await headers()
  const ip = clientIp(headerList)

  const { success, limit, remaining, reset } = await authLimiter.limit(ip)

  if (!success) {
    return Response.json(
      { error: 'Too many requests. Try again later.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
          'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      }
    )
  }

  // Process login...
}
```

### Rate Limiting in Server Actions

Server Actions don't expose the `Request` object, so extract the IP from headers.

```tsx
// FAIL — no rate limiting on password reset
'use server'
export async function requestPasswordReset(email: string) {
  // Attacker calls this 10,000 times → $500 in SMS/email costs
  await sendResetEmail(email)
}

// PASS — rate limited by IP
'use server'
import { headers } from 'next/headers'
import { resetLimiter, clientIp } from '@/lib/rate-limit'

export async function requestPasswordReset(email: string) {
  const headerList = await headers()
  const ip = clientIp(headerList)

  const { success } = await resetLimiter.limit(ip)
  if (!success) {
    return { error: 'Too many requests. Try again later.' }
  }

  // Always return success to prevent account enumeration
  const [user] = await db.select().from(users).where(eq(users.email, email))
  if (user) await sendResetEmail(user.email)
  return { success: 'If an account exists, a reset email has been sent.' }
}
```

### Authenticated Rate Limiting

For logged-in users, rate limit by user ID instead of IP. This is more accurate — multiple users can share an IP (corporate NAT), and one user can use multiple IPs (VPN).

```tsx
'use server'
import { getCurrentUser } from '@/data/auth'
import { apiLimiter } from '@/lib/rate-limit'

export async function createPost(input: unknown) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const { success } = await apiLimiter.limit(`user:${user.id}`)
  if (!success) {
    return { error: 'Rate limit exceeded. Please slow down.' }
  }

  // Create post...
}
```

## Per-Account Login Throttling

An IP limit alone misses credential stuffing. The attacker spreads one password list across thousands of proxy IPs, so each IP stays under the limit. Count failures per account as well. Then rotating IPs does not help.

A hard lockout turns that counter into a weapon: anyone who knows an email address can lock its owner out. So slow the account down instead of shutting it.

| Rule | Why |
|------|-----|
| Key the failure counter on the normalised account name | Rotating IPs does not reset it |
| Count failures only, and clear the count on success | A real user who types well is never slowed |
| Back off (delay, then CAPTCHA), not a permanent lock | Someone else's failures cannot lock the owner out |
| Same message for wrong password, throttled, or no account | The response does not reveal which accounts exist |
| Keep the password reset path open while throttled | The owner always has a way back in |
| Alert the user when the password was right but MFA failed | Their password is known to someone else |

```tsx
// lib/rate-limit.ts (continued)
// Per account: 10 failures an hour. Per IP stays as authLimiter above.
export const accountFailLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  prefix: 'ratelimit:login-fail',
})
```

```tsx
// FAIL: IP limit only. 5,000 proxies times 5 tries a minute each.
const { success } = await authLimiter.limit(ip)

// FAIL: hard lockout after 5 failures. Anyone can lock any account.
if (user.failedLogins >= 5) await db.update(users).set({ locked: true })

// PASS: app/login/actions.ts
'use server'
import { headers } from 'next/headers'
import { z } from 'zod'
import { accountFailLimiter, authLimiter, clientIp } from '@/lib/rate-limit'

const LoginSchema = z.object({ email: z.email(), password: z.string().min(1).max(1024) })
const GENERIC = 'Invalid email or password'

export async function login(formData: FormData) {
  const parsed = LoginSchema.safeParse({ email: formData.get('email'), password: formData.get('password') })
  if (!parsed.success) return { error: GENERIC }

  const email = parsed.data.email.toLowerCase()
  const ip = clientIp(await headers())

  const byIp = await authLimiter.limit(ip)
  if (!byIp.success) return { error: 'Too many attempts. Try again later.' }

  // getRemaining reads the count without spending a token
  const { remaining } = await accountFailLimiter.getRemaining(email)
  if (remaining <= 0) {
    // Throttled: same message, and the reset link still works.
    return { error: GENERIC, captchaRequired: true }
  }

  const [user] = await db.select().from(users).where(eq(users.email, email))
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    await accountFailLimiter.limit(email) // spend one token per failure only
    return { error: GENERIC }
  }

  await accountFailLimiter.resetUsedTokens(email)
  await startMfaOrSession(user.id) // MFA next: see authentication.md
}
```

The `captchaRequired` flag lets the form ask for a challenge on the next try. OWASP calls CAPTCHA defence in depth, not a fix, so it slows a bot without blocking the owner. Multi-factor authentication is the strongest defence against credential stuffing. Check new passwords against a breached-password list too.

## Rate Limiting in proxy.ts

This matcher only covers `/api/`. A Server Action posts to the page path, so this check misses it.

```tsx
// proxy.ts
import { NextRequest, NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { clientIp } from '@/lib/rate-limit'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 m'),
})

export async function proxy(request: NextRequest) {
  // Server Actions POST to the page path, so this does not see them.
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = clientIp(request.headers)

    const { success, limit, remaining, reset } = await ratelimit.limit(ip)

    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        }
      )
    }
  }

  return NextResponse.next()
}
```

## Cost Attack Prevention

Cost attacks target endpoints that trigger paid services (SMS, email, AI tokens, cloud storage).

```tsx
// FAIL — no limit on AI endpoint, each call costs ~$0.10
export async function POST(request: Request) {
  const { prompt } = await request.json()
  const result = await generateText({
    model: 'anthropic/claude-sonnet-4.6',
    prompt,
  })
  return Response.json({ text: result.text })
}

// PASS — budget-aware rate limiting
import { Ratelimit } from '@upstash/ratelimit'

const aiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.tokenBucket(100, '1 d', 100),  // 100 tokens per day, refill 100/day
  prefix: 'ratelimit:ai',
})

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // Estimate token cost before calling AI
  const { prompt } = CreatePromptSchema.parse(await request.json())
  const estimatedTokens = Math.ceil(prompt.length / 4)

  const { success } = await aiLimiter.limit(`ai:${user.id}`, {
    rate: estimatedTokens,  // consume estimated tokens from bucket
  })
  if (!success) {
    return Response.json(
      { error: 'Daily AI usage limit reached.' },
      { status: 429 }
    )
  }

  const result = await generateText({
    model: 'anthropic/claude-sonnet-4.6',
    prompt,
  })
  return Response.json({ text: result.text })
}
```

## Algorithm Comparison

| Algorithm | Use When | How It Works |
|-----------|----------|-------------|
| **Fixed Window** | Simple limits (20/hour) | Resets at fixed intervals; allows bursts at window boundaries |
| **Sliding Window** | Smooth limits (60/min) | Rolling window; most balanced for APIs |
| **Token Bucket** | Budget-based (AI tokens) | Refills over time; allows controlled bursts |

```tsx
// Fixed window — resets exactly on the hour
Ratelimit.fixedWindow(20, '1 h')

// Sliding window — smooth, no boundary bursts
Ratelimit.slidingWindow(60, '1 m')

// Refills 10 tokens every second. Bucket size is 10.
Ratelimit.tokenBucket(10, '1 s', 10)
```

## Rate Limit Headers

Always return rate limit information in response headers so clients can self-throttle.

```tsx
function rateLimitHeaders(result: { limit: number; remaining: number; reset: number }) {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
    'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
  }
}
```

## GraphQL Rate Limiting

Count request cost as well as HTTP requests. Depth alone misses wide queries, large lists, aliases and batched operations. Enforce controls in the actual server validation/execution path; an unused validationRules array provides no protection.

| Control | Integration decision |
| --- | --- |
| Depth and amount | Bound nesting, pagination and returned list sizes |
| Cost | Reject expensive operations before costly execution |
| Batching/aliases | Limit aggregate operations/object requests, including sensitive mutations |
| Identity budget | Apply per-user/IP limits across batches |
| Timeout/concurrency | Bound resolver/downstream work with cancellation where supported |

Select rules supported by the installed GraphQL server and tune limits to legitimate operations. The former depth 5 / score 1000 values were examples, not OWASP requirements. Verify high-depth, wide, aliased, batched and oversized-page requests are rejected while normal queries pass. Field/object authorization remains necessary. This is an enforcement checklist, not a drop-in server implementation.

Source: [OWASP GraphQL Cheat Sheet: DoS and batching](https://cheatsheetseries.owasp.org/cheatsheets/GraphQL_Cheat_Sheet.html). Scoped dates/limits: [SOURCES.md](../SOURCES.md).

## Audit Patterns

```bash
# Find auth endpoints without rate limiting
grep -rn "login\|signin\|signup\|password\|reset\|verify\|otp" --include="route.ts" -l | \
  xargs grep -L "ratelimit\|Ratelimit\|rate.limit\|rateLimiter"

# Find Server Actions without rate limiting
grep -rn "'use server'" --include="*.ts" -l | \
  xargs grep -L "ratelimit\|Ratelimit\|rate.limit"

# Find AI endpoints without rate limiting
grep -rn "generateText\|streamText\|openai\|anthropic" --include="route.ts" -l | \
  xargs grep -L "ratelimit\|Ratelimit"
```

## Sources

- [OWASP API4:2023 — Unrestricted Resource Consumption](https://api-security.owasp.org/editions/2023/en/0xa4-unrestricted-resource-consumption/)
- [OWASP A06:2025 — Insecure Design](https://top10.owasp.org/2025/A06_2025-Insecure_Design/)
- [Upstash Rate Limiting Documentation](https://upstash.com/docs/oss/sdks/ts/ratelimit/overview)
- [Next.js data security: Server Actions](https://nextjs.org/docs/app/guides/data-security)
- [OWASP GraphQL security](https://cheatsheetseries.owasp.org/cheatsheets/GraphQL_Cheat_Sheet.html)
- [OWASP Authentication Cheat Sheet: login throttling and account lockout](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP Credential Stuffing Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Credential_Stuffing_Prevention_Cheat_Sheet.html)
- [Upstash Ratelimit methods: `getRemaining`, `resetUsedTokens`](https://upstash.com/docs/redis/sdks/ratelimit-ts/methods)
