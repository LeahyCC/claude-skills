# Data and Lists

## Virtualization — Rendering Large Lists

For lists with 100+ items, rendering all DOM nodes is a performance killer. Virtualization renders only the visible items.

### When to Virtualize

| Items | Approach | Why |
|-------|----------|-----|
| < 50 | Render all | Overhead of virtualization not worth it |
| 50-200 | Consider virtualizing | Depends on item complexity |
| 200+ | Virtualize | DOM node count causes jank |
| 1000+ | Definitely virtualize | Essential for responsiveness |

### react-window (Lightweight)

```bash
npm install react-window
```

```tsx
import { FixedSizeList } from 'react-window'

function VirtualizedList({ items }: { items: Item[] }) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style} className="flex items-center px-4 border-b">
      <span>{items[index].name}</span>
      <span className="ml-auto text-muted-foreground">{items[index].price}</span>
    </div>
  )

  return (
    <FixedSizeList
      height={600}
      width="100%"
      itemCount={items.length}
      itemSize={48}  // Fixed row height
    >
      {Row}
    </FixedSizeList>
  )
}
```

### react-virtuoso (Feature-Rich)

```bash
npm install react-virtuoso
```

```tsx
import { Virtuoso } from 'react-virtuoso'

function VirtualizedList({ items }: { items: Item[] }) {
  return (
    <Virtuoso
      style={{ height: 600 }}
      data={items}
      itemContent={(index, item) => (
        <div className="flex items-center px-4 py-3 border-b">
          <span>{item.name}</span>
          <span className="ml-auto">{item.price}</span>
        </div>
      )}
    />
  )
}
```

Virtuoso handles:
- Variable height items (auto-measured)
- Infinite scrolling (`endReached` callback)
- Grouped/sticky headers
- Reverse scrolling (chat UIs)
- Table virtualization

### CSS `content-visibility` (No Library)

For simpler cases, CSS `content-visibility` skips rendering of off-screen content:

```tsx
function ListItem({ item }: { item: Item }) {
  return (
    <div
      className="border-b px-4 py-3"
      style={{
        contentVisibility: 'auto',
        containIntrinsicSize: '0 48px',  // Estimated height
      }}
    >
      <h3>{item.title}</h3>
      <p>{item.description}</p>
    </div>
  )
}
```

**Tradeoffs vs full virtualization:**
- Simpler — no library needed
- Less effective — browser still creates DOM nodes, just skips rendering
- No infinite scroll support
- Find-in-page works (virtualization breaks Ctrl+F)

## Efficient Key Usage

```tsx
// BAD — index as key causes bugs and poor performance on reorder/filter
{items.map((item, index) => (
  <ListItem key={index} item={item} />  // DON'T
))}

// GOOD — stable unique identifier
{items.map(item => (
  <ListItem key={item.id} item={item} />
))}

// WHY: When items are reordered, React uses keys to match old and new elements.
// Index keys mean React thinks element 0 is always the same component,
// so it won't move DOM nodes — it'll update props on existing nodes,
// losing internal state (input values, scroll position, animations).
```

## Pagination vs Infinite Scroll

### Cursor-Based Pagination (Preferred)

```tsx
// Server Component — efficient cursor pagination
async function ListingsPage({ searchParams }: { searchParams: { cursor?: string } }) {
  const { items, nextCursor } = await db.listings.findMany({
    take: 20,
    cursor: searchParams.cursor ? { id: searchParams.cursor } : undefined,
    orderBy: { createdAt: 'desc' },
  })

  return (
    <>
      <ListingGrid items={items} />
      {nextCursor && (
        <Link href={`/listings?cursor=${nextCursor}`}>
          Load more
        </Link>
      )}
    </>
  )
}
```

### Infinite Scroll with Intersection Observer

```tsx
'use client'
import { useCallback, useRef, useTransition } from 'react'

function InfiniteList({ initialItems }: { initialItems: Item[] }) {
  const [items, setItems] = useState(initialItems)
  const [cursor, setCursor] = useState(initialItems.at(-1)?.id)
  const [hasMore, setHasMore] = useState(true)
  const [isPending, startTransition] = useTransition()

  const observer = useRef<IntersectionObserver | null>(null)
  const lastItemRef = useCallback((node: HTMLDivElement | null) => {
    if (isPending) return
    observer.current?.disconnect()

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        startTransition(async () => {
          const { items: newItems, nextCursor } = await fetchMore(cursor)
          setItems(prev => [...prev, ...newItems])
          setCursor(nextCursor)
          if (!nextCursor) setHasMore(false)
        })
      }
    })

    if (node) observer.current.observe(node)
  }, [cursor, hasMore, isPending])

  return (
    <>
      {items.map((item, i) => (
        <div
          key={item.id}
          ref={i === items.length - 1 ? lastItemRef : undefined}
        >
          <ListItem item={item} />
        </div>
      ))}
      {isPending && <LoadingSpinner />}
    </>
  )
}
```

## Expensive Computations

### Sorting and Filtering

```tsx
// BAD — sorts on every render even if items haven't changed
function ItemList({ items, sortBy }: Props) {
  const sorted = [...items].sort((a, b) => a[sortBy] - b[sortBy])
  return <ul>{sorted.map(item => <li key={item.id}>{item.name}</li>)}</ul>
}

// GOOD — memoize when sort is expensive (> 1ms, measured)
function ItemList({ items, sortBy }: Props) {
  const sorted = useMemo(
    () => [...items].sort((a, b) => a[sortBy] - b[sortBy]),
    [items, sortBy]
  )
  return <ul>{sorted.map(item => <li key={item.id}>{item.name}</li>)}</ul>
}
```

### Lookup Tables

```tsx
// BAD — O(n) lookup in render
function UserName({ userId, users }: Props) {
  const user = users.find(u => u.id === userId)  // O(n) every render
  return <span>{user?.name}</span>
}

// GOOD — O(1) lookup with Map
function UserList({ userIds, users }: Props) {
  const userMap = useMemo(
    () => new Map(users.map(u => [u.id, u])),
    [users]
  )

  return (
    <ul>
      {userIds.map(id => (
        <li key={id}>{userMap.get(id)?.name}</li>  // O(1)
      ))}
    </ul>
  )
}
```

## Web Workers for Heavy Computation

```tsx
// Move expensive work off the main thread
'use client'

function DataProcessor({ rawData }: { rawData: RawData[] }) {
  const [result, setResult] = useState<ProcessedData | null>(null)

  useEffect(() => {
    const worker = new Worker(new URL('./processor.worker.ts', import.meta.url))

    worker.postMessage(rawData)
    worker.onmessage = (e: MessageEvent<ProcessedData>) => {
      setResult(e.data)
    }

    return () => worker.terminate()
  }, [rawData])

  if (!result) return <Skeleton />
  return <ResultView data={result} />
}

// processor.worker.ts
self.onmessage = (e: MessageEvent<RawData[]>) => {
  const processed = expensiveTransform(e.data)  // Runs off main thread
  self.postMessage(processed)
}
```
