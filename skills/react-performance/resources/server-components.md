# Server Components

## Performance Benefits

1. **Zero client JavaScript** — libraries used only for rendering stay on the server
2. **No fetch waterfall** — data fetching happens on the server, close to the database
3. **Streaming** — content arrives progressively, not all-or-nothing
4. **Smaller bundle** — heavy libraries (markdown, syntax highlighting, sanitization) never ship to client

## Decision Matrix: Server vs Client

| Need | Use | Why |
|------|-----|-----|
| Data fetching | Server Component | Direct DB/API access, no client waterfall |
| Static content rendering | Server Component | Zero JS shipped |
| Heavy library (markdown, syntax highlight) | Server Component | Library stays on server |
| Access to secrets (API keys, tokens) | Server Component | Never exposed to client |
| Interactivity (onClick, onChange) | Client Component | Event handlers need browser |
| State (useState, useReducer) | Client Component | State lives in browser |
| Effects (useEffect) | Client Component | Lifecycle needs browser |
| Browser APIs (localStorage, window) | Client Component | Only available in browser |

## Composition Pattern

The key pattern: Server Components fetch data and render static content. Client Components add interactivity. Compose them together.

```tsx
// Server Component — fetches data, renders static content
// app/listings/[id]/page.tsx (no 'use client' directive)
import { getListing } from '@/lib/db'
import LikeButton from './LikeButton'       // Client Component
import ShareButton from './ShareButton'     // Client Component

export default async function ListingPage({ params }: { params: { id: string } }) {
  const listing = await getListing(params.id)  // Direct DB access

  return (
    <article>
      <h1>{listing.title}</h1>                    {/* Static — zero JS */}
      <p>{listing.description}</p>                 {/* Static — zero JS */}
      <PriceDisplay price={listing.price} />       {/* Server Component */}
      <div className="flex gap-2">
        <LikeButton listingId={listing.id} />      {/* Interactive — client JS */}
        <ShareButton url={`/listings/${listing.id}`} /> {/* Interactive */}
      </div>
    </article>
  )
}
```

### Push 'use client' to the Leaves

```tsx
// BAD — entire page is a Client Component
'use client'
export default function Page() {
  const [liked, setLiked] = useState(false)
  return (
    <div>
      <Header />         {/* All of this is now client JS */}
      <Navigation />     {/* Even though it's static */}
      <Content />        {/* Entire page ships as JS */}
      <button onClick={() => setLiked(!liked)}>Like</button>
      <Footer />
    </div>
  )
}

// GOOD — only the interactive leaf is a Client Component
// page.tsx (Server Component)
export default function Page() {
  return (
    <div>
      <Header />         {/* Server — zero JS */}
      <Navigation />     {/* Server — zero JS */}
      <Content />        {/* Server — zero JS */}
      <LikeButton />     {/* Client — minimal JS */}
      <Footer />         {/* Server — zero JS */}
    </div>
  )
}

// LikeButton.tsx
'use client'
export default function LikeButton() {
  const [liked, setLiked] = useState(false)
  return <button onClick={() => setLiked(!liked)}>Like</button>
}
```

### Server Children in Client Wrappers

```tsx
// Server Component can be passed as children to Client Component
// The server content renders on the server, then hydrates inside the client wrapper

// Modal.tsx (Client Component)
'use client'
export default function Modal({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}>Open</button>
      {open && <dialog open>{children}</dialog>}
    </>
  )
}

// page.tsx (Server Component)
import Modal from './Modal'
import ListingDetails from './ListingDetails'  // Server Component

export default async function Page() {
  return (
    <Modal>
      <ListingDetails />  {/* Rendered on server, passed as children */}
    </Modal>
  )
}
```

## Parallel Data Fetching

```tsx
// BAD — sequential fetches (waterfall)
async function Page() {
  const listing = await getListing(id)        // 200ms
  const reviews = await getReviews(id)        // 300ms
  const similar = await getSimilar(id)        // 200ms
  // Total: 700ms

  return <div>...</div>
}

// GOOD — parallel fetches
async function Page() {
  const [listing, reviews, similar] = await Promise.all([
    getListing(id),     // 200ms ┐
    getReviews(id),     // 300ms ├── All run concurrently
    getSimilar(id),     // 200ms ┘
  ])
  // Total: 300ms (limited by slowest)

  return <div>...</div>
}

// BEST — streaming with Suspense boundaries
async function Page() {
  const listing = await getListing(id)  // Critical — await

  return (
    <div>
      <ListingHeader listing={listing} />  {/* Renders immediately */}

      <Suspense fallback={<ReviewsSkeleton />}>
        <Reviews listingId={id} />          {/* Streams in when ready */}
      </Suspense>

      <Suspense fallback={<SimilarSkeleton />}>
        <SimilarListings listingId={id} />  {/* Streams in when ready */}
      </Suspense>
    </div>
  )
}

// Reviews.tsx — Server Component that fetches its own data
async function Reviews({ listingId }: { listingId: string }) {
  const reviews = await getReviews(listingId)  // Fetches independently
  return <ReviewList reviews={reviews} />
}
```

## Server Actions for Mutations

```tsx
// Server Action — runs on server, no API route needed
// actions.ts
'use server'

export async function toggleLike(listingId: string) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  await db.likes.toggle({ listingId, userId: session.userId })
  revalidatePath(`/listings/${listingId}`)
}

// Client Component using the action
'use client'
import { toggleLike } from './actions'

export function LikeButton({ listingId }: { listingId: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(() => toggleLike(listingId))}
    >
      {isPending ? 'Saving...' : 'Like'}
    </button>
  )
}
```

## Common Mistakes

```tsx
// WRONG — 'use server' is for Server Functions/Actions, NOT Server Components
'use server'  // This means "this is a server function callable from the client"
export default function Page() { ... }

// RIGHT — Server Components need NO directive (they're the default)
export default function Page() { ... }

// WRONG — importing a Server Component into a Client Component
'use client'
import ServerThing from './ServerThing'  // This becomes a Client Component!

// RIGHT — pass Server Components as children
<ClientWrapper>
  <ServerThing />  {/* Stays a Server Component */}
</ClientWrapper>
```
