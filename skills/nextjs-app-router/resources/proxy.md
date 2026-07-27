# Proxy

> **Core Principle:** Use `proxy.ts` for fast request interception — redirects, rewrites, and auth gates. Keep it stateless, fast, and free of heavy data fetching.

## Introduction

`proxy.ts` (formerly `middleware.ts`) runs on the **Node.js** runtime **before** routes render. It can redirect, rewrite, modify headers/cookies, or respond directly. The Edge runtime is **not** supported in `proxy` (keep `middleware` only if you must stay on Edge). Proxy is separate from render code — pass information to the app via headers, cookies, rewrites, or the URL.

For route-level auth inside pages and Server Actions, see [server-components.md](server-components.md). For post-render 404 handling, see [error-handling.md](error-handling.md).

## Architecture

```
Incoming Request
      │
      ▼
next.config redirects/headers
      │
      ▼
proxy.ts (matcher-filtered)
      │
      ├─ redirect ──────────► 307/308 response
      ├─ rewrite ───────────► different route (URL unchanged)
      ├─ set request headers ► passed to Server Components
      ├─ set response cookies ► sent to browser
      └─ NextResponse.next() ► continue to route
      │
      ▼
Filesystem routes (app/, public/, _next/)
      │
      ▼
Server Components / Route Handlers render
```

### Execution Order

1. `headers` from `next.config.ts`
2. `redirects` from `next.config.ts`
3. **Proxy** (rewrites, redirects, header/cookie changes)
4. `beforeFiles` rewrites from `next.config.ts`
5. Filesystem routes
6. `afterFiles` / `fallback` rewrites

## Decision Matrix

| Task | Proxy | Alternative |
|------|-------|-------------|
| Redirect unauthenticated users | Yes | — |
| Rewrite `/api/v1` → `/api/v2` | Yes | `next.config` rewrites |
| Set security headers globally | Prefer `next.config` headers | Proxy for dynamic headers |
| Session validation with DB lookup | Avoid — too slow | Server Component / Server Action |
| Rate limiting | Yes (fast store / Redis) | Route Handler + Redis |
| A/B test routing | Yes (cookie/header based) | — |
| i18n locale detection | Yes | `app/[lang]/` layout |
| CSP nonce generation | Yes | Pass via request header |
| Full authorization (RBAC) | Partial — coarse gates only | DAL in Server Actions |

### Matcher Strategy

| Pattern | Use |
|---------|-----|
| No matcher | Runs on every request including `_next/static` — avoid |
| `['/dashboard/:path*']` | Protect specific sections |
| Negative regex | Exclude static assets and API from auth |
| `has` / `missing` | Conditional on cookies, headers, query |

## Migration from `middleware.ts`

Next.js 16 renamed `middleware` to `proxy`. Run the codemod:

```bash
npx @next/codemod@canary middleware-to-proxy .
```

| Before (deprecated) | After |
|---------------------|-------|
| `middleware.ts` | `proxy.ts` |
| `export function middleware()` | `export function proxy()` |
| Edge runtime optional | **Node.js only** — Edge not supported in `proxy` |
| Same location: project root or `src/` | Same |

```ts
// proxy.ts — project root or src/proxy.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  return NextResponse.redirect(new URL('/home', request.url))
}

export const config = {
  matcher: '/about/:path*',
}
```

## Production Workflow

```
1. Place proxy.ts at project root (or src/) — same level as app/
2. Define matcher to exclude _next/static, _next/image, public assets
3. Implement auth gate (`verifySession` on the cookie — not existence alone)
4. Re-verify the session cookie in Server Components / Actions (never trust forwarded headers)
5. Add redirects for legacy URLs
6. Keep proxy logic under 50ms — no database calls or self-fetch
7. Test: direct URL, client navigation, static asset loading
```

### File Location

```
acme-app/
├── proxy.ts          # ✓ Correct
├── src/
│   ├── proxy.ts      # ✓ Correct (with src/app/)
│   └── app/
└── app/
    └── proxy.ts      # ✗ Wrong — not inside app/
```

