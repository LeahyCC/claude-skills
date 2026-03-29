# Data Exposure

> OWASP API3:2023 (Broken Object Property Level Authorization), API6:2023 (Unrestricted Access to Sensitive Business Flows), A04:2021 (Insecure Design)

The most common data leak is returning too much. Developers query the database, serialize the result, and return the whole object — including fields the user should never see.

## The Data Access Layer (DAL)

The DAL is the central security architecture recommended by Next.js. It's a `server-only` module that:
1. Verifies authentication
2. Checks authorization
3. Returns filtered DTOs — never raw database records

```
Server Action / Route Handler
        ↓
  Data Access Layer (server-only)
    ├── getCurrentUser() — who is asking?
    ├── Authorization check — are they allowed?
    ├── Database query — parameterized
    └── DTO mapping — only needed fields
        ↓
  Filtered Response (safe to send to client)
```

### Setting Up the DAL

```tsx
// data/auth.ts
import 'server-only'
import { cache } from 'react'
import { cookies } from 'next/headers'

export const getCurrentUser = cache(async () => {
  const token = (await cookies()).get('session')?.value
  if (!token) return null

  const session = await validateSession(token)
  if (!session) return null

  // Return a class instance — classes can't accidentally serialize to client
  return new User(session.userId, session.role)
})
```

```tsx
// data/users.ts
import 'server-only'
import { getCurrentUser } from './auth'

// FAIL — returning raw database record
export async function getUser(id: string) {
  return await db.select().from(users).where(eq(users.id, id))
  // Returns: { id, email, passwordHash, ssn, internalNotes, role, stripeCustomerId, ... }
}

// PASS — returning a filtered DTO
export async function getUserProfile(slug: string) {
  const currentUser = await getCurrentUser()
  if (!currentUser) throw new Error('Unauthorized')

  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.slug, slug)))

  if (!user) return null

  return {
    name: user.name,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    // Only the owner sees their own email
    email: currentUser.id === user.id ? user.email : undefined,
    // Only admins see internal flags
    ...(currentUser.isAdmin && { verified: user.verified, flagged: user.flagged }),
  }
}
```

### Using `server-only`

The `server-only` import ensures the DAL can never be imported from a Client Component. If someone tries, the build fails.

```bash
npm install server-only
```

```tsx
// data/orders.ts
import 'server-only'  // build error if imported from 'use client' file

export async function getOrderDetails(orderId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, user.id)))

  if (!order) return null

  // DTO — only fields the user needs
  return {
    id: order.id,
    status: order.status,
    total: order.total,
    items: order.items,
    createdAt: order.createdAt,
    // NOT included: internalNotes, costPrice, supplierId, margin
  }
}
```

## Response Filtering Patterns

### Select Specific Fields (Database Level)

Don't `SELECT *` — select only what you need.

```tsx
// FAIL — selecting everything
const users = await db.select().from(users)

// PASS — selecting specific fields
const users = await db
  .select({
    id: users.id,
    name: users.name,
    avatarUrl: users.avatarUrl,
  })
  .from(users)
```

### DTO Mapping (Application Level)

When you need fields for logic but shouldn't return all of them:

```tsx
// types/dto.ts
export type UserProfileDTO = {
  id: string
  name: string
  bio: string | null
  avatarUrl: string | null
}

export type AdminUserDTO = UserProfileDTO & {
  email: string
  role: string
  createdAt: Date
  lastLoginAt: Date | null
}

// data/users.ts
export function toUserProfileDTO(user: DbUser): UserProfileDTO {
  return {
    id: user.id,
    name: user.name,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
  }
}

export function toAdminUserDTO(user: DbUser): AdminUserDTO {
  return {
    ...toUserProfileDTO(user),
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  }
}
```

## Error Sanitization

Error messages are a common source of data leaks — stack traces, SQL queries, internal paths, and variable names.

```tsx
// FAIL — leaking internal details in error responses
export async function POST(request: Request) {
  try {
    const body = await request.json()
    await db.insert(users).values(body)
    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
    // Leaks: "duplicate key value violates unique constraint "users_email_key""
    // Attacker now knows: table name, column name, constraint name
  }
}

// PASS — generic errors to client, detailed logs to server
export async function POST(request: Request) {
  try {
    const parsed = CreateUserSchema.safeParse(await request.json())
    if (!parsed.success) {
      return Response.json({ error: 'Invalid input' }, { status: 422 })
    }

    await db.insert(users).values(parsed.data)
    return Response.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error('User creation failed:', error)  // full details in server logs
    return Response.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
```

