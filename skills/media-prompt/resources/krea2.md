# Krea 2

Krea's own image model, open weights since June 2026. It is a 12B diffusion transformer trained from scratch, not a FLUX finetune. It comes as **Turbo** (distilled, 8 steps) for making images and **Raw** (undistilled) for training; Krea calls Raw "not recommended for inference use". Checkpoints built on Krea 2 take the same prompts. Their model page's sampler settings win over the table below.

`inspect-model.mjs` knows Krea 2 by its `txtfusion.projector` layer, the key ComfyUI checks.

## Contents

- [Write the prompt](#write-the-prompt)
- [Settings](#settings)
- [Community settings](#community-settings)
- [Image to image](#image-to-image)
- [Style reference](#style-reference)
- [Style LoRAs](#style-loras)
- [Train a style LoRA](#train-a-style-lora)
- [FAIL and PASS](#fail-and-pass)

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

- **Name the medium.** Krea 2's training has a stage driven by an aesthetic reward model, so it has a taste of its own. fal's guide: name a medium, an era, a printing process or an artist's general approach and the whole image reorganises around it; with no direction it settles into a house style. For a chosen look, see [look.md](./look.md).
- **No `(word:1.2)` weights.** ComfyUI's Krea 2 encoder is Qwen3-VL, and its tokenizer turns weighting off, so the brackets reach the model as text.
- **No negative on Turbo.** Krea runs Turbo with CFG off. ComfyUI's template sets cfg 1 and zeroes the negative.

## Settings

| | Turbo | Raw |
| --- | --- | --- |
| Steps | 8 | 52 (Krea's README command) |
| CFG | 1 in ComfyUI. Krea's CLI uses 0.0, which turns CFG off | 3.5 |
| Sampler, scheduler | euler, simple (ComfyUI template) | not given |
| Size | 1024×1024 by default; 1K to 2K. Set the template's megapixels to 2.0 for 2K | Trained up to 1K |
| Shift | Krea's CLI uses `mu` 1.15. ComfyUI's template has no shift node: ComfyUI's Krea 2 model class sets shift 1.15 itself | |

- Width and height in multiples of 16: Krea's code pads to that.
- ComfyUI files: `krea2_turbo_fp8_scaled.safetensors`, text encoder `qwen3vl_4b_fp8_scaled.safetensors` (CLIPLoader type `krea2`), VAE `qwen_image_vae.safetensors`.
- ComfyUI's template has prompt enhancement on by default. A prompt written with this skill already did that job: switch the enhancer off so the prompt runs as written.
- Krea's README options table lists 28 steps and CFG 4.5 as defaults, against its own Raw command (52 and 3.5). The command is the one Krea shows for Raw.

## Community settings

None of these come from Krea. Each is a report from people running the open weights, so test one at a time against the table above, with the seed fixed ([pipelines.md](./pipelines.md#seeds-and-takes)).

| Complaint about Turbo | Reported fix | Needs |
| --- | --- | --- |
| Skin looks plastic or wet, and every seed gives much the same picture | Load **Raw** with `krea2_turbo_lora_rank_64_bf16.safetensors` at 0.6 (LoraLoaderModelOnly) in place of the Turbo checkpoint: 12 steps, cfg 1, euler, beta. At 1.0 the pair behaves like Turbo; lower gives up some of the distillation | Raw and the LoRA, both in Comfy-Org's Krea-2 repository. The LoRA is a rank-extracted difference between Raw and Turbo, not a Krea file |
| Plastic skin, on the Turbo checkpoint itself | The `simple` schedule ends too coarse. Use `beta` in place of `simple`. One guide sets alpha 0.5 and beta 0.7, which needs BetaSamplingScheduler and SamplerCustomAdvanced: KSampler's `beta` is fixed at 0.6 and 0.6. The same guide blames fp8 files and prefers the int8 or nvfp4 build | ComfyUI core |
| Soft detail | `res_multistep` with `simple` in place of euler. Reports on `er_sde` disagree | ComfyUI core |

- **Samplers named `res_2s`, `bong_tangent` and `beta57`** come up in the same reports. They are from the RES4LYF node pack, not ComfyUI core.
- **Plain Raw is not the fix.** A user who ran Raw by itself at 50 steps, at guidance from 1 to 10, found it far worse than Turbo, as Krea's card warns.
- **A negative on Raw** only runs with CFG above 1, and CFG doubles the time. musubi-tuner's doc counts Krea's guidance one lower than standard CFG: Krea's 3.5 is 4.5 on a standard scale.

## Image to image

Turbo redraws an existing picture: the refine pass in [pipelines.md](./pipelines.md#refine-with-a-second-model). ComfyUI's templates are text to image only, so swap EmptyLatentImage for Load Image, a resize and VAE Encode:

| Setting | Value |
| --- | --- |
| Size | Resize first with ImageScaleToTotalPixels, 1 to 2 MP, resolution steps 16 |
| Steps, CFG | 8, 1 (as text to image), euler, simple |
| Denoise | 0.35 to start. 0.25 changes only texture and light; 0.45 starts to change shapes |
| Negative | None: ConditioningZeroOut, as in the template |
| Prompt | The whole picture, then the look, by the rules above. Not only the change |

## Style reference

`krea2_style_reference.safetensors`, by ostris, makes Turbo follow the look of one or two reference images. ComfyUI ships it as the template `image_krea2_turbo_int8_image_style_reference`:

- The LoRA loads with LoraLoaderModelOnly at 1.0 on Turbo.
- The reference image goes into TextEncodeQwenImageEditPlus, through FluxKontextMultiReferenceLatentMethod (`index_timestep_zero`). The template samples with CFGGuider 1, euler, simple, 8 steps and ModelSamplingFlux 1.15.
- The prompt is the new picture's subject. The card: "No trigger word is needed just image and prompt."
- Trained for 1 to 2 reference images. The template's box has three image inputs; the third is beyond what the card describes. The card does not say how much of the reference's content carries over; its example prompt names a new subject, so describe yours in full.
- TextEncodeQwenImageEditPlus resizes each reference itself: to about 384×384 pixels in total for the text encoder, and to about 1 MP for the reference latent. A huge reference adds nothing.
- The card gives no strength. In this skill's own runs 0.7 was a better start than the template's 1.0, which pulled the reference's subject into the new picture ([look.md](./look.md#borrow-a-look-from-a-picture)). Community reports put a workable range at 0.5 to 1.0, and one article keeps unwanted content out by masking the reference so the model never sees it. Cropping the file to the part whose look is wanted does the same job.

This is the nearest local tool to a hosted style reference; how to use it for a look is in [look.md](./look.md#borrow-a-look-from-a-picture). A style LoRA trained on your own images holds a look more firmly ([below](#train-a-style-lora)).

## Style LoRAs

Comfy-Org's Krea-2 repository carries nine style LoRAs. Its README gives each a trigger and a recommended strength of 1.0. Put the trigger in the prompt as written:

| File | Trigger |
| --- | --- |
| `krea2_darkbrush.safetensors` | monochrome ink wash style |
| `krea2_dotmatrix.safetensors` | monochrome stippling style |
| `krea2_kidsdrawing.safetensors` | naive expressive sketch style |
| `krea2_neondrip.safetensors` | textured abstract style |
| `krea2_rainywindow.safetensors` | rainy window style |
| `krea2_retroanime.safetensors` | purple retro anime style |
| `krea2_softwatercolor.safetensors` | art deco watercolor style |
| `krea2_sunsetblur.safetensors` | ethereal motion blur style |
| `krea2_vintagetarot.safetensors` | vintage tarot style |

- The README does not say whether they were trained for Turbo or Raw. ComfyUI's Turbo template loads `krea2_darkbrush` on Turbo at 0.8, behind an "Enable LoRA?" switch that starts off.
- `krea2_turbo_lora_rank_64_bf16.safetensors` sits in the same folder with no trigger or description. It is not a style: it turns Raw into Turbo ([Community settings](#community-settings)).
- Community style LoRAs are filed on Civitai under the base model "Krea 2". Take the trigger and strength from the model page, never from the file name ([loras.md](./loras.md#find-the-trigger)).

## Train a style LoRA

Krea's README: "You train LoRAs on RAW and apply them on Turbo." It names four trainers: Diffusers, ostris' ai-toolkit, fal and musubi-tuner. Krea publishes no training settings, and musubi-tuner's doc says the best ones are not established. These are the published starting points:

| Setting | Value | From |
| --- | --- | --- |
| Base | Krea 2 Raw. Sample and run on Turbo | Krea's README, musubi-tuner |
| Network | `networks.lora_krea2`, rank 32, alpha 32 | musubi-tuner |
| Learning rate | 1e-4 | musubi-tuner |
| Timesteps | `--timestep_sampling shift --discrete_flow_shift 2.5`, or `krea2_shift` for mixed sizes | musubi-tuner |
| Size, batch | 1024 buckets, batch 1 | One published run |
| Pictures, steps, time | 67 and 96 pictures, 2,680 and 2,880 steps, about 2 hours each on an RTX 5090 at 24.8 GB | The same run |
| Use | LoraLoaderModelOnly on Turbo, about 1.0 | Krea's own nine LoRAs |

- **Caption what should stay changeable.** That run's rule: whatever you want to be able to change at inference must be written in the caption. So describe each picture's subject, place and action in long natural language, start every caption with the trigger word, and leave the style itself out. The LoRA then ties the style to the trigger.
- **Pick the checkpoint by eye.** The same run found the loss curve flat and chose between saved epochs by looking at samples.
- **A LoRA trained on Raw is a derivative of Krea 2.** Krea's licence covers what may be done with it and with its outputs: read it before paid work.

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
