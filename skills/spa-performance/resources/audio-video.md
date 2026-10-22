# Audio and video

Status: written

A frame budget does not apply here. The deadline is the device clock. [off-thread.md](./off-thread.md) routes here when the work is sound or encoded media. Do not put a live audio callback on the main thread or in a normal worker.

## Owns

The audio callback, and the lifetime of decoded video frames.

## Does not own

- Gesture frame times: [measure.md](./measure.md)
- OffscreenCanvas for a drawing app: [off-thread.md](./off-thread.md)
- Drawing less of a document: [draw-less.md](./draw-less.md)

## Already settled

The default render quantum is 128 frames. `renderSizeHint` selects another size when the context is constructed. Once the context is running, that size stays fixed for its life. At 48 kHz the default block is `128 / 48000` seconds (about 2.7 ms). The older Mozilla note called the same block about 3 ms. The budget is one quantum at `sampleRate`, shared by every `process()` in the graph. Miss it and the listener hears a click, which is worse than a dropped visual frame.

The callback runs on the audio rendering thread, synchronously, once per quantum. It must not allocate, and it must not do anything whose time you cannot bound. A worker is too late and not deterministic for that callback. A worker is the right place for a batch much larger than one quantum. The worklet then copies that batch out of storage it already owns.

Video: `VideoEncoder` and `VideoDecoder` can be constructed on the main thread or a dedicated worker. `encode()` and `decode()` queue a control message and return. The codec runs on a parallel queue, not in your JavaScript. Transfer chunks and frames. Close a `VideoFrame` when you are done. Waiting for garbage collection can stall the decoder, because it still owns the media resource. A worker cannot use the DOM video element. Decode to frames and hand those across.

Confirm the interface is present, then confirm the codec config with `isConfigSupported()` on the machines you ship. A browser that has `VideoEncoder` still rejects configs.

## Support

Interface presence, from MDN browser-compat-data fetched 2026-10-22. This is not a codec matrix. Edge mirrors Chrome in that snapshot. Safari iOS is recorded as a mirror of desktop Safari, not as its own test.

| Interface | Chrome | Firefox | Safari |
| --- | --- | --- | --- |
| `AudioWorklet` (the one you can load) | 66 | 76 | 14.1 |
| `VideoEncoder`, `VideoDecoder` | 94 | 130 on desktop. Firefox for Android: no | 16.4 |
| `VideoFrame` | 94 | 130, including Firefox for Android (mirrors desktop) | 16.4 |
| `AudioEncoder`, `AudioDecoder`, `AudioData` | 94 | 130 on desktop. Firefox for Android: no | 26 |
| `AudioContext.getOutputTimestamp()` | 57 | 70 | 14.1 |
| `renderQuantumSize` and `AudioContext({ renderSizeHint })` | 153 | no | no |
| `HTMLVideoElement.requestVideoFrameCallback()` | 83 | 132 | 15.4 |
| `MediaStreamTrackProcessor` | 94, partial | no | 18 |
| `MediaStreamTrackGenerator` | 94 | no | no |

WebCodecs codecs are a secure context. `isSecureContext` is false on a `file:` URL, so a check there fails closed.

`AudioWorkletProcessor.process` on MDN, fetched the same day, still says blocks are always 128 frames and that a change is only planned. The Web Audio editor's draft (9 September 2026) already allows another size, and Chrome 153 ships the hint. The spec wins. Read the output array's `length` inside `process()`. `renderQuantumSize` is 0 until a `"hardware"` context has started, then the UA fills it in. Firefox and Safari do not expose the attribute, so on those browsers the block is still the default 128.

Chrome's partial `MediaStreamTrackProcessor` is the reverse of the mediacapture-transform draft (fetched 2026-10-22): the IDL says `DedicatedWorker` only, with no working-group agreement on also exposing it to `Window`. BCD's note says Chrome exposes it on `Window` instead of the worker. The spec's path is a `MediaStreamTrackHandle` (window or worker, transferable) and a processor constructed in the worker. Feature-detect the constructor in the worker before depending on it. There is also no agreement that a processor for an audio track should exist. Audio stays on the worklet.

`MediaStreamTrackGenerator` has no spec URL in BCD. Do not build a portable pipeline on it. The draft's generator is `VideoTrackGenerator`, dedicated worker only.

Codec strings have to be fully specified (`"avc1.4d0034"`, not `"h264"`). MDN's WebCodecs overview (page updated 2026-08-12) says hardware encoders are still uneven. Ask `VideoEncoder.isConfigSupported()` and `VideoDecoder.isConfigSupported()` (and the audio pair) with the config you will actually use. Publish that result. Do not copy a codec table out of a blog.

```ts
export async function videoConfigWorks(
  config: VideoEncoderConfig,
): Promise<boolean> {
  if (typeof VideoEncoder === 'undefined') return false
  const support = await VideoEncoder.isConfigSupported(config)
  return support.supported === true
}
```

## Clock

Two owners. Pick the one that is actually playing the audio.

