# Finishing: more frames, more pixels

No prompt. Settings only, in the output block's Settings line.

## More frames: interpolation

ComfyUI-Frame-Interpolation's **RIFE VFI** node adds frames between each pair of frames. Its defaults: checkpoint `rife49.pth`, multiplier 2, fast mode on, ensemble on, scale factor 1.0, cache cleared every 10 frames.

**Frame count.** N frames at multiplier m become (N − 1) × m + 1, not N × m. The node keeps every original frame and adds m − 1 new ones in each gap.

**Set the save fps to the source fps × m.** Otherwise the clip plays m times slower. Length stays the same:

| Source | ×2 gives | Save at |
| --- | --- | --- |
| Wan 2.2 A14B: 81 frames at 16 fps (5.06 s) | 161 frames | 32 fps (5.03 s) |
| Wan 2.2 TI2V-5B: 121 frames at 24 fps (5.04 s) | 241 frames | 48 fps (5.02 s) |
| LTX-2.5: 121 frames at 24 fps | 241 frames | 48 fps |

Where to set it:

- **ComfyUI core:** CreateVideo has the fps (default 30). SaveVideo takes it from the video it is given.
- **VideoHelperSuite's Video Combine:** frame_rate defaults to 8. Always set it.

The same pack has other interpolators (FILM, AMT, GMFSS Fortuna, IFRNet and more). LTX-2.5 also ships its own 2× temporal upscaler, which runs inside LTX's pipeline.

## More pixels: upscaling

- **Upscale model:** Load Upscale Model, then Upscale Image (using Model). The model's factor is fixed: a 4× model always makes the image four times bigger. Follow it with Upscale Image By to reach the size wanted.
- **Second pass for detail:** VAE Encode the upscaled image and run a sampler on it at denoise below 1, with the same prompt and settings. Lower denoise keeps more of the original image, higher denoise redraws more of it.
- **Video:** Upscale Image (using Model) works on every frame of a batch, at a large memory cost for long clips. For LTX-2.5, use its own 2× spatial upscaler, already in the two-stage templates.
- **Another pass through a model** needs the family's size rule again: multiples of 16 or 32.

## Output

```text
Settings: RIFE VFI, rife49.pth, multiplier 2, 81 frames in, 161 frames out. Save at 32 fps (the source's 16 × 2).
```