### Matcher — Exclude Static Assets

```ts
// proxy.ts
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### Authentication Gate

Authentication depends on **validating** the session cookie — not merely checking that it exists.

```ts
// proxy.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySession } from '@/lib/auth'

const PUBLIC_PATHS = ['/login', '/signup', '/api/auth']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const token = request.cookies.get('session')?.value
  const session = token ? await verifySession(token) : null
  if (!session) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/account/:path*', '/api/protected/:path*'],
}
```

### Re-verify Session in Server Components

Never treat a forwarded header (e.g. `x-session-id`) as authentication. Headers can be spoofed on direct requests. Always read the session cookie and call `verifySession()` again — fail closed.

```tsx
// app/dashboard/page.tsx
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/auth'

export default async function DashboardPage() {
  const token = (await cookies()).get('session')?.value
  const session = token ? await verifySession(token) : null
  if (!session) redirect('/login')

  // Full authz still required here — proxy is not sufficient alone
  return <Dashboard userId={session.userId} />
}
```

### Role-Based Redirect

```ts
// proxy.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySession } from '@/lib/auth'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('session')?.value
  const payload = token ? await verifySession(token) : null

  if (pathname.startsWith('/admin')) {
    if (!payload) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
```

### Rewrite for API Versioning

```ts
// proxy.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/v1/')) {
    const url = request.nextUrl.clone()
    url.pathname = url.pathname.replace('/api/v1/', '/api/v2/')
    return NextResponse.rewrite(url)
  }
  return NextResponse.next()
}

export const config = {
  matcher: '/api/v1/:path*',
}
```

### Internationalization

```ts
// proxy.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const LOCALES = ['en', 'fr', 'de'] as const
const DEFAULT_LOCALE = 'en'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const hasLocale = LOCALES.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )
  if (hasLocale) return NextResponse.next()

  const locale = request.cookies.get('locale')?.value ?? DEFAULT_LOCALE
  const url = request.nextUrl.clone()
  url.pathname = `/${locale}${pathname}`
  return NextResponse.redirect(url)
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
}
```

## PASS Examples

### Fast existence check for 404 (compliance)

```ts
// proxy.ts — local/fast-store lookup only; never fetch() back into the app
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { postSlugExists } from '@/lib/post-slugs' // in-memory set or Redis EXISTS

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (!pathname.startsWith('/blog/')) return NextResponse.next()

  const rawSlug = pathname.split('/').pop()
  if (!rawSlug) return NextResponse.next()

  const slug = encodeURIComponent(rawSlug)
  const exists = await postSlugExists(slug) // O(1) local check — no network to self
  if (!exists) {
    return NextResponse.rewrite(new URL('/not-found', request.url))
  }
  return NextResponse.next()
}
```

### Conditional matcher with `has`

```ts
export const config = {
  matcher: [
    {
      source: '/api/:path*',
      missing: [{ type: 'header', key: 'authorization' }],
    },
  ],
}
```

## FAIL Examples

### Database query in proxy

```ts
// FAIL — slow, blocks every matched request, no connection pooling guarantees
export async function proxy(request: NextRequest) {
  const user = await db.user.findFirst({
    where: { id: request.cookies.get('userId')?.value },
  })
  if (!user?.isActive) return NextResponse.redirect(new URL('/banned', request.url))
  return NextResponse.next()
}
```

```ts
// PASS — verifySession validates the cookie; full authz in Server Components
import { verifySession } from '@/lib/auth'

export async function proxy(request: NextRequest) {
  const token = request.cookies.get('session')?.value
  const payload = token ? await verifySession(token) : null
  if (!payload) return NextResponse.redirect(new URL('/login', request.url))
  return NextResponse.next()
}
```

### No matcher — blocks static assets

```ts
// FAIL — auth check runs on /_next/static/chunks/*.js
export async function proxy(request: NextRequest) {
  const token = request.cookies.get('session')?.value
  const payload = token ? await verifySession(token) : null
  if (!payload) return NextResponse.redirect(new URL('/login', request.url))
  return NextResponse.next()
}
// Missing config.matcher
```

### Relying on shared mutable state

```ts
// FAIL — proxy instances are isolated from render; shared mutable state is unreliable
let requestCount = 0

