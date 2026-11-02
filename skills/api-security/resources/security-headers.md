# Security Headers

> OWASP API8:2023 (Security Misconfiguration), A02:2025 (Security Misconfiguration)

Security headers are the cheapest, highest-impact security measure. Set them once in `next.config.ts` and they protect every response.

## Contents

- [Required Headers](#required-headers)
- [Setting Headers in next.config.ts](#setting-headers-in-nextconfigts)
- [Content Security Policy (CSP)](#content-security-policy-csp)
- [CORS Configuration](#cors-configuration)
- [CSRF Protection](#csrf-protection)
- [Cache-Control for Sensitive Data](#cache-control-for-sensitive-data)
- [Testing Headers](#testing-headers)
- [Audit Patterns](#audit-patterns)
- [Sources](#sources)

## Required Headers

These five headers are required by Vercel's conformance rules (`NEXTJS_MISSING_SECURITY_HEADERS`):

| Header | Value | Prevents |
|--------|-------|----------|
| `Content-Security-Policy` | See CSP section | XSS, code injection |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | HTTPS downgrade attacks |
| `X-Frame-Options` | `DENY` | Clickjacking |
| `X-Content-Type-Options` | `nosniff` | MIME sniffing attacks |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Referrer leakage |

Plus recommended:

| Header | Value | Prevents |
|--------|-------|----------|
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Unauthorized browser API access |

## Setting Headers in next.config.ts

```tsx
// next.config.ts
import type { NextConfig } from 'next'

const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
]

const config: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default config
```

`preload` puts the domain on a browser list that is hard to leave. Sending the domain to that list is a separate step.

## Content Security Policy (CSP)

CSP is the most important security header. It controls which resources the browser can load, preventing XSS even if injection occurs.

### Approach 1: Nonce-Based CSP (Strictest)

Each request gets a unique nonce, so the page has to render dynamically. Call `connection()` from `next/server`, or read `headers()`. A nonce does not work with Partial Prerendering or a `cacheComponents` static shell.

```tsx
// proxy.ts
import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')

  const isDev = process.env.NODE_ENV === 'development'

  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    `style-src 'self' 'nonce-${nonce}'`,
    `img-src 'self' blob: data:`,
    `font-src 'self'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ].join('; ')

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', csp)

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('Content-Security-Policy', csp)

  return response
}
```

```tsx
// app/layout.tsx — read nonce for inline scripts
import { headers } from 'next/headers'
import { connection } from 'next/server'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await connection()  // force dynamic rendering so nonce is unique per request
  const headerList = await headers()
  const nonce = headerList.get('x-nonce') ?? ''

  return (
    <html lang="en">
      <body>
        {children}
        <script nonce={nonce} src="/analytics.js" />
      </body>
    </html>
  )
}
```

Next.js automatically applies the nonce to framework scripts, bundles, and inline styles.

### Approach 2: Subresource Integrity (Static Generation)

`experimental.sri` is still experimental. It is App Router only (since Next.js 14) and adds `integrity` attributes to scripts. Those attributes are not CSP hash sources. Use `script-src 'self'`, and add `'unsafe-eval'` in development. Do not copy the hashes into the CSP header.

```tsx
// next.config.ts
const config: NextConfig = {
  experimental: {
    sri: { algorithm: 'sha256' },
  },
}
```

### Approach 3: Static CSP (Least Strict, Simplest)

When you can't use nonces:

```tsx
const csp = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline'`,  // less strict but allows static pages
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' blob: data:`,
  `font-src 'self'`,
  `object-src 'none'`,
  `frame-ancestors 'none'`,
  `upgrade-insecure-requests`,
].join('; ')
```

In development, `script-src` also needs `'unsafe-eval'`.

### CSP for Common Third-Party Services

```
# Analytics
script-src 'self' https://www.googletagmanager.com https://www.google-analytics.com;
img-src 'self' https://www.google-analytics.com;

# Stripe
script-src 'self' https://js.stripe.com;
frame-src https://js.stripe.com;

# Vercel Analytics
script-src 'self' https://va.vercel-scripts.com;

# Clerk Auth
script-src 'self' https://*.clerk.accounts.dev;
connect-src 'self' https://*.clerk.accounts.dev;
img-src 'self' https://img.clerk.com;
```

## CORS Configuration

For Route Handlers that need cross-origin access:

```tsx
// FAIL — overly permissive CORS
export async function GET() {
  return Response.json(data, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': '*',
      'Access-Control-Allow-Headers': '*',
    },
  })
}

// PASS — explicit allowlist
const ALLOWED_ORIGINS = new Set([
  'https://myapp.com',
  'https://staging.myapp.com',
])

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin') ?? ''

  const headers: HeadersInit = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  }

  // Only set Allow-Origin for allowed origins — omit entirely for others
  if (ALLOWED_ORIGINS.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
  }

  return new Response(null, { status: 204, headers })
}

export async function GET(request: Request) {
  const origin = request.headers.get('origin') ?? ''

  const headers: HeadersInit = {}
  if (ALLOWED_ORIGINS.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
  }

  return Response.json(data, { headers })
}
```

### CORS Decision Matrix

| Scenario | Allow-Origin | Credentials |
|----------|-------------|-------------|
| Public read-only API | `*` | Never |
| Your own frontend only | Explicit origin | `true` if cookies needed |
| Partner integrations | Allowlist of partner domains | Per-partner decision |
| Internal microservices | Should not need CORS (same origin) | N/A |

**Rule:** Never combine `Access-Control-Allow-Origin: *` with `Access-Control-Allow-Credentials: true`. Browsers reject this combination.

## CSRF Protection

### Server Actions (Built-in, With Limits)

What Next.js does for every Server Action:
- Only a POST can invoke an action
- It compares the host in the `Origin` header with `x-forwarded-host`, or `host`, and rejects the action when they differ
- A request with no `Origin` header at all is let through with a warning, not rejected
- POST-only plus `SameSite` cookies stops most CSRF in modern browsers

That covers actions only. A Route Handler, or a GET page that changes state, gets none of it. The check also fails when a proxy forwards its own host, or when another host you own posts to the action. List the public host, as the browser shows it, in `serverActions.allowedOrigins`:

```tsx
// next.config.ts
const config: NextConfig = {
  experimental: {
    serverActions: {
      // Host (plus port if not default), not a full URL. * is one label, ** is one or more.
      allowedOrigins: ['shop.example.com', '*.shop.example.com'],
    },
  },
}
```

Leave it out when the proxy forwards the public host in `x-forwarded-host`. Every action still checks the session and ownership. The origin check stops a forged request, not a logged-in attacker.

### Route Handlers (Not Built-in)

Route Handlers have no CSRF check. For state-changing handlers called from your own pages, check `Sec-Fetch-Site` first. The browser sets it and page script cannot change it. Older browsers do not send it, so an exact `Origin` match is the required fallback.

```tsx
// lib/csrf.ts
import 'server-only'

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])
const TRUSTED_ORIGINS = new Set(['https://myapp.com']) // full origins, exact match

