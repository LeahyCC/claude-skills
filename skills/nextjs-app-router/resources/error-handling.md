# Error Handling

> **Core Principle:** Model expected errors as return values. Reserve error boundaries for unexpected failures. Place boundaries at the right segment level for graceful recovery.

## Introduction

Next.js provides file conventions for loading states, error boundaries, and 404 pages. Errors fall into two categories:

- **Expected errors** — validation failures, missing resources, failed API calls the app anticipates.
- **Uncaught exceptions** — bugs and unexpected failures caught by error boundaries.

For loading/streaming patterns in data fetching, see [data-fetching.md](data-fetching.md). For proxy-level 404 rewrites, see [proxy.md](proxy.md).

## Architecture

```
Route Segment
│
├── layout.tsx
│     └── (not wrapped by segment error.tsx)
│
├── error.tsx ───────────── Error Boundary (Client Component)
│     └── wraps:
│           ├── loading.tsx ──── Suspense fallback
│           │     └── wraps:
│           │           ├── not-found.tsx
│           │           └── page.tsx
│           └── nested layouts below
│
└── global-error.tsx ─── Root-level boundary (replaces root layout)
```

### Boundary Hierarchy

```
app/
├── global-error.tsx        # Catches root layout errors — must include <html><body>
├── error.tsx               # App-wide segment errors
├── not-found.tsx           # Global 404 for unmatched URLs
│
└── dashboard/
    ├── error.tsx           # Dashboard-specific recovery
    ├── loading.tsx         # Dashboard loading skeleton
    ├── not-found.tsx       # Dashboard 404
    └── settings/
        ├── error.tsx       # Granular settings error
        └── page.tsx
```

Errors bubble to the **nearest parent** `error.tsx`. Place boundaries at segment levels where recovery UX differs.

## Decision Matrix

| Situation | Mechanism | File / API |
|-----------|-----------|------------|
| Route loading | `loading.tsx` | Automatic Suspense boundary |
| Component-level streaming | `<Suspense fallback>` | Inline in page/layout |
| Missing resource | `notFound()` | Triggers `not-found.tsx` |
| Unmatched URL | Root `not-found.tsx` | Automatic 404 |
| Unexpected render error | `error.tsx` | React Error Boundary |
| Root layout crash | `global-error.tsx` | Replaces entire root layout |
| Form validation failure | Return value from Server Action | `useActionState` |
| API fetch failure (expected) | Conditional render in Server Component | Return error UI |
| Event handler failure | `useState` in Client Component | Not caught by error boundary |
| Retry after transient error | `unstable_retry()` | In `error.tsx` |

### Expected vs Uncaught

| Type | Handle With | Throw? |
|------|-------------|--------|
| Invalid form input | Return `{ error: '...' }` from Server Action | No |
| Post not found | `notFound()` | No — special navigation |
| Unauthorized access | `redirect('/login')` | No — special navigation |
| Database connection lost | `error.tsx` boundary | Yes — uncaught |
| Null reference bug | `error.tsx` boundary | Yes — uncaught |

## Production Workflow

```
1. Add loading.tsx per slow route segment
2. Add error.tsx at feature boundaries (dashboard, checkout)
3. Add not-found.tsx for user-friendly 404s
4. Call notFound() when resource lookup fails
5. Return errors from Server Actions — don't throw for validation
6. Log errors in error.tsx via useEffect + reporting service
7. Add global-error.tsx for catastrophic root failures
8. Test: missing slug, API down, client event errors
```

### Loading UI

```tsx
// app/dashboard/loading.tsx
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton'

export default function DashboardLoading() {
  return <DashboardSkeleton />
}
```

`loading.tsx` automatically wraps `page.tsx` and nested children in a Suspense boundary. It does **not** wrap the sibling `layout.tsx` in the same segment.

### Suspense for Granular Streaming

```tsx
// app/dashboard/page.tsx
import { Suspense } from 'react'
import { RevenueChart } from './RevenueChart'
import { RecentOrders } from './RecentOrders'
import { ChartSkeleton, TableSkeleton } from '@/components/skeletons'

export default function DashboardPage() {
  return (
    <div className="grid gap-6">
      <Suspense fallback={<ChartSkeleton />}>
        <RevenueChart />
      </Suspense>
      <Suspense fallback={<TableSkeleton />}>
        <RecentOrders />
      </Suspense>
    </div>
  )
}
```

### Expected Errors — Server Actions

