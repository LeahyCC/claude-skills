# SSRF & Logging

> OWASP API7:2023 (Server Side Request Forgery), A01:2025 (Broken Access Control), A09:2025 (Security Logging and Alerting Failures)

Two related concerns: preventing the server from being tricked into making unintended requests (SSRF), and ensuring you can detect and investigate attacks (logging).

## Contents

- [Server-Side Request Forgery (SSRF)](#server-side-request-forgery-ssrf)
- [Security Logging](#security-logging)
- [Audit Patterns](#audit-patterns)
- [Sources](#sources)

## Server-Side Request Forgery (SSRF)

SSRF occurs when server-side code fetches a URL that the attacker controls. In Next.js, this is common in Server Components, Route Handlers, and Server Actions that accept URLs.

### The Danger

Server-side `fetch()` can access:
- Internal services (`http://localhost:3001/admin`)
- Cloud metadata (`http://169.254.169.254/latest/meta-data/iam/security-credentials/`)
- Private network resources (`http://10.0.0.1/internal-api`)
- Local files (`file:///etc/passwd`)

### URL Validation

```tsx
// FAIL — fetching user-supplied URL without validation
export async function POST(request: Request) {
  const { url } = await request.json()
  const response = await fetch(url)  // attacker sends http://169.254.169.254/...
  return Response.json(await response.json())
}
```

A hostname check alone is not enough. `api.example.com` can resolve to `10.0.0.5`, and `fetch()` does its own DNS lookup after your check. An attacker who controls DNS can answer the check with a public IP and the fetch with a private one (DNS rebinding). Resolve the name, check every A and AAAA answer, and make the socket connect to the address you checked.

```tsx
// lib/safe-fetch.ts
// npm install undici (its Agent lets us replace the DNS lookup)
import 'server-only'
import dns from 'node:dns'
import net from 'node:net'
import { Agent, fetch, type RequestInit } from 'undici'

// OWASP SSRF minimum deny list, plus 169.254.0.0/16 (link-local and cloud metadata).
// Add any other ranges your own network uses.
const blocked = new net.BlockList()
blocked.addSubnet('0.0.0.0', 8, 'ipv4')
blocked.addSubnet('10.0.0.0', 8, 'ipv4')
blocked.addSubnet('127.0.0.0', 8, 'ipv4')
blocked.addSubnet('169.254.0.0', 16, 'ipv4') // 169.254.169.254 metadata
blocked.addSubnet('172.16.0.0', 12, 'ipv4')
blocked.addSubnet('192.168.0.0', 16, 'ipv4')
blocked.addSubnet('224.0.0.0', 4, 'ipv4')
blocked.addSubnet('::', 128, 'ipv6')
blocked.addSubnet('::1', 128, 'ipv6')
blocked.addSubnet('fc00::', 7, 'ipv6') // unique local
blocked.addSubnet('fe80::', 10, 'ipv6') // link-local
blocked.addSubnet('ff00::', 8, 'ipv6') // multicast

function isBlocked(address: string): boolean {
  const family = net.isIP(address)
  if (family === 4) return blocked.check(address, 'ipv4')
  // BlockList matches IPv4-mapped IPv6 against the IPv4 rules: ::ffff:7f00:1 is 127.0.0.1.
  // Do not add ::ffff:0:0/96 as a rule. IPv4 checks match it too, so it blocks every IPv4 address.
  if (family === 6) return blocked.check(address, 'ipv6')
  return true // not an IP address at all
}

// Runs inside the socket connect. The socket dials the address this returns,
// so there is no second lookup an attacker can rebind.
const pinnedLookup: net.LookupFunction = (hostname, options, callback) => {
  dns.lookup(hostname, { all: true, family: options.family }, (err, addresses) => {
    if (err) return callback(err, '')
    const [first] = addresses
    if (!first || addresses.some((a) => isBlocked(a.address))) {
      return callback(new Error(`Blocked address for ${hostname}`), '')
    }
    if (options.all) return callback(null, addresses)
    callback(null, first.address, first.family)
  })
}

// TLS still checks the certificate against the hostname in the URL.
const agent = new Agent({ connect: { lookup: pinnedLookup, timeout: 5_000 } })

export function validateUrl(input: string, allowedHosts?: ReadonlySet<string>): URL | null {
  let url: URL
  try {
    url = new URL(input)
  } catch {
    return null
  }

  if (url.protocol !== 'https:') return null
  if (url.port !== '' && url.port !== '443') return null
  if (url.username || url.password) return null
  if (allowedHosts && !allowedHosts.has(url.hostname)) return null

  // An IP literal skips the DNS lookup, so check it here.
  // new URL() already turns 2130706433 and 0x7f.1 into 127.0.0.1.
  const literal = url.hostname.replace(/^\[|\]$/g, '')
  if (net.isIP(literal) !== 0 && isBlocked(literal)) return null

  return url
}

export function safeFetch(url: URL, init: RequestInit = {}) {
  return fetch(url, {
    ...init,
    dispatcher: agent,
    redirect: 'error', // a redirect would skip validateUrl
    signal: AbortSignal.timeout(5_000),
  })
}
```

```tsx
// PASS: allowlist, then the pinned fetch
import { z } from 'zod'
import { safeFetch, validateUrl } from '@/lib/safe-fetch'

const ALLOWED_HOSTS = new Set(['api.example.com', 'cdn.example.com', 'images.unsplash.com'])
const BodySchema = z.object({ url: z.string().max(2048) })

export async function POST(request: Request) {
  const parsed = BodySchema.safeParse(await request.json().catch(() => null))
  const url = parsed.success ? validateUrl(parsed.data.url, ALLOWED_HOSTS) : null
  if (!url) {
    return Response.json({ error: 'Invalid URL' }, { status: 400 })
  }

  try {
    const response = await safeFetch(url)
    return Response.json({ ok: response.ok, status: response.status })
  } catch {
    return Response.json({ error: 'Fetch failed' }, { status: 502 })
  }
}
```

Keep the allowlist when you know the destinations. It stops the request going anywhere else. The pinned lookup stops an allowed name from pointing inside your network. With no allowlist (user webhooks), the pinned lookup is the main defence, and OWASP calls a deny list incomplete. On AWS, also require IMDSv2.

### Common SSRF Vectors in Next.js

```tsx
// Vector 1: Profile picture URL
// FAIL
export async function updateAvatar(imageUrl: string) {
  const image = await fetch(imageUrl)  // SSRF
  await uploadToStorage(await image.blob())
}

// PASS: take the file itself, not a URL to it. No server fetch, no SSRF.
// Size caps and the magic-byte check live in file-uploads.md.
export async function updateAvatar(formData: FormData) {
  const file = formData.get('avatar')
  if (!(file instanceof File)) throw new Error('No file provided')
  await saveUpload(file, IMAGE_TYPES) // see file-uploads.md
}
```

The upload checks themselves are in [File Uploads](file-uploads.md).

```tsx
// Vector 2: Webhook URL registration
// FAIL
export async function createWebhook(url: string) {
  // Attacker registers http://169.254.169.254/... as webhook
  await db.insert(webhooks).values({ url, userId: user.id })
}

// PASS: validate, then test through the pinned fetch
export async function createWebhook(input: string) {
  const url = validateUrl(input) // no allowlist: any public HTTPS host
  if (!url) return { error: 'Invalid webhook URL. Must be HTTPS.' }

  try {
    const response = await safeFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'webhook.test' }),
    })
    if (!response.ok) return { error: 'Webhook endpoint returned an error' }
  } catch {
    return { error: 'Could not reach webhook endpoint' }
  }

  await db.insert(webhooks).values({ url: url.href, userId: user.id })
}
// Deliver every later event through safeFetch too. DNS can change after registration.
```

```tsx
// Vector 3: Open redirect in Server Components
// FAIL
export default async function Page({ searchParams }: { searchParams: Promise<{ redirect: string }> }) {
  const { redirect: url } = await searchParams
  redirect(url)  // attacker sends ?redirect=https://evil.com
}

// PASS — exact path only. startsWith('/dashboard') also matches /dashboard-extra.
const ALLOWED_REDIRECT_PATHS = new Set(['/dashboard', '/settings', '/profile'])

export default async function Page({ searchParams }: { searchParams: Promise<{ redirect: string }> }) {
  const { redirect: target } = await searchParams
  const path = (target ?? '').split(/[?#]/)[0]

  // Reject protocol-relative (//) and backslash. Redirect only a path in the set.
  if (!path || path.includes('\\') || path.startsWith('//') || !ALLOWED_REDIRECT_PATHS.has(path)) {
    redirect('/dashboard')
  }

  redirect(path)
}
```

### Key SSRF Prevention Rules

| Rule | Why |
|------|-----|
| URL allowlist (not blocklist) | Blocklists are always incomplete — IP encoding tricks bypass them |
| HTTPS only | Blocks `file://`, `gopher://`, `dict://` |
| No redirect following | Prevents allowlist bypass via redirect chain |
| Resolve DNS and pin the connection | Stops an allowed or public name resolving to a private IP, and DNS rebinding |
| Timeout on all fetches | Prevents resource exhaustion from hanging connections |
| Don't return raw responses | Prevents internal data leakage |
| Accept file uploads instead of URLs | Eliminates SSRF entirely for user content |

## Security Logging

Without logging, you can't detect attacks or investigate them afterwards.

### What to Log

| Event | Priority | Why |
|-------|----------|-----|
| Login success/failure | Critical | Detect credential stuffing, brute force |
| Auth failures (401/403) | Critical | Detect privilege escalation attempts |
| Rate limit hits | High | Detect automated attacks |
| Input validation failures | High | Detect injection attempts |
| Password/email changes | High | Detect account takeover |
| Admin actions | Critical | Audit trail for privileged operations |
| API errors (5xx) | High | Detect exploitation attempts |
| CSRF/CORS violations | Medium | Detect cross-origin attacks |

### What NOT to Log

| Data | Why |
|------|-----|
| Passwords (even failed ones) | Logs are often less protected than auth stores |
| Credit card numbers | PCI DSS compliance |
| SSN, tax IDs | PII regulations |
| Session tokens | Token theft via log access |
| Full request bodies with sensitive data | Data minimization |

### Structured Logging

```tsx
// lib/logger.ts
import 'server-only'

type LogLevel = 'info' | 'warn' | 'error' | 'security'

interface LogEntry {
  level: LogLevel
  event: string
  userId?: string
  ip?: string
  path?: string
  details?: Record<string, unknown>
  timestamp: string
}

export function log(level: LogLevel, event: string, details?: Record<string, unknown>) {
  const entry: LogEntry = {
    level,
    event,
    timestamp: new Date().toISOString(),
    ...details,
  }

  // Structured JSON — parseable by log aggregators
  console.log(JSON.stringify(entry))
}

export const securityLog = (event: string, details?: Record<string, unknown>) =>
  log('security', event, details)
```

### Logging in Auth Flows

```tsx
// data/auth.ts
import { securityLog } from '@/lib/logger'
import { headers } from 'next/headers'

async function getClientIp(): Promise<string> {
  const headerList = await headers()
  // Last X-Forwarded-For address, or 'unknown'. Same rule as rate limiting.
  const forwarded = headerList.get('x-forwarded-for')
  if (!forwarded) return 'unknown'
  const parts = forwarded.split(',').map((part) => part.trim()).filter(Boolean)
  return parts.at(-1) ?? 'unknown'
}

export async function login(email: string, password: string) {
  const ip = await getClientIp()

  const [user] = await db.select().from(users).where(eq(users.email, email))
  if (!user || !await verifyPassword(password, user.passwordHash)) {
    securityLog('auth.login.failed', {
      ip,
      email,  // OK to log email (not password)
      reason: 'invalid_credentials',
    })
    return { error: 'Invalid email or password' }
  }

  securityLog('auth.login.success', {
    userId: user.id,
    ip,
  })

  await createSession(user.id)
}
```

### Logging in Server Actions

```tsx
'use server'
import { securityLog } from '@/lib/logger'
import { getCurrentUser } from '@/data/auth'

export async function deleteProject(projectId: string) {
  const user = await getCurrentUser()
  if (!user) {
    securityLog('authz.denied', {
      action: 'deleteProject',
      reason: 'unauthenticated',
    })
    throw new Error('Unauthorized')
  }

  const [project] = await db.select().from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, user.id)))

  if (!project) {
    securityLog('authz.denied', {
      userId: user.id,
      action: 'deleteProject',
      projectId,
      reason: 'not_owner',
    })
    throw new Error('Not found')
  }

  await db.delete(projects).where(eq(projects.id, projectId))

  securityLog('data.deleted', {
    userId: user.id,
    action: 'deleteProject',
    projectId,
  })
}
```

### Log Injection Prevention

Attackers can inject fake log entries by including newlines or JSON in user input.

```tsx
// FAIL — user input directly in log string
console.log(`Login attempt for user: ${email}`)
// Attacker sends email: "admin\n[SECURITY] Login successful for admin"
// Log shows a fake successful login

// PASS — structured logging prevents injection
console.log(JSON.stringify({
  event: 'auth.login.attempt',
  email,  // JSON-encoded, newlines escaped
  timestamp: new Date().toISOString(),
}))
```

### Monitoring and Alerting

Logging without monitoring is useless. Set up alerts for:

```
# Alert thresholds
- 5+ failed logins from same IP in 1 minute → brute force
- 10+ 403 errors from same user in 5 minutes → privilege escalation attempt
- 100+ validation errors in 1 minute → injection attack
- Any 500 error spike (2x baseline) → potential exploitation
- Password change without recent login → session hijack
```

Integration with observability platforms:

```tsx
// Vercel captures console.log from Functions.
// Read them with: vercel logs <deployment-url>
//
// Drains are not a vercel.json property. Add them in Team Settings → Drains.
// Pro and Enterprise: https://vercel.com/docs/drains
// https://vercel.com/docs/drains/using-drains
```

## Audit Patterns

```bash
# Find fetch() calls without URL validation
grep -rn "fetch(" --include="*.ts" | grep -v "node_modules" | grep -v "validateUrl\|ALLOWED"

# Find user-supplied URLs being fetched
grep -rn "request.json\|searchParams\|formData" --include="*.ts" -A10 | grep "fetch("

# Find redirects with user-supplied targets
grep -rn "redirect(" --include="*.ts" --include="*.tsx" -B5 | grep "searchParams\|params\|query"

# Find missing security logging in auth flows
grep -rn "login\|authenticate\|password" --include="*.ts" -l | xargs grep -L "securityLog\|audit\|log("

# Find sensitive data in log statements
grep -rn "console.log\|console.error" --include="*.ts" | grep -i "password\|token\|secret\|key\|ssn"
```

## Sources

- [OWASP API7:2023 — Server Side Request Forgery](https://api-security.owasp.org/editions/2023/en/0xa7-server-side-request-forgery/)
- [OWASP A01:2025 — Broken Access Control](https://top10.owasp.org/2025/A01_2025-Broken_Access_Control/)
- [OWASP A09:2025 — Security Logging and Alerting Failures](https://top10.owasp.org/2025/A09_2025-Security_Logging_and_Alerting_Failures/)
- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
- [OWASP SSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)
- [Node.js 22 `net.BlockList` and the `lookup` connect option](https://nodejs.org/docs/latest-v22.x/api/net.html)
- [Node.js 22 `dns.lookup`](https://nodejs.org/docs/latest-v22.x/api/dns.html)
- [undici Client `connect` options](https://github.com/nodejs/undici/blob/main/docs/docs/api/Client.md)

Review note (2026-10-21): login and deleteProject select-result handling checked against [Drizzle select result examples](https://orm.drizzle.team/docs/select#partial-select). A select returns an array; destructuring its first row makes an empty result undefined. This check does not verify the whole logging resource.
