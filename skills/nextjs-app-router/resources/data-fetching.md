# Data Fetching

> **Core Principle:** Fetch data where it is consumed. Prefer Server Components for reads; use Client fetching only when browser interaction requires it.

## Introduction

The App Router fetches data during server render and streams HTML to the client. Use `fetch()`, an ORM, or any async I/O in Server Components. Pass Promises to Client Components with `use()` when you need client-side unwrapping. Mutate with Server Actions — this resource covers the **read vs write** boundary only.

For Server vs Client boundaries, see [server-components.md](server-components.md). For `'use cache'`, tags, and invalidation, see [caching.md](caching.md). For `loading.tsx` and error boundaries, see [error-handling.md](error-handling.md).

## Data Fetching Philosophy

```
Request → Server Component → DB / API → HTML + RSC Payload → Stream → Client hydrate

FAIL:  Browser → Client Component → /api → DB → JSON → Render
PASS:  Browser → Server Component → DB → HTML
```

## Server-first Data Fetching

| Scenario | Pattern |
|----------|---------|
| Database / ORM / CMS / REST / GraphQL | Server Component |
| Auth session for initial render | Server Component (`cookies()` / `headers()`) |
| Form mutation | Server Action — see [Relationship with Server Actions](#relationship-with-server-actions) |
| Webhook / public HTTP API | Route Handler |
| Live search, polling, infinite scroll | Client (SWR / React Query) |

```
Need data before first paint?
├── YES → Server Component (fetch / ORM)
└── NO — browser interaction?
        ├── YES → Client fetch (SWR / React Query / WebSocket)
        └── External HTTP consumer? → Route Handler
```

## Fetch API

`fetch()` in Server Components runs on the server. Secrets stay off the client. Identical `fetch` URLs are memoized per render. Cross-request caching uses `'use cache'` — see [caching.md](caching.md).

```tsx
// app/posts/page.tsx
export default async function PostsPage() {
  const res = await fetch('https://api.example.com/posts', {
    headers: { Authorization: `Bearer ${process.env.API_TOKEN}` },
  })
  if (!res.ok) throw new Error('Failed to fetch posts')
  const posts: { id: string; title: string }[] = await res.json()
  return (
    <main>
      {posts.map((post) => (
        <article key={post.id}><h2>{post.title}</h2></article>
      ))}
    </main>
  )
}
```

| Need | Use |
|------|-----|
| External HTTP / GraphQL / CMS | `fetch()` |
| SQL / document DB | ORM or DB client |
| Tag-based invalidation on fetch | `next: { tags }` — see [caching.md](caching.md) |

## Database / ORM Access

Query the database directly from Server Components — no internal API hop for page reads. Mark DB modules with `server-only` — see [server-components.md](server-components.md).

```tsx
// Prisma — app/users/page.tsx
import { prisma } from '@/lib/prisma'

export default async function UsersPage() {
  const users = await prisma.user.findMany({ select: { id: true, name: true } })
  return <ul>{users.map((u) => <li key={u.id}>{u.name}</li>)}</ul>
}
```

```tsx
// Drizzle
import { db } from '@/lib/db'
import { users } from '@/lib/schema'

export default async function Page() {
  const rows = await db.select().from(users)
  return <>{rows.map((u) => <p key={u.id}>{u.name}</p>)}</>
}
```

### Repository pattern

```tsx
// lib/repositories/products.ts
import { prisma } from '@/lib/prisma'

export async function getProducts() {
  return prisma.product.findMany({
    where: { published: true },
    select: { id: true, name: true, slug: true, price: true },
  })
}

// app/products/page.tsx
import { getProducts } from '@/lib/repositories/products'

export default async function ProductsPage() {
  const products = await getProducts()
  return <>{products.map((p) => <ProductCard key={p.id} product={p} />)}</>
}
```

## React Request Memoization

Within a single server render, identical `fetch()` calls are automatically deduplicated.

```tsx
const a = await fetch('https://api.example.com/users')
const b = await fetch('https://api.example.com/users') // same network request
```

| Mechanism | Scope | Use for |
|-----------|-------|---------|
| `fetch()` memoization | Identical URL + options per render | HTTP |
| `React.cache()` | Function + args per request | ORM, CMS, file reads |
| `'use cache'` | Cross-request | See [caching.md](caching.md) |

## React `cache()`

Wrap non-`fetch` data access so `generateMetadata` and `page.tsx` share one query per request. Define `cache()` once at module scope — each call creates a separate map. Scope is **per request**, not across requests.

```tsx
import { cache } from 'react'
import { db } from '@/lib/db'

export const getUser = cache(async (id: string) => {
  return db.user.findUnique({ where: { id } })
})

const user = await getUser(id) // shared across metadata + page
```

## React `use()`

Start a Promise in a Server Component, pass it to a Client Component, unwrap with `use()` inside Suspense:

```tsx
// app/users/page.tsx
import { Suspense } from 'react'
import { UserList } from './UserList'
import { getUsers } from '@/lib/users'

export default function UsersPage() {
  const usersPromise = getUsers() // do not await
  return (
    <Suspense fallback={<p>Loading users…</p>}>
      <UserList users={usersPromise} />
    </Suspense>
  )
}
```

```tsx
// UserList.tsx
'use client'
import { use } from 'react'
import type { User } from '@/lib/types'

export function UserList({ users }: { users: Promise<User[]> }) {
  const data = use(users)
  return <ul>{data.map((u) => <li key={u.id}>{u.name}</li>)}</ul>
}
```

Await `params` / `searchParams` in Server Components — see [version-changes.md](version-changes.md).

## Parallel vs Sequential Fetching

```
Sequential (waterfall):  A → B → C = sum of latencies
Parallel:                A ║ B ║ C = max latency
```

### Parallel — independent requests

```tsx
export default async function DashboardPage() {
  const [sales, customers, inventory] = await Promise.all([
    getSales(),
    getCustomers(),
    getInventory(),
  ])
  return (
    <>
      <Sales data={sales} />
      <Customers data={customers} />
      <Inventory data={inventory} />
    </>
  )
}
```

### Sequential — dependent requests

```tsx
export default async function Page({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const artist = await getArtist(username)
  return (
    <>
      <h1>{artist.name}</h1>
      <Suspense fallback={<p>Loading playlists…</p>}>
        <Playlists artistID={artist.id} />
      </Suspense>
    </>
  )
}

async function Playlists({ artistID }: { artistID: string }) {
  const playlists = await getArtistPlaylists(artistID)
  return <ul>{playlists.map((p) => <li key={p.id}>{p.name}</li>)}</ul>
}
```

| Situation | Pattern |
|-----------|---------|
| Dashboard widgets, unrelated APIs | `Promise.all()` |
| User → orders, post → comments | Sequential |
| One failure should not fail all | `Promise.allSettled()` |

## Streaming Data

Stream slow sections so critical content is not blocked. Use `<Suspense>` around fetch boundaries. For route-level `loading.tsx`, see [error-handling.md](error-handling.md).

```tsx
// app/dashboard/page.tsx
import { Suspense } from 'react'
import { RevenueChart } from './RevenueChart'
import { RecentOrders } from './RecentOrders'
import { ChartSkeleton, TableSkeleton } from '@/components/skeletons'

export default function DashboardPage() {
  return (
    <div className="grid gap-6">
      <h1>Dashboard</h1>
      <Suspense fallback={<ChartSkeleton />}><RevenueChart /></Suspense>
      <Suspense fallback={<TableSkeleton />}><RecentOrders /></Suspense>
    </div>
  )
}

// RevenueChart.tsx — Server Component owns its fetch
export async function RevenueChart() {
  return <Chart data={await getRevenue()} />
}
```

## Route Handlers vs Server Components

| Need | Use | Why |
|------|-----|-----|
| Render UI with data | Server Component | No HTTP hop |
| Webhook / third-party / mobile API | Route Handler | HTTP contract |
| File download / streaming binary | Route Handler | Response control |
| Internal page read | Server Component | Direct DB access |

```tsx
// PASS — page data in Server Component
export default async function ReportsPage() {
  const reports = await db.report.findMany()
  return <ReportList reports={reports} />
}

// PASS — Route Handler only for external consumers
// app/api/reports/route.ts
export async function GET() {
  return Response.json(await db.report.findMany())
}

// FAIL — client useEffect → /api for initial page data the server could fetch
```

## Client-side Fetching

Use client libraries when data depends on interaction, polling, or browser-only APIs — not for the initial server-rendered payload.

| Scenario | Approach |
|----------|----------|
| Live search | SWR / React Query |
| Infinite scroll | React Query `useInfiniteQuery` |
| Polling | SWR `refreshInterval` / React Query `refetchInterval` |
| WebSocket / SSE | `useEffect` + native APIs |

### SWR

```tsx
'use client'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function LiveSearchResults({ query }: { query: string }) {
  const { data, error, isLoading } = useSWR(
    query ? `/api/search?q=${encodeURIComponent(query)}` : null,
    fetcher,
    { keepPreviousData: true }
  )
  if (isLoading) return <p>Searching…</p>
  if (error) return <p>Search failed.</p>
  return (
    <ul>
      {data?.results.map((r: { id: string; title: string }) => (
        <li key={r.id}>{r.title}</li>
      ))}
    </ul>
  )
}
```

### React Query

```tsx
'use client'
import { useQuery } from '@tanstack/react-query'

export function JobStatus({ jobId }: { jobId: string }) {
  const { data } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => fetch(`/api/jobs/${jobId}`).then((r) => r.json()),
    refetchInterval: 2000,
    enabled: !!jobId,
  })
  return <p>Status: {data?.status ?? 'pending'}</p>
}
```

### Browser-only

Use native WebSocket/SSE inside `useEffect` for realtime streams. Do not use them for initial page data the server could fetch.

## Relationship with Server Actions

| Concern | Owner |
|---------|-------|
| **Read** | Server Component / `fetch` / ORM |
| **Write** | Server Action (`'use server'`) |
| Cache after write | `updateTag` / `revalidateTag` — see [caching.md](caching.md) |
| Validation errors | Return values — see [error-handling.md](error-handling.md) |

```
Server Component (read) → UI → Client interact → Server Action (mutate) → invalidate cache
```

```tsx
// app/actions/cart.ts
'use server'
import { updateTag } from 'next/cache'
import { requireUser } from '@/lib/auth'

export async function addToCart(productId: string) {
  const user = await requireUser()
  await db.cartItem.create({ data: { userId: user.id, productId } })
  updateTag(`cart-${user.id}`)
}
```

## Common Mistakes

- Client `useEffect` fetch for data the server could load on first paint.
- Sequential `await` for independent queries — use `Promise.all()`.
- Route Handler solely to feed a Server-rendered page.
- Duplicate ORM calls in `generateMetadata` and page without `React.cache()`.
- Importing DB clients into Client Components — see [server-components.md](server-components.md).
- Putting cache lifetime / invalidation logic here instead of [caching.md](caching.md).

## PASS / FAIL Examples

### PASS — stream secondary data; share `cache()` with metadata

```tsx
export default async function Page() {
  const hero = await getHero()
  return (
    <>
      <Hero data={hero} />
      <Suspense fallback={<ReviewsSkeleton />}><Reviews /></Suspense>
    </>
  )
}

const getPost = cache(async (slug: string) =>
  db.post.findUnique({ where: { slug } })
)
```

### FAIL — block the page; sequential independent queries

```tsx
export default async function Page() {
  const hero = await getHero()
  const reviews = await getReviews() // blocks Hero
  return <><Hero data={hero} /><Reviews data={reviews} /></>
}

const sales = await getSales()
const customers = await getCustomers()
const inventory = await getInventory()
```

## Best Practices

- Default to Server Component fetches; add client libraries only for interactive/live data.
- Start independent requests with `Promise.all()`; stream slow sections with Suspense.
- Deduplicate ORM access with `React.cache()` across metadata and pages.
- Isolate queries in a repository layer; keep secrets and DB clients on the server.
- After mutations, invalidate via [caching.md](caching.md).
- Validate `fetch` responses; await `params` in Next.js 16.

## Production Checklist

- [ ] Initial page data fetched in Server Components
- [ ] Independent requests use `Promise.all()`
- [ ] Slow sections wrapped in `<Suspense>` (`loading.tsx` → [error-handling.md](error-handling.md))
- [ ] `React.cache()` deduplicates ORM across `generateMetadata` + page
- [ ] No client `useEffect` for first-paint data
- [ ] Route Handlers only for external HTTP consumers
- [ ] Repository layer separates queries from UI; secrets stay on server
- [ ] Client fetching (SWR / React Query) only for interactive or live data
- [ ] Mutations use Server Actions; cache invalidated via [caching.md](caching.md)
- [ ] `params` / `searchParams` awaited (Next.js 16)

## References

### Verified Against

- [Fetching Data](https://nextjs.org/docs/app/getting-started/fetching-data)
- [Mutating Data](https://nextjs.org/docs/app/getting-started/mutating-data)
- [Route Handlers](https://nextjs.org/docs/app/api-reference/file-conventions/route)
- [React `cache`](https://react.dev/reference/react/cache)
- [React `use()`](https://react.dev/reference/react/use)
- [React Suspense](https://react.dev/reference/react/Suspense)

**Framework:** Next.js 16 App Router · React 19.2

**Last verified:** July 2026
