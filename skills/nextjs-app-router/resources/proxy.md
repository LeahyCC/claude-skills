# Proxy and request interception

Use `proxy.ts` for request-dependent redirects, rewrites or header/cookie changes. Static redirects/headers may fit `next.config.*` better. Do not add Proxy when ordinary routing or a data-boundary auth check solves the task.

## Version and location

Next.js 16 renames/deprecates the `middleware` convention in favor of `proxy`; middleware is not simply removed. Proxy runs on Node.js and does not support an Edge runtime setting. Preserve Edge middleware when required by the project's supported version/deployment rather than renaming it blindly. Proxy belongs alongside `app`/`pages`, at the root or under `src`, not inside `app`.

```ts
// proxy.ts; Next.js 16 Node runtime
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  const destination = request.nextUrl.clone()
  destination.pathname = destination.pathname.replace('/legacy/', '/docs/')
  return NextResponse.redirect(destination)
}

export const config = { matcher: '/legacy/:path*' }
```

Matcher values must be statically analyzable. Target relevant paths; test static assets, image optimization, APIs and prefetched navigation. Broad exclusion regexes are easy to get wrong. Preserve query parameters only where intended.

## Authentication boundary

Proxy can offer an optimistic redirect based on a verified cookie using an existing auth library. Cookie presence is not authenticated identity. Avoid expensive/duplicated DB lookups on every intercepted request; use the auth provider's supported integration rather than inventing a session scheme. Latency budgets depend on the application, not a universal 50ms rule.

Authenticate and authorize again at protected reads, Route Handlers and Server Actions, including resource ownership. A layout or Proxy gate can be bypassed or become stale. Never accept a caller's forwarded identity header as proof of authentication unless a trusted infrastructure boundary strips/sets and authenticates it. Validate any login return URL before redirecting to it.

Do not share mutable process state between Proxy and rendering, self-fetch the app for auth or data, or invalidate cache from Proxy. For complex resource-dependent 404s use the route/data boundary. Rewriting to a made-up `/not-found` page does not establish a real 404 status; inspect actual response semantics.

## Verify

Exercise matched/unmatched paths, direct unauthorized page/action/API calls, forged and expired cookies, assets, client navigation and callback redirects. Measure added request latency. Proxy auth is an optimization/UX boundary, not the authorization system.

Sources: [Proxy API and migration](https://nextjs.org/docs/app/api-reference/file-conventions/proxy), [Authentication and DAL](https://nextjs.org/docs/app/guides/authentication), [404 convention](https://nextjs.org/docs/app/api-reference/file-conventions/not-found). Scope/dates: [ledger](../SOURCES.md).
