# LTX-2.5

Lightricks' LTX-2.5 (August 2026, 22B, open weights) and LTX-2 (19B). Both make video and its sound together, from text or from an image. LTX-2.5 adds native multi-shot clips, a new text encoder (Gemma 4 12B) and an optional prompt enhancer.

## Contents

- [Write the prompt](#write-the-prompt)
- [Sound and dialogue](#sound-and-dialogue)
- [Several shots](#several-shots)
- [Image to video](#image-to-video)
- [Camera control and speed](#camera-control-and-speed)
- [Negative prompt](#negative-prompt)
- [Frames, size, fps](#frames-size-fps)
- [Settings](#settings)
- [FAIL and PASS](#fail-and-pass)

## Write the prompt

From Lightricks' prompting guide:

- **One flowing paragraph, present tense, about 4 to 8 sentences.** Lead with the shot or the main action.
- **Then the parts in this order:** the scene, the action, the characters, the camera, the sound.
- **Emotion through the body.** The guide: express emotion "through physical cues, not abstract labels". "Her jaw tightens and she looks away", not "she is angry".
- **Camera movement relative to the subject,** and what is seen after the move: "the camera circles around him until the city skyline is behind him". The guide's words: follows, tracks, pans across, circles around, tilts upward, pushes in, pulls back, overhead view, handheld movement, over-the-shoulder, wide establishing shot, static frame.
- **One move per shot,** and say where the subject ends up. Lightricks' camera blog: a move the clip is too short for gets cut off, not slowed down.
- **The guide's other terms,** one list for LTX-2 and 2.5: pacing (slow motion, time-lapse, lingering shot, continuous shot, freeze-frame, fade-in, fade-out, seamless transition, sudden stop), film characteristics (film grain, lens flares, pixelated edges, jittery stop-motion), visual effects (particle systems, motion blur, depth of field), and styles from claymation and hand-drawn to film noir, surreal and experimental film.
- **One light source,** kept consistent.
- **Avoid:** numbered shot lists, abstract emotion words, mixed light sources, crowded frames, on-screen text, complex physics, and prompts written for other video models pasted in unchanged.
- **No `(word:1.2)` weights.** ComfyUI turns weighting off for LTX-2's Gemma encoders, so the brackets reach the model as text.
- **Turn the prompt enhancer off** for a prompt written with this skill. Lightricks recommends the enhancer for prompts that are "short, rough", or written for another model. It adds a minute or two, and off is how a prompt runs exactly as written. Lightricks' docs and ComfyUI's docs disagree on whether the template starts with it on, so check the toggle.

## Sound and dialogue

- Describe the ambience, the music, sound effects, speech or singing, in the paragraph where they happen.
- **Spoken words go in double quotes.** Say who speaks and how: voice, tone, and the language or accent if it matters.
- Keep dialogue that must stay lip-synced inside one shot.
- **The voice is generated, not supplied.** ComfyUI's LTX-2.5 templates (text to video, image to video, first and last frame, DFR) all generate their audio; none takes an audio file. Custom-audio lip sync on LTX-2.5 exists only as community workflows, with mixed reports. For a voice file you already have, use Wan 2.2 S2V or InfiniteTalk ([wan.md](./wan.md#your-own-audio-lip-sync)).

Black Forest Labs' audio guide for FLUX 3 Video, a hosted model that also makes sound, covers what Lightricks' guide leaves out. Treat it as a starting point on LTX, not as documented LTX behaviour:

- **Four layers; use only the ones the scene needs.** Speech, ambience (the place), effects tied to something visible ("the mug clicks against the saucer"), and music, with its style and where it sits in the mix.
- **Name the source, not the mood.** "Rain ticking on a metal awning, distant traffic" gives the model more than "moody ambience".
- **Ask for a sound, not for silence.** BFL warns that quiet room tone can come out as static or dead air. Name something soft and concrete, such as rain on the window or a low piano.
- **Off-screen speech is a "voiceover".** On FLUX 3, a quoted line with no visible speaker and no voiceover cue can turn into on-screen text.
- **Direct a voice with anchors:** age and accent when they matter, register (low, bright, rough), how it is recorded (close and dry, a phone speaker, across the room), and the delivery (hesitant, lightly amused). "Professional" and "engaging" give a stock announcer read.
- **Keep other voices out from under a line.** Crowd chatter or a radio fights the speech. Weather, machines and footsteps don't.
- **Leave room for the line.** A short line in a longer clip is safer than words written to fill every second. If the last word is cut off, shorten the line.

## Several shots

LTX-2.5 makes multi-shot clips natively:

- **2 to 4 shots, in one paragraph, in time order.**
- **Name each cut in words:** "Cut to a close-up of her hands on the steering wheel." Lightricks names hard cuts, match cuts and dissolves.
- **Name the people again after each cut.** Don't rely on "she".
- **Say whether the sound carries across the cut.**
- **Write pauses in** ("she pauses", "a beat of silence"). Lightricks says LTX-2.5's duration predictor does not add them on its own.
- Image to video stays one take.
- Longer scenes can use screenplay form: scene headers, character names and quoted lines.

## Image to video

Describe the motion, the camera and the sound. The picture already shows the scene, so do not describe it again.

**Two images.** Lightricks' docs give the first and last frame template (`video_ltx2_5_flf2v`) three uses: transitions, morphing between subjects or scenes, and camera moves with a fixed destination. The template guides the first and the last frame with the two images at strength 0.7, and its example prompt names the start image as the first frame and the end image as the last.

## Camera control and speed

- **Camera LoRAs are for LTX-2 only.** Lightricks' seven camera LoRAs (dolly in, dolly out, dolly left, dolly right, jib up, jib down, static; `Lightricks/LTX-2-19b-LoRA-Camera-Control-<Move>`) were trained on the 19B LTX-2. They load with LoraLoaderModelOnly at 1.0 and have no trigger word; their cards say to describe where the move ends. Lightricks publishes none for LTX-2.3 or LTX-2.5, and the LTX-2 README says a LoRA works only with the model it was trained for.
- **An exact camera path on LTX-2.5:** the Layout-To-Render IC-LoRA (`Lightricks/LTX-2.5-22b-IC-LoRA-Layout-To-Render`, strength 1.0) follows the camera path and framing of a rough layout video. Don't also describe the move in the prompt.
- **Slow motion on LTX-2.5 image to video:** the Slow-Motion-Control LoRA (`Lightricks/LTX-2.5-22b-LoRA-Slow-Motion-Control`, strength 1.0) with Lightricks' `LTX-2.5_I2V_Speed_Control_flow.json`, whose speed setting runs from 1.0 down to 0.025 while playback stays at 24 fps. Leave "slow motion" and other speed words out of the prompt.
- **Dolly zoom and crane-and-tilt** are "stress cases" in Lightricks' camera blog, not moves it expects to work every time.

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
