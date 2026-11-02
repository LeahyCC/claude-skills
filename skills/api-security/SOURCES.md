# Scoped security follow-up

Actually checked 2026-10-21 (Pacific/Honolulu), after #12/#13. This covers previously deferred deployment-key/GraphQL sections and adjacent provider/provisioning guidance; it is not a whole-skill security certification. Preserve the existing OWASP mappings, CORS resources, unrelated auth sections and filenames. Metadata/discovery fields remain unchanged.

| Section | KEEP | REVISE | ADD | REMOVE |
| --- | --- | --- | --- | --- |
| Server Functions key | Strong generated secret and cross-instance coordination | Per-build default, build-time injection, valid AES encoding | Artifact/rotation/version-skew and authorization limits | Claim every server process independently generates a key; universal hosting assumption |
| GraphQL | Cost beyond request count | Real enforcement and configurable limits | Width/list/batch/alias/cancellation test scenarios | Unwired PASS rules and universal depth/score defaults |
| Provider/provisioning | Optional Clerk integration and supported service integrations | Choice and credential lifecycle remain project responsibilities | Scope/environment/rotation checks | Exclusive native-provider, deprecated matcher default, exact null sentinel and no-secrets-management assertions |
| Sources | Primary OWASP/Upstash/Next refs | Link official Server Action security | Scoped records | Third-party newsletter as technical authority |

