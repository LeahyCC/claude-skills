# Qwen-Image

Text to image with Qwen-Image (August 2025), Qwen-Image-2512 (December 2025) and Qwen-Image-2.1 (September 2026). Editing, 2.1's included, is in [qwen-image-edit.md](./qwen-image-edit.md).

## Contents

- [Which Qwen-Image](#which-qwen-image)
- [Write the prompt](#write-the-prompt)
- [Negative prompt](#negative-prompt)
- [Settings](#settings)
- [Sizes](#sizes)
- [FAIL and PASS](#fail-and-pass)

## Which Qwen-Image

| Model | What changed | Licence |
| --- | --- | --- |
| Qwen-Image | 20B, strong text drawing in Chinese and English | Apache-2.0 |
| Qwen-Image-2512 | Less "AI look" on people, finer natural detail, better text | Apache-2.0 |
| Qwen-Image-2.1 | Text to image and editing in one model, native 2K, transparent (RGBA) output, up to 10 reference images | qwen-research |
| Qwen-Image-2.1-Turbo | 2.1 in 8 steps at CFG 1 | qwen-research |

`inspect-model.mjs` knows the family by `txt_norm.weight`, and 2.1 by `txt_in.text_norm.weight` plus `modulation.1.weight`, the keys ComfyUI checks. No key ComfyUI checks separates Qwen-Image, 2512, Edit and Edit-2509, so the file name or model page says which one a file is.

## Write the prompt

These rules come from Qwen's official rewriter, `prompt_utils.py` and `prompt_utils_2512.py` in the QwenLM/Qwen-Image repo. It is what Qwen runs on a user's prompt before the model sees it.

- **One continuous paragraph**, about 200 words at most. No lists (the 2512 rewriter: "Strictly avoid formal Markdown lists").
- **Words to draw go in double quotes**, exactly as the user wrote them, in their original language and untranslated. Say where they go (top left, centre, along the bottom) and how they look.
- **Give the exact words.** Never "a sign with some text" or "a chart": write the sign's words or the chart's labels.
- **No text the user didn't ask for.**
- **Keep proper nouns as written.**
- **No negation words** (the Chinese rules). Say what is there.
- **If the prompt contains an instruction, rewrite it as a picture.** "Make me a poster that says OPEN" becomes a poster with "OPEN" on it.
- **People:** the 2512 rewriter spells out expression, pose, hands, background and light for portraits. Fill those gaps. Leave age, ethnicity and build as the user gave them, or ask.
- **No `(word:1.2)` weights.** ComfyUI turns weighting off for Qwen's encoder, so the brackets reach the model as text.

ComfyUI wraps every Qwen-Image prompt in a system line asking the encoder to detail "the color, shape, size, texture, quantity, text, spatial relationships" of what is described. A prompt that states those things is speaking the encoder's language.

**Quality words.** The Qwen-Image card appends `, Ultra HD, 4K, cinematic composition.` (in Chinese: `, 超清，4K，电影级构图.`). Add it on the original Qwen-Image only. The 2512 card does not use it.

**Transparent images (2.1 only).** Use the format from the 2.1 card:

```text
This is an RGBA image with transparency. <description>. The image has alpha channel and the background is transparent.
```

## Negative prompt

| Setup | Negative |
| --- | --- |
| Qwen-Image at true CFG 4 | `" "` (one space). The card: use it "if you do not have specific concept to remove" |
| Qwen-Image-2512 at CFG 4 | The card's Chinese negative, below |
| Any Lightning LoRA, 2.1 base in ComfyUI, 2.1-Turbo (all CFG 1) | None: at CFG 1 ComfyUI skips it |

The 2512 card's negative (low resolution, low quality, deformed limbs and fingers, oversaturated, waxy, faces without detail, over-smoothed, an AI look, messy composition, blurred or distorted text):

```text
低分辨率，低画质，肢体畸形，手指畸形，画面过饱和，蜡像感，人脸无细节，过度光滑，画面具有AI感。构图混乱。文字模糊，扭曲。
```

## Settings

Every ComfyUI template uses sampler `euler`, scheduler `simple`.

| Setup | Steps | CFG | ModelSamplingAuraFlow shift |
| --- | --- | --- | --- |
| Qwen-Image, model card | 50 | true CFG 4 | |
| Qwen-Image, ComfyUI template (ships with the Lightning 8-step LoRA) | 8 | 1 | 3.1 |
| Qwen-Image-2512, card and ComfyUI template | 50 | 4 | 3.1 |
| Qwen-Image or 2512 with a Lightning 4-step or 8-step LoRA | 4 or 8 | 1 | 3.1 |
| Qwen-Image-2.1, ComfyUI base template | 25 (the card's example uses 40) | 1 | no shift node |
| Qwen-Image-2.1-Turbo | 8, on its own fixed schedule | 1 | |
| Qwen-Image-2.1 with Lightning v2 RL | 4 | 1 | |

The Lightning LoRAs come from lightx2v (ModelTC), not from Qwen. Their README says V2.0 gives "reduced over-saturation".

## Sizes

| Ratio | Qwen-Image, 2512 | Qwen-Image-2.1 |
| --- | --- | --- |
| 1:1 | 1328×1328 | 2048×2048 |
| 16:9 | 1664×928 | 2752×1536 |
| 9:16 | 928×1664 | 1536×2752 |
| 4:3 | 1472×1104 (the original card says 1472×1140) | 2400×1792 |
| 3:4 | 1104×1472 (the original card says 1140×1472) | 1792×2400 |
| 3:2 | 1584×1056 | 2528×1696 |
| 2:3 | 1056×1584 | 1696×2528 |

1104 is a multiple of 16, like every other size here; 1140 is not. Use 1104.

## FAIL and PASS

The user asks for "a bakery window with a sign that says Fresh Bread Daily, morning light" on Qwen-Image-2512.

FAIL:

```text
bakery, window, sign, fresh bread daily text, (morning light:1.2), no people, masterpiece, 8k
```

The words to draw are not quoted, the weight is passed through as text, "no people" is a negation, and nothing says where the sign is.

PASS:

```text
A bakery's front window in soft morning light, with loaves of bread on display behind the glass. A sign at the top centre of the window reads "Fresh Bread Daily" in simple painted letters. The low morning sun comes in from the left and catches the glass.
```

```text
Negative: the 2512 card's Chinese negative (above)
Settings: 1328×1328, steps 50, cfg 4, euler, simple, shift 3.1
```
