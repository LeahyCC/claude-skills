# Rendering Optimization

## How React Rendering Works

```
Trigger (setState) → Render (call component functions) → Commit (apply DOM changes)
```

- **Render** = calling your component functions to produce JSX. This is pure computation — no DOM changes.
- **Commit** = React applies only the minimal DOM mutations needed. Identical output = no DOM touch.
- **A component can re-render and produce identical output** — the cost is in calling the function, not in DOM updates.
- **Batching** — multiple `setState` calls in the same event handler are batched into one render.

## Structural Optimizations (Try These First)

These fix re-render problems without any memoization API:

### 1. Colocate State

```tsx
// BAD — typing in search re-renders Header, Nav, Footer
function Page() {
  const [query, setQuery] = useState('')
  return (
    <>
      <Header />
      <Nav />
      <SearchBar query={query} setQuery={setQuery} />
      <Results query={query} />
      <Footer />
    </>
  )
}

// GOOD — search state is local to SearchSection
function Page() {
  return (
    <>
      <Header />
      <Nav />
      <SearchSection />  {/* State lives here */}
      <Footer />
    </>
  )
}

function SearchSection() {
  const [query, setQuery] = useState('')
  return (
    <>
      <SearchBar query={query} setQuery={setQuery} />
      <Results query={query} />
    </>
  )
}
```

### 2. Children Pattern (Composition)

```tsx
// BAD — ColorPicker state change re-renders ExpensiveTree
function Page() {
  const [color, setColor] = useState('red')
  return (
    <div style={{ color }}>
      <input value={color} onChange={e => setColor(e.target.value)} />
      <ExpensiveTree />  {/* Re-renders on every keystroke */}
    </div>
  )
}

// GOOD — ExpensiveTree passed as children, doesn't re-render
function ColorWrapper({ children }: { children: React.ReactNode }) {
  const [color, setColor] = useState('red')
  return (
    <div style={{ color }}>
      <input value={color} onChange={e => setColor(e.target.value)} />
      {children}  {/* Stable reference — doesn't re-render */}
    </div>
  )
}

function Page() {
  return (
    <ColorWrapper>
      <ExpensiveTree />
    </ColorWrapper>
  )
}
```

### 3. Derive During Render (No Effect Needed)

```tsx
// BAD — Effect chain: items change → effect runs → setFiltered → extra render
const [items, setItems] = useState([])
const [filtered, setFiltered] = useState([])

useEffect(() => {
  setFiltered(items.filter(i => i.active))
}, [items])

// GOOD — derived value, no extra render
const [items, setItems] = useState([])
const filtered = items.filter(i => i.active)

// GOOD — if filtering is expensive (> 1ms, measured)
const filtered = useMemo(() => items.filter(i => i.active), [items])
```

### 4. Use `key` to Reset State (Not Effects)

```tsx
// BAD — Effect to reset form when selectedId changes
function EditForm({ selectedId }: { selectedId: string }) {
  const [value, setValue] = useState('')

  useEffect(() => {
    setValue('')  // Extra render on every selection change
  }, [selectedId])

  return <input value={value} onChange={e => setValue(e.target.value)} />
}

// GOOD — key forces remount with fresh state, no Effect needed
<EditForm key={selectedId} selectedId={selectedId} />
```

## Concurrent Features

### useTransition — Keep UI Responsive During Heavy Updates

```tsx
'use client'
import { useState, useTransition } from 'react'

function FilterableList({ items }: { items: Item[] }) {
  const [query, setQuery] = useState('')
  const [filtered, setFiltered] = useState(items)
  const [isPending, startTransition] = useTransition()

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setQuery(value)  // Urgent — update input immediately

    startTransition(() => {
      // Non-urgent — can be interrupted by more typing
      setFiltered(items.filter(item =>
        item.name.toLowerCase().includes(value.toLowerCase())
      ))
    })
  }

  return (
    <>
      <input value={query} onChange={handleChange} />
      <div style={{ opacity: isPending ? 0.7 : 1 }}>
        <List items={filtered} />
      </div>
    </>
  )
}
```

**Rules:**
- `startTransition` executes synchronously — it's NOT like `setTimeout`
- Only the state updates inside are deferred
- Don't use for controlled inputs (`<input value={...}>`) — the input won't update
- Updates inside `setTimeout` called from within `startTransition` are NOT transitions

### useDeferredValue — Defer Rendering of Slow Children

