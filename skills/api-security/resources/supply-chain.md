# Supply Chain

> OWASP API9:2023 (Improper Inventory Management), API10:2023 (Unsafe Consumption of APIs), A06:2021 (Vulnerable & Outdated Components), A08:2021 (Software & Data Integrity Failures)

Your code is only as secure as its weakest dependency. The average Next.js project pulls in 500+ packages — each one is an attack surface.

## Dependency Security

### Audit Regularly

```bash
# npm — built-in audit
npm audit
npm audit --fix  # auto-fix where possible

# pnpm
pnpm audit
pnpm audit --fix

# GitHub — automatic via Dependabot
# .github/dependabot.yml
```

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
    open-pull-requests-limit: 10
    groups:
      production:
        dependency-type: production
      development:
        dependency-type: development
```

### Lockfile Integrity

```bash
# Always commit your lockfile
# package-lock.json (npm) or pnpm-lock.yaml (pnpm)

# In CI, use frozen lockfile installs
npm ci           # npm — fails if lockfile doesn't match
pnpm install --frozen-lockfile  # pnpm equivalent
```

### Dependency Scanning Tools

| Tool | What It Does | When |
|------|-------------|------|
| `npm audit` | Checks npm advisory database | Every install, CI |
| Dependabot | PRs for vulnerable deps | Automated via GitHub |
| Socket.dev | Detects supply chain attacks (typosquatting, malicious code) | CI, GitHub App |
| Snyk | Deep vulnerability scanning with fix PRs | CI |

## Environment Variable Security

### The Rules

1. **Never hardcode secrets** — always use env vars
2. **Never commit `.env` files** — add to `.gitignore`
3. **Only the DAL accesses `process.env`** — use `server-only` modules
4. **`NEXT_PUBLIC_` prefix exposes to the client** — never use for secrets

```tsx
// FAIL — secret accessible to client
NEXT_PUBLIC_DATABASE_URL=postgres://user:pass@host/db  // exposed in browser bundle

// PASS — server-only env var
DATABASE_URL=postgres://user:pass@host/db  // only accessible in server code
```

```tsx
// FAIL — accessing env vars in a component
export default function Page() {
  const key = process.env.STRIPE_SECRET_KEY  // undefined in client, but risky pattern
}

// PASS — access in DAL only
// data/stripe.ts
import 'server-only'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
```

### .gitignore

```gitignore
# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Vercel
.vercel
```

### Secret Scanning

Prevent secrets from leaking into git history:

```bash
# TruffleHog — scan for secrets in git history
npx trufflehog git file://. --only-verified

# Gitleaks — fast secret scanner
gitleaks detect --source .

# Pre-commit hook to prevent secret commits
# .husky/pre-commit
npx gitleaks protect --staged
```

### Vercel Environment Variables

```bash
# Pull env vars from Vercel (includes OIDC tokens for AI Gateway)
vercel link
vercel env pull .env.local

# Add sensitive env vars via CLI
vercel env add STRIPE_SECRET_KEY production
vercel env add DATABASE_URL production preview

# List current env vars
vercel env ls
```

**Rule:** On Vercel, use the Marketplace to provision databases and services — env vars are auto-injected, no manual secrets management.

## CI/CD Security

### Protect the Build Pipeline

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install dependencies (frozen lockfile)
        run: npm ci

      - name: Audit dependencies
        run: npm audit --audit-level=high

      - name: Scan for secrets
        run: npx gitleaks detect --source . --no-git

      - name: Type check
        run: npx tsc --noEmit

      - name: Lint
        run: npx next lint
```

### CI/CD Security Checklist

| Check | Why |
|-------|-----|
| Frozen lockfile in CI (`npm ci`) | Prevents supply chain injection via modified lockfile |
| Pin GitHub Actions to commit SHA | Prevents compromised action versions |
| Audit dependencies in CI | Catches newly disclosed vulnerabilities |
| Scan for secrets before deploy | Prevents secret leaks to production |
| Separate staging and production secrets | Limits blast radius |
| Rotate secrets after exposure | Prevents ongoing compromise |

### Pin GitHub Actions

```yaml
# FAIL — mutable tag, could be compromised
- uses: actions/checkout@v4

# PASS — pinned to specific commit SHA
- uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11  # v4.1.1
```

## Third-Party API Security (API10)

When your server consumes external APIs, treat their responses as untrusted input.

