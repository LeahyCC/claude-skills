# Server Components

> **Core Principle:** Everything is a **Server Component by default**. Only add `'use client'` when browser-only capabilities — state, effects, or event handlers — are required.

## Introduction

Server Components render on the server, giving direct access to databases, secrets, and server-only libraries without shipping that code to the browser. Client Components hydrate only interactive UI.

For data-fetching patterns, see [data-fetching.md](data-fetching.md). For caching, see [caching.md](caching.md). For streaming/loading UI details, see [error-handling.md](error-handling.md) and [data-fetching.md](data-fetching.md).

## Architecture

```
Browser Request
        │
        ▼
Route Resolution
        │
        ▼
Server Components Render
        │
        ├──────────────┐
        │              │
        ▼              ▼
Database         External APIs
        │
        ▼
RSC Payload + HTML
        │
        ▼
Streaming Response
        │
        ▼
Client Components Hydrate
        │
        ▼
Interactive UI
```

### RSC Payload

Server Components do not send component source to the browser. Next.js serializes a **React Server Component Payload** containing rendered output, Client Component references, serialized props, and hydration instructions.

```
HTML + RSC Payload + Client JS → Interactive UI
```

## Decision Matrix

### Server vs Client

| Capability | Server | Client |
|------------|--------|--------|
| Database / ORM | ✅ | ❌ |
| API keys / secrets | ✅ | ❌ |
| `cookies()` / `headers()` | ✅ | ❌ |
| File system | ✅ | ❌ |
| Static UI | ✅ | ❌ |
| `useState` / `useReducer` | ❌ | ✅ |
| `useEffect` | ❌ | ✅ |
| Event handlers | ❌ | ✅ |
| `window` / `localStorage` | ❌ | ✅ |

### Composition

| Requirement | Pattern |
|-------------|---------|
| Static content | Server Component |
| Interactive wrapper (modal, tabs) | Client wrapper + Server `children` |
| Data fetching | Server Component — see [data-fetching.md](data-fetching.md) |
| Form with Server Action | Server Component page + `action` prop (no `'use client'` required) |
| Theme / auth context | Client Provider deep in tree |
| Third-party chart/editor | Thin Client wrapper |

### Decision Tree

```
Need useState, useEffect, onClick, or browser APIs?
├── YES → Client Component
└── NO  → Server Component (default)
```

## Production Workflow

```
1. Build page as Server Component (no directive)
2. Fetch data in the Server Component or child Server Components
3. Identify interactive leaves (buttons, forms with client state, inputs)
4. Extract those leaves into 'use client' files
5. Pass serializable props from Server → Client
6. Use children pattern for Server content inside Client wrappers
7. Protect server modules with 'server-only'
```

## Composition Pattern

Push `'use client'` to the leaves:

```
Page (Server)
├── Header (Server)
├── ProductGrid (Server)
├── AddToCartButton (Client)  ← only this hydrates
└── Footer (Server)
```

```tsx
// app/products/[id]/page.tsx
import { getProduct } from '@/lib/products'
import AddToCartButton from './AddToCartButton'

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const product = await getProduct(id)

  return (
    <article>
      <h1>{product.title}</h1>
      <p>{product.description}</p>
      <AddToCartButton productId={product.id} price={product.price} />
    </article>
  )
}
```

```tsx
// AddToCartButton.tsx
'use client'

export default function AddToCartButton({
  productId,
  price,
}: {
  productId: string
  price: number
}) {
  return <button type="button">Add (${price})</button>
}
```

## Passing Props

Server Components pass **serializable props** to Client Components.

| Serializable | Not Serializable |
|--------------|------------------|
| string, number, boolean | Functions (except Server Actions via form) |
| plain objects, arrays | Class instances |
| Dates (serialized) | Database clients, Prisma |
| null, undefined | Request/Response objects |

### PASS

```tsx
// Server Component
<ClientChart data={series} title="Revenue" />

// Client Component receives plain objects only
'use client'
export function ClientChart({ data, title }: { data: number[]; title: string }) { ... }
```

### FAIL

```tsx
// FAIL — cannot serialize database client
<ClientWidget db={prisma} />
```

## Interleaving Server & Client

### Children Pattern

Pass Server Components as `children` to Client wrappers — the server content renders on the server, then slots into the client shell.

```tsx
// Modal.tsx
'use client'
import { useState } from 'react'

export default function Modal({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>Open</button>
      {open && <dialog open>{children}</dialog>}
    </>
  )
}
```

```tsx
// page.tsx — Server Component
import Modal from './Modal'
import ProductDetails from './ProductDetails'

export default function Page() {
  return (
    <Modal>
      <ProductDetails />
    </Modal>
  )
}
```

### FAIL — Importing Server into Client

```tsx
// FAIL — ProductDetails becomes client-bundled
'use client'
import ProductDetails from './ProductDetails'

export default function Modal() {
  return <ProductDetails />
}
```

## Context Providers

React Context does not work in Server Components. Providers must be Client Components, placed as deep as possible:

```tsx
// app/providers.tsx
'use client'
import { ThemeProvider } from 'next-themes'

export default function Providers({ children }: { children: React.ReactNode }) {
  return <ThemeProvider attribute="class">{children}</ThemeProvider>
}
```

