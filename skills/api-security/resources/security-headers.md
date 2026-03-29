# Security Headers

> OWASP API8:2023 (Security Misconfiguration), A05:2021 (Security Misconfiguration)

Security headers are the cheapest, highest-impact security measure. Set them once in `next.config.ts` and they protect every response.

## Required Headers

These five headers are required by Vercel's conformance rules (`NEXTJS_MISSING_SECURITY_HEADERS`):

| Header | Value | Prevents |
|--------|-------|----------|
| `Content-Security-Policy` | See CSP section | XSS, code injection |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | HTTPS downgrade attacks |
| `X-Frame-Options` | `SAMEORIGIN` | Clickjacking |
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
    value: 'SAMEORIGIN',
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

## Content Security Policy (CSP)

CSP is the most important security header. It controls which resources the browser can load, preventing XSS even if injection occurs.

### Approach 1: Nonce-Based CSP (Strictest)

Requires dynamic rendering — each request gets a unique nonce.

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

### Approach 2: Hash-Based CSP (Allows Static Pages)

Uses Subresource Integrity (SRI) hashes — no nonce needed, compatible with static generation.

```tsx
// next.config.ts
const config: NextConfig = {
  experimental: {
    sri: { algorithm: 'sha256' },
  },
}
```

This generates integrity hashes at build time. Set CSP to allow `'self'` plus the generated hashes. App Router only.

### Approach 3: Static CSP (Least Strict, Simplest)

When you can't use nonces or hashes:

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

### Server Actions (Built-in)

Next.js Server Actions have built-in CSRF protection:
- POST-only (no GET-based CSRF)
- Origin header checked against Host/X-Forwarded-Host
- SameSite cookies block cross-origin submissions

No additional CSRF protection needed for Server Actions.

### Route Handlers (Not Built-in)

Route Handlers do NOT have automatic CSRF protection. For state-changing endpoints accessed by your own frontend:

```tsx
// lib/csrf.ts
import { headers } from 'next/headers'

export async function verifyCsrf(): Promise<boolean> {
  const headerList = await headers()
  const origin = headerList.get('origin')
  const host = headerList.get('host')

  if (!origin) return false

  const originUrl = new URL(origin)
  return originUrl.host === host
}
```

```tsx
// app/api/settings/route.ts
import { verifyCsrf } from '@/lib/csrf'

export async function POST(request: Request) {
  if (!await verifyCsrf()) {
    return Response.json({ error: 'CSRF validation failed' }, { status: 403 })
  }

  // Process request...
}
```

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

- [OWASP API8:2023 — Security Misconfiguration](https://owasp.org/API-Security/editions/2023/en/0xa8-security-misconfiguration/)
- [OWASP A05:2021 — Security Misconfiguration](https://owasp.org/Top10/A05_2021-Security_Misconfiguration/)
- [Next.js Content Security Policy Guide](https://nextjs.org/docs/app/guides/content-security-policy)
- [Vercel Conformance — NEXTJS_MISSING_SECURITY_HEADERS](https://vercel.com/docs/workflow-collaboration/conformance/rules/NEXTJS_MISSING_SECURITY_HEADERS)
- [MDN — Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
