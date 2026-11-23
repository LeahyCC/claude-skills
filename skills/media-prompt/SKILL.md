---
name: media-prompt
description: >
  Turns a plain-words idea into a ready-to-paste prompt and ComfyUI settings
  for local image and video models: FLUX.2, FLUX 3 Klein, FLUX.1 finetunes,
  Krea 2, Qwen-Image and Qwen-Image-Edit, SDXL tag models (Pony V6, NoobAI,
  Illustrious), Wan 2.2 and LTX-2.5, plus LoRA triggers, upscaling,
  interpolation and lip sync to a voice file. Writes the form each model was
  trained on, a negative only when CFG uses one, and steps, CFG, size and
  frames. Directs the shot (camera, lens, light, colour, sound) and builds
  trippy effects such as a dolly zoom or morph. Plans multi-pass jobs (one
  master still, layers, a refine pass) and fixes broken results. A bundled
  script reads a model file's base and triggers. Use when the user wants an image or video prompt for
  ComfyUI, Forge or SwarmUI, wants it cinematic or trippy, asks what
  settings or triggers a model needs, or says a result is not working. Not
  for prompts for hosted tools such as Midjourney, DALL-E or Sora, or for
  building ComfyUI workflows or custom nodes.
---

# Media prompt

The user describes what they want in plain words. This skill finds the model, writes the prompt in the form that model was trained on, and hands back the settings.

**Keep the idea, fill the gaps.** Every subject, action, place and style the user named stays, in their words where the model's form allows. Add only what that model needs and the user left out. The vendors' own rewriters say the same: Krea's tells its LLM not to add "new objects, props, characters, or animals", and Lightricks says LTX's enhancer helps least when a prompt already follows its guide.

