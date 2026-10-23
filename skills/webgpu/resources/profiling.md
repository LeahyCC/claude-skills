# Profiling GPU time

`performance.now()` around `submit()` measures how long it took to queue work, not how long the GPU took to do it. GPU time needs timestamp queries. Whether the GPU is even the bottleneck is a question for the `spa-performance` skill: measure the frame there first.

Facts below are from the WebGPU editor's draft of 21 October 2026, checked 2026-10-22. Sources are in [SOURCES.md](../SOURCES.md).

## Which clock answers what

| Question | Measure with |
| --- | --- |
| Is the frame late at all? | Frame gaps and long animation frames (`spa-performance`) |
| Is the CPU slow to encode? | `performance.now()` around encoding, before `submit()` |
| Is the GPU slow? | Timestamp queries on each pass |
| When did the GPU finish? | `queue.onSubmittedWorkDone()`. Coarse: it includes queueing. |

## Timestamp queries

`timestamp-query` is an optional feature. Ask for it only if the adapter has it.

```ts
const canTime = adapter.features.has('timestamp-query')
const device = await adapter.requestDevice({
  requiredFeatures: canTime ? ['timestamp-query'] : [],
})
```

Write a timestamp at the start and end of each pass, resolve them into a buffer, and read back.

```ts
// Times one pass. Readback reuses its buffer only when the last read finished.
function createPassTimer(device: GPUDevice) {
  const querySet = device.createQuerySet({ type: 'timestamp', count: 2 })
  const resolve = device.createBuffer({
    size: 16,
    usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC,
  })
  const readback = device.createBuffer({
    size: 16,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
  })
  let lastMs = 0

  return {
    timestampWrites: {
      querySet,
      beginningOfPassWriteIndex: 0,
      endOfPassWriteIndex: 1,
    } satisfies GPURenderPassTimestampWrites,

    // Call after pass.end(), before encoder.finish().
    resolve(encoder: GPUCommandEncoder) {
      encoder.resolveQuerySet(querySet, 0, 2, resolve, 0)
      if (readback.mapState === 'unmapped') {
        encoder.copyBufferToBuffer(resolve, 0, readback, 0, 16)
      }
    },

    // Call after submit(). Never awaited by the frame.
    read() {
      if (readback.mapState !== 'unmapped') return
      void readback.mapAsync(GPUMapMode.READ).then(() => {
        const [start, end] = new BigUint64Array(readback.getMappedRange())
        // Values can go backwards. Drop those samples.
        if (end > start) lastMs = Number(end - start) / 1e6
        readback.unmap()
      })
    },

    get ms() {
      return lastMs
    },
  }
}
```

```ts
const timer = createPassTimer(device)
// Each frame:
const pass = encoder.beginRenderPass({ colorAttachments, timestampWrites: timer.timestampWrites })
// ...draw...
pass.end()
timer.resolve(encoder)
device.queue.submit([encoder.finish()])
timer.read()
```

Keep `resolve()`, `submit()`, and `read()` in the same synchronous block, as above. The buffer's map state only changes in a callback, so it cannot change between the check at encode time and the map after submit. Frames where the buffer is still mapped skip the sample and lose nothing else.

## Reading the numbers

- **Units are nanoseconds**, as 64-bit unsigned integers.
- **Precision is reduced on purpose.** The spec requires it, as with other high-resolution timers. Chrome quantizes to 100 microseconds by default, and its `enable-webgpu-developer-features` flag removes that for local profiling. That Chrome detail was checked against a summary of Chrome's developer-features page, not the full page.
- **Values can be negative or out of order.** Drop any sample where end is not after start.
- **Average many frames.** One pass sample is noise. Report a median and a high percentile.
- **A pass is the smallest unit.** Timestamps inside a pass are not part of core WebGPU. Split work into passes to time it separately, and know that the split itself has a cost.

## Before you read GPU time

- Close the WebGPU inspector or capture tool, or state its cost.
- Use a production build.
- Name the GPU and the browser. Integrated and discrete GPUs differ by more than most optimizations.

## Checklist

- [ ] GPU time comes from timestamp queries, not `performance.now()` around `submit()`
- [ ] The feature is requested only when the adapter has it, and the app runs without it
- [ ] Readback never blocks a frame, and buffers are not copied into while mapped
- [ ] Bad samples are dropped, and the number is a median over many frames
- [ ] The quantization in effect is written next to the number
