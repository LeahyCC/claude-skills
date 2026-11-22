# FLUX 3 Image Klein

Black Forest Labs' open-weights version of FLUX 3 Image (October 2026). One 5.6B model edits from an instruction, makes images from text, combines up to 10 reference images and places elements with bounding boxes. BFL built it for editing. It is not a FLUX.2 model: it has its own text encoder, its own settings, and a prompt upsampler it was trained around. FLUX.2 [klein] is a different model, in [flux.md](./flux.md).

## Contents

- [Which Klein](#which-klein)
- [The upsampler](#the-upsampler)
- [Upsampler on: write the request](#upsampler-on-write-the-request)
- [Upsampler off: write the caption](#upsampler-off-write-the-caption)
- [Edits and references](#edits-and-references)
- [Bounding boxes](#bounding-boxes)
- [LoRAs](#loras)
- [Settings](#settings)
- [FAIL and PASS](#fail-and-pass)

## Which Klein

| | Klein (distilled) | Klein Base |
| --- | --- | --- |
| Made for | Making and editing images | Fine-tuning, LoRA training, research |
| Steps | 16 | 50 |
| CFG | 1: no guidance | 3.5 |
| ComfyUI file | `flux3-image-klein-<precision>.safetensors` | `flux3-image-klein-base-<precision>.safetensors` |

- **Both:** a 5.6B image transformer, the Qwen3-VL-4B-Instruct text encoder in its own file, the FLUX.2 autoencoder (`flux2-vae.safetensors`), output up to 4K, up to 10 references.
- **Precision:** bf16 (11.1 GB), int8 (5.8 GB) or NVFP4 (5.3 GB). BFL says Klein fits consumer GPUs down to an RTX 3090. The int8 files run on 8 GB cards such as the RTX 3070, and on cards without FP8 (RTX 30 series and older). NVFP4 needs a Blackwell GPU.
- **Licence:** both models are under the FLUX Kommunity License. The text encoder and the upsampler are Apache 2.0.

`inspect-model.mjs` knows Klein by the two keys ComfyUI checks, `content_mode_blocks.image.0.attn_out.weight` and `single_stream_modulations.txt.lin.weight`. Only the distilled checkpoint has `ref_time_in.in_layer.weight`, its flow-map time input (BFL's `checkpoint.py`), so the script tells distilled from Base by the file, not by its name.

## The upsampler

BFL: "Always run a prompt upsampler." The model was trained on the captions its upsampler writes, and BFL says a prompt sent as typed gives noticeably weaker results. The upsampler (`flux-3-image-klein-pup`) is a 9B vision-language model, fine-tuned from Qwen3.5-9B. It reads the request, any reference images and any boxes, and writes one long caption. It is on by default in every official ComfyUI template, in BFL's CLI and in the Diffusers pipeline.

| Route | When | This skill writes |
| --- | --- | --- |
| Upsampler on | By default | A short request in the user's words, with references named by order |
| Upsampler off | The 9B upsampler costs too much memory or time, or the user wants every word fixed | The full caption, in the form the upsampler writes |

BFL's README names the second route: an outside vision-language model can write the caption from BFL's system prompts, sent with `--no-pup`. For an edit, BFL adds that the caption must come from the same reference images the model gets. So look at every reference before writing an edit caption, and ask for any that is missing.

Never send a short prompt with the upsampler off. That is the typed prompt BFL warns about.

The minimal version, this skill's control, is the user's words with the upsampler on.

## Upsampler on: write the request

BFL's system prompts tell the upsampler to keep every subject, count, position, style cue and piece of wording it is given, and to decide the rest. A long request keeps its content but not its wording. So the request should be clear, not long.

- **The user's words.** Subjects, actions, counts, places, the style, the words to draw. One or two sentences.
- **A style, if the user gave one.** With none, the upsampler plans a photograph.
- **Words to draw in double quotes,** exactly as they should read, in their own language.
- **Name what should be there.** The upsampler rewrites negations as what is present, so write it that way from the start.
- **References by order:** "the first image", "the second image", as in BFL's CLI examples. For an edit, say what changes and what must stay.
- **No `(word:1.2)` weights.** ComfyUI's FLUX 3 tokenizer turns weighting off, so the brackets reach the model as text.

The templates show the upsampler's caption in a preview node. Read it when a result surprises you: it is what the model got.

## Upsampler off: write the caption

Write what the upsampler would. These rules come from BFL's text-to-image system prompts: the one the upsampler ships with, and a longer brief for an outside model that writes in its place.

| Do | Don't |
| --- | --- |
| One block of prose, with no line breaks | Bullets, JSON, Markdown, headings |
| Open with the medium: `Full-color outdoor photograph, ...`, `Studio photograph, ...`, `Anime-style illustration of ...` | "Photorealistic" for a real photo. BFL keeps that opener for renders, and on a photo it pulls toward their look |
| Then the scene, the light (source, direction, hardness, colour temperature) and the camera. Then the subjects, with colours, materials and state | Mood words. Turn "joyful" into a posture, "golden hour" into the sun's angle and colour |
| Place each thing in the frame: "On the left, ...", "In the background, ...", behind, holds, faces | Summaries such as "various items": name them |
| Give each person in focus a profile you can see: ethnicity, gender, age range, skin tone ("fair skin", "brown skin"), hair, clothing | Identities, clothing details or text for anything blurred or far away. Those get shapes, colours and silhouettes |
| Plain colour names | "bright", "vibrant", "vivid" |
| Keep the background to about a sixth of the caption | A background paragraph as long as the subject's |
| State facts flatly | Hedges ("slightly", "softly"), quality words ("stunning", "highly detailed"), a closing line about the mood |
| Words to draw verbatim in double quotes, in their own language, line breaks as `\n`, with font, colour and place | Text described but not quoted: BFL says it comes out as gibberish |
| Depth of field, bokeh or blur only when the user asks or the style calls for it | Optics added by habit |
| English prose, whatever the user's language | |

- **Length:** BFL's brief puts a typical caption at 200 to 350 words, and a complex scene at up to 500. The upsampler's own prompt says 100 to 350.
- **Names:** keep the people, brands and places the user named. Add none.
- **Time of day is light,** never a clock or a sign.
- **Fill gaps with new things in new places,** not with more adjectives on what the user already described.
- **No `(word:1.2)` weights,** for the same reason as above.

## Edits and references

An edit caption is an instruction about the change, not a description of the whole picture. BFL's edit upsampler picks the voice by the job:

| Job | Open with |
| --- | --- |
| One image keeps its scene and gets bounded changes | An imperative: "Remove the ...", "Change the ... to ...", "Zoom in on ..." |
| The whole image changes | Its scope: "Convert the entire image into ...", "Shift the camera viewpoint to ..." |
| References drawn into a new frame: a person into another scene, a garment, an object or a style donor | A request: "Create a photograph of ...", saying what comes from each image and what is new |

- **Name references by order or by what they show:** "the first image", "the cafe photo". BFL's brief says never by token. Tokens belong to [box layouts](#bounding-boxes).
- **Pick out each thing by how it looks:** "the standing man in the blue shirt on the left", not "the man" when there are two.
- **Give the end state:** which colour, how large, which pose, which material.
- **Cover the knock-on effects:** shadows, reflections, what hides what, scale, light. Say what fills a removed area.
- **Describe the change, not the scene.** End with one short clause on what stays: "Keep the rest of the room unchanged." A person moved from one image to another keeps their face and identity unless the user says otherwise.
- **Text:** the new words verbatim in double quotes, in the font, size and colour of the old ones.
- **Length:** one or two sentences for one simple change, about 40 to 90 words for a standard edit, up to 150 for several references (BFL's brief).

With the upsampler on, write the change in the user's words, with references by order: "print the dog from the second image on the mug".

**Output size:** the first reference sets it (BFL's README). ComfyUI's edit templates pass the references through a ReferenceMultiLatent node, which scales them to about 1 megapixel, adds each one to both the positive and the negative, and hands the sampler a latent of that size. BFL's own code keeps a single reference at up to about 4 megapixels, and fits each of several under 1.

## Bounding boxes

Boxes set where an element goes and how big it is. They are not a hard mask: an element can spill past its box, a small one may not appear, and an edit can change things outside its box (BFL's model card).

**In ComfyUI:** draw the boxes in Create Bounding Boxes and describe each one, then pass them through FLUX 3 Image Layout Prompt (`Flux3LayoutPrompt`, marked experimental). It adds the boxes to the prompt as a table. In the prompt, cite box N as `<obj_N>`: `a red balloon <obj_1> above a lighthouse <obj_2>`. Put colours in the box's description: the node ignores palettes.

The templates run the upsampler with BFL's plain text-to-image and edit prompts, which tell it to write no JSON, ids or coordinates. BFL's `t2i_bbox` and `i2i_bbox` prompts, in `system_prompts.json`, are the ones that keep boxes. So with boxes, either load the matching `_bbox` prompt into the template's system prompt node, or switch the upsampler off and send the caption with its table. Neither was tested for this skill.

**Written by hand,** in the form the upsampler writes:

- **The caption, one space, then one JSON array,** all on one line. The caption cites each row's id in angle brackets at its first mention: `a wicker table <table_1>`.
- **Text-to-image rows:** `{"id", "bbox", "desc"}`. **Edit rows:** `{"id", "from", "src_bbox", "tgt_bbox", "desc"}`.
- **id:** a class noun and a number, counted left to right, then top to bottom: `person_1`, `dog_2`. A block of text is `En_Text_1`.
- **bbox:** `[y_min, x_min, y_max, x_max]`, whole numbers from 0 to 1000, measured from the top-left corner.
- **desc:** what the element is and looks like, not where it is. A text row quotes its words.
- **Edits:** `from` is `ref_image_0` for the first reference, `ref_image_1` for the second (counting from 0), or `target` for new content. A removed item has `"tgt_bbox": null`. New content has `"src_bbox": null`. Cite a reference by its token where content comes from it: `the cup <cup_1> from <ref_image_1>`.

BFL's CLI takes boxes as a separate file, with coordinates from 0 to 1.

## LoRAs

Train on Base. BFL's Klein page says a rank-32 LoRA from a handful of images can teach Klein a new style or edit. Base and distilled share an architecture, so the LoRA loads on distilled with no conversion.

- **On distilled:** keep 16 steps and CFG 1, and set the LoRA to 0.75. BFL found anything from 0.5 to 1.0 works, with small changes in detail and none in the style.
- **The trigger:** from the models file, the script or the model page ([loras.md](./loras.md)). Whether the upsampler keeps a made-up trigger word was not tested. Check its caption in the preview node, or switch it off and put the trigger in your own caption.

## Settings

| | Klein (distilled) | Klein Base |
| --- | --- | --- |
| Steps | 16 | 50 |
| CFG | 1 | 3.5 (BFL's Klein page, the ComfyUI card and the text-to-image template). BFL's code and README use 4 |
| Negative | None: at CFG 1 ComfyUI skips it | Leave it empty. BFL's code runs CFG against an empty prompt |
| Sampler, scheduler | euler, simple | euler, simple |
| Size | 1024×1024 for text to image. An edit takes the first reference's size | The same |
| Shift | ComfyUI's default for the model, 1.93586. The templates add no shift node | The same |

- Width and height in multiples of 16: BFL's autoencoder refuses anything else. Each side from 64 to 4096.
- ComfyUI files, from `black-forest-labs/flux-3-image-klein-comfy`: the model in `diffusion_models`, loaded with UNETLoader. The encoder `qwen3vl_4b_<precision>.safetensors` and the upsampler `qwen3.5_9b_flux3_prompt_upsampler_<precision>.safetensors` go in `text_encoders`, and both load through CLIPLoader with type `flux3`. The autoencoder `flux2-vae.safetensors` goes in `vae`.
- The templates: `image_flux3_klein_distilled_t2i`, `image_flux3_klein_distilled_image_edit`, `image_flux3_klein_t2i` and `image_flux3_klein_image_edit` (the last two are Base). They ship the int8 model and encoder and the w4a8 upsampler (6.7 GB). Their notes suggest the bf16 model when the GPU has more than 24 GB.
- The upsampler runs in a TextGenerate node with BFL's system prompt, and a switch node sends either its caption or your own text to the encoder. In the text-to-image templates the switch is on for the upsampler; in the edit templates the upsampler feeds the switch's false side, and the switch is saved at false. All four ship with the upsampler in use.
- The saved Base edit template reads cfg 1 at 50 steps, against its own note and BFL's 3.5. Set 3.5. The distilled edit template's note says 50 steps and cfg 3.5, but its sampler is set to 16 and 1, which is right for distilled.

## FAIL and PASS

The user attaches a daytime photo of a woman in a yellow hooded raincoat with buttons, standing on a dry city street in front of shopfronts. On Klein distilled, they ask: "make the coat red and make it rain".

FAIL:

```text
(red raincoat:1.3), rain, masterpiece, 8k, ultra detailed, photorealistic, no blur
Negative: blurry, lowres, deformed
```

SDXL habits. With the upsampler on, it drops the quality words anyway. With it off, the brackets reach the encoder as text, and this is the typed prompt BFL warns about. "Photorealistic" points a photo at renders, "no blur" is a negation, and at CFG 1 the negative never runs.

PASS, upsampler on:

```text
Make her raincoat red and make it rain. Keep her face, her pose and the street.
```

PASS, upsampler off, written after looking at the photo:

```text
Change the woman's yellow hooded raincoat to a deep red raincoat of the same cut, keeping its hood, buttons and folds. Add steady rain across the whole frame, with streaks against the shopfronts behind her, small splashes on the pavement and a wet sheen on the paving stones that reflects the red coat. Turn the daylight to an even overcast grey and darken her hair and shoulders with damp. Keep her face, her pose and the street unchanged.
```

```text
Negative: none: distilled runs at CFG 1, so ComfyUI skips it
Settings: the photo's size, steps 16, cfg 1, euler, simple, upsampler on (or off, with the caption above)
Minimal version: make the coat red and make it rain (upsampler on)
```
