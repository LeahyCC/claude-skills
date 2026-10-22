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