```tsx
// FAIL — trusting third-party API response
export async function enrichUser(userId: string) {
  const response = await fetch(`https://api.enrichment-service.com/users/${userId}`)
  const data = await response.json()

  // Storing unvalidated data — could contain SQL injection, XSS payloads
  await db.update(users).set({
    company: data.company,
    title: data.title,
  }).where(eq(users.id, userId))
}

// PASS — validate external API response
import { z } from 'zod'

const EnrichmentSchema = z.object({
  company: z.string().max(200).trim(),
  title: z.string().max(100).trim(),
})

export async function enrichUser(userId: string) {
  const response = await fetch(`https://api.enrichment-service.com/users/${userId}`, {
    signal: AbortSignal.timeout(5000),  // timeout to prevent hanging
  })

  if (!response.ok) {
    console.error(`Enrichment API failed: ${response.status}`)
    return  // fail gracefully
  }

  const parsed = EnrichmentSchema.safeParse(await response.json())
  if (!parsed.success) {
    console.error('Enrichment API returned invalid data:', parsed.error)
    return
  }

  await db.update(users).set(parsed.data).where(eq(users.id, userId))
}
```

### Third-Party API Checklist

| Rule | Why |
|------|-----|
| Validate all responses with Zod | Prevents injection via third-party data |
| Set timeouts on all fetch calls | Prevents resource exhaustion |
| Use HTTPS only | Prevents man-in-the-middle |
| Don't follow redirects blindly | Prevents data exfiltration |
| Log integration failures | Detect compromised providers early |
| Review third-party security before integration | Shared responsibility |

## API Versioning and Inventory (API9)

Undocumented and forgotten API endpoints are a major attack surface.

```tsx
// FAIL — legacy v1 API still running, unmonitored
// app/api/v1/users/route.ts — no rate limiting, no auth, forgotten
// app/api/v2/users/route.ts — current version with all security controls

// PASS — retirement strategy
// 1. Remove old API routes entirely
// 2. Or redirect to current version
export async function GET() {
  return Response.json(
    { error: 'API v1 is deprecated. Use /api/v2/users instead.' },
    { status: 410 }  // 410 Gone
  )
}
```

### API Inventory Checklist

- [ ] All API endpoints are documented (OpenAPI/Swagger or at minimum a README)
- [ ] No test/debug endpoints in production (`/api/debug`, `/api/test`, `/api/seed`)
- [ ] All API versions have equivalent security controls
- [ ] Deprecated versions return 410 with migration guidance
- [ ] Non-production environments don't use production data

## Server Actions Encryption Key

When deploying to multiple servers (not Vercel — Vercel handles this automatically):

```bash
# Generate encryption key for Server Action closures
openssl rand -base64 32

# Set as environment variable
NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=<base64-encoded-key>
```

Without this, each server generates its own key and Server Action calls may fail when hitting a different server than the one that rendered the page.

## Audit Patterns

```bash
# Find hardcoded secrets
grep -rn "sk_live\|sk_test\|password\s*=\s*['\"]" --include="*.ts" --include="*.tsx" --include="*.env" | grep -v node_modules

# Find NEXT_PUBLIC_ vars that look like secrets
grep -rn "NEXT_PUBLIC_.*SECRET\|NEXT_PUBLIC_.*KEY\|NEXT_PUBLIC_.*PASSWORD\|NEXT_PUBLIC_.*TOKEN" --include="*.ts" --include="*.env"

# Find unvalidated third-party API responses
grep -rn "await.*fetch\|axios\.\(get\|post\)" --include="*.ts" -A5 | grep -v "safeParse\|parse(\|Schema\|validate"

# Find forgotten API routes
find . -name "route.ts" -path "*/api/*" | sort
```

## Sources

- [OWASP API9:2023 — Improper Inventory Management](https://owasp.org/API-Security/editions/2023/en/0xa9-improper-inventory-management/)
- [OWASP API10:2023 — Unsafe Consumption of APIs](https://owasp.org/API-Security/editions/2023/en/0xaa-unsafe-consumption-of-apis/)
- [OWASP A06:2021 — Vulnerable and Outdated Components](https://owasp.org/Top10/A06_2021-Vulnerable_and_Outdated_Components/)
- [OWASP A08:2021 — Software and Data Integrity Failures](https://owasp.org/Top10/A08_2021-Software_and_Data_Integrity_Failures/)
- [Socket.dev — Supply Chain Security](https://socket.dev/)