export function proxy(request: NextRequest) {
  requestCount++
  return NextResponse.next()
}
```

### Trusting proxy for authorization

```tsx
// FAIL — proxy can be bypassed via direct Server Action POST
'use server'
export async function deleteAccount(userId: string) {
  await db.user.delete({ where: { id: userId } })
}
```

```tsx
// PASS — re-verify auth inside every Server Action
'use server'
import { requireUser } from '@/lib/auth'

export async function deleteAccount() {
  const user = await requireUser()
  await db.user.delete({ where: { id: user.id } })
}
```

## Common Mistakes

- Placing `proxy.ts` inside `app/` instead of project root / `src/`.
- Using `middleware.ts` filename in new Next.js 16 projects.
- Running proxy on `_next/static` and `_next/image` paths.
- Heavy I/O in proxy (database, `fetch()` back into the app, external API calls).
- Checking cookie presence without `verifySession()` — a forged cookie must fail closed.
- Trusting forwarded headers (`x-session-id`) as authentication without re-verifying the cookie.
- Treating proxy auth as sufficient — Server Actions and Route Handlers must re-verify.
- Using dynamic values in `matcher` config (must be statically analyzable).
- Calling `revalidateTag` or `updateTag` from proxy — server-only, not in proxy context.
- Sharing global state between proxy and render code.

## Best Practices

- Keep proxy logic under ~50ms per request.
- Use signed JWT or encrypted session cookies — call `verifySession()`, don't database-lookup.
- Re-read and verify the session cookie in Server Components — never trust forwarded auth headers.
- Always re-authorize in Server Actions, Route Handlers, and DAL.
- Exclude static assets, images, and favicon from matcher.
- Use `NextResponse.redirect` for auth failures with `callbackUrl` preserved.
- Prefer `next.config.ts` for static redirects that don't need request inspection.
- Test with JavaScript disabled (direct URL) and client-side navigation.
- Use `has` / `missing` matcher conditions for cookie/header-based routing.
- Document proxy routes in team onboarding — it's the first code that runs.

## Production Checklist

### Setup

- [ ] `proxy.ts` at project root or `src/` (not inside `app/`)
- [ ] Exports `proxy` function (not `middleware`)
- [ ] No `runtime: 'edge'` config (unsupported — proxy is Node.js)
- [ ] `config.matcher` excludes `_next/static`, `_next/image`, static files
- [ ] Matcher values are static strings (no runtime variables)

### Authentication

- [ ] Unauthenticated users redirected before protected routes render
- [ ] Session verified with `verifySession()` — not cookie presence alone; no DB in proxy
- [ ] Server Components / Actions re-verify the cookie — never trust forwarded auth headers
- [ ] `callbackUrl` preserved on login redirect
- [ ] Server Actions re-verify auth independently of proxy

### Performance

- [ ] No database, self-`fetch()`, or heavy API calls in proxy
- [ ] No shared mutable global state
- [ ] Rewrites used instead of redirect when URL should stay the same

### Security

- [ ] Admin routes gated by role check in proxy + server-side authz
- [ ] Sensitive headers stripped before passing to client
- [ ] Rate limiting on auth endpoints (proxy or dedicated service)

## References

### Verified Against

- [Proxy](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)
- [Migration to Proxy](https://nextjs.org/docs/app/api-reference/file-conventions/proxy#migration-to-proxy)
- [`NextRequest`](https://nextjs.org/docs/app/api-reference/functions/next-request)
- [`NextResponse`](https://nextjs.org/docs/app/api-reference/functions/next-response)
- [Redirecting](https://nextjs.org/docs/app/guides/redirecting)
- [Rewriting](https://nextjs.org/docs/app/api-reference/config/next-config-js/rewrites)

**Framework:** Next.js 16 App Router

**Last verified:** July 2026
