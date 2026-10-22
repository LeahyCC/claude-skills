# Streams

Status: written

Logs, prices, live dashboards, a chat that is mostly other people's messages. Samples arrive faster than the screen. Paint once per frame.

```
socket message
      |
      +-- price, gauge ----------> one slot per id (keep the newest)
      |
      +-- click, command, alarm, chat line --> ring (keep each one)
      |
      v
one requestAnimationFrame
      |
      v
paint the slots, drain the ring, show the overflow count
```

## Owns

Coalescing to one paint per frame, what must never be dropped, and backpressure.

## Does not own

- The harness, including how a GC hitch shows up as a long frame: [measure.md](./measure.md)
- Windowing the rows on screen: [draw-less.md](./draw-less.md) and, for two axes, [grids.md](./grids.md)
- Decoding a fat payload: [off-thread.md](./off-thread.md)

A live log bigger than memory is a window the server sends. The ring below is only the gap between paints. Holding every row and hiding them is the leak [draw-less.md](./draw-less.md) is about.

## One paint

`requestAnimationFrame` is one-shot. The callback runs before the next repaint, and every callback in that frame shares one timestamp. Most browsers pause it while the tab is in the background or the iframe is hidden. Messages still arrive. ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame), fetched 2026-10-22.)

```ts
// BAD: every socket message schedules its own paint.
// A chat line also copies the whole log into a new array.
socket.onmessage = (event) => {
  const message = JSON.parse(event.data)
  if (message.kind === 'price' || message.kind === 'gauge') renderPrice(message.value)
  else renderLog([...log, message])
}

// GOOD: store the sample. The feed arms one frame, which paints once.
socket.onmessage = (event) => {
  const message = JSON.parse(event.data)
  feed.onMessage(message.kind, message.id, message.value, message.text)
}
```

`JSON.parse` still builds an object and new strings. That is already an allocation. A numeric tick does not parse. It writes numbers into the slot, in the hot function below.

A `for` loop of renders inside one turn is a different program. Socket messages arrive as separate tasks. The burst script below delivers them that way. One synchronous loop can hide the extra paints.

## Latest value, and the queue beside it

| Sample | Where it sits | Older samples |
| --- | --- | --- |
| Price, gauge | One reused record per id | Collapse to the newest. Count the ones a frame never showed as `coalesced`. |
| Click, command, alarm, chat line | Ring, in arrival order | Keep each one until a frame applies it. |

Two prices for the same id in one frame paint the second number. Two ids both paint. A click, a command, and an alarm never share that slot.

The handle starts as `null`. Do not use `0` for "nothing scheduled". A request id can be `0` after the counter wraps, and that `0` is a live id. ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame), fetched 2026-10-22.)

Arm once. The callback is a function you created at setup, so a message does not allocate a closure. While the handle is set, later messages only write.

`256` below is a stand-in so a test can fill the ring. Size it to the gap between paints on your feed. A replay of history does not go through this ring.

```ts
type Kind = 'price' | 'gauge' | 'click' | 'command' | 'alarm' | 'message'

type Counters = {
  received: number
  coalesced: number
  painted: number
  overflow: number
}

type Slot = { kind: Kind, id: number, value: number, text: string }

type Paint = {
  price: (id: number, value: number) => void
  discrete: (kind: Kind, id: number, value: number, text: string) => void
  overflow: (count: number) => void
}

export const RING_CAPACITY = 256

export function createFeed(
  deadlineMs: number,
  paint: Paint,
  requestFrame: (callback: () => void) => number = requestAnimationFrame,
) {
  const slots: Slot[] = []
  for (let i = 0; i < RING_CAPACITY; i++) {
    slots.push({ kind: 'command', id: 0, value: 0, text: '' })
  }
  let head = 0
  let tail = 0
  let size = 0
  let dirtyCount = 0
  let raf: number | null = null
  const series = new Map<number, { value: number, dirty: boolean }>()
  const counters: Counters = { received: 0, coalesced: 0, painted: 0, overflow: 0 }

  function noteLatest(id: number, value: number) {
    const row = series.get(id)
    if (row === undefined) {
      // Once per series. Later ticks only write fields.
      series.set(id, { value, dirty: true })
      dirtyCount++
      return
    }
    if (row.dirty) counters.coalesced++
    else dirtyCount++
    row.value = value
    row.dirty = true
  }

  function noteDiscrete(kind: Kind, id: number, value: number, text: string) {
    if (size === RING_CAPACITY) {
      counters.overflow++
      return
    }
    const slot = slots[head]
    if (slot === undefined) {
      counters.overflow++
      return
    }
    slot.kind = kind
    slot.id = id
    slot.value = value
    slot.text = text
    head++
    if (head === RING_CAPACITY) head = 0
    size++
  }

  function flush() {
    const started = performance.now()
    for (const [id, row] of series) {
      if (!row.dirty) continue
      const value = row.value
      // Clear before paint. Paint can take another message, and that sample has to stay dirty.
      row.dirty = false
      dirtyCount--
      paint.price(id, value)
    }
    while (size > 0 && performance.now() - started < deadlineMs) {
      const slot = slots[tail]
      if (slot === undefined) {
        counters.overflow += size
        size = 0
        break
      }
      const kind = slot.kind
      const id = slot.id
      const value = slot.value
      const text = slot.text
      // Release the slot before paint. The next push reuses this object.
      tail++
      if (tail === RING_CAPACITY) tail = 0
      size--
      paint.discrete(kind, id, value, text)
    }
    paint.overflow(counters.overflow)
    counters.painted++
  }

  function onFrame() {
    raf = null
    flush()
    if (size > 0 || dirtyCount > 0) schedule()
  }

  function schedule() {
    if (raf !== null) return
    raf = requestFrame(onFrame)
  }

  function onMessage(kind: Kind, id: number, value: number, text: string) {
    counters.received++
    if (kind === 'price' || kind === 'gauge') noteLatest(id, value)
    else noteDiscrete(kind, id, value, text)
    schedule()
  }

  function stop() {
    if (raf === null) return
    cancelAnimationFrame(raf)
    raf = null
  }

  return { onMessage, flush, stop, counters }
}

export type Feed = ReturnType<typeof createFeed>
```

