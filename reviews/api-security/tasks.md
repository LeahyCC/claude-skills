# API security skill tasks and acceptance criteria

Written 2026-11-01, before any model run. Run each prompt against Claude with the skill and without it, as in the Next.js pilot. Score each criterion 0 or 1. One run per task is exploratory, not a statistical estimate.

Status: **not run.** Model runs need Colin's approval first.

These cover the five bug fixes and seven additions made on 2026-11-01. Sources for each are in `skills/api-security/SOURCES.md`.

## Bug fixes

| ID | Prompt | Acceptance criteria |
| --- | --- | --- |
| F1 | "Our CI step runs `npm audit --fix` and `pnpm audit --fix` in two packages. Is that right?" | Says npm's fix is the `npm audit fix` subcommand, and `--force` is needed for SemVer-major. Says `pnpm audit --fix` is a real flag that adds overrides to `pnpm-workspace.yaml`, with `--fix=update` to change the lockfile instead. Does not invent a `pnpm audit fix` subcommand. |
| F2 | "Review this Server Action." Fixture: `reserveTickets` that reads `SUM(count)` for the user and event, compares with 10, then inserts, with no transaction. | Names the check-then-insert race: concurrent requests all read the old total and all pass. Fixes it with a transaction plus a row lock (`.for('update')` or `SELECT ... FOR UPDATE`), or a single conditional insert or update. Explains in one line why the lock closes the gap. Notes the `bigint` sum or casts it. |
| F3 | "Is this SSRF check enough?" Fixture: `validateUrl` with a host allowlist and hostname regexes for private ranges, then `fetch(url)`. | Says the regexes never see an IP, and an allowed or public name can resolve to a private address. Explains DNS rebinding between check and fetch. Resolves A and AAAA, blocks loopback, RFC 1918, link-local and `169.254.169.254`, `fc00::/7`, `fe80::/10` and IPv4-mapped forms, and pins the socket to the checked IP (custom `lookup` on an undici `Agent` or equivalent). Keeps `redirect: 'error'`. |
| F4 | "Upgrade these handlers to Zod 4." Fixture: three handlers using `parsed.error.flatten().fieldErrors`. | Replaces with `z.flattenError(parsed.error).fieldErrors`, or `z.treeifyError` for nested shapes. States `.flatten()` is deprecated in Zod 4. Does not use `.formErrors` on the error. |
| F5 | "We put the app behind a proxy at `shop.example.com` and now every Server Action fails. Also, do our Route Handlers need CSRF checks?" | Explains the Origin vs `x-forwarded-host`/`host` comparison and adds the public host to `experimental.serverActions.allowedOrigins` (host, not URL). Says the built-in check covers POST Server Actions only, a missing Origin only warns, and Route Handlers or state-changing GETs get no protection. |

## New topics

| ID | Prompt | Acceptance criteria |
| --- | --- | --- |
| N1 | "Add avatar and PDF uploads to our Next.js app." | Caps size at `serverActions.bodySizeLimit` and in Route Handlers by counting bytes, not only `Content-Length`. Detects type from magic bytes against an allowlist and ignores `file.type` and the extension. Stores under a random name. Serves from a separate origin with `X-Content-Type-Options: nosniff` and `Content-Disposition: attachment` (inline only for raster images). Refuses SVG and HTML inline. Leaves a scan hook that fails closed. |
| N2 | "This route makes thumbnails with `exec(\`convert uploads/${name} ...\`)`. Make it safe." | Replaces `exec` with `execFile` or `spawn` and an argument array, no `shell: true`. Validates the input (an issued ID, not a raw filename). Mentions argument injection and `--`. Maps it to A05:2025. |
| N3 | "Our login does `users.findOne({ email: body.email, password: hash(body.password) })` on MongoDB. Any issue?" | Shows `{ "$ne": null }` style operator injection through an object value. Fixes it with a Zod schema that forces scalar strings before the filter is built. Says not to accept client `$where`, `$regex` or `$expr`. Maps it to A05:2025. |
| N4 | "Add TOTP two-factor and backup codes to our custom auth." | Limits attempts per account. Accepts the current step and at most one back, and rejects a step already used. Stores backup codes hashed and spends each once atomically. Recovery cannot remove MFA through a password reset or email alone. Recommends passkeys as phishing-resistant with server-checked user verification. |
| N5 | "Attackers are trying leaked passwords against our login from thousands of IPs. Our IP rate limit isn't catching it." | Adds a failure counter keyed on the account, alongside the IP limit. Avoids a hard lockout that anyone can trigger: backs off or asks for CAPTCHA, keeps the reset path open, and returns the same message. Names MFA as the strongest defence. |
| N6 | "Write `generateResetToken` for our password reset." Fixture: the `requestPasswordReset` from `authentication.md` that calls it. | Uses a CSPRNG token of at least 32 bytes, stores only its hash, sets a short expiry, and spends it once atomically. Keeps the same response and timing whether or not the account exists. Builds the link from a fixed origin, not `Host`. Revokes sessions after the reset and does not log the user in. |
| N7 | "Add CSRF protection to our cookie-authenticated Route Handlers." | Checks `Sec-Fetch-Site` first and accepts only `same-origin` for unsafe methods. Falls back to an exact `Origin` match when the header is missing, and rejects a missing or `null` Origin. Uses a `__Host-` session cookie. Calls `SameSite` defence in depth, not the fix. Does not use a prefix match on Origin. |
| N8 | "Our app booted fine in prod with `AUTH_SECRET` unset. How do we stop that?" | Parses `process.env` with a Zod schema at startup, from `instrumentation.ts` `register()` or an imported `env` module, and throws on a missing or short secret. Prints variable names, never values. Replaces `process.env.X!` reads with the typed `env`. |
| N9 | "Audit `app/api` for security issues and write up what you find." | Uses the report format: findings grouped by root cause, each with file:line, severity, OWASP id (API and Web), and a fix. |

## Selection

The skill should load for the first ten and not for the last ten.

| ID | Prompt | Should load |
| --- | --- | --- |
| S1 | Add rate limiting to our Next.js API routes | yes |
| S2 | Is this Server Action safe to call from any page? | yes |
| S3 | Validate this webhook URL before we fetch it | yes |
| S4 | Let users upload profile pictures | yes |
| S5 | Add two-factor login with an authenticator app | yes |
| S6 | Write the forgot-password flow | yes |
| S7 | Our Server Actions break behind the Cloudflare proxy | yes |
| S8 | Lock down CORS on this route handler | yes |
| S9 | Are these security headers in next.config right? | yes |
| S10 | Check this Mongo query for injection | yes |
| S11 | Write React Testing Library tests for this signup form | no (react-testing) |
| S12 | Turn on `noUncheckedIndexedAccess` and fix the errors | no (typescript-safety) |
| S13 | Migrate this page from `getServerSideProps` to the App Router | no (nextjs-app-router) |
| S14 | Stop a poisoned README from steering our coding agent | no (llm-agent-security) |
| S15 | Audit our modal for WCAG 2.2 focus order | no (wcag-accessibility) |
| S16 | Build a Tailwind v4 token system | no (tailwind-design-system) |
| S17 | Profile why this list re-renders on every keystroke | no (react-performance) |
| S18 | Draw an ASCII diagram of our deploy pipeline | no (ascii-art) |
| S19 | Write a WGSL compute shader for a prefix sum | no (webgpu) |
| S20 | Rename these variables so the function reads better | no (code-readability) |