| Who is playing | Clock | What you do |
| --- | --- | --- |
| An `HTMLVideoElement` or `HTMLAudioElement` | The element's media timeline. HTML leaves the clock user-agent defined. It should approximate the wall clock. | Read `currentTime`, or `requestVideoFrameCallback`. Audio, if it plays, is specified to stay synchronized with that playback position. Do not schedule a second copy of the same audio against `AudioContext.currentTime`. |
| WebCodecs frames, audio out through Web Audio | `AudioContext.currentTime`, mapped to `performance.now()` with `getOutputTimestamp()` | Present the video frame whose media timestamp matches the sample the device is playing. Drop late video. |

`AudioContext.currentTime` is the audio stream. The spec says it may not match other clocks in the system. `getOutputTimestamp()` is the bridge: `contextTime` is in the `currentTime` origin, `performanceTime` estimates when that sample hit the device, in the `performance.now()` origin. Use it to decide when a paint is due. A `requestAnimationFrame` loop only draws the frame the audio clock already chose. Frame gaps belong to [measure.md](./measure.md).

WebCodecs timestamps are integers in microseconds. The origin belongs to the media. It is not wall time, and it is not guaranteed to be shared across different sources or tracks. One container can share one origin. Two captures cannot, until you align them.

Chrome's WebCodecs article (updated 2025-01-22) clocks a video-only demo from `performance.now()`. That sample has no audio device. Once audio is playing, that clock is the wrong owner.

```ts
// dueUs is the media timestamp the audio device has reached.
// frames are in presentation order, which is how VideoDecoder delivers them.
export function takeDueFrame(frames: VideoFrame[], dueUs: number): VideoFrame | undefined {
  let chosen: VideoFrame | undefined
  while (frames.length > 0 && frames[0].timestamp <= dueUs) {
    const next = frames.shift()
    if (!next) break
    if (chosen) chosen.close()
    chosen = next
  }
  return chosen
}

export function dueMediaUs(audio: AudioContext, audioStartSec: number): number {
  return (audio.currentTime - audioStartSec) * 1_000_000
}
```

`currentTime` on a media element is the official playback position, held still while a script turn runs. Do not poll it in a loop inside one turn and expect it to move.

## How many frames, and closing them

The WebCodecs draft sets no hold count. Codec saturation is implementation-defined: any maximum greater than 1, including no maximum. Holding output `VideoFrame`s (or waiting for garbage collection) can stall the decoder, because those media resources stay owned until `close()`. The same warning is on `MediaStreamTrackProcessor`: if you do not close frames, the source can stop emitting. The UA may also drop processor frames to avoid exhaustion and increment `discardedFrames`. A gap in timestamps is the other signal. Neither one is a budget you copy.

Count live frames yourself. Increment when the output callback receives one, decrement inside the close helper. If the count climbs while the playhead moves, a path is not closing. The bytes live in the frame's media resource, not the JS heap. How to read the other stores is in [measure.md](./measure.md).

The MDN `VideoFrame` example drops a camera frame when `encodeQueueSize > 2`. That is that sample's live-encode choice, not a decoded-frame limit.

Close on every exit. `close()` on a frame clears its resource and marks it detached. The algorithm does not throw if you close again.

| Exit | What to close |
| --- | --- |
| Output callback, frame is late or you will not encode it | That frame, before returning |
| `encode(frame)` returns | Your copy. `encode()` clones first, so the encoder holds its own reference |
| Drew the frame | The frame you drew. A `clone()` is a second reference and needs its own `close()` |
| Clean end of a file | `await flush()`, then close anything still queued. The decoder may withhold the last frames until `flush()` |
| Cancel, seek, error, track ended | `reset()` or `close()` on the codec, then close every frame you still hold. Those calls abort pending work and reject an in-flight `flush()` with `AbortError`. They do not close frames already handed to you |
| `MediaStreamTrackProcessor` reader | `reader.cancel()`, then close any frame the reader already gave you |
| `postMessage` with the frame in the transfer list | Do not keep using the sender. The receiver closes |

`flush()` is the clean end. It is the wrong call for cancel, because it waits until queued work finishes.

```ts
export function closeFrames(frames: VideoFrame[]): void {
  for (const frame of frames) frame.close()
  frames.length = 0
}

export function cancelDecode(decoder: VideoDecoder, held: VideoFrame[]): void {
  if (decoder.state !== 'closed') decoder.close()
  closeFrames(held)
}
```

`AudioData` uses the same `close()`. Encoded chunks are bytes. Drop the references. The objects that pin device memory are the frames and the audio data.

## What still cannot run on a worker

Checked against the IDL each spec exposed on 2026-10-22.