`deadlineMs` is the long-task line in [measure.md](./measure.md). This file does not keep a second budget. If the ring still has events when the line is reached, the rest waits for the next frame. Waiting is not overflow.

The hot function is `onMessage`, `noteLatest`, and `noteDiscrete`. Inside it: no fresh object, no fresh array, no string build. No `{ ...sample }`, no `[...rows, row]`, no template string, no concatenation. A closure created per message is a fresh object. `schedule` avoids that by passing `onFrame`, which already exists.

The first time an id is seen, the map stores one record. That allocation is once per series. `JSON.parse`, and a string the socket already built, happen before this function. Store the chat string by reference. Build a display string in `flush` if you need one, once for that frame.

`flush` is the frame. One render there is the point of the coalesce. `for...of` on the map walks series once per frame.

## Counters

| Counter | Increments when |
| --- | --- |
| `received` | A message entered `onMessage`, including one the ring refused |
| `coalesced` | A price or gauge overwrote a value no frame has painted yet |
| `painted` | `flush` ran |
| `overflow` | A click, command, alarm, or chat line arrived and the ring was full |

`overflow` is not `coalesced`. A test that only watches `coalesced` must still fail when a discrete event is missing from the frame.

Each assertion builds a fresh feed. `1e9` only forces that flush to finish. `() => 1` stands in for a frame, so the check does not paint twice.

```ts
// Same module as createFeed.

function collect() {
  const prices = new Map<number, number>()
  const discrete: string[] = []
  const box = { overflow: 0 }
  const paint: Paint = {
    price(id, value) {
      prices.set(id, value)
    },
    discrete(kind, id) {
      discrete.push(kind + ':' + id)
    },
    overflow(count) {
      box.overflow = count
    },
  }
  return { prices, discrete, box, paint }
}

function freshFeed(): { feed: Feed, seen: ReturnType<typeof collect> } {
  const seen = collect()
  const feed = createFeed(1e9, seen.paint, () => 1)
  return { feed, seen }
}

export function assertDiscreteNotCoalesced() {
  const { feed, seen } = freshFeed()
  feed.onMessage('price', 4, 1, '')
  feed.onMessage('price', 4, 2, '')
  feed.onMessage('gauge', 8, 1, '')
  feed.onMessage('gauge', 8, 3, '')
  feed.onMessage('click', 1, 0, '')
  feed.onMessage('command', 2, 0, '')
  feed.onMessage('alarm', 3, 0, '')
  feed.onMessage('message', 5, 0, 'hi')
  if (feed.counters.received !== 8) {
    throw new Error('received ' + feed.counters.received)
  }
  if (feed.counters.coalesced !== 2) {
    throw new Error('coalesced ' + feed.counters.coalesced + ', want the older price and the older gauge')
  }
  feed.flush()
  if (feed.counters.painted !== 1) {
    throw new Error('painted ' + feed.counters.painted)
  }
  if (seen.prices.get(4) !== 2 || seen.prices.get(8) !== 3) {
    throw new Error('the frame painted an older price or gauge')
  }
  if (seen.discrete.join(',') !== 'click:1,command:2,alarm:3,message:5') {
    throw new Error('a click, command, alarm, or chat line was missing from the frame')
  }
}

export function assertFullQueueIsVisible() {
  const { feed, seen } = freshFeed()
  for (let id = 0; id < RING_CAPACITY; id++) feed.onMessage('command', id, 0, '')
  feed.onMessage('alarm', 999, 0, '')
  if (feed.counters.coalesced !== 0) {
    throw new Error('a command or alarm was coalesced')
  }
  if (feed.counters.overflow !== 1) {
    throw new Error('a full queue hid the alarm')
  }
  feed.flush()
  if (seen.box.overflow !== 1) {
    throw new Error('the frame did not show the overflow')
  }
  if (seen.discrete.indexOf('alarm:999') !== -1) {
    throw new Error('an alarm that did not fit was applied')
  }
}
```