```tsx
// app/actions/invoices.ts
'use server'

import { z } from 'zod'

const schema = z.object({
  amount: z.coerce.number().positive('Amount must be positive'),
  clientId: z.string().uuid('Invalid client'),
})

export async function createInvoice(
  _prevState: { error?: string } | null,
  formData: FormData
) {
  const parsed = schema.safeParse({
    amount: formData.get('amount'),
    clientId: formData.get('clientId'),
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors.amount?.[0] ?? 'Invalid input' }
  }

  const res = await fetch(`${process.env.API_URL}/invoices`, {
    method: 'POST',
    body: JSON.stringify(parsed.data),
  })

  if (!res.ok) {
    return { error: 'Failed to create invoice. Try again.' }
  }

  return { error: undefined }
}
```

```tsx
// app/invoices/new/InvoiceForm.tsx
'use client'

import { useActionState } from 'react'
import { createInvoice } from '@/app/actions/invoices'

export function InvoiceForm() {
  const [state, formAction, pending] = useActionState(createInvoice, null)

  return (
    <form action={formAction}>
      <label htmlFor="amount">Amount</label>
      <input id="amount" name="amount" type="number" step="0.01" required />
      <label htmlFor="clientId">Client ID</label>
      <input id="clientId" name="clientId" required />
      {state?.error && (
        <p role="alert" className="text-destructive">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending}>
        {pending ? 'Creating…' : 'Create Invoice'}
      </button>
    </form>
  )
}
```

### Expected Errors — Server Components

```tsx
// app/reports/page.tsx
import { getReport } from '@/lib/reports'

export default async function ReportsPage() {
  const result = await getReport()

  if (result.error) {
    return (
      <div role="alert">
        <h2>Report unavailable</h2>
        <p>{result.error}</p>
      </div>
    )
  }

  return <ReportView data={result.data} />
}
```

### Not Found

```tsx
// app/products/[slug]/page.tsx
import { notFound } from 'next/navigation'
import { getProductBySlug } from '@/lib/products'

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) {
    notFound()
  }

  return <ProductDetail product={product} />
}
```

```tsx
// app/products/[slug]/not-found.tsx
import Link from 'next/link'

export default function ProductNotFound() {
  return (
    <div>
      <h2>Product not found</h2>
      <p>This product may have been removed or the URL is incorrect.</p>
      <Link href="/products">Browse all products</Link>
    </div>
  )
}
```

### Error Boundary

```tsx
// app/dashboard/error.tsx
'use client'

import { useEffect } from 'react'

export default function DashboardError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error('Dashboard error:', error.digest, error)
    // reportToSentry(error)
  }, [error])

  return (
    <div role="alert">
      <h2>Something went wrong loading your dashboard</h2>
      <p className="text-muted-foreground">
        {error.digest && `Reference: ${error.digest}`}
      </p>
      <button type="button" onClick={() => unstable_retry()}>
        Try again
      </button>
    </div>
  )
}
```

### Global Error

```tsx
// app/global-error.tsx
'use client'

import { useEffect } from 'react'
import './globals.css'

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error('Global error:', error.digest)
  }, [error])

  return (
    <html lang="en">
      <body>
        <main>
          <h1>Application error</h1>
          <p>We hit an unexpected problem. Please try again.</p>
          <button type="button" onClick={() => unstable_retry()}>
            Try again
          </button>
        </main>
      </body>
    </html>
  )
}
```

### `reset()` vs `unstable_retry()`

| Function | Behavior | When to Use |
|----------|----------|-------------|
| `unstable_retry()` | Re-fetches and re-renders segment | **Default** — transient failures |
| `reset()` | Clears error state, re-renders without re-fetch | Specific UI-only recovery |

```tsx
'use client'

export default function Error({
  error,
  unstable_retry,
  reset,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
  reset: () => void
}) {
  return (
    <div>
      <button type="button" onClick={() => unstable_retry()}>
        Reload data
      </button>
      <button type="button" onClick={() => reset()}>
        Dismiss
      </button>
    </div>
  )
}
```

## PASS Examples

### `notFound()` before Suspense boundaries

```tsx
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const item = await getItem(id) // Resolves before streaming starts

  if (!item) notFound()

  return (
    <Suspense fallback={<CommentsSkeleton />}>
      <Comments itemId={id} />
    </Suspense>
  )
}
```

Calling `notFound()` before Suspense boundaries ensures correct 404 HTTP semantics when possible.

### Nested error boundaries

```
app/checkout/error.tsx     → payment failures
app/checkout/shipping/error.tsx → address validation crashes
```

Each level provides context-appropriate recovery UI.

## FAIL Examples

### Throwing for validation in Server Actions

```tsx
// FAIL — triggers error boundary, poor UX
'use server'
export async function createUser(formData: FormData) {
  const email = formData.get('email') as string
  if (!email.includes('@')) {
    throw new Error('Invalid email')
  }
}
```

