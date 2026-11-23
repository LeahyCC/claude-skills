# media-prompt

Turns a plain-words idea into a prompt and ComfyUI settings for local image and video models. Each model gets the form it was trained on: tags for Pony, NoobAI and Illustrious, sentences for FLUX, Krea 2 and Qwen-Image, a short request for FLUX 3 Image Klein's prompt upsampler (or the caption it would write), one instruction for Qwen-Image-Edit, a motion paragraph for Wan 2.2, and a paragraph in time order, with sound, for LTX-2.5. Ask for a look and it directs the shot like a cinematographer: camera move, lens, light, colour and sound, plus trippy effects such as a dolly zoom, a morph or an impossible reveal. A bundled script reads a model file to tell what it is built on and what its trigger words are.

## Install

```bash
npx skills add LeahyCC/claude-skills@media-prompt
```

Or inside Claude Code:

```text
/plugin install media-prompt --marketplace LeahyCC/claude-skills
```

## What it does

Describe the picture or the clip. The skill finds the model (from your models file, the file itself, the model page, or one question), reads only that model's resource file, asks at most two questions, and hands back:

- the prompt, ready to paste
- the negative prompt, or "none" and why (at CFG 1, ComfyUI never runs it)
- settings: size, frames and fps, steps, CFG, sampler, shift or guidance
- LoRAs, with trigger words and strengths
- when it directs a look, the film terms it used and what each does on screen, so you learn the words
- a minimal version: your words in the model's form with nothing added, as the control

Say "make it cinematic", "like a film photo" or "make it trippy", or paste a prompt written for FLUX 3 Video, and it chooses one framing, one camera move, one lens, one light and at most one impossible effect, written as what happens on screen and cut to what the model can make in its clip length. Give it only a mood and it offers three ideas to pick from. For a finished piece it plans the passes (a master still, edits, video, finish), and when a result breaks it gives the fix, cheapest first.

Your own checkpoints and LoRAs go in `~/.claude/media-prompt/models.md`, outside any repository. `node scripts/inspect-model.mjs <models folder> --rows` writes its rows for you.

Version 0.2.0. 14 resource files and 1 script.

## Coverage

| Resource | Topics |
| --- | --- |
| [flux.md](./resources/flux.md) | FLUX.2 [dev], [klein] 4B and 9B (distilled and base), FLUX.1 [dev] and Krea [dev]: prose, light, the [klein] Style and Mood ending, quoted text, hex colours, JSON, reference edits, settings |
| [flux3-klein.md](./resources/flux3-klein.md) | FLUX 3 Image Klein and Klein Base: the prompt upsampler and when to write its caption yourself, the caption and edit-instruction forms, references by order, bounding boxes, Base LoRAs on the distilled model, ComfyUI files, templates and settings |
| [krea2.md](./resources/krea2.md) | Krea 2 Turbo and Raw: Krea's prompting doc and expansion rules, CFG-free Turbo, ComfyUI files and settings, image to image, the style reference LoRA, the nine official style LoRAs and their triggers |
| [qwen-image.md](./resources/qwen-image.md) | Qwen-Image, 2512 and 2.1: Qwen's rewriter rules, quoted text, the quality suffix, negatives, Lightning, sizes, transparent output |
| [qwen-image-edit.md](./resources/qwen-image-edit.md) | Edit, 2509, 2511 and 2.1 edits: one instruction, the fixed restore, inpaint and outpaint wording, "picture 1" versus `<image1>`, the 2511 multi-angles LoRA, and what edits do badly |
| [sdxl-tags.md](./resources/sdxl-tags.md) | Pony V6 score, source and rating tags, NoobAI tag order and special tags, Illustrious versions, weights, escapes, CLIP skip, v-prediction |
| [wan.md](./resources/wan.md) | Wan 2.2 A14B and TI2V-5B: the official formula and vocabulary, what each camera move does, image to video, first and last frame, Fun Camera presets, the default negative, Lightning, NAG, template and repo settings, lip sync to your own audio with S2V and InfiniteTalk |
| [ltx.md](./resources/ltx.md) | LTX-2.5 and LTX-2: the paragraph, the full camera and effect vocabulary, sound and dialogue, multi-shot, first and last frame, camera LoRAs and the slow-motion LoRA, 8n+1 frames, the enhancer, two-stage settings, and why it can't take your own audio |
| [loras.md](./resources/loras.md) | Where trigger words come from and how far to trust each source, ComfyUI loaders, Wan high and low pairs, strength and stacking |
| [finishing.md](./resources/finishing.md) | ComfyUI's own frame interpolation and the RIFE pack, frame counts and the save fps, upscale models, a second pass, SeedVR2, mixing clip frame rates |
| [camera.md](./resources/camera.md) | Directing any model: how a directed prompt is built, shot size, angle, composition, camera moves, focus, lenses, time, light, colour, still photography, the Danbooru tags with enough posts to work, and turning a FLUX 3 prompt into a local one |
| [effects.md](./resources/effects.md) | Trippy and impossible effects: what makes them work, three treatments from a mood, camera tricks, time, transformations, world swaps, optics and layers, and which route each needs |
| [pipelines.md](./resources/pipelines.md) | Jobs of several passes: shots from one master still, building in layers, one idea per still, a refine pass on a second model, a detail pass, seeds and takes, a hosted still as the start frame |
| [fixes.md](./resources/fixes.md) | When a result comes back wrong: video symptoms, edits that fail, the rendered look, and checking a result you can't see |

| Script | What it does |
| --- | --- |
| [inspect-model.mjs](./scripts/inspect-model.mjs) | Reads a `.safetensors` header (never the weights) and the sidecar files next to it. Reports the family from the keys ComfyUI checks when it loads a file, checkpoint or LoRA, LoRA rank, v-prediction, trigger words, training tags and recommended strength, each with its source. `--rows` prints models file rows, `--json` prints everything. Node built-ins only |

## What's different

| Typical prompt enhancer | This skill |
| --- | --- |
| One style for every model | The form each model was trained on, taken from the vendor's own rewriter where there is one |
| Adds detail freely | Keeps your idea, adds only what the model needs, and includes a minimal version as the control |
| Writes a negative every time | Writes one only when CFG uses it, and says "none" at CFG 1 |
| Uses `(word:1.2)` everywhere | Weights only on SDXL tag models. On FLUX.2, FLUX 3 Klein, Qwen-Image, Krea 2 and LTX-2, ComfyUI passes them through as text |
| Guesses the model from the file name | Reads the file: the keys ComfyUI checks, the metadata, the sidecars |
| Guesses trigger words | Reads them from the metadata and sidecars, says where each came from, or asks |
| Says "use CLIP skip 2" | ComfyUI's SDXL default already is CLIP skip 2. The CLIP Set Last Layer node's default of -1 undoes it |
| Piles on "cinematic, dramatic lighting, drone shot, dolly zoom" | One move, one lens, one light, each named and then described as what the camera does, in the model's own words where its guide has them |
| Writes "psychedelic" on a tag model | Uses only Danbooru tags with enough posts to have been learned, and sends looks with no such tag to a sentence model |

Checked sources are in [SOURCES.md](./SOURCES.md).

## License

[MIT](../../LICENSE)
