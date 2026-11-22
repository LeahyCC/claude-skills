---
name: media-prompt
description: >
  Turns a plain-words idea into a ready-to-paste prompt and ComfyUI settings
  for local image and video models: FLUX.2 [dev] and [klein], FLUX.1
  finetunes, Krea 2, Qwen-Image and Qwen-Image-Edit (2509, 2511, 2.1), SDXL
  tag models (Pony V6, NoobAI, Illustrious), Wan 2.2 and LTX-2.5, plus LoRA
  trigger words, upscaling and frame interpolation. Writes the form each model
  was trained on (tags, sentences, an edit instruction, a motion paragraph with
  sound), a negative prompt only when CFG uses one, and steps, CFG, size and
  frame count. A bundled script reads a .safetensors header to tell what a
  checkpoint or LoRA is built on and what its trigger words are. Use when the
  user wants an image or video prompt for ComfyUI, Forge or SwarmUI, asks what
  settings or trigger words a checkpoint or LoRA needs, or says a prompt is not
  working. Not for hosted tools such as Midjourney, DALL-E or Sora, and not for
  building ComfyUI workflows or custom nodes.
---

# Media prompt

The user describes what they want in plain words. This skill finds the model, writes the prompt in the form that model was trained on, and hands back the settings.

**Keep the idea, fill the gaps.** Every subject, action, place and style the user named stays, in their words where the model's form allows. Add only what that model needs and the user left out. The vendors' own rewriters say the same: Krea's tells its LLM not to add "new objects, props, characters, or animals", and Lightricks says LTX's enhancer helps least when a prompt already follows its guide.

Sources checked: [SOURCES.md](SOURCES.md)

## Pick the file

| Model | The prompt is | Negative prompt | Read |
| --- | --- | --- | --- |
| FLUX.2 [dev], FLUX.2 [klein] 4B and 9B, FLUX.1 [dev] and its finetunes | Sentences | None, except on [klein] base | [flux.md](./resources/flux.md) |
| Krea 2, and checkpoints built on it | Long sentences | None on Turbo | [krea2.md](./resources/krea2.md) |
| Qwen-Image, 2512 and 2.1 | Sentences, words to draw in quotes | At CFG 4. None at CFG 1 (Lightning, 2.1) | [qwen-image.md](./resources/qwen-image.md) |
| Qwen-Image-Edit, 2509, 2511, and 2.1 edits | One edit instruction | At CFG 4. None at CFG 1 (Lightning, 2.1) | [qwen-image-edit.md](./resources/qwen-image-edit.md) |
| Pony V6, NoobAI, Illustrious and other SDXL checkpoints | Tags | Yes | [sdxl-tags.md](./resources/sdxl-tags.md) |
| Wan 2.2 T2V-A14B, I2V-A14B, TI2V-5B | A paragraph about motion | At CFG 3.5 or 5. None with a Lightning LoRA | [wan.md](./resources/wan.md) |
| LTX-2.5 and LTX-2 | One paragraph in time order, with sound | On dev. None on distilled | [ltx.md](./resources/ltx.md) |
| A LoRA on any of these | Its trigger words, at a strength | | [loras.md](./resources/loras.md) |
| Upscaling, frame interpolation | No prompt, settings only | | [finishing.md](./resources/finishing.md) |

Not covered: Pony V7 (AuraFlow), Chroma, Z-Image, HiDream, HunyuanVideo, SD 1.5, SD 3.5, FLUX 3, and Wan 2.5 and later (hosted only). For those, say so, write plain sentences, and mark the settings as unchecked.

## Steps

1. **Find the model.** Stop at the first source that answers:
   - the user's models file, `~/.claude/media-prompt/models.md` ([format below](#your-models-file))
   - the file itself: `node scripts/inspect-model.mjs <path>`. It reads the header, never the weights, and says where each answer came from. A line marked "hint" is a guess from the file name.
   - the checkpoint's model page (Civitai's "Base Model" field)
   - ask, once, with the likely families as options

   A checkpoint's name is not enough. One name is used for checkpoints on FLUX.1, Pony and Illustrious, and one checkpoint line moved from SDXL to Krea 2 at version 10.
