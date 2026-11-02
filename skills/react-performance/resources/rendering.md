# Rendering Optimization

## Contents

- How React Rendering Works
- Structural Optimizations (Try These First)
- Concurrent Features
- Activity: Hide Without Losing State
- Memoization APIs
- Context Performance
- A value that changes per asset, under thousands of siblings
- useState: Lazy Initial State and Updaters
- useRef for Non-Rendering Values
- Narrow Effect Dependencies
- useEffectEvent: Read the Latest Value Without Re-subscribing
- Effect Anti-Patterns

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

// GOOD — if filtering is noticeably slow (thousands of items, measured)
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

### 5. Declare Components at the Top Level

React decides whether to keep a component's state by its type at that spot in the tree. A function declared inside another component is a brand new function on every render. React sees a different type, throws away the old subtree with its state and DOM, and mounts a fresh one.

Symptoms: an input loses focus after each keystroke, local state resets, a CSS animation on the node starts over. It is also slow, because the whole subtree mounts again instead of updating.

```tsx
// BAD: typing sets Form state, Form re-renders, Field is a new type,
// so the <input> is destroyed and recreated and focus is lost
function Form() {
  const [name, setName] = useState('')

  function Field() {
    return <input value={name} onChange={e => setName(e.target.value)} />
  }

  return <Field />
}

// GOOD: Field is declared once at module level and gets data by props
function Field({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  return <input value={value} onChange={e => onChange(e.target.value)} />
}

function Form() {
  const [name, setName] = useState('')
  return <Field value={name} onChange={setName} />
}
```

The same goes for `lazy()` and `next/dynamic` calls made inside a component. See [bundle.md](./bundle.md).