**Direct it when asked.** When the user wants a look (cinematic, photographic, trippy, surreal) or pastes a prompt written for a hosted model, also choose how the shot is made: framing, camera move, lens, light, colour and, on LTX-2.5, sound. Every choice serves their idea, and the minimal version still shows the idea with nothing added. See [Direct it](#direct-it).

Sources checked: [SOURCES.md](SOURCES.md)

## Pick the file

| Model | The prompt is | Negative prompt | Read |
| --- | --- | --- | --- |
| FLUX.2 [dev], FLUX.2 [klein] 4B and 9B, FLUX.1 [dev] and its finetunes | Sentences | None, except on [klein] base | [flux.md](./resources/flux.md) |
| FLUX 3 Image Klein and Klein Base | A short request for its prompt upsampler, or the full caption the upsampler would write | None on Klein (CFG 1). Empty on Base | [flux3-klein.md](./resources/flux3-klein.md) |
| Krea 2, and checkpoints built on it | Long sentences | None on Turbo | [krea2.md](./resources/krea2.md) |
| Qwen-Image, 2512 and 2.1 | Sentences, words to draw in quotes | At CFG 4. None at CFG 1 (Lightning, 2.1) | [qwen-image.md](./resources/qwen-image.md) |
| Qwen-Image-Edit, 2509, 2511, and 2.1 edits | One edit instruction | At CFG 4. None at CFG 1 (Lightning, 2.1) | [qwen-image-edit.md](./resources/qwen-image-edit.md) |
| Pony V6, NoobAI, Illustrious and other SDXL checkpoints | Tags | Yes | [sdxl-tags.md](./resources/sdxl-tags.md) |
| Wan 2.2 T2V-A14B, I2V-A14B, TI2V-5B | A paragraph about motion | At CFG 3.5 or 5. None with a Lightning LoRA | [wan.md](./resources/wan.md) |
| LTX-2.5 and LTX-2 | One paragraph in time order, with sound | On dev. None on distilled | [ltx.md](./resources/ltx.md) |
| A LoRA on any of these | Its trigger words, at a strength | | [loras.md](./resources/loras.md) |
| Upscaling, frame interpolation | No prompt, settings only | | [finishing.md](./resources/finishing.md) |
| Directing any of these: framing, camera move, lens, light, colour, a still's camera and film | The family's form, with shot words added | | [camera.md](./resources/camera.md) |
| Trippy, surreal and impossible effects: dolly zoom, morph, dissolve, time tricks, recursion | One effect, written as what happens | | [effects.md](./resources/effects.md) |
| More than one pass: shots from one master still, building in layers, a refine pass on a second model, a detail pass, seeds and takes, a hosted still as the start frame | Each pass in its own family's form | Per pass | [pipelines.md](./resources/pipelines.md) |
| A result came back wrong: an object split, motion stopped early, a reframe lost the character, the rendered look | The fix, cheapest first | | [fixes.md](./resources/fixes.md) |

Not covered: Pony V7 (AuraFlow), Chroma, Z-Image, HiDream, HunyuanVideo, SD 1.5, SD 3.5, and the hosted models: FLUX 3 Image (its open-weights Klein is covered above), FLUX 3 Video, and Wan 2.5 and later. For those, say so, write plain sentences, and mark the settings as unchecked. [camera.md](./resources/camera.md#from-a-flux-3-prompt) turns FLUX 3 Video prompts into prompts for the local video models. A still made by a hosted model can be the start frame for a local video model: write only the local video prompt ([pipelines.md](./resources/pipelines.md#a-hosted-still-as-the-start-frame)).

## Steps

1. **Find the model.** Stop at the first source that answers:
   - the user's models file, `~/.claude/media-prompt/models.md` ([format below](#your-models-file))
   - the file itself: `node scripts/inspect-model.mjs <path>`. It reads the header, never the weights, and says where each answer came from. A family marked "hint", or a row whose notes say "family from the file name only" or "a guess from the tensor names", is not settled: check the model page or ask.
   - the checkpoint's model page (Civitai's "Base Model" field)
   - ask, once, with the likely families as options

   A checkpoint's name is not enough. One name is used for checkpoints on FLUX.1, Pony and Illustrious, and one checkpoint line moved from SDXL to Krea 2 at version 10.
2. **Find the job:** text to image, edit an image, text to video, image to video, finishing, a chain of passes, or fixing a result. For an edit or image to video, ask for the image if it is not attached, look at it, and write only what changes. If the user can't share it (outputs are often private), ask what it shows and work from the description. Claude can't watch video; [fixes.md](./resources/fixes.md#checking-what-went-wrong) has a frame-strip command to use with the user's OK.
3. **Read that one family file.** If the user wants a look, also read [camera.md](./resources/camera.md), and for anything impossible [effects.md](./resources/effects.md). For a job of several passes read [pipelines.md](./resources/pipelines.md), then each pass's family file as you reach it; for a broken result read [fixes.md](./resources/fixes.md). Do not load the others.
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
| Use `(word:1.2)` weights in SDXL tag prompts only | Use them on FLUX.2, FLUX 3 Klein, Qwen-Image, Krea 2 or LTX-2. ComfyUI turns weighting off for those encoders, so the brackets reach the model as text |
| For an edit or image to video, describe the change | Describe what the image already shows |
| Match the length the family file gives | Pad to a word count |

## Direct it

Use this when the user asks for a look ("cinematic", "like a film photo", "trippy", "dreamy"), names a film technique, or pastes a prompt written for a hosted model such as FLUX 3 Video.

1. **Keep their idea.** Every subject, action and place they named stays. The look and one effect are the additions they asked for. New people, props or story beats still come only from them, or from a treatment they picked.
2. **Choose one of each:** a framing, one camera move (video), one lens or optic, one light, one colour or texture. Take the words from [camera.md](./resources/camera.md), in the model's own words where its guide has them.
3. **At most one impossible thing.** Name the effect, then write how it works: what stays fixed, what moves, what turns into what, and in what order. [effects.md](./resources/effects.md) lists the effects and the route each needs: the prompt alone, a first and last frame, camera control, or a step after generation.
4. **Only a mood, no subject** ("something trippy with jellyfish")? Offer three treatments, one line each, and write the one the user picks. On "surprise me", pick one and say which.
5. **Fit it to the model.** Wan 2.2 makes about 5 seconds: one move, one change. An LTX-2.5 clip of 5 to 10 seconds, with sound, holds two to four beats in time order. An image is one moment, so a camera move becomes a lens and an angle. Tag models get tags.

## Output

Always this shape:

```text
Model: <family and variant>, from <the models file | inspect-model.mjs | the user>

Prompt:
<ready to paste>

Negative: <the negative prompt> | none: <why, for example "CFG is 1, so ComfyUI skips it">

Settings: <width>×<height>, <frames> frames at <fps> fps (video only), steps <n>, cfg <n>, <sampler>, <scheduler>, <shift or guidance>
LoRAs: <file> at <strength>, trigger "<words>" | none
Terms: <each film term in the prompt, and what it does on screen> (only when directing)
Takes: <n> takes, seed on randomize; fix the seed before changing words (only for a risky shot)

Minimal version (the user's words in this model's form, nothing added):
<prompt>
```

The minimal version is the control. If it beats the full prompt, the additions were wrong for this idea: say so, and stay closer to it next time. Finishing jobs get Settings only. A risky shot (hands holding things, small or hinged props, two characters touching, big motion) gets the Takes line ([pipelines.md](./resources/pipelines.md#seeds-and-takes)). A job of several passes gets one output block per pass, in order, each naming what feeds it. The Terms line teaches the words: "dolly zoom: the camera pulls back while the lens zooms in, so the subject holds its size and the background swells".

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
- [ ] On FLUX 3 Klein, the upsampler is on, or the prompt is a full caption in its form (for an edit, written from the references)
- [ ] Sizes and frame counts follow the family's rule (multiples of 16 or 32, 4n+1 or 8n+1 frames)
- [ ] LoRA triggers came from the models file, the script or the user
- [ ] The minimal version is there
- [ ] When directing: one move, one lens, one light, at most one effect, each written as what happens on screen, and the length fits the model
- [ ] A risky shot says how many takes; a job of several passes has one block per pass, each naming its input
- [ ] A fix changes one thing, with the seed fixed, and starts with the cheapest route
- [ ] The limits hold
