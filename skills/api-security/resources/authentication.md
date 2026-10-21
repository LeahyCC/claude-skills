# Authentication

> OWASP API2:2023 (Broken Authentication), A07:2025 (Authentication Failures), A04:2025 (Cryptographic Failures)

Authentication verifies identity. Get it wrong and every other security control is meaningless — the attacker is "you."

## Authentication Architecture in Next.js

```
Browser → proxy.ts (redirect unauthenticated) → Page (Server Component)
                                                      ↓
                                                 getCurrentUser() (cached per request)
                                                      ↓
                                              Server Action / Route Handler
                                                      ↓
                                              Data Access Layer (re-verify auth)
```

### proxy.ts

`proxy.ts` (formerly `middleware.ts` — renamed in Next.js 16) intercepts requests before they reach pages. Use it to redirect unauthenticated users — but never as the only auth check.

```tsx
// src/proxy.ts (or proxy.ts at project root if not using src/)
import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = new Set(['/', '/login', '/signup', '/api/health'])

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths
  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next()

  // Allow static assets and Next.js internals
  if (pathname.startsWith('/_next/') || pathname.startsWith('/favicon')) {
    return NextResponse.next()
  }

  // A present cookie is not a session. Anyone can send `session=x`.
  // This redirect is a convenience. getCurrentUser() is the check.
  const session = request.cookies.get('session')?.value
  if (!session) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}
```

**Critical:** proxy.ts is a convenience redirect, not a security boundary. Server Actions and Route Handlers must re-verify auth independently.

### CVE-2025-29927 — Middleware Bypass

In March 2025, a critical vulnerability (CVSS 9.1) was disclosed: attackers could send an `x-middleware-subrequest` header to bypass all middleware logic, including auth checks.

**Fixed in:** Next.js 12.3.5, 13.5.9, 14.2.25, 15.2.3

Vercel-hosted apps were already protected. Those releases fix this bug only. Later advisories exist, so 15.2.3 is not a current pin.

**Lesson:** This is why auth must be checked in the DAL, not just in middleware. Defense in depth.

### getCurrentUser() — Cached Auth Check

The core auth primitive. Uses React's `cache()` to share the result across a single request without prop-drilling.

```tsx
// data/auth.ts
import 'server-only'
import { cache } from 'react'
import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET)

export const getCurrentUser = cache(async () => {
  const cookieStore = await cookies()
  const token = cookieStore.get('session')?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, SECRET)
    if (typeof payload.sub !== 'string' || typeof payload.sid !== 'string') return null

    // jwtVerify does not revoke anything. The session row does.
    const [session] = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.id, payload.sid), eq(sessions.userId, payload.sub)))
    if (!session) return null

    return {
      id: payload.sub,
      role: typeof payload.role === 'string' ? payload.role : 'user',
    }
  } catch {
    return null  // expired, tampered, or invalid
  }
})
```

**Key points:**
- `server-only` prevents import from Client Components
- `cache()` deduplicates across the same request (not across requests)
- Never returns raw database user. Returns a minimal object
- Catches all JWT errors: expired, tampered, malformed
- Rejects the token when the session row is gone, so logout and password change revoke it

## Session Management

### Cookie-Based Sessions

```tsx
// FAIL — insecure cookie settings
import { cookies } from 'next/headers'

export async function createSession(userId: string) {
  const token = await signJWT({ sub: userId })
  const cookieStore = await cookies()
  cookieStore.set('session', token)  // missing security flags
}

// PASS — secure cookie settings
export async function createSession(userId: string) {
  const [session] = await db.insert(sessions).values({ userId }).returning({ id: sessions.id })
  const token = await signJWT({ sub: userId, sid: session.id })
  const cookieStore = await cookies()
  cookieStore.set('session', token, {
    httpOnly: true,       // prevents XSS from reading the cookie
    secure: true,         // HTTPS only
    sameSite: 'lax',      // prevents CSRF from foreign origins
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours — not weeks
  })
}
```

### Session Invalidation

```tsx
// Logout deletes the session row. The JWT cookie is useless once that row is gone.
'use server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function logout() {
  const user = await getCurrentUser()
  if (user) {
    await db.delete(sessions).where(eq(sessions.userId, user.id))
  }

  const cookieStore = await cookies()
  cookieStore.delete('session')
  redirect('/login')
}
```

## JWT Security

| Rule | Why |
|------|-----|
| Always verify signature | `{"alg":"none"}` attacks bypass unsigned tokens |
| Always check expiration | Stolen tokens should expire |
| Use short TTLs (15min–24h) | Limits damage window from stolen tokens |
| Store in httpOnly cookie, not localStorage | XSS can't read httpOnly cookies |
| Rotate signing keys | Limits blast radius of key compromise |
| Never put sensitive data in payload | JWTs are base64-encoded, not encrypted |

```tsx
// FAIL — accepting unsigned JWTs
import jwt from 'jsonwebtoken'
const decoded = jwt.decode(token)  // decode() does NOT verify!

// PASS — always verify
import { jwtVerify } from 'jose'
const { payload } = await jwtVerify(token, SECRET)
```

