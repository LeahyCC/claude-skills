# Loading, errors and missing resources

## Choose the boundary and recovery API

| Situation | Mechanism |
| --- | --- |
| Expected validation/business failure | Return structured action state; render close to the form |
| Missing resource | `notFound()` at the data boundary |
| Transient/unexpected rendering failure | Client `error.tsx` at a useful recovery boundary |
| Root layout/template failure | Client `global-error.tsx` with its own html/body and styles |
| Route loading | `loading.tsx`, or Suspense around an independent slow section |
| Event-handler error | Handle in the handler/local state; ordinary render boundary won't catch it |

`error.tsx` in the same segment catches that page and descendant render failures. Move the boundary to a parent only to catch a failing sibling layout/template; do not move every page boundary up one level. `loading.tsx` similarly sits below that segment's layout. Choose boundaries for recovery/streaming UX rather than a fixed millisecond cutoff.

Resolve the installed version before choosing a prop:

| Next version | Recovery |
| --- | --- |
| Older supported App Router, including 16.0/16.1 | `reset()` clears boundary state and retries rendering; do not promise server refetch |
| 16.2 | `unstable_retry()` added for refetch and rerender; verify that version's docs |
| 16.3+ current docs | Stable `retry()` refetches and rerenders; `reset()` remains for clearing without refetch |

```tsx
// app/dashboard/error.tsx; Next.js 16.3+ example
'use client'

export default function DashboardError({ retry }: {
  error: unknown; retry: () => void
}) {
  return <section>
    <h2>Unable to load your dashboard</h2>
    <button onClick={() => retry()}>Try again</button>
  </section>
}
```

For an earlier version use its documented prop and behavior; don't destructure an unsupported `unstable_retry` or `retry`. Current docs type the thrown value as unknown because client code can throw non-Errors. Narrow before reading properties. Server errors sent to production clients are sanitized; correlate `digest` with server logs, and avoid displaying/logging confidential raw error details. Use the project's monitoring instead of prescribing console logging.

A global boundary replaces the root document, so supply the dependencies needed for its UI. The framework has fallback error UI even without a custom global boundary; absence does not universally mean a blank page.

## Actions and navigation

Return expected errors with a stable shape for `useActionState`; validate untrusted FormData rather than casting it to string. Unexpected infrastructure failures can throw. Keep `redirect()` and `notFound()` outside broad try/catch: they throw framework control-flow signals. These mechanisms do not replace access control.

## HTTP status and streaming

`notFound()` terminates the segment and adds noindex metadata. A not-found response before streaming can carry 404; after response headers are sent it can carry 200. Calling it before a local Suspense boundary does not prove no ancestor loading boundary already streamed. Check actual direct HTTP response status/body when status is a requirement. Do not promise a 404 based on a rewrite to a route called `/not-found`.

Test expected form errors, server failure then recovery, client render vs event errors, missing resources, root failure and production streamed status. Ensure useful content remains during loading and failure.

Sources: [Error handling](https://nextjs.org/docs/app/getting-started/error-handling), [error API/version history/global error](https://nextjs.org/docs/app/api-reference/file-conventions/error), [Loading and status codes](https://nextjs.org/docs/app/api-reference/file-conventions/loading), [not-found](https://nextjs.org/docs/app/api-reference/file-conventions/not-found). Scope/dates: [ledger](../SOURCES.md).