```tsx
// app/layout.tsx
import Providers from './providers'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

| Context Type | Placement |
|--------------|-----------|
| Theme | Root or feature layout Provider |
| Auth session (client) | Below root — not entire app if avoidable |
| Database access | Server Component — never Context |

## Third-Party Components

Libraries using hooks or browser APIs need a Client wrapper:

```tsx
// components/ProductCarousel.tsx
'use client'
import { Carousel } from 'third-party-carousel'

export default function ProductCarousel({ items }: { items: string[] }) {
  return <Carousel items={items} autoPlay />
}
```

```tsx
// app/page.tsx — Server Component imports wrapper only
import ProductCarousel from '@/components/ProductCarousel'

export default function Page() {
  return (
    <>
      <h1>Products</h1>
      <ProductCarousel items={['a', 'b', 'c']} />
    </>
  )
}
```

## server-only and client-only

### server-only

Prevents accidental client imports of server modules:

```tsx
// lib/products.ts
import 'server-only'
import { db } from '@/lib/db'

export async function getProducts() {
  return db.product.findMany()
}
```

### client-only

Marks browser-only utilities:

```tsx
// lib/theme-storage.ts
import 'client-only'

export function getStoredTheme() {
  return localStorage.getItem('theme')
}
```

| Module | Package |
|--------|---------|
| Database, secrets, auth | `server-only` |
| localStorage, clipboard, DOM | `client-only` |

## Environment Poisoning

Environment poisoning occurs when server-only code enters the client module graph — causing build failures or security risks.

```
GOOD:  Database → server-only → Server Component → HTML
BAD:   Database → Client Component → Browser bundle
```

### PASS

```tsx
// lib/invoices.ts
import 'server-only'
export async function getInvoices(userId: string) { ... }

// app/invoices/page.tsx
import { getInvoices } from '@/lib/invoices'
export default async function Page() {
  const invoices = await getInvoices('...')
  return <InvoiceList invoices={invoices} />
}
```

### FAIL

```tsx
'use client'
import { getInvoices } from '@/lib/invoices' // server-only — build error
```

## Streaming Overview

Server Components enable progressive streaming — the server sends HTML as sections complete. Wrap slow Server Components in `<Suspense>` for granular streaming. See [data-fetching.md](data-fetching.md) for Suspense data patterns and [error-handling.md](error-handling.md) for `loading.tsx`.

```
Request → Static shell streams → Suspense fallbacks → Dynamic content fills in
```

## PASS vs FAIL

### PASS — Server-first page

```tsx
import { db } from '@/lib/db'
import LikeButton from './LikeButton'

export default async function Page() {
  const posts = await db.post.findMany()
  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>
          {post.title}
          <LikeButton postId={post.id} />
        </li>
      ))}
    </ul>
  )
}
```

### FAIL — Entire page client-fetched

```tsx
'use client'
import { useEffect, useState } from 'react'

export default function Page() {
  const [posts, setPosts] = useState([])
  useEffect(() => {
    fetch('/api/posts').then((r) => r.json()).then(setPosts)
  }, [])
  return <ul>{posts.map(...)}</ul>
}
```

### FAIL — `'use server'` on a page

```tsx
// FAIL — 'use server' marks Server Actions, NOT Server Components
'use server'
export default function Page() { ... }
```

```tsx
// PASS — Server Components need no directive
export default async function Page() { ... }
```

## Common Mistakes

- `'use client'` on page or layout when only one child needs interactivity.
- Importing Server Components into Client Component files (use `children` instead).
- Passing non-serializable props (DB clients, functions) to Client Components.
- Using Context in Server Components.
- Skipping `server-only` on modules with secrets or database access.
- Treating `'use server'` as the Server Component directive.
- Wrapping entire app in Client Providers when only a subtree needs them.

## Best Practices

- Default to Server Components — add `'use client'` at the leaf.
- Pass serializable props only across the server/client boundary.
- Use the `children` pattern for Server content inside Client shells.
- Place Context Providers as deep in the tree as possible.
- Wrap third-party interactive libraries in dedicated Client files.
- Mark server utilities with `server-only`; browser utilities with `client-only`.
- Keep interactive islands small — measure client bundle impact.
- Cross-reference [data-fetching.md](data-fetching.md) for fetch location, not here.

## Production Checklist

### Boundaries

- [ ] No unnecessary `'use client'` directives
- [ ] Client Components are leaves, not page roots
- [ ] Props crossing boundary are serializable
- [ ] Server Components not imported into Client files

### Security

- [ ] `server-only` on database and secret modules
- [ ] No env secrets in Client Components
- [ ] `client-only` on localStorage/DOM utilities

### Composition

- [ ] Children pattern used for modals/dialogs with server content
- [ ] Context Providers are Client Components, placed deep
- [ ] Third-party widgets wrapped in Client Components

### Providers & Libraries

- [ ] Theme/auth providers don't wrap entire app unnecessarily
- [ ] Heavy server libraries (markdown, syntax) stay on server

## References

### Verified Against

- [Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Server Components (React)](https://react.dev/reference/rsc/server-components)
- [Client Components (React)](https://react.dev/reference/rsc/use-client)
- [`server-only` package](https://nextjs.org/docs/app/getting-started/server-and-client-components#preventing-environment-poisoning)
- [Composition Patterns](https://nextjs.org/docs/app/getting-started/server-and-client-components#composing-server-and-client-components)

**Framework:** Next.js 16 App Router · React 19

**Last verified:** July 2026