```tsx
'use client'
import { useState, useDeferredValue, memo } from 'react'

function Search() {
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const isStale = query !== deferredQuery

  return (
    <>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      <div style={{ opacity: isStale ? 0.5 : 1, transition: 'opacity 0.2s' }}>
        <SlowResults query={deferredQuery} />
      </div>
    </>
  )
}

// CRITICAL: The slow component MUST be wrapped in memo()
// Without memo, useDeferredValue provides zero benefit
const SlowResults = memo(function SlowResults({ query }: { query: string }) {
  const results = expensiveFilter(query)
  return <ul>{results.map(r => <li key={r.id}>{r.name}</li>)}</ul>
})
```

**When to use useDeferredValue vs useTransition:**
- `useTransition` — you control the state update (your own `setState`)
- `useDeferredValue` — you don't control the update (value comes from props)

## Memoization APIs

### React.memo — Skip Re-rendering When Props Haven't Changed

```tsx
// Only use when:
// 1. Component re-renders frequently with same props AND
// 2. Rendering is measurably expensive (> 1ms, profiled)

const ExpensiveList = memo(function ExpensiveList({ items }: { items: Item[] }) {
  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>{complexRender(item)}</li>
      ))}
    </ul>
  )
})

// PITFALL: These props defeat memo() entirely
<ExpensiveList
  items={items}
  style={{ color: 'red' }}      // New object every render!
  onClick={() => handleClick()}  // New function every render!
/>

// FIX: Stable references
const style = useMemo(() => ({ color: 'red' }), [])
const handleClick = useCallback(() => { /* ... */ }, [])
<ExpensiveList items={items} style={style} onClick={handleClick} />
```

### useMemo — Cache Expensive Calculations

```tsx
// Only use when calculation takes >= 1ms (measured with console.time)
const sortedItems = useMemo(
  () => items.sort((a, b) => a.name.localeCompare(b.name)),
  [items]
)

// PITFALL: Arrow function returning object
const config = useMemo(() => { key: 'value' }, [])     // WRONG — empty block
const config = useMemo(() => ({ key: 'value' }), [])    // RIGHT — object

// PITFALL: Dependency on objects created during render
function Component({ options }: { options: Options }) {
  const { roomId } = options  // Extract primitives
  const result = useMemo(() => compute(roomId), [roomId])  // Stable dependency
}
```

### useCallback — Cache Function References

```tsx
// Only useful when passed to a memo()-wrapped child
const handleDelete = useCallback((id: string) => {
  setItems(prev => prev.filter(item => item.id !== id))  // Updater function = no items dependency
}, [])

// PASS to memo'd child
<MemoizedList onDelete={handleDelete} />

// USELESS without memo on child — child re-renders anyway
<RegularList onDelete={handleDelete} />  // useCallback wasted
```

## Context Performance

```tsx
// BAD — monolithic context re-renders everything on any change
const AppContext = createContext({ user, theme, cart, notifications })

// GOOD — split by update frequency
const UserContext = createContext(user)           // Changes rarely
const ThemeContext = createContext(theme)          // Changes rarely
const CartContext = createContext(cart)            // Changes often
const NotificationContext = createContext(notifs)  // Changes often

// GOOD — memoize the provider value
function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart>({ items: [] })

  const value = useMemo(() => ({ cart, setCart }), [cart])

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

// GOOD — selector pattern with useSyncExternalStore
// For external stores (Zustand, Jotai), use selectors to subscribe to specific slices
import { useStore } from './store'
const count = useStore(state => state.count)  // Only re-renders when count changes
```

## useRef for Non-Rendering Values

```tsx
// Values needed between renders but NOT for rendering → useRef (no re-render)
const timerRef = useRef<NodeJS.Timeout | null>(null)
const previousValueRef = useRef(value)

// PITFALL: Expensive initializer runs every render
const playerRef = useRef(new VideoPlayer())  // BAD — creates new instance each render

// FIX: Lazy initialization
const playerRef = useRef<VideoPlayer | null>(null)
if (playerRef.current === null) {
  playerRef.current = new VideoPlayer()  // Only runs once
}
```

## Effect Anti-Patterns

| Anti-Pattern | Fix |
|---|---|
| `useEffect(() => setFullName(first + ' ' + last), [first, last])` | `const fullName = first + ' ' + last` (derive during render) |
| `useEffect(() => setFiltered(items.filter(...)), [items])` | `const filtered = useMemo(() => items.filter(...), [items])` |
| `useEffect(() => { onSubmit(data) }, [data])` | Call `onSubmit(data)` in the event handler |
| `useEffect(() => { setReady(true) }, [])` | Remove — component is ready when it renders |
| Chain: effect A → setState → effect B → setState | Single event handler with all logic |
| `useEffect(() => { parent.onChildChange(value) }, [value])` | Call parent callback in the event handler that changes value |
