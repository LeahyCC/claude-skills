# FLUX

FLUX.2 [dev], FLUX.2 [klein] 4B and 9B, and FLUX.1 [dev] with its finetunes, FLUX.1 Krea [dev] included. All of them take sentences. None takes a negative prompt except FLUX.2 [klein] base.

FLUX 3 Image Klein (October 2026) is a different model, with its own text encoder, settings and prompt upsampler. It is in [flux3-klein.md](./flux3-klein.md).

## Contents

- [Which FLUX](#which-flux)
- [Write the prompt](#write-the-prompt)
- [Words to draw, colours, JSON](#words-to-draw-colours-json)
- [Edit with reference images](#edit-with-reference-images)
- [Settings](#settings)
- [FAIL and PASS](#fail-and-pass)

## Which FLUX

| Model | Text encoder | Reference images | Notes |
| --- | --- | --- | --- |
| FLUX.2 [dev] | Mistral Small 3.2 24B | Up to 6 recommended | Guidance-distilled |
| FLUX.2 [klein] 4B | Qwen3 4B | Up to 4 | Distilled (4 steps) or base (50 steps) |
| FLUX.2 [klein] 9B | Qwen3 8B | Up to 4 | Distilled or base |
| FLUX.1 [dev], Krea [dev], finetunes | T5-XXL and CLIP-L | None (FLUX.1 Kontext is the FLUX.1 editor) | Guidance-distilled |

The FLUX.2 encoders read at most 512 tokens (`MAX_LENGTH` in BFL's flux2 code), and so does FLUX.1's T5. Text past that is cut.

`inspect-model.mjs` tells them apart. FLUX.2 has a `double_stream_modulation_img` layer, and its width says which one: 6144 is [dev], 4096 is [klein] 9B, 3072 is [klein] 4B. Distilled and base [klein] have the same tensors, so only the file name ("base") says which. A FLUX.1 finetune's model page often names its own sampler; the page wins over the table below.

## Write the prompt

- **Prose, not keyword lists.** BFL's [klein] guide: "describe scenes like a novelist".
- **What the user named comes first:** subject and action, then the place, then style, camera, light and colour. BFL publishes no order for [dev] or [klein]. This order keeps the user's idea in front.
- **Light by source, direction and softness** (BFL's [klein] guide): "warm window light from the left, soft" says more than "nice lighting".
- **[klein]: end with `Style: <style>. Mood: <mood>.`** BFL gives this for "consistent aesthetics".
- **English is most precise.** BFL says FLUX.2 takes other languages, but most of its training text is English.
- **Name what should be there.** There is no negative to push things out.
- **No `(word:1.2)` weights on FLUX.2.** ComfyUI turns weighting off for both FLUX.2 encoders, so the brackets and the number reach the model as text. On FLUX.1 ComfyUI does apply weights, but BFL's guides never use them, so this skill does not either.

**Length.** [klein] has no prompt upsampling: "What you write is exactly what the model receives". A bare idea gets a bare picture, so fill the gaps the idea leaves (setting, light, style) in a few sentences. BFL's README says [dev] "benefits significantly" from upsampling, an extra LLM pass that is off by default in BFL's CLI. A prompt written with this skill does that pass's job.

## Words to draw, colours, JSON

BFL documents these for FLUX.2 [pro] and [max]. For [dev] and [klein] they are not confirmed; use them, and check the result.

- **Words to draw:** put each string in double quotes, with the exact capitals and punctuation. Say where it goes and how it looks. Keep strings short; BFL: "long strings are harder to render accurately". The [klein] model card warns that text may come out wrong.
- **Hex colours:** write `color #0047AB` and tie it to a named object: `a vintage illustration of an apple in color #0047AB`. For a gradient: `starting with color #02eb3c and finishing with color #edfa3c`. A loose "use #FF0000 somewhere" gives uneven results. The [dev] model card shows hex in an example.
- **JSON:** BFL's JSON guide sends a JSON string as the prompt, with keys such as `scene`, `subjects` (each with `description`, `position`, `action`), `style`, `color_palette`, `lighting`, `mood`, `background`, `composition` and `camera`. Two BFL pages use different keys, so the schema is not strict. Use it on [dev] when many objects need fixed places or colours, and compare it with a prose version. On [klein], stay with prose.

## Edit with reference images

In ComfyUI each reference image goes through VAE Encode into a ReferenceLatent node on the conditioning (the official templates). The [klein] edit templates scale inputs to 1 megapixel first.

- Say what changes, and what stays: "Change the jacket to red leather. Keep her face, pose and the street behind her."
- BFL's FLUX.2 pages name references only by their API slots, not as "image 1" in the prompt. The "image 1, image 2" wording is documented for FLUX 3 Image only. On FLUX.2, point at a reference by what it shows: "the red jacket from the product photo".
- Do not describe what already matches the reference.

## Settings

| Model | Steps | Guidance or CFG | Negative | Sampler | Size |
| --- | --- | --- | --- | --- | --- |
| FLUX.2 [dev], ComfyUI template | 20 (Flux2Scheduler) | FluxGuidance 4, BasicGuider | None: BasicGuider has no negative input | euler | 1024×1024 default, up to 4 MP |
| FLUX.2 [dev], BFL code | 50 (the Diffusers card: 28 is "a good trade-off") | guidance 4.0 | None | | |
| FLUX.2 [dev] with the Turbo LoRA | 8 | FluxGuidance 4 | None | euler | |
| [klein] 4B or 9B, distilled | 4, fixed in BFL's code | CFG 1 | None: CFG 1 | euler | 1024×1024 |
| [klein] base, ComfyUI template | 20 | CFG 5 (CFGGuider) | Works; the template leaves it empty | euler | 1024×1024 |
| [klein] base, BFL code | 50 | guidance 4.0 | Empty by default | | |
| FLUX.1 [dev] and finetunes, ComfyUI template | 20 | cfg 1; guidance 3.5 in the Diffusers example (BFL's CLI default is 2.5) | None: the template zeroes it | euler, simple | 1024×1024 |
| FLUX.1 Krea [dev] | 20 (template) | guidance 4.5 (model card example) | None | euler, simple | 1024×1024 |

- Width and height in multiples of 16, for FLUX.2 and FLUX.1 alike.
- The current FLUX.1 templates have no FluxGuidance node, so the model's built-in default applies. Add the node to set guidance.
- BFL's README says [klein] base is for fine-tuning and LoRA training. Use distilled for making images unless the user wants the negative or the slower model.

## FAIL and PASS

The user asks for "a woman in a red jacket on a rainy street at night, neon" on FLUX.2 [klein] 4B, distilled.

FAIL:

```text
1girl, red jacket, rainy street, night, neon, (masterpiece:1.2), best quality, 8k
Negative: blurry, lowres, bad hands
```

Tags and quality words are SDXL habits, ComfyUI passes `(masterpiece:1.2)` through as text, and at CFG 1 the negative never runs.

PASS:

```text
A woman in a red jacket stands on a rainy city street at night. Pink and blue neon signs light her from the side, their glow soft through the falling rain, and the wet pavement reflects them. Style: photograph. Mood: moody.
```

```text
Negative: none: [klein] distilled runs at CFG 1, so ComfyUI skips it
Settings: 1024×1024, steps 4, cfg 1, euler
```
