# Finishing: more frames, more pixels, a grade

No prompt. Settings only, in the output block's Settings line.

## Contents

- [More frames: interpolation](#more-frames-interpolation)
- [More pixels: upscaling](#more-pixels-upscaling)
- [SeedVR2: restore and upscale](#seedvr2-restore-and-upscale)
- [Grade: colour, glow and grain](#grade-colour-glow-and-grain)
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
- ComfyUI's docs call SeedVR2 a conservative upscaler: it keeps what is there and invents little. For new detail, use the second pass above.

## Grade: colour, glow and grain

A straight render has pure blacks, even colour and no grain, which is much of what reads as "AI". ComfyUI ships the tools as blueprints: ready-made subgraph boxes, each one GLSLShader node running on the GPU. Find them by name in the node search, or all together in the template `basic_image_color_adjustment`. No custom nodes.

Chain them in this order, after the last upscale:

| Step | Blueprint | Controls | A gentle start | Too much looks like |
| --- | --- | --- | --- | --- |
| 1. Split the tones | Color Balance | Red, green and blue for shadows, midtones and highlights, each −100 to 100. Preserve Luminosity | Shadows: red −5, blue +6. Highlights: red +5, green +2, blue −5 | A colour cast on skin |
| 2. Lift the blacks | Image Levels | Input black and white, gamma, output black and white (0 to 255) | Output black 8, output white 250 | Grey, washed-out shadows |
| 3. Calm the colour | Color Adjustment | Temperature, tint, vibrance, saturation, each −100 to 100 | Saturation −8, vibrance +8 | Flat, or orange |
| 4. Glow | Glow | Intensity, radius, threshold, a blend mode, a tint colour | Intensity 5, radius 45, threshold 30, blend screen, a warm orange tint | A hazy, smeared picture |
| 5. Grain | Film Grain | Grain amount (0 to 1), grain size (0.3 to 3, lower is finer), colour amount, luminance bias (1 is shadows only), Smooth or Grainy | Amount 0.3, size 1.2, colour 0.25, luminance bias 0.35 | Noise |
| 6. Lens fringing | Chromatic Aberration | Amount 0 to 100; Linear, Radial, Barrel, Swirl or Diagonal | Off. To try it: Radial, 10 | A 3D-glasses look |

- **The starting values are a judgement,** picked from each shader's range to be barely visible. No source gives numbers for these. Change one box at a time and compare with the box bypassed.
- **What each number does,** from the shaders: Color Balance at 10 moves a tone range by about 0.07 of full scale. Glow's threshold counts down from white, so at 30 only parts brighter than about 70% of white glow, and at intensity 0 the box does nothing (its default). Glow's radius is in pixels, so it needs raising on a bigger picture. Film Grain's amount of 1 adds noise of about 0.15 of full scale.
- **Glow with a warm tint stands in for halation,** the red-orange halo film gives bright edges. There is no core node or blueprint for halation, a vignette or a LUT file. Color Curves (an RGB master curve and one per channel) covers a contrast curve.
- **Match another picture's colours** with Transfer Color (ColorTransfer): the picture as `image_target`, the reference as `image_ref`, method `reinhard_lab`, `mkl_lab` or `histogram`, strength 1.0. This is how a set of stills, or clips from two video models, gets one palette.
- **Add Noise to Image** (ImageAddNoise) is the plain alternative for grain: per-channel Gaussian noise, with a default strength of 0.5 that is far too high for grain.
- **One grade for the whole set.** Save the chain once and run every still through it unchanged.
- **On video, skip the Film Grain box.** The boxes take a batch of frames, but the grain shader has no frame input, so it draws the same grain on every frame and the grain sits still like dirt on the lens. The colour steps and the glow are safe on clips. Add moving grain in the editor.
- **A painting gets no grain.** Grain and fringing are what a camera adds. For a painted look keep the colour steps and the glow.

## A reel from mixed clips

Wan 2.2 A14B saves at 16 fps and LTX-2.5 at 24. Pick one delivery rate before editing, for example 24 or 30, and let the editor convert, or interpolate each clip toward it first. Interpolating the 16 fps clips ×2 gives 32 fps, close to 30.

## Output

```text
Settings: FrameInterpolate, rife_v4.25, multiplier 2, 81 frames in, 161 frames out. Save at 32 fps (the source's 16 × 2).
```

```text
Settings: after the upscale, Color Balance (shadows red −5, blue +6; highlights red +5, green +2, blue −5), Image Levels (output black 8, output white 250), Film Grain (amount 0.3, size 1.2). The same chain for every still in the set.
```
