# LTX-2.5

Lightricks' LTX-2.5 (August 2026, 22B, open weights) and LTX-2 (19B). Both make video and its sound together, from text or from an image. LTX-2.5 adds native multi-shot clips, a new text encoder (Gemma 4 12B) and an optional prompt enhancer.

## Contents

- [Write the prompt](#write-the-prompt)
- [Sound and dialogue](#sound-and-dialogue)
- [Several shots](#several-shots)
- [Image to video](#image-to-video)
- [Negative prompt](#negative-prompt)
- [Frames, size, fps](#frames-size-fps)
- [Settings](#settings)
- [FAIL and PASS](#fail-and-pass)

## Write the prompt

From Lightricks' prompting guide:

- **One flowing paragraph, present tense, about 4 to 8 sentences.** Lead with the shot or the main action.
- **Then the parts in this order:** the scene, the action, the characters, the camera, the sound.
- **Emotion through the body.** The guide: express emotion "through physical cues, not abstract labels". "Her jaw tightens and she looks away", not "she is angry".
- **Camera movement relative to the subject,** and what is seen after the move: "the camera circles around him until the city skyline is behind him". The guide's words: follows, tracks, pans across, circles around, pushes in, pulls back, handheld, over-the-shoulder, static frame.
- **One light source,** kept consistent.
- **Avoid:** numbered shot lists, abstract emotion words, mixed light sources, crowded frames, on-screen text, complex physics, and prompts written for other video models pasted in unchanged.
- **No `(word:1.2)` weights.** ComfyUI turns weighting off for LTX-2's Gemma encoders, so the brackets reach the model as text.
- **Turn the prompt enhancer off** for a prompt written with this skill. Lightricks recommends the enhancer for prompts that are "short, rough", or written for another model. It adds a minute or two, and off is how a prompt runs exactly as written. Lightricks' docs and ComfyUI's docs disagree on whether the template starts with it on, so check the toggle.

## Sound and dialogue

- Describe the ambience, the music, sound effects, speech or singing, in the paragraph where they happen.
- **Spoken words go in double quotes.** Say who speaks and how: voice, tone, and the language or accent if it matters.
- Keep dialogue that must stay lip-synced inside one shot.

## Several shots

LTX-2.5 makes multi-shot clips natively:

- **2 to 4 shots, in one paragraph, in time order.**
- **Name each cut in words:** "Cut to a close-up of her hands on the steering wheel."
- **Name the people again after each cut.** Don't rely on "she".
- **Say whether the sound carries across the cut.**
- Longer scenes can use screenplay form: scene headers, character names and quoted lines.

## Image to video

Describe the motion, the camera and the sound. The picture already shows the scene, so do not describe it again.

## Negative prompt

| Setup | Negative |
| --- | --- |
| Distilled (the default templates), CFG 1 | The templates attach `pc game, console game, video game, cartoon, childish, ugly` automatically. At CFG 1 a negative has no effect (ComfyUI's standard guider does not even run it), so write none |
| Dev, CFG 2 to 5 | Works. The LTX-2 model card's example starts `shaky, glitchy, low quality, worst quality, deformed, distorted, disfigured, motion smear, motion artifacts` |

## Frames, size, fps

- **Frames are 8n+1** ("1 + a multiple of 8" in the docs). ComfyUI's EmptyLTXVLatentVideo steps the length by 8 from 1. Frames = 8 × round(seconds × fps ÷ 8) + 1:

  | Seconds at 24 fps | Frames |
  | --- | --- |
  | 4 | 97 frames |
  | 5 | 121 frames |
  | 10 | 241 frames |

- **Width and height in multiples of 32** (the latent node steps by 32 from 64). The DFR pipeline needs 64. 4K is 3840×2176, because 2160 is not on that grid.
- **Sizes:** the two-stage templates start at 768×512 and upscale 2× to 1536×1024. The one-stage pipeline typically runs 512×768.
- **fps:** the templates use 24. Lightricks: 24 for a film look, 25 standard, 30 for smoother motion, up to 50. Keep the fps in LTXVConditioning (its default is 25) the same as the save node's.

## Settings

| Setup | Steps | CFG | Notes |
| --- | --- | --- | --- |
| LTX-2.5 distilled, two-stage template (`video_ltx2_5_t2v`, `video_ltx2_5_i2v`) | 8, then 4 after the 2× upscale | 1 | euler_ancestral; 768×512 to 1536×1024, 97 frames, 24 fps |
| LTX-2.5 first and last frame (`video_ltx2_5_flf2v`) | one stage | 1 | No 2× upscale |
| LTX-2.5 dev | 20 to 50 | 2 to 5 | Lightricks' PyTorch API page |
| LTX-2 dev | 40 | 4 | The model card's example, at 768×512 and 121 frames |
| Image to video | | | Image strength 0.7 in stage 1, 1.0 in stage 2 |

Lightricks says the distilled model has guidance built in, so raising CFG does not help. Stay at 1 to 1.5 if experimenting.

`inspect-model.mjs` finds the LTX-2 family (2, 2.3, 2.5) by its audio layers. It cannot tell the three apart; the file name says which.

## FAIL and PASS

The user asks for "a barista making latte art, she says good morning to a customer, cosy cafe sounds", on LTX-2.5 distilled.

FAIL:

```text
Shot 1: barista. Shot 2: latte art close-up. Shot 3: she is happy and says good morning. (cozy cafe:1.3), masterpiece, 4k
```

A numbered shot list, an emotion label, a weight passed through as text, and no sound described.

PASS:

```text
A medium shot of a barista behind the counter, steadily pouring steamed milk into a cup as latte art forms in the foam. Cut to a close-up of the cup as she slides it across the counter, then back to the barista as she looks up, smiles and says in a warm, bright voice, "Good morning!" Soft morning light comes through the front window. The steady hiss of the espresso machine, the clink of cups and the low murmur of other customers fill the room, continuing across the cut.
```

```text
Negative: none: distilled runs at CFG 1
Settings: 768×512 then 2× to 1536×1024, 121 frames at 24 fps (5 s), steps 8 then 4, cfg 1, euler_ancestral, prompt enhancer off
```