2. **Find the job:** text to image, edit an image, text to video, image to video, or finishing. For an edit or image to video, ask for the image if it is not attached, look at it, and write only what changes.
3. **Read that one resource file.** Do not load the others.
4. **Ask only what would change the prompt.** At most two questions, usually none. Take the rest from the file's defaults and say which defaults you used.
5. **Write the prompt** by the rules below.
6. **Hand back the output block**, then stop. Offer one next change ("more motion", "closer crop"), not a menu.

## Rules

| Do | Don't |
| --- | --- |
| Keep the user's subjects, actions, places, style, and any words to draw | Swap their words for synonyms, or improve the idea |
| Add what the family file lists as needed and missing | Add people, props, events or on-screen text nobody asked for |
| Use the quality words the model's authors publish (Pony's score string, NoobAI's quality tags) | Paste "masterpiece, 8k, ultra detailed" onto a sentence model |
| Name what should be there | Write negations ("no hat") in the prompt. Qwen's Chinese rewriter rules ban negation words in rewrites |
| Write a negative only when CFG is above 1 | Write one that ComfyUI will skip: at CFG 1 it never runs the negative |
| Use `(word:1.2)` weights in SDXL tag prompts only | Use them on FLUX.2, Qwen-Image, Krea 2 or LTX-2. ComfyUI turns weighting off for those encoders, so the brackets reach the model as text |
| For an edit or image to video, describe the change | Describe what the image already shows |
| Match the length the family file gives | Pad to a word count |

## Output

Always this shape:

```text
Model: <family and variant>, from <the models file | inspect-model.mjs | the user>

Prompt:
<ready to paste>

Negative: <the negative prompt> | none: <why, for example "CFG is 1, so ComfyUI skips it">

Settings: <width>×<height>, <frames> frames at <fps> fps (video only), steps <n>, cfg <n>, <sampler>, <scheduler>, <shift or guidance>
LoRAs: <file> at <strength>, trigger "<words>" | none

Minimal version (the user's words in this model's form, nothing added):
<prompt>
```

The minimal version is the control. If it beats the full prompt, the additions were wrong for this idea: say so, and stay closer to it next time. Finishing jobs get Settings only.

## Your models file

`~/.claude/media-prompt/models.md` (on Windows, `%USERPROFILE%\.claude\media-prompt\models.md`) lists the user's own checkpoints and LoRAs:

```markdown
| File | Kind | Family | Trigger | Strength | Notes |
| --- | --- | --- | --- | --- | --- |
```

Read it at step 1 if it exists. When a new file is identified, offer to add its row. `node scripts/inspect-model.mjs <folder> --rows` prints rows in this format for a whole models folder.

The file lives outside every repository because it names the user's own models. Never copy it, or the model names in it, into a repository, commit, pull request or issue.

## Limits

These hold for every model, LoRA and request:

- Nothing sexual or suggestive involving anyone under 18, or anyone who looks or is described as under 18. Anime and tag models often draw adults young, so when content is suggestive, say the characters are adults (`adult`, `mature female`, `mature male`) and leave out child-coded tags.
- No sexual or nude images of a real, identifiable person, and no realistic fakes of a real person doing something they did not do.
- No sexual content that shows non-consent.

Decline these whatever the framing.

## Checklist

- [ ] The model came from the models file, the script or the user, not from the file name alone
- [ ] Every part of the user's idea is in the prompt, and nothing new was invented
- [ ] The form matches the family: tags, sentences, an edit instruction, or a paragraph
- [ ] Negative says "none" and why whenever CFG is 1
- [ ] No weight brackets outside SDXL tag prompts
- [ ] Sizes and frame counts follow the family's rule (multiples of 16 or 32, 4n+1 or 8n+1 frames)
- [ ] LoRA triggers came from the models file, the script or the user
- [ ] The minimal version is there
- [ ] The limits hold
