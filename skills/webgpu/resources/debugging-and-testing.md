# Debugging and testing

How to see what the GPU did, and how to prove WebGPU code works without a person watching a canvas. Sources are in [SOURCES.md](../SOURCES.md).

## Contents

- Is WebGPU even on?
- Read the first error
- Debug markers
- Capture tools
- Check WGSL before the browser does
- Test in Node with Dawn
- Test in headless Chrome
- Say how it was checked
- Checklist

## Is WebGPU even on?

Open `chrome://gpu` and look for "WebGPU: Hardware accelerated". "Software only" or "Disabled" means the browser, the driver, or a blocklist turned it off. It is not your code.

| Chrome flag | Use |
| --- | --- |
| `chrome://flags/#enable-unsafe-webgpu` | Turn WebGPU on where it is off or blocklisted, and unlock unreleased features. Never ask users to set it. |
| `chrome://flags/#ignore-gpu-blocklist` | Override the software rendering list |
| `chrome://flags/#force-high-performance-gpu` | Windows only. Force the discrete GPU. |
| `chrome://flags/#enable-vulkan` | Needed for WebGPU on Linux where it is not on by default |
| `chrome://flags/#enable-webgpu-developer-features` | Full-precision timestamps and extra adapter info. Local profiling only. |

## Read the first error

One invalid object makes everything built from it invalid. The console then shows a cascade. The first message names the real fault, usually by label. Labels and the error listener are in [errors-and-device-loss.md](./errors-and-device-loss.md).

## Debug markers

Group commands so captures and some error messages show where they came from.

```ts
encoder.pushDebugGroup('shadow pass')
const pass = encoder.beginRenderPass(shadowPassDesc)
pass.insertDebugMarker('opaque casters')
// ...draws...
pass.end()
encoder.popDebugGroup()
```

Every push needs a matching pop inside the same encoder or pass. A mismatch is a validation error.

## Capture tools

| Tool | What it shows | Where |
| --- | --- | --- |
| WebGPU Inspector (community, by Brendan Duncan) | Live objects, frame capture, buffer and texture contents, shader editing, record and replay | Browser extension for Chrome, Edge, Firefox Nightly |
| Xcode Metal capture | The Metal commands Safari or Chrome issued | macOS |
| PIX | The Direct3D 12 commands Chrome issued | Windows |
| RenderDoc | The Vulkan commands | Linux, Android |

Native captures show the browser's translated commands, not your WebGPU calls. Start with the WebGPU Inspector and use native tools when the driver itself is in question.

## Check WGSL before the browser does

`naga`, from the wgpu project, validates WGSL from the command line. It is a different compiler from Chrome's Tint and Safari's, so a pass is a strong signal, not a guarantee. naga 30.0.1 accepted a `textureSample` inside a branch on per-pixel data that Dawn rejected for uniformity. Use naga for syntax and types, and compile on a real device for the rest.

```bash
cargo install naga-cli
naga shaders/particles.wgsl          # exits non-zero with a message on error
```

For CI, validate every `.wgsl` file in the repo, and run [`scripts/wgsl-layout.mjs`](../scripts/wgsl-layout.mjs) with `--uniform` on files that hold uniform structs. Shaders built from strings at runtime need a test that compiles them through a real device (next section) and checks `getCompilationInfo()`.

## Test in Node with Dawn

The `webgpu` package on npm is Dawn, Chrome's WebGPU implementation, built for Node by the Chrome WebGPU team. It runs on the machine's real GPU. Use it to unit-test compute shaders, struct layouts, and buffer math without a browser.

```ts
// particles.test.ts (Vitest). The same shader and buffer code the app ships.
import { create, globals } from 'webgpu'
import { afterAll, afterEach, beforeAll, expect, test } from 'vitest'
// runStep and makeParticles are the app's own modules, not test helpers.
import { makeParticles, runStep } from '../src/particles'

Object.assign(globalThis, globals) // GPUBufferUsage, GPUMapMode, ...
let device: GPUDevice
const gpuErrors: string[] = []

beforeAll(async () => {
  const adapter = await create([]).requestAdapter()
  if (!adapter) throw new Error('No GPU adapter in this environment')
  device = await adapter.requestDevice()
  // Throwing inside a listener would not fail the test. Collect, then assert.
  device.addEventListener('uncapturederror', (e) => {
    gpuErrors.push((e as GPUUncapturedErrorEvent).error.message)
  })
})
afterEach(() => expect(gpuErrors.splice(0)).toEqual([]))
afterAll(() => device.destroy())

test('step moves every particle, including the partial last workgroup', async () => {
  const count = 1000 // not a multiple of 64 on purpose
  const result = await runStep(device, makeParticles(count), 0.5)
  expect(result.every((p) => p.x === 0.5)).toBe(true)
})
```

- **It is not a browser.** No canvas, no `navigator.gpu`, no DOM. Test the canvas and frame loop in a browser.
- **CI machines often have no GPU.** Check `requestAdapter()` and skip with a clear message rather than fail. Or run on a runner with a GPU.
- **Pin the package version.** It tracks Dawn, and Dawn tracks the spec.

## Test in headless Chrome

For canvas output, run real Chrome under Playwright or Puppeteer. Chrome's guide for WebGPU in headless Chrome on Linux uses these flags:

```ts
const browser = await chromium.launch({
  args: [
    '--no-sandbox',
    '--headless=new',
    '--use-angle=vulkan',
    '--enable-features=Vulkan',
    '--disable-vulkan-surface',
    '--enable-unsafe-webgpu',
  ],
})
```

Check it worked before trusting a test. Open `chrome://gpu` in the same browser and assert the WebGPU line, or assert `await navigator.gpu.requestAdapter()` is not null in the page.

Pixel tests: render a fixed scene, read the canvas back with `copyTextureToBuffer`, and compare with a tolerance. GPUs differ in the last bit of filtering and blending. An exact match fails across machines.

## Say how it was checked

A change to WebGPU code is reported with the level it reached:

| Level | Proves |
| --- | --- |
| Type-checked against `@webgpu/types` | The calls exist with those shapes |
| WGSL validated with `naga` | The shader parses and type-checks in one compiler |
| Ran in Node with Dawn | The shader and buffers produce the right numbers on one GPU |
| Ran in a browser | The canvas, the frame loop, and the browser's compiler |
| Ran on the target devices | It works where users are |

Do not say "works" for code that only reached the first row.

## Checklist

- [ ] `chrome://gpu` was checked before blaming the code
- [ ] The first error was read, not the last
- [ ] Passes and draws are grouped with debug markers
- [ ] Every `.wgsl` file is validated in CI
- [ ] Compute and layout logic has tests that run on a real device
- [ ] Tests skip clearly when no adapter exists
- [ ] Pixel comparisons use a tolerance
- [ ] The report says which level of checking the code reached
