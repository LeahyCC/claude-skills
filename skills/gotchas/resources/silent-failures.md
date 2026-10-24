# Silent failures

Code that fails without saying so. LLMs are trained to hand back output that runs, so when an API call, batch operation, or permission check fails during a session, the model's instinct is to catch the error and return a fallback so the screen looks populated. A crash with a stack trace takes five minutes to fix. A silent fallback that returns plausible data takes days to notice.

## Contents

- [Swallowed exceptions and fake fallback data](#swallowed-exceptions-and-fake-fallback-data)
- [Batch operations that drop items past a cap](#batch-operations-that-drop-items-past-a-cap)
- [Removing a button without removing its shortcut](#removing-a-button-without-removing-its-shortcut)
- [Persistence that restores half the state](#persistence-that-restores-half-the-state)

## Swallowed exceptions and fake fallback data

"No records exist" and "the request failed" are different facts. Returning `[]`, `null`, or hardcoded sample rows from a `catch` block turns an outage or broken auth token into a clean-looking empty or demo state.

Order of preference when a read or write fails:

1. Succeed with real data.
2. Fall back visibly: serve cached or degraded data and tell the user how old or partial it is.
3. Fail visibly: set an error state or rethrow with context (`new Error(message, { cause: err })`).
4. Never return fake or empty success data with no signal.

```ts
export interface Invoice {
  id: string
  totalCents: number
}

export type InvoiceResult =
  | { kind: 'ready'; invoices: Invoice[]; stale: false }
  | { kind: 'stale'; invoices: Invoice[]; cachedAt: number; reason: string }
  | { kind: 'error'; message: string }

// BAD: auth failure or 500 returns [] and the UI renders "No invoices this month"
export async function loadInvoicesBad(accountId: string): Promise<Invoice[]> {
  try {
    const res = await fetch(`/api/accounts/${encodeURIComponent(accountId)}/invoices`)
    if (!res.ok) return []
    return (await res.json()) as Invoice[]
  } catch {
    return []
  }
}

// GOOD: real data, disclosed cache fallback, or an explicit error state
export async function loadInvoices(
  accountId: string,
  cached: { invoices: Invoice[]; cachedAt: number } | null,
): Promise<InvoiceResult> {
  try {
    const res = await fetch(`/api/accounts/${encodeURIComponent(accountId)}/invoices`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const invoices = (await res.json()) as Invoice[]
    return { kind: 'ready', invoices, stale: false }
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err)
    if (cached) {
      return {
        kind: 'stale',
        invoices: cached.invoices,
        cachedAt: cached.cachedAt,
        reason,
      }
    }
    return { kind: 'error', message: `Could not load invoices (${reason}).` }
  }
}
```

 ([Error cause](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause), ECMAScript 2022.)

## Batch operations that drop items past a cap

Many editors, queues, and storage APIs enforce a per-page or per-call limit (`maxShapesPerPage`, DynamoDB `BatchWriteItem`'s 25-item cap, browser storage quotas). Some drop the whole batch when `existing + batch.length > limit` and return `undefined` without throwing. Others accept a prefix and return the unprocessed items in a field the caller never reads.

Before sending a batch, check the remaining room, slice to what fits, verify what landed, and tell the user if the batch was cut short.

```ts
export interface Store<T extends { id: string }> {
  readonly limit: number
  count(): number
  has(id: string): boolean
  createMany(items: readonly T[]): void
}

export interface BatchOutcome {
  added: number
  requested: number
  limit: number
}

// BAD: asks for all 1,000. When count() is 19,500 and limit is 20,000, the
// store drops the whole batch and nothing on screen says why.
export function addItemsBad<T extends { id: string }>(
  store: Store<T>,
  items: readonly T[],
): void {
  store.createMany(items)
}

// GOOD: ask only for the room left, verify what landed, and return the gap
export function addItems<T extends { id: string }>(
  store: Store<T>,
  items: readonly T[],
): BatchOutcome {
  const room = Math.max(0, store.limit - store.count())
  const slice = items.slice(0, room)
  if (slice.length === 0) {
    return { added: 0, requested: items.length, limit: store.limit }
  }
  store.createMany(slice)
  const landed = slice.filter((item) => store.has(item.id)).length
  return { added: landed, requested: items.length, limit: store.limit }
}
```

## Removing a button without removing its shortcut

In command-driven UIs (tldraw, ProseMirror, Monaco, Radix menus, custom shortcut maps), a toolbar button, a menu item, a keyboard shortcut, and a command-palette row are four views of one action registry entry. Hiding the button in JSX leaves the keyboard shortcut active: pressing `F` or `Cmd+U` still activates the tool you removed.

Delete the action and tool from the registry, not just from the toolbar component.

```ts
export interface ToolItem {
  id: string
  kbd?: string
}

export interface ActionItem {
  id: string
  kbd?: string
  onSelect(): void
}

const REMOVED_TOOLS = ['frame', 'laser', 'embed'] as const
const REMOVED_ACTIONS = ['export-all', 'print', 'insert-embed'] as const

// BAD: the toolbar filters the buttons out, but pressing 'f' still enters the frame tool
export function visibleToolbarIds(allIds: readonly string[]): string[] {
  const hidden = new Set<string>(REMOVED_TOOLS)
  return allIds.filter((id) => !hidden.has(id))
}

// GOOD: delete the entries from the registries so the button, menu item,
// shortcut handler, and shortcuts dialog all lose them together
export function trimRegistries(
  tools: Record<string, ToolItem>,
  actions: Record<string, ActionItem>,
): void {
  for (const id of REMOVED_TOOLS) delete tools[id]
  for (const id of REMOVED_ACTIONS) delete actions[id]
}
```

## Persistence that restores half the state

Turning on a one-line persistence flag (`persistenceKey` on an editor, `persist()` middleware on a store, `localStorage` sync on a form) only saves the serializable records inside that store. If the feature also depends on in-memory bytes, `Blob` URLs, a WebSocket session, or a parsed binary document in a separate atom, a reload brings back the metadata shells with nothing behind them.

Either persist and rehydrate every piece the view needs, or start clean on reload. Do not ship a reload that restores broken shells.

```ts
export interface PageShell {
  id: string
  pageNumber: number
}

// BAD: the shell records survive a reload in IndexedDB, but the PDF bytes
// were in memory only. After reload, the page shapes mount with no bitmaps.
export function canRestoreBad(shells: readonly PageShell[]): boolean {
  return shells.length > 0
}

// GOOD: restore only when both the records and the backing bytes exist
export function canRestore(
  shells: readonly PageShell[],
  documentBytes: ArrayBuffer | null,
): boolean {
  return shells.length > 0 && documentBytes !== null && documentBytes.byteLength > 0
}
```
