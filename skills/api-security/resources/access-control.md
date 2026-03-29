# Access Control

> OWASP API1:2023 (Broken Object Level Authorization), API5:2023 (Broken Function Level Authorization), A01:2021 (Broken Access Control)

Access control is the #1 API vulnerability. Every API endpoint — Route Handler or Server Action — must verify both **authentication** (who are you?) and **authorization** (can you do this to this resource?).

## The Two Authorization Failures

| Failure | OWASP | What Happens | Example |
|---------|-------|--------------|---------|
| **BOLA** (Object-Level) | API1 | User accesses another user's data via ID manipulation | `GET /api/orders/456` returns someone else's order |
| **BFLA** (Function-Level) | API5 | User accesses admin endpoints | Regular user calls `DELETE /api/admin/users/123` |

## Rule 1: Never Trust Client-Supplied IDs

The most common access control failure. If the client sends an ID, the attacker controls it.

```tsx
// FAIL — BOLA: attacker changes userId in request body
'use server'
export async function getOrders(userId: string) {
  return await db.select().from(orders).where(eq(orders.userId, userId))
}

// PASS — derive userId from session, never from client
'use server'
import { getCurrentUser } from '@/data/auth'

export async function getOrders() {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  return await db.select().from(orders).where(eq(orders.userId, user.id))
}
```

### When You Must Accept an ID

Sometimes you need a resource ID (viewing a specific order, editing a post). Always verify ownership:

```tsx
// FAIL — checks auth but not ownership
'use server'
export async function getOrder(orderId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  return await db.select().from(orders).where(eq(orders.id, orderId))
}

// PASS — checks auth AND ownership
'use server'
export async function getOrder(orderId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, user.id)))

  if (!order) throw new Error('Not found')
  return order
}
```

The `and()` clause ensures the order belongs to the requesting user. If it doesn't, the query returns nothing — no information leak about whether the order exists.

## Rule 2: Auth in Every Server Action

Server Actions are public HTTP endpoints. Page-level auth (in `proxy.ts` or layout) does NOT extend to actions.

```tsx
// FAIL — relies on page-level auth
'use server'
export async function updateProfile(data: FormData) {
  const name = data.get('name') as string
  await db.update(users).set({ name }).where(eq(users.id, '???'))
}

// PASS — action verifies its own auth
'use server'
import { getCurrentUser } from '@/data/auth'

export async function updateProfile(data: FormData) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const name = data.get('name') as string
  await db.update(users).set({ name }).where(eq(users.id, user.id))
}
```

## Rule 3: Auth in Every Route Handler

Route Handlers are standard HTTP endpoints with no automatic protection.

```tsx
// FAIL — no auth check
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await db.select().from(users).where(eq(users.id, id))
  return Response.json(user)
}

// PASS — auth + ownership check
import { getCurrentUser } from '@/data/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  if (id !== currentUser.id && !currentUser.isAdmin) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const [user] = await db.select().from(users).where(eq(users.id, id))
  if (!user) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  return Response.json(toUserDTO(user))
}
```

## Rule 4: Role-Based Function Authorization

Prevent regular users from accessing admin or elevated functions.

```tsx
// data/auth.ts — centralized role checking
import 'server-only'
import { cache } from 'react'
import { cookies } from 'next/headers'

export const getCurrentUser = cache(async () => {
  const token = (await cookies()).get('session')?.value
  if (!token) return null

  const session = await validateSession(token)
  if (!session) return null

  return {
    id: session.userId,
    role: session.role,
    isAdmin: session.role === 'admin',
  }
})

export async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  if (!user.isAdmin) throw new Error('Forbidden')
  return user
}

export async function requireRole(role: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  if (user.role !== role && !user.isAdmin) throw new Error('Forbidden')
  return user
}
```

```tsx
// FAIL — checking role on the client side
'use client'
export function AdminPanel() {
  const { user } = useAuth()
  if (user.role !== 'admin') return null  // client-side only — trivially bypassed
  return <DeleteAllUsersButton />
}

// PASS — checking role on the server side in the action
'use server'
import { requireAdmin } from '@/data/auth'

export async function deleteAllInactiveUsers() {
  const admin = await requireAdmin()

  await db.delete(users).where(
    and(eq(users.active, false), sql`last_login < NOW() - INTERVAL '1 year'`)
  )

  await auditLog('delete_inactive_users', { adminId: admin.id })
}
```

## Rule 5: Use Unpredictable IDs

Sequential IDs (1, 2, 3...) make enumeration trivial. Use UUIDs or CUIDs.

```tsx
// FAIL — sequential IDs are enumerable
const user = await db.insert(users).values({
  id: nextId++,  // attacker tries id=1, id=2, id=3...
  name: 'Alice',
})

// PASS — random IDs prevent enumeration
import { createId } from '@paralleldrive/cuid2'

const user = await db.insert(users).values({
  id: createId(),  // e.g., "clh3am1gf0000356789abcdef"
  name: 'Alice',
})
```

Even with random IDs, always verify ownership. Random IDs are a layer of defense, not a replacement for authorization.

## CORS in Route Handlers

CORS misconfigurations allow unauthorized cross-origin API access.

```tsx
// FAIL — wildcard CORS allows any origin
export async function GET(request: Request) {
  return Response.json(data, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  })
}

// FAIL — reflecting the origin header back (same as wildcard)
export async function GET(request: Request) {
  const origin = request.headers.get('origin')
  return Response.json(data, {
    headers: { 'Access-Control-Allow-Origin': origin ?? '*' },
  })
}

// PASS — explicit origin allowlist
const ALLOWED_ORIGINS = new Set([
  'https://myapp.com',
  'https://staging.myapp.com',
])

export async function GET(request: Request) {
  const origin = request.headers.get('origin') ?? ''

  const headers: HeadersInit = {
    'Access-Control-Allow-Methods': 'GET, POST',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  }

  // Only set Allow-Origin for allowed origins — omit entirely for others
  if (ALLOWED_ORIGINS.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
  }

  return Response.json(data, { headers })
}
```

## Multi-Tenant Authorization

In multi-tenant apps, always scope queries to the tenant.

```tsx
// FAIL — no tenant scoping
'use server'
export async function getProjects() {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  return await db.select().from(projects)  // returns ALL tenants' projects
}

// PASS — scope to tenant
'use server'
export async function getProjects() {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  return await db
    .select()
    .from(projects)
    .where(eq(projects.organizationId, user.organizationId))
}
```

## Audit Patterns for Access Control

Search your codebase for these red flags:

```bash
# Server Actions without auth checks
grep -rln "'use server'" --include="*.ts" --include="*.tsx" | \
  xargs grep -L "getCurrentUser\|requireAdmin\|requireRole\|auth()"

# Route Handlers without auth checks
find . -name "route.ts" -exec grep -L "getCurrentUser\|requireAdmin\|auth()" {} \;

# Client-supplied IDs used directly in queries (potential BOLA)
grep -rn "params\." --include="route.ts" | grep -v "getCurrentUser"

# Wildcard CORS
grep -rn "Access-Control-Allow-Origin.*\*" --include="*.ts"
```

## Sources

- [OWASP API1:2023 — Broken Object Level Authorization](https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/)
- [OWASP API5:2023 — Broken Function Level Authorization](https://owasp.org/API-Security/editions/2023/en/0xa5-broken-function-level-authorization/)
- [OWASP A01:2021 — Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/)
- [Next.js Security: Server Components and Actions](https://nextjs.org/blog/security-nextjs-server-components-actions)
