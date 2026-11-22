# LoRAs

A LoRA adds a style, a character or a motion to a base model. The prompt needs its trigger words, if it has any, and the workflow needs it loaded at the right strength on the right model.

## Contents

- [Find the trigger](#find-the-trigger)
- [What the sources mean](#what-the-sources-mean)
- [Load it in ComfyUI](#load-it-in-comfyui)
- [Strength](#strength)

## Find the trigger

Stop at the first source that answers:

1. The user's models file, `~/.claude/media-prompt/models.md`.
2. `node scripts/inspect-model.mjs <lora>`. It reads the file's metadata and any sidecar files, and says where each trigger came from.
3. The model page's "Trigger Words".
4. Ask.

Never take a trigger from the file name. When the user gives one, offer to add it to the models file so they never have to look it up again.

## What the sources mean

| The script shows | Where it comes from | How much to trust it |
| --- | --- | --- |
| `modelspec.trigger_phrase` | ModelSpec metadata in the file. The spec: a phrase the model is "trained to heavily require" | The author's trigger. Use it exactly |
| `trainedWords` in `NAME.civitai.info` or `NAME.metadata.json` | Civitai's trigger words, saved next to the file by Civitai Helper or ComfyUI LoRA Manager | The author's trigger. Use it exactly |
| `activation text` in `NAME.json` | A1111 or Forge, set by whoever downloaded the LoRA | The user's own note |
| training folder `10_mychar` | kohya names training folders `<repeats>_<words>` and adds the words to every caption | Usually the trigger |
| training folder `1_ohwx` | ai-toolkit writes its trigger as a fake `1_<trigger>` folder, so A1111 shows it | The trigger |
| top tags, with counts | The training captions (`ss_tag_frequency`) | A tag in nearly every image works like a trigger. The rest show what the LoRA learned |
| nothing | musubi-tuner, a common trainer for Wan, Qwen-Image, FLUX.2 and Krea 2 LoRAs, saves no caption tags | Check the model page. Many style and motion LoRAs need no trigger |

Write a trigger exactly as given: same spelling, capitals and spaces.

## Load it in ComfyUI

- **LoRAs load with nodes, not prompt tags.** `<lora:name:0.8>` is A1111 and Forge syntax. ComfyUI's text encode docs cover weights, `{a|b}` choices and `embedding:` names, not LoRA tags. Without a custom node that reads them, the tag is just more words in the prompt.
- **SDXL:** LoraLoader, with a model strength and a clip strength (both default 1.0). The clip strength only does something when the LoRA trained the text encoders: in kohya files, keys that start with `lora_te`.
- **FLUX, Qwen-Image, Krea 2, Wan, LTX:** LoraLoaderModelOnly (strength_model, default 1.0). These LoRAs change the diffusion model only.
- **Wan 2.2 A14B LoRAs come in pairs.** Load the high-noise file on the high-noise model and the low-noise file on the low-noise model. `inspect-model.mjs` flags "high" or "low" from the file name, because the tensors don't say.
- **Load a LoRA only on the family it was trained for.** The script's family line and the model page say which. A Pony LoRA is SDXL, so it loads on Illustrious too, but it was trained for Pony's tags.

## Strength

- **The author's number wins.** The script shows it when a sidecar has one: A1111's `preferred weight`, LoRA Manager's `usage_tips`, or SwarmUI's `lora_default_weight`.
- **Otherwise start at 1.0,** ComfyUI's default, and lower it if the LoRA overpowers the prompt.
- **Stacked LoRAs add up.** Each one adds its change to the same weights, so two at 1.0 move the model further than one. Lower each, then raise the one that matters most.
- **A speed LoRA changes the settings.** With a Lightning or Turbo LoRA loaded, use its steps and CFG (often 4 or 8 steps at CFG 1) and drop the negative prompt, which CFG 1 skips.

In the output block, list each LoRA as `<file> at <strength>, trigger "<words>"`, and put the trigger words into the prompt the way the author's example prompts do.