| Object | Where it actually runs |
| --- | --- |
| `AudioContext`, `OfflineAudioContext`, the node graph, `AudioWorkletNode` | `Exposed=Window`. The graph is built on the window. |
| `process()` | The audio rendering thread. Not the main thread, and not a `Worker`. No DOM. No `VideoEncoder` (codecs are not exposed on the worklet global). |
| `HTMLMediaElement`, `HTMLVideoElement`, `HTMLAudioElement` | `Exposed=Window`. A worker has no document, so it has no video element and no `requestVideoFrameCallback`. |
| `VideoEncoder`, `VideoDecoder`, `AudioEncoder`, `AudioDecoder`, `VideoFrame`, `AudioData` | Window and dedicated worker. Secure context for the codecs. Not a shared worker, not a service worker. |
| `MediaRecorder` | `Exposed=Window` in the mediacapture-record draft. |
| `MediaStreamTrackProcessor`, `VideoTrackGenerator` | Dedicated worker in the transform draft. Chrome's partial processor is the exception in the support table. |

Output callbacks run as tasks on the thread that constructed the codec. Constructing a `VideoEncoder` on the main thread puts `output` and `error` on the main thread even though the codec work is off-thread. That is the usual reason to move it.

Transfer `VideoFrame` and `AudioData` the same way [off-thread.md](./off-thread.md) transfers buffers. After the transfer, the sender's object is detached.

```ts
// Worklet module. The ring is allocated once, in the constructor.
// process() only writes into the output the browser handed us.
class Pull extends AudioWorkletProcessor {
  private readonly ring = new Float32Array(48_000)
  private read = 0
  private filled = 0

  process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const out = outputs[0]?.[0]
    if (!out) return true
    for (let i = 0; i < out.length; i++) {
      if (this.filled === 0) {
        out[i] = 0
        continue
      }
      out[i] = this.ring[this.read]
      this.read = (this.read + 1) % this.ring.length
      this.filled -= 1
    }
    return true
  }
}

registerProcessor('pull', Pull)
```

The port handler that fills `ring` runs on the rendering thread too. It copies into `ring[(read + filled) % length]` and increments `filled`, and it drops the copy when `filled` would pass `ring.length`. It must not allocate a `Float32Array` per message either.

## Lab

`encode()` returning immediately is not a measurement. Chrome's article and the spec agree the codec work is off your JavaScript. What hitches the main thread is the JavaScript you left there: building a `VideoFrame` from pixels or a canvas, and an `output` callback that copies bytes, many times a second.

Run two configurations, same frame count, same pixel size. Raise the frame count until the main-thread run records a long task. The long-task line is in [measure.md](./measure.md). Keep that count for the worker run. This file has no measured duration.

1. Main thread. Loop `new VideoFrame(pixels, init)` and `encoder.encode(frame)` with the encoder constructed on the window, and copy the chunk inside `output`.
2. Dedicated worker. The same loop, the encoder, and `output` live in the worker. The main thread only starts and stops it.

Quote a rerun with DevTools closed, headed, production build. The pass is a main thread that stays inside the long-task line on the worker run and does not on the control. If the worker run still shows a main-thread long task, frame construction or the callback is still on the window. `longtask` is a Chromium entry type. Where `supportedEntryTypes` does not include it, use the frame sampler in [measure.md](./measure.md).

```ts
export function watchLongTasks(onDuration: (ms: number) => void): () => void {
  if (!PerformanceObserver.supportedEntryTypes.includes('longtask')) {
    return () => {}
  }
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) onDuration(entry.duration)
  })
  observer.observe({ entryTypes: ['longtask'] })
  return () => observer.disconnect()
}
```

```ts
// encode.worker.ts
type Start = { type: 'start'; config: VideoEncoderConfig }
type Frames = { type: 'frames'; n: number; frameDurationUs: number }
type Stop = { type: 'stop' }
type EncodeMsg = Start | Frames | Stop

let encoder: VideoEncoder | undefined

function shut(): void {
  if (encoder && encoder.state !== 'closed') encoder.close()
  encoder = undefined
}

const pixels = new Uint8Array(320 * 180 * 4)

function encodeCount(n: number, frameDurationUs: number): void {
  if (!encoder || encoder.state !== 'configured') return
  for (let i = 0; i < n; i++) {
    const frame = new VideoFrame(pixels, {
      format: 'RGBA',
      codedWidth: 320,
      codedHeight: 180,
      timestamp: i * frameDurationUs,
    })
    encoder.encode(frame)
    frame.close()
  }
}

self.onmessage = (event: MessageEvent<EncodeMsg>) => {
  if (event.data.type === 'stop') {
    shut()
    return
  }
  if (event.data.type === 'frames') {
    encodeCount(event.data.n, event.data.frameDurationUs)
    return
  }
  const config = event.data.config
  encoder = new VideoEncoder({
    output: (chunk) => {
      const bytes = new Uint8Array(chunk.byteLength)
      chunk.copyTo(bytes)
    },
    error: () => shut(),
  })
  encoder.configure(config)
}
```

The pixel buffer is allocated once. The control run is this same `encodeCount` on the window. Call `videoConfigWorks` before `configure`. On cancel, post `{ type: 'stop' }`, which `close()`s the encoder instead of `flush()`ing it.
