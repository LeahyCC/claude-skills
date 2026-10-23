# WebGPU skill tasks and acceptance criteria

Written 2026-10-22, before any model run. Run each prompt against Claude with the skill and without it, as in the Next.js pilot. Score each criterion 0 or 1. One run per task is exploratory, not a statistical estimate.

Status: **run on 2026-10-22** with Colin's approval. Results and grading are in [validation.md](./validation.md).

## Behaviour

| ID | Prompt | Acceptance criteria |
| --- | --- | --- |
| T1 | "My WebGPU canvas is black and nothing throws. Here's my init and frame code." Fixture: a uniform buffer created with `MAP_READ \| UNIFORM`, no error listener, no labels. | Adds an `uncapturederror` listener or error scope before guessing. Says to read the first error. Finds the invalid usage combination. Adds labels. |
| T2 | "Particle positions look shifted in the shader." Fixture: `struct P { pos: vec3f, vel: vec3f }` filled from a tightly packed `Float32Array` of 6 floats per particle. | Names the 16-byte `vec3` alignment. Gives the correct offsets (0 and 16, size 32), ideally by running `wgsl-layout.mjs`. Fixes the CPU packing or reorders with a scalar in the gap. |
| T3 | "Add WebGPU to this React component. It works, but in dev I see two devices and sometimes a leaked one." Fixture: a `useEffect` that awaits adapter and device with no cancel flag. | Explains Strict Mode double effects. Adds a cancelled flag checked after each await. Destroys the device if cleanup already ran. Cancels the frame and observers on cleanup. |
| T4 | "After porting from WebGL, close objects disappear." Fixture: `mat4.perspective` from gl-matrix. | Identifies the -1..1 vs 0..1 depth range. Switches to `perspectiveZO` or an equivalent. Checks for a depth texture. |
| T5 | "The second pipeline rejects my camera bind group." Fixture: two pipelines with `layout: 'auto'`. | Explains auto layouts are per pipeline. Moves to an explicit shared bind group layout and pipeline layout. |
| T6 | "Users on some laptops see a blank page." Fixture: init calls `requestDevice({ requiredFeatures: ['shader-f16', 'timestamp-query'] })` with no checks. | Requests features only when `adapter.features` has them. Handles null adapter and rejected device. Adds a fallback and logs the reason. |

## Selection

The skill should load for the first ten and not for the last ten.

| ID | Prompt | Should load |
| --- | --- | --- |
| S1 | Write a compute shader that blurs an image with WebGPU | yes |
| S2 | Why does `textureSample` give a uniformity error inside my if? | yes |
| S3 | Set up `navigator.gpu` with a fallback for Firefox on Linux | yes |
| S4 | My GPUDevice keeps getting lost on Android | yes |
| S5 | Port this WebGL shader to WGSL | yes |
| S6 | How do I time a render pass on the GPU in WebGPU? | yes |
| S7 | Add MSAA to my WebGPU renderer | yes |
| S8 | Struct offsets for this `.wgsl` uniform buffer | yes |
| S9 | Play a video into a WebGPU texture | yes |
| S10 | Write a Vitest test for my WebGPU compute shader | yes |
| S11 | Will moving to WebGPU make my dashboard faster? | no (spa-performance) |
| S12 | Make this three.js scene use TSL node materials | no (engine owns the device) |
| S13 | Fix a WebGL2 `gl.texImage2D` error | no |
| S14 | Speed up my React list re-renders | no |
| S15 | Write a GLSL shader for Shadertoy | no |
| S16 | Set up CUDA on my Linux box | no |
| S17 | Draw a chart with Canvas 2D | no |
| S18 | My Metal app crashes in Xcode | no |
| S19 | Explain how GPUs work in general | no |
| S20 | Configure Vulkan validation layers for a native game | no |

## Not covered by these tasks

Visual correctness in a browser, other GPUs, and Safari or Firefox behaviour. Those need a browser run, recorded separately.