| Canonical source | Applicable scope/config | Upstream date | Sections checked |
| --- | --- | --- | --- |
| [Next self-hosting](https://nextjs.org/docs/app/guides/self-hosting) | Next16.4.2 live docs, multi-instance builds; check installed version | 2026-10-15 | Key generated per build, base64 AES length, next build injection, deployment skew |
| [Next data security](https://nextjs.org/docs/app/guides/data-security) | App Server Functions/Actions | unknown | Encrypted closures do not replace safe data handling/auth; advanced key override |
| [OWASP GraphQL Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/GraphQL_Cheat_Sheet.html) | GraphQL APIs; server/plugin integration depends on installed implementation | unknown | DoS depth/amount/cost/timeouts/rate limits and batching; not a universal numeric policy |
| [Clerk middleware](https://clerk.com/docs/reference/nextjs/clerk-middleware) | Optional installed @clerk/nextjs provider integration | 2026-10-21 | Optional integration, Next filename versions and Core3 createRouteMatcher deprecation |
| [Vercel Integrations](https://vercel.com/docs/integrations) | Supported service provisioning | unknown | Integrations provision supported services, not a general elimination of secret lifecycle work |
| [Clerk App Router auth](https://clerk.com/docs/reference/nextjs/app-router/auth) | Core3 SDK, organization context and explicit sample admin policy; older SDK differs | 2026-10-21 | isAuthenticated/auth requirements and resource checks |
| [Vercel environment variables](https://vercel.com/docs/environment-variables) | Project/environment configuration | unknown | Environment scoping and managed configuration |

Every row was checked 2026-10-21; unknown upstream dates were not inferred from fetch time. Primary-source review supports the prose decisions, not deployment success. The old GraphQL array had no callers or server integration in this markdown-only repo; resource callers remain intact. No runtime script or new dependency is needed for a server-agnostic policy. No external skill code was reused.

Validation: frontmatter/discovery unchanged, local links/whitespace checked. Six extracted Clerk action policy cases passed with auth/DB stubs; actual SDK/provider/tenant integration is untested. Locally confirmed base64 round-trips 16/24/32-byte fixture keys and rejects an invalid byte length; no production secret generated or logged. No real GraphQL server enforcement, key rotation, rolling deployment or provider integration was executed. Those require the target application's runtime/config. No new model benchmark or security certification is claimed. Recheck after relevant upgrades/deployment failures or after three months of active reliance; age alone is not a defect.

## 2026-11-01 follow-up: bug fixes and new topics

Checked 2026-11-01. Five bug fixes and seven additions, listed below. Topics were borrowed from an outside list. No text or code was copied from it. Every claim below was read on the source page that day.

| Section | KEEP | REVISE | ADD | REMOVE |
| --- | --- | --- | --- | --- |
| Supply chain audit | `npm audit`, `pnpm audit` | `npm audit fix` is a subcommand. `pnpm audit --fix` adds overrides | `--fix=update` | `npm audit --fix` |
| Data exposure API6 | Per-order and per-event caps | Check and insert in one transaction with a row lock | `sum()` bigint cast, conditional `UPDATE` for shared caps | Unlocked SUM then INSERT |
| SSRF | Allowlist, HTTPS only, no redirects, timeouts | `validateUrl` checks IP literals, `safeFetch` pins the checked IP | DNS resolve of A and AAAA, BlockList ranges, undici custom lookup | Hostname regex deny list that never saw an IP |
| Input validation | Zod schemas | `z.flattenError(error)` | Command injection, NoSQL operator injection | `error.flatten()` |
| CSRF | Server Action origin check, Route Handler check | Actions are POST-only, missing Origin only warns, `allowedOrigins` | Fetch Metadata first, exact Origin fallback, `__Host-` cookie, SameSite as defence in depth | "No additional CSRF protection needed" |
| File uploads | Avatar byte check idea | Moved to `file-uploads.md` as one home | Size caps per layer, random names, scan hook, separate origin, serving headers | Duplicate snippet in SSRF |
| Authentication | Same reset response for every email | Reset request runs in `after()` for even timing | `generateResetToken`, `consumeResetToken`, TOTP, backup codes, MFA recovery, passkeys | Undefined `generateResetToken` |
| Rate limiting | Per-IP auth limit | Login row notes per-account failures | Per-account failure counter that slows, not locks | None |
| Env vars | DAL-only `process.env` | `env` module replaces `!` assertions | Zod schema parsed in `instrumentation.ts` | None |

| Canonical source | Applicable scope/config | Upstream date | Sections checked |
| --- | --- | --- | --- |
| [npm audit](https://docs.npmjs.com/cli/v11/commands/npm-audit) | npm 11 CLI | unknown | `npm audit [fix\|signatures]`, `--force` needed for SemVer-major |
| [pnpm audit](https://pnpm.io/cli/audit) | pnpm CLI | unknown | `--fix` adds overrides to `pnpm-workspace.yaml`, `--fix=update` updates the lockfile |
| [PostgreSQL explicit locking](https://www.postgresql.org/docs/current/explicit-locking.html) | Postgres current | unknown | `FOR UPDATE` blocks other locks and writes on the row until commit |
| [PostgreSQL aggregate functions](https://www.postgresql.org/docs/current/functions-aggregate.html) | Postgres current | unknown | `sum(integer)` returns `bigint` |
| [Drizzle pg select builder](https://github.com/drizzle-team/drizzle-orm/blob/main/drizzle-orm/src/pg-core/query-builders/select.ts) | drizzle-orm main | unknown | `.for(strength)` locking clause |
| [node-postgres types](https://node-postgres.com/features/types) | pg | unknown | Types without a parser come back as strings |
| [OWASP SSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html) | Server-side fetch | unknown | Check every A and AAAA answer, rebinding, connect to the checked IP, minimum deny list, metadata IP, IMDSv2, no redirects |
| [Node.js 22 net](https://nodejs.org/docs/latest-v22.x/api/net.html) | Node 22 | unknown | `BlockList.addSubnet` and `check`, IPv4-mapped notation, `lookup` connect option, `isIP` |
| [Node.js 22 dns](https://nodejs.org/docs/latest-v22.x/api/dns.html) | Node 22 | unknown | `lookup` with `all: true` callback shape |
| [undici Client](https://github.com/nodejs/undici/blob/main/docs/docs/api/Client.md) | undici main | unknown | `connect` accepts `tls.connect()` options, custom DNS lookup example |
| [Zod error formatting](https://zod.dev/error-formatting), [Zod 4 changelog](https://zod.dev/v4/changelog), [Zod API](https://zod.dev/api) | Zod 4 | unknown | `z.flattenError`, `z.treeifyError`, `.flatten()` and `.format()` deprecated, `z.url`, `z.email`, `z.strictObject`, `z.object` strips unknown keys |
| [Next.js serverActions config](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions) | Next 16 docs | 2026-08-26 | `allowedOrigins` host matching and wildcards, missing Origin warns, `bodySizeLimit` 1 MB default, counts multipart overhead |
| [Next.js data security](https://nextjs.org/docs/app/guides/data-security#allowed-origins-advanced) | Next 16 docs | 2026-10-06 | Actions POST-only, Origin vs Host or X-Forwarded-Host, reverse proxies |
| [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html) | Browser-facing endpoints | unknown | Fetch Metadata for modern browsers with a mandatory Origin fallback, exact origin match, `null` Origin, `__Host-`, SameSite defence in depth, XSS defeats CSRF defences |
| [MDN Sec-Fetch-Site](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-Fetch-Site) | Browsers | unknown | Values and forbidden header status |
| [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html) | Uploads | unknown | Extension and Content-Type not trusted, signature not alone, generated names, size limits, different host, AV and CDR, image rewriting, CSRF, permissions |
| [OWASP API4:2023](https://api-security.owasp.org/editions/2023/en/0xa4-unrestricted-resource-consumption/), [A06:2025](https://top10.owasp.org/2025/A06_2025-Insecure_Design/) | Mapping | unknown | Maximum upload size; CWE-434 under A06 |
| [MDN Content-Disposition](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Disposition), [X-Content-Type-Options](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Content-Type-Options), [SVG script](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/script) | Browsers | unknown | `attachment` vs `inline`, `filename*`, `nosniff` behaviour, script in SVG |
| [OWASP A05:2025 Injection](https://top10.owasp.org/2025/A05_2025-Injection/) | Mapping | unknown | OS command (CWE-77, CWE-78) and NoSQL named |
| [OWASP OS Command Injection Defense](https://cheatsheetseries.owasp.org/cheatsheets/OS_Command_Injection_Defense_Cheat_Sheet.html) | Any language | unknown | Avoid commands, separate arguments, allowlists, argument injection and `--`, least privilege |
| [Node.js 22 child_process](https://nodejs.org/docs/latest-v22.x/api/child_process.html) | Node 22 | unknown | `exec` uses a shell, `execFile` does not by default, `shell` option warning, `.bat`/`.cmd` on Windows, promisified `execFile` |
| [OWASP NoSQL Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/NoSQL_Security_Cheat_Sheet.html), [WSTG NoSQL Injection](https://github.com/OWASP/wstg/blob/master/document/4-Web_Application_Security_Testing/07-Injection/05.6-NoSQL_Injection.md) | MongoDB | unknown | `$ne` object values, scalar type checks, no client `$where`/`$regex`/`$expr`, server-side JS off, denylist weaker |
| [OWASP Multifactor Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html) | MFA | unknown | Attempt limits, single-use OTP, recovery codes, recovery must not bypass MFA, reauth with an existing factor, notify on change, WebAuthn and user verification, SMS restricted |
| [NIST SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html) | Federal guidance | unknown | Phishing resistance and verifier name binding, look-up secrets stored hashed, salt under 112 bits, OTP accepted once |
| [RFC 6238](https://datatracker.ietf.org/doc/html/rfc6238) | TOTP | 2011 | At most one step back for delay, no second use. `totpAt` matched the RFC 4226 test vectors locally |
| [OWASP Forgot Password Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html) | Password reset | unknown | CSPRNG, stored securely, single use, expiry, same message and timing, Host header, `no-referrer`, no auto-login, end sessions, notify |
| [Next.js after](https://nextjs.org/docs/app/api-reference/functions/after) | Next 15.1+ | 2026-09-16 | Runs after the response, allowed in Server Functions and Route Handlers |
| [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html) | Login | unknown | Failure counter on the account, lockout DoS risk, reset path while locked, CAPTCHA as defence in depth, generic messages |
| [OWASP Credential Stuffing Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Credential_Stuffing_Prevention_Cheat_Sheet.html) | Login | unknown | Proxy networks beat IP limits, MFA strongest, breached-password checks, notify on correct password plus failed MFA |
| [Upstash Ratelimit methods](https://upstash.com/docs/redis/sdks/ratelimit-ts/methods) | @upstash/ratelimit | unknown | `getRemaining` returns `{ remaining, reset }`, `resetUsedTokens` |
| [Next.js instrumentation](https://nextjs.org/docs/app/guides/instrumentation), [environment variables](https://nextjs.org/docs/app/guides/environment-variables) | Next 16 docs | 2026-08-06, 2026-08-25 | `register` once per server before requests, `NEXT_RUNTIME`, `NEXT_PUBLIC_` inlined at build only for literal references |

Validation: the pinned lookup and `BlockList` rules ran on local Node 26 (not 22) against `localhost` (blocked) and a public host (connected, certificate valid). That run also showed that a `::ffff:0:0/96` rule blocks every IPv4 address, so it is not in the sample. The TOTP helper matched RFC 4226 vectors. The other samples were checked by reading against the APIs above, not compiled. No upload pipeline, WebAuthn library, Mongo server or proxy deployment was run.
