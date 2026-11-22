# media-prompt

Turns a plain-words idea into a prompt and ComfyUI settings for local image and video models. Each model gets the form it was trained on: tags for Pony, NoobAI and Illustrious, sentences for FLUX, Krea 2 and Qwen-Image, one instruction for Qwen-Image-Edit, a motion paragraph for Wan 2.2, and a paragraph in time order, with sound, for LTX-2.5. A bundled script reads a model file to tell what it is built on and what its trigger words are.

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
- a minimal version: your words in the model's form with nothing added, as the control

Your own checkpoints and LoRAs go in `~/.claude/media-prompt/models.md`, outside any repository. `node scripts/inspect-model.mjs <models folder> --rows` writes its rows for you.

Version 0.1.0. 9 resource files and 1 script.

## Coverage

| Resource | Topics |
| --- | --- |
| [flux.md](./resources/flux.md) | FLUX.2 [dev], [klein] 4B and 9B (distilled and base), FLUX.1 [dev] and Krea [dev]: prose, light, the [klein] Style and Mood ending, quoted text, hex colours, JSON, reference edits, settings |
| [krea2.md](./resources/krea2.md) | Krea 2 Turbo and Raw: Krea's prompting doc and expansion rules, CFG-free Turbo, ComfyUI files and settings |
| [qwen-image.md](./resources/qwen-image.md) | Qwen-Image, 2512 and 2.1: Qwen's rewriter rules, quoted text, the quality suffix, negatives, Lightning, sizes, transparent output |
| [qwen-image-edit.md](./resources/qwen-image-edit.md) | Edit, 2509, 2511 and 2.1 edits: one instruction, the fixed restore, inpaint and outpaint wording, "picture 1" versus `<image1>` |
| [sdxl-tags.md](./resources/sdxl-tags.md) | Pony V6 score, source and rating tags, NoobAI tag order and special tags, Illustrious versions, weights, escapes, CLIP skip, v-prediction |
| [wan.md](./resources/wan.md) | Wan 2.2 A14B and TI2V-5B: the official formula and vocabulary, image to video, the default negative, Lightning, NAG, template and repo settings |
| [ltx.md](./resources/ltx.md) | LTX-2.5 and LTX-2: the paragraph, sound and dialogue, multi-shot, 8n+1 frames, the enhancer, two-stage settings |
| [loras.md](./resources/loras.md) | Where trigger words come from and how far to trust each source, ComfyUI loaders, Wan high and low pairs, strength and stacking |
| [finishing.md](./resources/finishing.md) | RIFE frame counts and the save fps, upscale models, a second pass |

| Script | What it does |
| --- | --- |
| [inspect-model.mjs](./scripts/inspect-model.mjs) | Reads a `.safetensors` header (never the weights) and the sidecar files next to it. Reports the family from the keys ComfyUI checks when it loads a file, checkpoint or LoRA, LoRA rank, v-prediction, trigger words, training tags and recommended strength, each with its source. `--rows` prints models file rows, `--json` prints everything. Node built-ins only |

## What's different

| Typical prompt enhancer | This skill |
| --- | --- |
| One style for every model | The form each model was trained on, taken from the vendor's own rewriter where there is one |
| Adds detail freely | Keeps your idea, adds only what the model needs, and includes a minimal version as the control |
| Writes a negative every time | Writes one only when CFG uses it, and says "none" at CFG 1 |
| Uses `(word:1.2)` everywhere | Weights only on SDXL tag models. On FLUX.2, Qwen-Image, Krea 2 and LTX-2, ComfyUI passes them through as text |
| Guesses the model from the file name | Reads the file: the keys ComfyUI checks, the metadata, the sidecars |
| Guesses trigger words | Reads them from the metadata and sidecars, says where each came from, or asks |
| Says "use CLIP skip 2" | ComfyUI's SDXL default already is CLIP skip 2. The CLIP Set Last Layer node's default of -1 undoes it |

Checked sources are in [SOURCES.md](./SOURCES.md).

## License

[MIT](../../LICENSE)
