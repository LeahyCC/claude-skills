# Krea 2

Krea's own image model, open weights since June 2026. It is a 12B diffusion transformer trained from scratch, not a FLUX finetune. It comes as **Turbo** (distilled, 8 steps) for making images and **Raw** (undistilled) for training; Krea calls Raw "not recommended for inference use". Checkpoints built on Krea 2 take the same prompts. Their model page's sampler settings win over the table below.

`inspect-model.mjs` knows Krea 2 by its `txtfusion.projector` layer, the key ComfyUI checks.

## Write the prompt

Krea's prompting doc asks for natural language, and says long, detailed prompts give the best results, though short ones work. Put the words to draw in quotes.

Krea's expansion prompt (`docs/expansion.txt`, also the system prompt in ComfyUI's Krea 2 template) is the clearest statement of what this model wants filled in, and of what to leave alone:

| Do | Don't |
| --- | --- |
| Keep every subject, action, colour and spatial relation the user gave | Add objects, props, characters or animals the user did not imply |
| Group each subject with its own look and action | Scatter one person's details across the paragraph |
| Use grounded words for poses, contact and layout: "her left hand on the railing" | Invent exact clothing, colours, materials or scene details the idea does not support |
| Polish lightly when the prompt is already detailed | Expand a detailed prompt further |
| Write one paragraph | Use bullets, JSON or markdown |
| Keep the user's medium: a sketch stays a sketch | Switch to a photo because it is easier |

Its rules also keep people clothed by default, which is one more reason to run a finished prompt without the template's enhancer.

- **No `(word:1.2)` weights.** ComfyUI's Krea 2 encoder is Qwen3-VL, and its tokenizer turns weighting off, so the brackets reach the model as text.
- **No negative on Turbo.** Krea runs Turbo with CFG off. ComfyUI's template sets cfg 1 and zeroes the negative.

## Settings

| | Turbo | Raw |
| --- | --- | --- |
| Steps | 8 | 52 (Krea's README command) |
| CFG | 1 in ComfyUI. Krea's CLI uses 0.0, which turns CFG off | 3.5 |
| Sampler, scheduler | euler, simple (ComfyUI template) | not given |
| Size | 1024×1024 by default; 1K to 2K. Set the template's megapixels to 2.0 for 2K | Trained up to 1K |
| Shift | Krea's CLI uses `mu` 1.15. ComfyUI's template has no shift node | |

- Width and height in multiples of 16: Krea's code pads to that.
- ComfyUI files: `krea2_turbo_fp8_scaled.safetensors`, text encoder `qwen3vl_4b_fp8_scaled.safetensors` (CLIPLoader type `krea2`), VAE `qwen_image_vae.safetensors`.
- ComfyUI's template has prompt enhancement on by default. A prompt written with this skill already did that job: switch the enhancer off so the prompt runs as written.
- Krea's README options table lists 28 steps and CFG 4.5 as defaults, against its own Raw command (52 and 3.5). The command is the one Krea shows for Raw.

## FAIL and PASS

The user asks for "an old fisherman mending a net on a dock at dawn, painted in watercolour".

FAIL:

```text
old fisherman, net, dock, dawn, watercolor, (masterpiece:1.3), highly detailed, 8k, trending on artstation
```

A tag list with weights and quality spam. The weight reaches the model as text, and nothing says what the man is doing with the net.

PASS:

```text
A watercolour painting of an old fisherman sitting on a wooden dock at dawn, mending a fishing net spread across his knees. Soft early light from the low sun on the water behind him, loose washes of colour, visible paper texture.
```

```text
Negative: none: Turbo runs without CFG
Settings: 1024×1024, steps 8, cfg 1, euler, simple, enhancer off
```
