# Wan 2.2

Wan 2.2 T2V-A14B (text to video), I2V-A14B (image to video) and TI2V-5B (both, in one smaller model). Wan 2.5, 2.6, 2.7 and 3.0 are hosted only, with no open weights, so they are not covered.

## Contents

- [Which Wan](#which-wan)
- [Text to video](#text-to-video)
- [The official vocabulary](#the-official-vocabulary)
- [Image to video](#image-to-video)
- [Negative prompt](#negative-prompt)
- [Settings](#settings)
- [FAIL and PASS](#fail-and-pass)

## Which Wan

| Model | Size | Length | fps | Notes |
| --- | --- | --- | --- | --- |
| T2V-A14B, I2V-A14B | 832×480 or 480×832 (480p), 1280×720 or 720×1280 (720p) | 81 frames, about 5 s | 16 | Two experts: a high-noise model for the first steps, a low-noise model for the rest |
| TI2V-5B | 1280×704 or 704×1280 | 121 frames, about 5 s | 24 | One model, its own Wan 2.2 VAE |

- **Frames are 4n+1.** ComfyUI's Wan latent nodes step the length by 4 from 1. 81 and 121 frames are the trained lengths. Wan22ImageToVideoLatent defaults to 49 frames, so set it.
- **Width and height:** multiples of 16 for A14B (EmptyHunyuanLatentVideo and WanImageToVideo step by 16), multiples of 32 for TI2V-5B (Wan22ImageToVideoLatent steps by 32).
- **Image to video:** in Wan's own scripts the size is a target area and the input image's aspect ratio wins. ComfyUI's WanImageToVideo takes an exact width and height and resizes the start image to them, so set them to the photo's aspect ratio.
- `inspect-model.mjs` reads the size from the width (5120 is 14B, 3072 is 5B) and the task from the input channels (16 text, 36 image, 48 TI2V-5B). The high-noise and low-noise experts have the same tensors, so only the file name says which is which. Wan 2.1 and 2.2 14B text-to-video files look the same too.

## Text to video

Alibaba's official formula (Model Studio's video prompt guide):

```text
Entity + Scene + Motion
```

For more control:

```text
Entity (description) + Scene (description) + Motion (description) + Aesthetic control + Stylization
```

Write it as one paragraph: who or what, where, what moves and how, then camera and light, then style.

- **Motion is the point.** Say what moves, in which direction, and how fast, with adverbs such as "slowly" or "quickly".
- **Camera and light** come from the vocabulary below. Use the terms that fit the idea and leave the rest out.
- **Weights:** ComfyUI applies `(word:1.2)` to Wan's umT5 encoder, but Alibaba's guide never uses it, so this skill doesn't.

## The official vocabulary

From the guide's "Cinematic aesthetic control" section, which says its examples were made with Wan 2.2. The terms are its table labels and examples, not a closed list.

| Category | Terms |
| --- | --- |
| Light source | daylight, firelight, overcast light, clear sky light |
| Light type | soft light, hard light, side light, high contrast, rim light, backlight |
| Time of day | daytime, night, dawn, sunrise, sunset |
| Shot size | close-up, close shot, medium close-up, medium shot, medium full shot, wide-angle, extreme full shot |
| Composition | center composition, left-heavy composition, balanced composition, symmetrical composition |
| Lens | long-focus lens, wide-angle lens, ultra-wide-angle fisheye, tilt-shift lens |
| Camera angle | eye-level, low angle, high-angle, top-down angle, over-the-shoulder angle, aerial shot |
| Shot type | clean single shot, two-shot, group shot, establishing shot |
| Tone | warm tones, cool tones, low saturation |
| Camera movement | camera pushes in, camera pulls out, camera moves left, orbiting camera movement, compound camera movement, fixed camera |
| Visual style | felt style, 3D cartoon, pixel style, puppet animation, claymation style, black and white animation |
| Special effects | tilt-shift photography, time-lapse photography |

## Image to video

The guide: the image already sets the subject, the scene and the style, so the prompt is:

```text
Motion + Camera movement
```

- Describe how the things already in the picture move, with adverbs for speed and strength.
- Add one camera move ("camera pushes in", "camera moves left"), or "fixed camera" to keep it still.
- Do not describe the picture again. Wan 2.2's own README examples do describe the scene; this skill follows the guide.
- An empty prompt is allowed. The README runs one with prompt extension on.

## Negative prompt

Wan 2.2's default negative (`sample_neg_prompt` in its `shared_config.py`) is in Chinese. ComfyUI's templates use it as it is, and the umT5 encoder reads Chinese:

```text
色调艳丽，过曝，静态，细节模糊不清，字幕，风格，作品，画作，画面，静止，整体发灰，最差质量，低质量，JPEG压缩残留，丑陋的，残缺的，多余的手指，画得不好的手部，画得不好的脸部，畸形的，毁容的，形态畸形的肢体，手指融合，静止不动的画面，杂乱的背景，三条腿，背景人很多，倒着走
```

In rough English (this skill's translation; no official one exists): garish colours, overexposed, static, blurry details, subtitles, style, artwork, painting, picture, still, greyish overall, worst quality, low quality, JPEG artefacts, ugly, mutilated, extra fingers, badly drawn hands, badly drawn face, deformed, disfigured, malformed limbs, fused fingers, motionless picture, cluttered background, three legs, many people in the background, walking backwards.

It only works when CFG is above 1. With a Lightning LoRA the template runs at CFG 1 and ComfyUI skips the negative. To get negatives back at CFG 1:

- ComfyUI core has an experimental **NAGuidance** node (Normalized Attention Guidance). Its description says it enables negative prompts on distilled models. Its code patches attention in general and does not name Wan.
- The **ComfyUI-NAG** pack (ChenDarYen) supports Wan: swap KSampler for KSamplerWithNAG, or KSampler (Advanced) for KSamplerWithNAG (Advanced).

## Settings

ComfyUI's templates use these by default. The Wan repo's own numbers differ, so both are here.

| Setup | Steps | CFG | High-noise, then low-noise | Sampler, scheduler | Shift |
| --- | --- | --- | --- | --- | --- |
| A14B, ComfyUI template, Lightning off (the default) | 20 | 3.5 | steps 0 to 10, then 10 to 20 | euler, simple | 5 (ModelSamplingSD3 on both models) |
| A14B, ComfyUI template, Lightning on | 4 | 1 | steps 0 to 2, then 2 to 4 | euler, simple | 5 |
| T2V-A14B, Wan repo | 40 | 4.0 high, 3.0 low | switch at timestep 875 | | 12 |
| I2V-A14B, Wan repo | 40 | 3.5 | switch at timestep 900 | | 5 |
| TI2V-5B, ComfyUI template | 20 | 5 | one model | uni_pc, simple | 8 |
| TI2V-5B, Wan repo | 50 | 5 | one model | | 5 |

- **Save at the trained fps:** 16 for A14B, 24 for TI2V-5B (the templates' CreateVideo node). The templates' A14B size is 640×640 at 81 frames.
- **High noise runs first.** In the first KSamplerAdvanced, add noise on and return the leftover noise. In the second, add noise off.
- **Lightning LoRAs** (lightx2v, not the Wan team) come in pairs: the high LoRA on the high-noise model, the low LoRA on the low-noise model, both at 1.0. Their README: "please set cfg = 1.0". T2V V2.0 (November 2025) is the newest T2V release. For I2V there is V1, plus a 720p 4-step distill from 2026.
- The TI2V-5B template starts as text to video, with its image input bypassed. Turn the image node on for image to video.

## FAIL and PASS

The user attaches a photo of a woman in a sunflower field and asks: "she turns to the camera and smiles, there's a breeze". Model: I2V-A14B with the Lightning LoRAs.

FAIL:

```text
A woman with red hair in a green dress standing in a field of sunflowers on a sunny day, beautiful, masterpiece, 4k
Negative: (the Chinese default)
```

It describes the picture again, gives no motion, and the negative never runs at CFG 1.

PASS:

```text
The woman slowly turns her head toward the camera and smiles as a light breeze moves her hair and sways the sunflowers around her. The camera pushes in slowly.
```

```text
Negative: none: the Lightning LoRAs run at CFG 1, so ComfyUI skips it
Settings: 832×480 (a landscape photo; match its aspect ratio), 81 frames at 16 fps, steps 4 (high 0 to 2, low 2 to 4), cfg 1, euler, simple, shift 5
LoRAs: the I2V Lightning high LoRA on the high-noise model at 1.0, the low LoRA on the low-noise model at 1.0
```