## Backpressure

Two different queues.

### Outbound

`WebSocket.bufferedAmount` is how many bytes `send()` has queued and the browser has not yet transmitted. It resets to `0` once those bytes are handed to the network. It does not include framing, or bytes the operating system is still holding. It does not reset when the connection closes. Further `send()` calls keep the number climbing. After close, that climb is not data on the wire. ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/bufferedAmount) and the [WebSockets standard](https://websockets.spec.whatwg.org/#dom-websocket-bufferedamount), fetched 2026-10-22.)

```ts
export function sendIfRoom(socket: WebSocket, bytes: ArrayBuffer, mark: number): boolean {
  if (socket.readyState !== WebSocket.OPEN) return false
  // `mark` is a byte count you measured. It is not a platform constant.
  // One send can still land past it, because the check is before send().
  if (socket.bufferedAmount > mark) return false
  socket.send(bytes)
  return true
}
```

The documented API is the number. Read it again on a later frame. Do not spin. When `sendIfRoom` returns false, that frame shows the outbound feed waiting.

`bufferedAmount` counts bytes you queued with `send()`. It says nothing about messages you received.

### Inbound, when you can pause the source

A stream's desired size is its high water mark minus the size already queued. At or below zero, the source is supposed to stop. `pull()` runs again when desired size becomes positive, and keeps running until the queue is back at the high water mark. A `write()` that returns a promise holds the pipe until that promise resolves, which is the same signal in the other direction. ([WHATWG Streams](https://streams.spec.whatwg.org/#backpressure), living standard updated 2026-10-19.)

A push source pauses in the message handler when desired size is `<= 0`, and resumes inside `pull()`. For a socket, pause means a message in your protocol. Taking the listener off does not stop the peer.

### Inbound WebSocket you cannot pause

The peer keeps sending. The ring is the bound. When it is full, `noteDiscrete` refuses the event, `overflow` increments, and `coalesced` does not. The event is not applied.

The frame shows that count in the same place as the log: how many events did not fit, and that they were not applied. The count stays until the feed is keeping up and the user has seen it. `flush` writes it every time, including while it is `0`.

A hidden tab pauses the animation callback, so the ring can fill with nobody painting. The frame that runs when the tab is visible again shows the count. Prices still collapse to the newest sample during that gap. Commands do not.

## Burst

A quiet stream hides the hitch. A few prices a second never fill a frame. The lab sends a burst, as separate tasks, the way socket messages arrive.

Run the per-message handler and the feed as separate runs. One fresh page each. [measure.md](./measure.md) has that rule, and it has the frame-gap sampler. This script does not restate the sampler. Quote gaps, p95, and dropped frames from there.

What this script checks is `"long-animation-frame"`. A long animation frame is the line in [measure.md](./measure.md). The observer is how you see one. The timeline buffer holds 200 entries, then drops new ones, so the observer is the check, not `getEntriesByType` after a long run. The entry type is not baseline. If it is missing, the sampler in [measure.md](./measure.md) is the measurement you still have. ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Performance_API/Long_animation_frame_timing), fetched 2026-10-22.)

`buffered: false` so frames from before the burst stay out of the list. Run it headed, as [measure.md](./measure.md) requires.

```ts
export function burstAsTasks(count: number, onSample: (i: number) => void): Promise<void> {
  return new Promise((resolve) => {
    const channel = new MessageChannel()
    let i = 0
    channel.port1.onmessage = () => {
      onSample(i)
      i++
      if (i < count) channel.port2.postMessage(0)
      else {
        channel.port1.close()
        resolve()
      }
    }
    channel.port2.postMessage(0)
  })
}

export async function runBurst(count: number, onSample: (i: number) => void): Promise<number[]> {
  if (!PerformanceObserver.supportedEntryTypes.includes('long-animation-frame')) {
    throw new Error('long-animation-frame is missing. Record gaps with the sampler in measure.md.')
  }
  const durations: number[] = []
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) durations.push(entry.duration)
  })
  observer.observe({ type: 'long-animation-frame', buffered: false })
  await burstAsTasks(count, onSample)
  // The entry is recorded when the frame ends. The observer runs as a task.
  // A later frame gives that task a turn before we read the list.
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve())
    })
  })
  observer.disconnect()
  return durations
}
```

`count` is how big the burst is. It is not a budget. The bad handler should record long animation frames. If the feed records them too, the task queue itself is the cost. Cut `count` until the feed stays under the line in [measure.md](./measure.md), and keep that count for both runs.

```ts
await runBurst(count, (i) => renderPrice(i))
await runBurst(count, (i) => feed.onMessage('price', 1, i, ''))
```
