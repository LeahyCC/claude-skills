# SSRF & Logging

> OWASP API7:2023 (Server Side Request Forgery), A01:2025 (Broken Access Control), A09:2025 (Security Logging and Alerting Failures)

Two related concerns: preventing the server from being tricked into making unintended requests (SSRF), and ensuring you can detect and investigate attacks (logging).

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

// PASS — strict URL validation with allowlist
const ALLOWED_HOSTS = new Set([
  'api.example.com',
  'cdn.example.com',
  'images.unsplash.com',
])

function validateUrl(input: string): URL | null {
  let url: URL
  try {
    url = new URL(input)
  } catch {
    return null
  }

  // Only allow HTTPS
  if (url.protocol !== 'https:') return null

  // Allowlisted names skip the IP checks below.
  // DNS can still point one of those names at a private address.
  if (!ALLOWED_HOSTS.has(url.hostname)) return null

  // Block private/internal IPs (basic check)
  const blockedPatterns = [
    /^localhost$/i,
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2\d|3[01])\./,
    /^192\.168\./,
    /^169\.254\./,    // AWS metadata
    /^0\./,
    /^\[::1\]/,       // IPv6 localhost
    /^\[fc/i,         // IPv6 private
    /^\[fd/i,         // IPv6 private
  ]

  if (blockedPatterns.some(p => p.test(url.hostname))) return null

  return url
}

export async function POST(request: Request) {
  const { url } = await request.json()

  const validated = validateUrl(url)
  if (!validated) {
    return Response.json({ error: 'Invalid URL' }, { status: 400 })
  }

  const response = await fetch(validated.href, {
    redirect: 'error',              // don't follow redirects
    signal: AbortSignal.timeout(5000), // timeout
  })

  return Response.json({ ok: response.ok, status: response.status })
}
```

### Common SSRF Vectors in Next.js

```tsx
// Vector 1: Profile picture URL
// FAIL
export async function updateAvatar(imageUrl: string) {
  const image = await fetch(imageUrl)  // SSRF
  await uploadToStorage(await image.blob())
}

// PASS — file.type is the browser's claim. Check the bytes.
export async function updateAvatar(formData: FormData) {
  const file = formData.get('avatar')
  if (!(file instanceof File)) throw new Error('No file provided')

  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  const png = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
  const webp =
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  if (!jpeg && !png && !webp) throw new Error('Invalid file type')

  await uploadToStorage(file)
}
```

```tsx
// Vector 2: Webhook URL registration
// FAIL
export async function createWebhook(url: string) {
  // Attacker registers http://169.254.169.254/... as webhook
  await db.insert(webhooks).values({ url, userId: user.id })
}

// PASS — validate and test the URL
export async function createWebhook(input: string) {
  const url = validateUrl(input)
  if (!url) return { error: 'Invalid webhook URL. Must be HTTPS.' }

  // Verify the endpoint responds
  try {
    const response = await fetch(url.href, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'webhook.test' }),
      redirect: 'error',
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) return { error: 'Webhook endpoint returned an error' }
  } catch {
    return { error: 'Could not reach webhook endpoint' }
  }

  await db.insert(webhooks).values({ url: url.href, userId: user.id })
}
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

- [OWASP API7:2023 — Server Side Request Forgery](https://owasp.org/API-Security/editions/2023/en/0xa7-server-side-request-forgery/)
- [OWASP A01:2025 — Broken Access Control](https://owasp.org/Top10/2025/A01_2025-Broken_Access_Control/)
- [OWASP A09:2025 — Security Logging and Alerting Failures](https://owasp.org/Top10/2025/A09_2025-Security_Logging_and_Alerting_Failures/)
- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)

Review note (2026-10-21): login and deleteProject select-result handling checked against [Drizzle select result examples](https://orm.drizzle.team/docs/select#partial-select). A select returns an array; destructuring its first row makes an empty result undefined. This check does not verify the whole logging resource.