```tsx
// FAIL — sensitive data in JWT payload
const token = await new SignJWT({
  sub: user.id,
  ssn: user.ssn,         // visible to anyone who base64-decodes
  creditCard: user.card,  // the token
})

// PASS — minimal claims only
const token = await new SignJWT({
  sub: user.id,
  sid: session.id,
  role: user.role,
})
  .setProtectedHeader({ alg: 'HS256' })
  .setIssuedAt()
  .setExpirationTime('24h')
  .sign(SECRET)
```

## Auth with Clerk (Marketplace Integration)

Clerk is the native Vercel Marketplace auth provider. It handles session management, JWT verification, and middleware.

```tsx
// proxy.ts with Clerk
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/login(.*)',
  '/signup(.*)',
  '/api/webhooks(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})
```

```tsx
// Server Action with Clerk
'use server'
import { auth } from '@clerk/nextjs/server'

export async function createPost(data: FormData) {
  const { userId, orgId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  // orgId may be null if user has no org — handle explicitly
  if (!orgId) throw new Error('Select an organization first')

  await db.insert(posts).values({
    title: data.get('title') as string,
    authorId: userId,
    organizationId: orgId,
  })
}
```

**Clerk gotcha:** After sign-in, if the user has no organization, `auth()` returns `{ userId, orgSlug: null }`. Handle this explicitly or the app may loop.

## Password Security

If you're implementing custom auth (not Clerk/Auth0):

```tsx
// FAIL — plaintext or weak hashing
import crypto from 'crypto'
const hash = crypto.createHash('md5').update(password).digest('hex')  // crackable in seconds

// PASS — Argon2id at the OWASP minimum
import argon2 from 'argon2'

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456, // 19 MiB
    timeCost: 2,
    parallelism: 1,
  })
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return argon2.verify(hash, password)
}
```

| Algorithm | Status | Notes |
|-----------|--------|-------|
| MD5, SHA-1, SHA-256 | Never use for passwords | Fast hashes are cheap to crack |
| Argon2id | Use this | OWASP minimum: 19 MiB, 2 iterations, parallelism 1 |
| scrypt | If Argon2id is unavailable | Memory-hard. OWASP: N=2^17, r=8, p=1 |
| bcrypt | Legacy only | Work factor 10 or more. Ignores bytes after 72 |

## Re-Authentication for Sensitive Operations

```tsx
// FAIL — allows password change without re-auth
'use server'
export async function changePassword(newPassword: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  await db.update(users).set({ passwordHash: await hashPassword(newPassword) })
}

// PASS — requires current password to change
'use server'
export async function changePassword(currentPassword: string, newPassword: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const [dbUser] = await db.select().from(users).where(eq(users.id, user.id))
  const valid = await verifyPassword(currentPassword, dbUser.passwordHash)
  if (!valid) throw new Error('Current password is incorrect')

  await db.update(users).set({
    passwordHash: await hashPassword(newPassword),
  }).where(eq(users.id, user.id))

  // Drops every session row. The next request fails getCurrentUser.
  await db.delete(sessions).where(eq(sessions.userId, user.id))
}
```

## Account Enumeration Prevention

```tsx
// FAIL — different messages reveal account existence
if (!user) return { error: 'No account with that email' }
if (!validPassword) return { error: 'Wrong password' }

// PASS — same message for both cases
if (!user || !await verifyPassword(password, user.passwordHash)) {
  return { error: 'Invalid email or password' }
}
```

Apply the same principle to password reset:

```tsx
// PASS — always show success, even if email doesn't exist
// Note: add rate limiting for production — see rate-limiting.md
export async function requestPasswordReset(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email))
  if (user) {
    await sendPasswordResetEmail(user.email, await generateResetToken(user.id))
  }
  // Always return success — don't reveal if email exists
  return { success: 'If an account exists, a reset email has been sent' }
}
```

## Webhook Authentication

Webhooks are incoming HTTP requests from third-party services. Always verify their authenticity.

```tsx
// app/api/webhooks/stripe/route.ts
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch {
    return Response.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Process verified event
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutComplete(event.data.object)
      break
  }

  return Response.json({ received: true })
}
```

## Sources

- [OWASP API2:2023 — Broken Authentication](https://owasp.org/API-Security/editions/2023/en/0xa2-broken-authentication/)
- [OWASP A07:2025 — Authentication Failures](https://owasp.org/Top10/2025/A07_2025-Authentication_Failures/)
- [OWASP A04:2025 — Cryptographic Failures](https://owasp.org/Top10/2025/A04_2025-Cryptographic_Failures/)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [Next.js Security Blog — Server Components and Actions](https://nextjs.org/blog/security-nextjs-server-components-actions)
- [CVE-2025-29927 — Next.js Middleware Bypass](https://github.com/advisories/GHSA-f82v-jwr5-mffw)
- [NIST 800-63b — Digital Identity Guidelines](https://pages.nist.gov/800-63-4/sp800-63b.html)