Sources: [Your First Component, pitfall](https://react.dev/learn/your-first-component), [Preserving and Resetting State](https://react.dev/learn/preserving-and-resetting-state).

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

#### Async transitions

`startTransition` can take an async function. Only the updates made before the first `await` are marked as a transition. React loses track of the transition across the `await`, so wrap later updates in another `startTransition`.

```tsx
// BAD: setResults runs after the await, so it is an urgent update
startTransition(async () => {
  const next = await searchProducts(query)
  setResults(next)
})

// GOOD: the update after the await gets its own startTransition
startTransition(async () => {
  const next = await searchProducts(query)
  startTransition(() => {
    setResults(next)
  })
})
```

Transitions do not keep requests in order. If the user triggers two, the older request can finish last and overwrite the newer result. React does not cancel the older one for you. `isPending` stays true until all of them finish, and React currently batches ongoing transitions together. For ordering, use `useActionState` or a `<form>` action, which queue for you, or track the latest request and abort stale ones yourself.

Source: [useTransition](https://react.dev/reference/react/useTransition).

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

## Activity: Hide Without Losing State

Rendering `{show && <Panel />}` unmounts the panel. Its state, its DOM and any expensive first render are gone, and showing it again pays the mount cost again. `<Activity>` (React 19.2+) hides the children instead.

```tsx
import { Activity, useState } from 'react'

// BAD: switching tabs unmounts the editor, so the draft and scroll position are lost
function Workspace() {
  const [tab, setTab] = useState<'editor' | 'preview'>('editor')
  return (
    <>
      <Tabs value={tab} onChange={setTab} />
      {tab === 'editor' ? <Editor /> : <Preview />}
    </>
  )
}

// GOOD: both stay mounted. The hidden one keeps its state and DOM.
function Workspace() {
  const [tab, setTab] = useState<'editor' | 'preview'>('editor')
  return (
    <>
      <Tabs value={tab} onChange={setTab} />
      <Activity mode={tab === 'editor' ? 'visible' : 'hidden'}>
        <Editor />
      </Activity>
      <Activity mode={tab === 'preview' ? 'visible' : 'hidden'}>
        <Preview />
      </Activity>
    </>
  )
}
```

What `mode="hidden"` does:

- The children are hidden with `display: none`. Their state and DOM are kept.
- Their Effects are cleaned up, so subscriptions stop. They are set up again when the boundary becomes visible.
- They still re-render when their props change, but at a lower priority than visible content. Hidden is not free.
- A boundary that starts hidden still renders its children at low priority, without running their Effects. Use this to pre-render a likely next screen so its code and data load early. Only data read through Suspense (for example `use` on a promise) loads this way. Data fetched in an Effect does not.
- DOM side effects carry on. A hidden `<video>` keeps playing. Pause it in a `useLayoutEffect` cleanup.

Wrap the screens a user switches between, not every conditional. Each hidden tree keeps its DOM in the document and still takes render work.

Source: [Activity](https://react.dev/reference/react/Activity).

## Memoization APIs

### React.memo — Skip Re-rendering When Props Haven't Changed

```tsx
// Only use when:
// 1. Component re-renders frequently with same props AND
// 2. Rendering is noticeably slow (Profiler, production build)

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
// Use when the work is noticeably slow (often thousands of items) and the
// inputs rarely change. Also valid to keep a memo() child from re-rendering,
// or to keep a Hook dependency stable. Measure on a production build.
const sortedItems = useMemo(
  () => [...items].sort((a, b) => a.name.localeCompare(b.name)),
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

A cached function only helps when something checks its identity. That is one of:

1. A `memo()`-wrapped child takes it as a prop.
2. An Effect, or another `useMemo` or `useCallback`, lists it as a dependency.
3. A custom Hook returns it, so callers can put it in their own dependencies.

```tsx
const handleDelete = useCallback((id: string) => {
  setItems(prev => prev.filter(item => item.id !== id))  // Updater function = no items dependency
}, [])

// GOOD: a memo'd child skips re-rendering while the prop is the same function
<MemoizedList onDelete={handleDelete} />

// GOOD: the Effect does not re-run on every render
useEffect(() => {
  const unsubscribe = bus.on('delete', handleDelete)
  return unsubscribe
}, [handleDelete])

// BAD: nothing checks its identity, so useCallback does nothing here
<RegularList onDelete={handleDelete} />
```

When only an Effect uses the function, moving the function inside the Effect is often simpler than `useCallback`.

Still needed with React Compiler? Less often. react.dev says the compiler memoizes functions itself, which reduces the need for manual `useCallback`.

Source: [useCallback](https://react.dev/reference/react/useCallback).

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

## A value that changes per asset, under thousands of siblings

A selector is the right tool when one slice of a store should re-render one small component. It is the wrong tool when the value changes per asset, or per frame, and that component sits under thousands of siblings.

One PDF canvas read each page bitmap with tldraw's `useValue` (a `useSyncExternalStore` subscription) and then kept the decoded bitmap in `useState`. With 10,000 shapes, each swap rendered from the root. A CPU profile of that path put 2450 ms in `propagateParentContextChanges` out of a 22 s sample. Stock, which never swaps, was 59 fps and 5 dropped frames. The swapping path was 56 fps and 60 dropped. An effect that subscribed to the atom and set `img.src` through a ref made the swapping path 59 fps and 5 dropped. Memoization was not the change. The measured time was the walk from the root.

Keep the image and its placeholder mounted, and toggle `hidden`. The decode-before-swap rule for the blank frame is in the spa-performance skill, `resources/draw-less.md`.

```tsx
import { useEffect, useRef, useSyncExternalStore } from 'react'

// BAD: every bitmap renders this component, and the tree above it walks
const bitmap = useSyncExternalStore(subscribe, () => store.get(id))
return <img src={bitmap?.url} alt="" />

// GOOD: the effect writes the node. The siblings do not render.
function Page({ id }: { id: string }) {
  const imgRef = useRef<HTMLImageElement>(null)
  useEffect(() => {
    return subscribe(id, (bitmap) => {
      const img = imgRef.current
      if (!img || !bitmap) return
      img.src = bitmap.url
    })
  }, [id])
  return <img ref={imgRef} alt="" />
}
```

## useState: Lazy Initial State and Updaters

React uses the initial value only on the first render, but `useState(build())` still calls `build()` on every render and throws the result away. Pass the function itself and React calls it once.

```tsx
// BAD: parses the saved document on every render
const [doc, setDoc] = useState(parseDocument(savedJson))

// GOOD: React calls the initializer only when the component mounts
const [doc, setDoc] = useState(() => parseDocument(savedJson))
```

The initializer must be pure. In Strict Mode, React calls it twice in development and keeps one result.

When the next state is built from the previous one, pass an updater. React queues updaters and runs them in order, so several updates in one event all apply. It also lets a cached callback drop the state from its dependencies, as `handleDelete` does above.

```tsx
// BAD: all three read the same count, so one click adds 1
function addThree() {
  setCount(count + 1)
  setCount(count + 1)
  setCount(count + 1)
}

// GOOD: each updater gets the result of the one before
function addThree() {
  setCount(c => c + 1)
  setCount(c => c + 1)
  setCount(c => c + 1)
}
```

An updater is not required for a single update. Use it when the next value depends on the previous one.

Source: [useState](https://react.dev/reference/react/useState).

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

## Narrow Effect Dependencies

An Effect re-runs when any dependency changes by `Object.is`. An object or function made during render is new every time, even with the same contents, so an Effect that depends on it re-runs on every render. Depend on the primitive values the Effect reads.

```tsx
// BAD: the parent builds a new options object each render,
// so the chart is destroyed and rebuilt each render
function Chart({ options }: { options: { seriesId: string; color: string } }) {
  useEffect(() => {
    const chart = createChart(options.seriesId, options.color)
    return () => chart.destroy()
  }, [options])
  return <div id="chart" />
}

// GOOD: only a real change to seriesId or color rebuilds it
function Chart({ options }: { options: { seriesId: string; color: string } }) {
  const { seriesId, color } = options
  useEffect(() => {
    const chart = createChart(seriesId, color)
    return () => chart.destroy()
  }, [seriesId, color])
  return <div id="chart" />
}
```

Other fixes from the same page: move a static object out of the component, or build the object inside the Effect.

Subscribe to the value you need, not the raw input it comes from. If the component only cares whether the screen is narrow, subscribing to `window.innerWidth` re-renders it on every resize event. A media query fires only when the answer flips.

```tsx
import { useSyncExternalStore } from 'react'

// BAD: every resize event sets state, so the component renders for each pixel
const [width, setWidth] = useState(() => window.innerWidth)
useEffect(() => {
  const onResize = () => setWidth(window.innerWidth)
  window.addEventListener('resize', onResize)
  return () => window.removeEventListener('resize', onResize)
}, [])
const isNarrow = width < 768

// GOOD: renders only when the query result changes.
// subscribe is declared outside the component. A new subscribe
// function on each render makes React re-subscribe.
const narrowQuery = '(max-width: 767px)'

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(narrowQuery)
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}

function useIsNarrow(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(narrowQuery).matches,  // a boolean, so it compares equal while unchanged
    () => false,                                   // server snapshot, used for SSR and hydration
  )
}
```

`getSnapshot` must return the same value while nothing has changed. A boolean does that for free. A new object each call loops forever.

Sources: [Removing Effect Dependencies](https://react.dev/learn/removing-effect-dependencies), [useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore), [MediaQueryList change event](https://developer.mozilla.org/en-US/docs/Web/API/MediaQueryList/change_event).

## useEffectEvent: Read the Latest Value Without Re-subscribing

Some Effects read a value only when something fires, not to decide what to connect to. Listing that value as a dependency tears down and rebuilds the subscription every time it changes. `useEffectEvent` (React 19.2+) wraps that part. The wrapped function always sees the latest props and state, and the Effect does not depend on it.

```tsx
import { useEffect, useEffectEvent } from 'react'

// BAD: editing the threshold closes and reopens the price feed
function PriceAlert({ symbol, threshold }: { symbol: string; threshold: number }) {
  useEffect(() => {
    const feed = openPriceFeed(symbol)
    feed.onPrice((price: number) => {
      if (price > threshold) notify(`${symbol} is above ${threshold}`)
    })
    return () => feed.close()
  }, [symbol, threshold])
  return null
}

// GOOD: only a new symbol reopens the feed. The alert reads the current threshold.
function PriceAlert({ symbol, threshold }: { symbol: string; threshold: number }) {
  const onPrice = useEffectEvent((price: number) => {
    if (price > threshold) notify(`${symbol} is above ${threshold}`)
  })

  useEffect(() => {
    const feed = openPriceFeed(symbol)
    feed.onPrice(onPrice)
    return () => feed.close()
  }, [symbol])
  return null
}
```

Rules:

- Its identity changes on every render on purpose. Never put it in a dependency array.
- Call it only from inside Effects, or from other Effect Events in the same component. Never during render.
- Never pass it to another component or Hook. For a child or an event handler, use a plain function or `useCallback`.
- Use it only for logic that really is an event fired from an Effect. Using it to dodge the dependency lint hides bugs.
- Upgrade `eslint-plugin-react-hooks` to the latest version, or the linter tries to add it as a dependency.

Source: [useEffectEvent](https://react.dev/reference/react/useEffectEvent).

## Effect Anti-Patterns

| Anti-Pattern | Fix |
|---|---|
| `useEffect(() => setFullName(first + ' ' + last), [first, last])` | `const fullName = first + ' ' + last` (derive during render) |
| `useEffect(() => setFiltered(items.filter(...)), [items])` | `const filtered = useMemo(() => items.filter(...), [items])` |
| `useEffect(() => { onSubmit(data) }, [data])` | Call `onSubmit(data)` in the event handler |
| `useEffect(() => { setReady(true) }, [])` | Remove — component is ready when it renders |
| Chain: effect A → setState → effect B → setState | Single event handler with all logic |
| `useEffect(() => { parent.onChildChange(value) }, [value])` | Call parent callback in the event handler that changes value |
| `useEffect(() => { initAnalytics(); checkAuthToken() }, [])` in `App` | Run app-wide setup once per app load: a module-level flag, or module top-level code (see below) |

App-wide setup belongs to the app load, not to a mount. In development, Strict Mode runs a mount Effect twice. Even the root component can remount.

```tsx
// BAD: runs on every mount of App, twice in development
function App() {
  useEffect(() => {
    initAnalytics()
    checkAuthToken()
  }, [])
  return <Routes />
}

// GOOD: a module-level flag makes it once per app load
let didInit = false

function App() {
  useEffect(() => {
    if (didInit) return
    didInit = true
    initAnalytics()
    checkAuthToken()
  }, [])
  return <Routes />
}

// ALSO GOOD: module top level, skipped on the server.
// Code here runs when the module is imported, even if App never renders,
// so keep it in the app's entry or root module.
if (typeof window !== 'undefined') {
  initAnalytics()
  checkAuthToken()
}
```

Source: [You Might Not Need an Effect, initializing the application](https://react.dev/learn/you-might-not-need-an-effect#initializing-the-application).