export function isTrustedRequest(request: Request): boolean {
  if (!UNSAFE_METHODS.has(request.method)) return true // GET must never change state

  // same-site is rejected too: a sibling subdomain is not your origin.
  const site = request.headers.get('sec-fetch-site')
  if (site !== null) return site === 'same-origin'

  // No Fetch Metadata: fall back to Origin. Missing or "null" is not proof of same origin.
  const origin = request.headers.get('origin')
  if (!origin || origin === 'null') return false
  return TRUSTED_ORIGINS.has(origin)
}
```

```tsx
// FAIL: prefix match. https://myapp.com.attacker.net passes.
if (origin?.startsWith('https://myapp.com')) { /* ... */ }

// PASS: app/api/settings/route.ts
import { isTrustedRequest } from '@/lib/csrf'

export async function POST(request: Request) {
  if (!isTrustedRequest(request)) {
    return Response.json({ error: 'Cross-site request blocked' }, { status: 403 })
  }

  // Auth, validation, then the write...
}
```

A client that sends a bearer token in a header, not a cookie, is not a CSRF target. The browser never adds that header for another site.

### Cookies: `__Host-` Prefix and SameSite

```tsx
// PASS: __Host- means Secure, Path=/, and no Domain.
// A sibling subdomain cannot set or overwrite it. Read the same name everywhere.
cookieStore.set('__Host-session', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  path: '/',
})
```

`SameSite` is defence in depth, not the fix. `Lax` still sends the cookie on a top-level GET from another site, and "site" means the registrable domain, so every subdomain counts as same-site. Keep the origin checks above.

XSS defeats every CSRF defence. Script running on your origin sends same-origin requests. The CSP above and the sinks in [Input Validation](input-validation.md) are the other half.

## Cache-Control for Sensitive Data

```tsx
// FAIL — browser caches private data
export async function GET() {
  const userData = await getPrivateUserData()
  return Response.json(userData)  // may be cached by browser or CDN
}

// PASS — prevent caching of private data
export async function GET() {
  const userData = await getPrivateUserData()
  return Response.json(userData, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    },
  })
}
```

## Testing Headers

```bash
# Check all security headers
curl -I https://yoursite.com 2>/dev/null | grep -iE "strict-transport|x-frame|x-content-type|referrer-policy|content-security-policy|permissions-policy"

# Check CSP specifically
curl -s -I https://yoursite.com | grep -i "content-security-policy"

# Online scanner
# https://securityheaders.com — grades A through F
# https://observatory.mozilla.org — comprehensive analysis
```

## Audit Patterns

```bash
# Check if security headers are configured
grep -rn "Strict-Transport-Security\|X-Frame-Options\|X-Content-Type-Options\|Content-Security-Policy\|Referrer-Policy" next.config.*

# Find Route Handlers with permissive CORS
grep -rn "Access-Control-Allow-Origin.*\*" --include="*.ts"

# Find responses missing Cache-Control for sensitive data
grep -rn "Response.json" --include="route.ts" | grep -v "Cache-Control\|no-store"
```

## Sources

- [OWASP API8:2023 — Security Misconfiguration](https://api-security.owasp.org/editions/2023/en/0xa8-security-misconfiguration/)
- [OWASP A02:2025 — Security Misconfiguration](https://top10.owasp.org/2025/A02_2025-Security_Misconfiguration/)
- [Next.js Content Security Policy Guide](https://nextjs.org/docs/app/guides/content-security-policy)
- [Vercel Conformance — NEXTJS_MISSING_SECURITY_HEADERS](https://vercel.com/docs/workflow-collaboration/conformance/rules/NEXTJS_MISSING_SECURITY_HEADERS)
- [MDN — Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [Next.js `serverActions` config: `allowedOrigins`](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions)
- [Next.js data security: allowed origins](https://nextjs.org/docs/app/guides/data-security#allowed-origins-advanced)
- [MDN Sec-Fetch-Site](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-Fetch-Site)
