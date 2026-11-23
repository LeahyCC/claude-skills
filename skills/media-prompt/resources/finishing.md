# Finishing: more frames, more pixels

No prompt. Settings only, in the output block's Settings line.

## Contents

- [More frames: interpolation](#more-frames-interpolation)
- [More pixels: upscaling](#more-pixels-upscaling)
- [SeedVR2: restore and upscale](#seedvr2-restore-and-upscale)
- [A reel from mixed clips](#a-reel-from-mixed-clips)
- [Output](#output)

## More frames: interpolation

Two routes add frames between each pair of frames:

| Route | Nodes | Models |
| --- | --- | --- |
| ComfyUI core, template `utility_video_frame_interpolation` | FrameInterpolationModelLoader, then FrameInterpolate (multiplier 2 to 16) | In `models/frame_interpolation`: `film_net_fp16`, `rife_v4.25` (plus `_heavy` and `_lite`), `rife_v4.26` (plus `_heavy`). The template starts on FILM |
| ComfyUI-Frame-Interpolation (custom pack) | **RIFE VFI**: checkpoint `rife49.pth`, multiplier 2, fast mode on, ensemble on, scale factor 1.0, cache cleared every 10 frames | The pack also has FILM, AMT, GMFSS Fortuna, IFRNet and more |

**Frame count, both routes.** N frames at multiplier m become (N − 1) × m + 1, not N × m. Each keeps every original frame and adds m − 1 new ones in each gap.

**Set the save fps to the source fps × m.** Otherwise the clip plays m times slower. Length stays the same:

| Source | ×2 gives | Save at |
| --- | --- | --- |
| Wan 2.2 A14B: 81 frames at 16 fps (5.06 s) | 161 frames | 32 fps (5.03 s) |
| Wan 2.2 TI2V-5B: 121 frames at 24 fps (5.04 s) | 241 frames | 48 fps (5.02 s) |
| LTX-2.5: 121 frames at 24 fps | 241 frames | 48 fps |

Where to set it:

- **ComfyUI core:** CreateVideo has the fps (default 30). SaveVideo takes it from the video it is given. The core template works it out for you when its "Apply multiplier to FPS?" switch is on; off, the clip plays at 1/m speed, which is a slow-motion route.
- **VideoHelperSuite's Video Combine:** frame_rate defaults to 8. Always set it.

LTX-2.5 also ships its own 2× temporal upscaler, which runs inside LTX's pipeline.

## More pixels: upscaling

- **Upscale model:** Load Upscale Model, then Upscale Image (using Model). The model's factor is fixed: a 4× model always makes the image four times bigger. Follow it with Upscale Image By to reach the size wanted.
- **Second pass for detail:** VAE Encode the upscaled image and run a sampler on it at denoise below 1, with the same prompt and settings. Lower denoise keeps more of the original image, higher denoise redraws more of it. The pass can run on a different model from the one that made the image: see [pipelines.md](./pipelines.md#refine-with-a-second-model).
- **Video:** Upscale Image (using Model) works on every frame of a batch, at a large memory cost for long clips. For LTX-2.5, use its own 2× spatial upscaler, already in the two-stage templates. For restoration as well as size, use SeedVR2 below.
- **Another pass through a model** needs the family's size rule again: multiples of 16 or 32.

## SeedVR2: restore and upscale

ByteDance's SeedVR2 restores and upscales in one diffusion step, and ComfyUI runs it natively:

| Template | Model | Default |
| --- | --- | --- |
| `utility_seedvr2_3b_int8_upscale_video` | `seedvr2_3b_int8_convrot` (3.22 GB) | Scale 2× |
| `utility_seedvr2_3b_int8_upscale_image`, `utility_seedvr2_7b_int8_upscale_image` | 3B or 7B (7.76 GB) | Scale 4× |

- Both use `seedvr2_ema_vae_fp16` with tiled encode and decode. The sampler is one step, cfg 1, euler, simple, denoise 1 ("full restore").
- For a long clip, the template note says to turn on `trim_video` and upscale in segments, to avoid running out of memory.
- An optional colour correction matches the result to the original; it starts off.

## A reel from mixed clips

Wan 2.2 A14B saves at 16 fps and LTX-2.5 at 24. Pick one delivery rate before editing, for example 24 or 30, and let the editor convert, or interpolate each clip toward it first. Interpolating the 16 fps clips ×2 gives 32 fps, close to 30.

## Output

```text
Settings: FrameInterpolate, rife_v4.25, multiplier 2, 81 frames in, 161 frames out. Save at 32 fps (the source's 16 × 2).
```
