# State and async

Bugs where the code runs in a different order than it reads on the page, or where state moved to a wider scope outlives the call that created it.

## Contents

- [Commit state only after the point of no return](#commit-state-only-after-the-point-of-no-return)
- [Cancel superseded runs and guard every post-await write](#cancel-superseded-runs-and-guard-every-post-await-write)
- [Module-scope singletons shared across concurrent requests](#module-scope-singletons-shared-across-concurrent-requests)
- [Reading live state inside a cached geometry or selector pass](#reading-live-state-inside-a-cached-geometry-or-selector-pass)

## Commit state only after the point of no return

When opening a file, switching a document, or saving a record, several pieces of state describe "what is currently open": the active tab or radio button, the document title, the `lastSource` used by a Reopen button, the load timings, and the shapes or annotations on screen.

If you update those before `await fetch()` and `await parse()`, and the new file is corrupt or 404s, the catch block runs while the old document is still on screen. The user now sees the old document under the new file's name, with the old annotations forgotten, and clicking Reopen retries the broken file.

Keep the incoming work in locals. Only replace the active state, dispose the previous resource, and clear old state after the new resource has parsed and cannot fail.

```ts
export interface DocHandle {
  name: string
  pages: number
  dispose(): void
}

export interface ViewerState {
  chosenName: string | null
  current: DocHandle | null
  lastSource: (() => Promise<ArrayBuffer>) | null
  startedAt: number | null
  annotationIds: string[]
}

// BAD: updates chosenName, lastSource, startedAt, and clears annotationIds
// before the bytes are fetched and parsed. A bad file corrupts the open session.
export async function openDocumentBad(
  state: ViewerState,
  name: string,
  source: () => Promise<ArrayBuffer>,
  parse: (bytes: ArrayBuffer) => Promise<DocHandle>,
): Promise<void> {
  state.chosenName = name
  state.lastSource = source
  state.startedAt = performance.now()
  state.annotationIds = []
  const bytes = await source()
  const next = await parse(bytes)
  state.current?.dispose()
  state.current = next
}

// GOOD: stage in locals. Commit only after parse() succeeds.
export async function openDocument(
  state: ViewerState,
  name: string,
  source: () => Promise<ArrayBuffer>,
  parse: (bytes: ArrayBuffer) => Promise<DocHandle>,
): Promise<void> {
  const startedAt = performance.now()
  const bytes = await source()
  const next = await parse(bytes)

  // Point of no return: the new document is valid.
  state.current?.dispose()
  state.current = next
  state.chosenName = name
  state.lastSource = source
  state.startedAt = startedAt
  state.annotationIds = []
}
```

## Cancel superseded runs and guard every post-await write

Passing an `AbortSignal` to `fetch()` is half of cancellation. Three gaps remain:

1. `signal.aborted` can become `true` after `fetch()` resolves and while `parse()` or a worker is running.
2. If you dispose a resource inside `try`, and the run is aborted after `parse()` creates it, `finally` must still destroy the uncommitted resource.
3. In `finally`, clearing `inFlight = null` unconditionally wipes out the *newer* controller that aborted you. Check `if (inFlight === controller) inFlight = null`.

([AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal), WHATWG DOM Standard.)

```ts
export interface Renderer {
  destroy(): Promise<void>
}

let inFlight: AbortController | null = null
let activeRenderer: Renderer | null = null

// BAD: leaks renderer when aborted after openRenderer, and clears inFlight
// even when a newer call has already replaced it
export async function switchRendererBad(
  openRenderer: (signal: AbortSignal) => Promise<Renderer>,
): Promise<void> {
  inFlight?.abort()
  const controller = new AbortController()
  inFlight = controller
  try {
    const renderer = await openRenderer(controller.signal)
    if (controller.signal.aborted) return
    await activeRenderer?.destroy()
    activeRenderer = renderer
  } finally {
    inFlight = null
  }
}

// GOOD: tracks uncommitted renderer in a local and only clears its own controller
export async function switchRenderer(
  openRenderer: (signal: AbortSignal) => Promise<Renderer>,
): Promise<boolean> {
  inFlight?.abort()
  const controller = new AbortController()
  inFlight = controller
  let uncommitted: Renderer | null = null
  try {
    uncommitted = await openRenderer(controller.signal)
    if (controller.signal.aborted) return false
    const previous = activeRenderer
    activeRenderer = uncommitted
    uncommitted = null
    await previous?.destroy()
    return true
  } finally {
    void uncommitted?.destroy()
    if (inFlight === controller) inFlight = null
  }
}
```

## Module-scope singletons shared across concurrent requests

When refactoring server handlers (Next.js route handlers, Node HTTP servers, Fastify, Cloudflare Workers, AWS Lambda warm containers), LLMs frequently "optimize" by hoisting a helper object, query builder, or cache to module scope. In a browser tab, module scope is one user. On a server, module scope is shared across every concurrent request handled by that isolate or process.

Never store current user, auth token, tenant ID, or mutable request state in a module-level variable or singleton class field. Pass request context as an argument or read it from `AsyncLocalStorage`. ([Node.js AsyncLocalStorage](https://nodejs.org/api/async_context.html).)

```ts
export interface RequestContext {
  tenantId: string
  userId: string
}

export interface ContextStore<T> {
  run<R>(context: T, fn: () => Promise<R>): Promise<R>
  getStore(): T | undefined
}

// BAD: module-level mutable state. Under concurrent requests, Request B
// overwrites currentTenant while Request A is awaiting the database.
let currentTenant: RequestContext | null = null

export async function handleRequestBad(
  ctx: RequestContext,
  queryDb: (tenantId: string) => Promise<string[]>,
): Promise<string[]> {
  currentTenant = ctx
  await new Promise((resolve) => setTimeout(resolve, 10))
  return queryDb(currentTenant.tenantId)
}

// GOOD: pass ctx directly, or bind it per request with AsyncLocalStorage
export function createRequestScope(storage: ContextStore<RequestContext>) {
  return {
    runWithContext<R>(ctx: RequestContext, fn: () => Promise<R>): Promise<R> {
      return storage.run(ctx, fn)
    },
    requireContext(): RequestContext {
      const ctx = storage.getStore()
      if (!ctx) throw new Error('requireContext called outside runWithContext')
      return ctx
    },
  }
}
```

## Reading live state inside a cached geometry or selector pass

Spatial indexes, memoized selectors, and layout caches rebuild an item's bounding box only when that item's own record changes. If `getBounds(record)` secretly reads a live global (like current camera zoom, `window.innerWidth`, or `Date.now()`) that is not on `record`, the cache is not invalidated when the global changes. Hit testing and selection then use the stale box from the last time the record was edited.

Compute geometry purely from properties stored on the record. When an external value like zoom must scale the shape, write that scale onto the record when the zoom settles.

```ts
export interface PinRecord {
  id: string
  x: number
  y: number
  scale: number
}

// BAD: reads live camera zoom inside getBox. When the user zooms, PinRecord
// does not change, the spatial index does not rebuild, and clicks miss the pin.
export function getPinBoxBad(pin: PinRecord, getLiveZoom: () => number) {
  const size = 24 / getLiveZoom()
  return { x: pin.x - size / 2, y: pin.y - size, w: size, h: size }
}

// GOOD: geometry is a pure function of the record. A zoom listener updates
// pin.scale when zoom settles, which invalidates the spatial index.
export function getPinBox(pin: PinRecord) {
  const size = 24 * pin.scale
  return { x: pin.x - size / 2, y: pin.y - size, w: size, h: size }
}
```