```tsx
// PASS — return expected error
'use server'
export async function createUser(
  _prev: { error?: string } | null,
  formData: FormData
) {
  const email = formData.get('email') as string
  if (!email.includes('@')) {
    return { error: 'Enter a valid email address.' }
  }
}
```

### Server Component as error boundary

```tsx
// FAIL — error.tsx must be a Client Component
export default function Error({ error }: { error: Error }) {
  return <p>{error.message}</p>
}
```

```tsx
// PASS
'use client'
export default function Error({ error }: { error: Error }) {
  return <p>Something went wrong.</p>
}
```

### Relying on error boundary for event handlers

```tsx
// FAIL — onClick errors are NOT caught by error.tsx
'use client'
export function DeleteButton() {
  return (
    <button onClick={() => { throw new Error('fail') }}>
      Delete
    </button>
  )
}
```

```tsx
// PASS — handle manually
'use client'
import { useState } from 'react'

export function DeleteButton() {
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    try {
      await deleteItem()
    } catch {
      setError('Delete failed. Try again.')
    }
  }

  return (
    <>
      {error && <p role="alert">{error}</p>}
      <button onClick={handleClick}>Delete</button>
    </>
  )
}
```

### Missing `html`/`body` in global-error

```tsx
// FAIL
'use client'
export default function GlobalError() {
  return <p>Error</p>
}
```

```tsx
// PASS — must include html and body
'use client'
export default function GlobalError({ unstable_retry }: { unstable_retry: () => void }) {
  return (
    <html lang="en">
      <body>
        <button onClick={() => unstable_retry()}>Try again</button>
      </body>
    </html>
  )
}
```

## Common Mistakes

- Throwing validation errors from Server Actions instead of returning them.
- Using `error.tsx` without `'use client'` directive.
- Expecting `loading.tsx` to cover slow layout data fetching — wrap layout runtime access in Suspense.
- Calling `notFound()` after streaming has started — may produce soft 404 with `noindex` meta.
- Showing raw `error.message` from Server Components in production — use `error.digest` for support references.
- No `global-error.tsx` — root layout failures show blank page.
- Using `try/catch` around `redirect()` or `notFound()` — they throw special errors by design.
- Placing single error boundary at root only — users lose navigation context on failure.

## Best Practices

- Add `loading.tsx` at each segment with >200ms data fetching.
- Place `error.tsx` at feature boundaries, not just root.
- Return structured errors from Server Actions; use `useActionState` on client.
- Log `error.digest` to your reporting service — correlate with server logs.
- Use `unstable_retry()` as the default recovery action.
- Call `notFound()` as early as possible, before Suspense boundaries.
- Provide actionable 404 pages with navigation back to known routes.
- Handle event handler errors with local state, not error boundaries.
- Test error boundaries in React DevTools (toggle error boundary).
- Include `role="alert"` on error messages for accessibility.

## Production Checklist

### Loading

- [ ] `loading.tsx` per slow route segment
- [ ] Suspense boundaries for independently streaming sections
- [ ] Skeleton UI matches final layout dimensions (prevents CLS)
- [ ] Layout runtime data wrapped in Suspense if using Cache Components

### Expected Errors

- [ ] Server Actions return errors, not throw for validation
- [ ] `useActionState` displays field-level and form-level errors
- [ ] `notFound()` called when resource lookup fails
- [ ] Custom `not-found.tsx` per feature where appropriate

### Error Boundaries

- [ ] `error.tsx` is a Client Component at feature boundaries
- [ ] `unstable_retry()` wired to recovery button
- [ ] Errors logged with `digest` to monitoring service
- [ ] `global-error.tsx` includes `<html>`, `<body>`, and global styles
- [ ] Server error messages not leaked to client in production

### HTTP Semantics

- [ ] `notFound()` called before streaming when 404 status required
- [ ] Soft 404 understood: streamed 404 may return 200 with `noindex`
- [ ] Proxy-level fast checks for compliance 404 when needed

## References

### Verified Against

- [Error Handling](https://nextjs.org/docs/app/getting-started/error-handling)
- [`error.js`](https://nextjs.org/docs/app/api-reference/file-conventions/error)
- [`global-error.js`](https://nextjs.org/docs/app/api-reference/file-conventions/global-error)
- [`loading.js`](https://nextjs.org/docs/app/api-reference/file-conventions/loading)
- [`not-found.js`](https://nextjs.org/docs/app/api-reference/file-conventions/not-found)
- [`notFound`](https://nextjs.org/docs/app/api-reference/functions/not-found)
- [Streaming — Status Codes](https://nextjs.org/docs/app/api-reference/file-conventions/loading#status-codes)

**Framework:** Next.js 16 App Router · React 19

**Last verified:** July 2026