### Error Classification

```tsx
// lib/errors.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public userMessage: string,
    public internalMessage?: string,
  ) {
    super(internalMessage ?? userMessage)
  }
}

export function handleApiError(error: unknown): Response {
  if (error instanceof AppError) {
    console.error(`[${error.statusCode}] ${error.internalMessage ?? error.userMessage}`)
    return Response.json(
      { error: error.userMessage },
      { status: error.statusCode }
    )
  }

  // Unknown errors — never expose details
  console.error('Unhandled error:', error)
  return Response.json(
    { error: 'An unexpected error occurred' },
    { status: 500 }
  )
}
```

## Preventing Business Logic Abuse (API6)

API6 covers attacks that exploit legitimate API functionality at scale — scalping, fare manipulation, referral abuse.

```tsx
// FAIL — no protection against automated booking abuse
'use server'
export async function reserveTickets(eventId: string, count: number) {
  await db.insert(reservations).values({ eventId, count, userId: user.id })
}
// Attacker books 600 seats across all events in seconds

// PASS — business logic limits
'use server'
import { apiLimiter } from '@/lib/rate-limit'

export async function reserveTickets(eventId: string, count: number) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  // Per-user limit
  if (count > 6) return { error: 'Maximum 6 tickets per order' }

  // Check existing reservations
  const existing = await db
    .select({ total: sql<number>`SUM(count)` })
    .from(reservations)
    .where(and(eq(reservations.eventId, eventId), eq(reservations.userId, user.id)))

  if ((existing[0]?.total ?? 0) + count > 10) {
    return { error: 'Maximum 10 tickets per person per event' }
  }

  // Rate limit to prevent rapid automated requests
  const { success } = await apiLimiter.limit(`reserve:${user.id}`)
  if (!success) return { error: 'Please wait before making another reservation' }

  await db.insert(reservations).values({ eventId, count, userId: user.id })
}
```

## What to Never Return to the Client

| Field | Risk |
|-------|------|
| `passwordHash` | Offline cracking |
| `ssn`, `taxId` | Identity theft |
| `internalNotes` | Information disclosure |
| `stripeCustomerId`, `paymentMethodId` | Payment fraud |
| `costPrice`, `margin` | Business intelligence leak |
| `ipAddress`, `userAgent` | Privacy violation |
| `apiKey`, `secretKey` | Full account takeover |
| `resetToken`, `verificationCode` | Account takeover |
| Stack traces, SQL queries | Attack surface discovery |
| Full file paths | Server architecture disclosure |

## Pagination and Data Limits

```tsx
// FAIL — no limit, returns entire table
export async function GET() {
  const allUsers = await db.select().from(users)  // 500k records
  return Response.json(allUsers)
}

// PASS — enforced server-side pagination
import { z } from 'zod'

const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export async function GET(request: Request) {
  const url = new URL(request.url)
  const { page, limit } = PaginationSchema.parse({
    page: url.searchParams.get('page'),
    limit: url.searchParams.get('limit'),
  })

  const offset = (page - 1) * limit

  const results = await db
    .select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl })
    .from(users)
    .limit(limit)
    .offset(offset)

  return Response.json({ data: results, page, limit })
}
```

## Audit Patterns

```bash
# Find SELECT * queries (potential over-fetching)
grep -rn "\.select()" --include="*.ts" | grep -v "\.select({" | grep "from("

# Find error.message returned to client
grep -rn "error\.message\|error\.stack\|err\.message" --include="*.ts" --include="*.tsx" | grep -i "json\|response"

# Find potential sensitive fields in API responses
grep -rn "passwordHash\|password_hash\|ssn\|secret\|apiKey\|api_key\|token\|creditCard" --include="*.ts" | grep -v "\.env\|test\|spec\|mock"

# Find Route Handlers without pagination
find . -name "route.ts" -exec grep -l "select\|findMany\|find(" {} \; | \
  xargs grep -L "limit\|take\|pageSize\|per_page"
```

## Sources

- [OWASP API3:2023 — Broken Object Property Level Authorization](https://owasp.org/API-Security/editions/2023/en/0xa3-broken-object-property-level-authorization/)
- [OWASP API6:2023 — Unrestricted Access to Sensitive Business Flows](https://owasp.org/API-Security/editions/2023/en/0xa6-unrestricted-access-to-sensitive-business-flows/)
- [Next.js Data Security Guide](https://nextjs.org/docs/app/guides/data-security)
- [Next.js Security Blog — Server Components and Actions](https://nextjs.org/blog/security-nextjs-server-components-actions)
