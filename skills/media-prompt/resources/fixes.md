# When it breaks

What to do when a result comes back wrong. Each row gives the likely cause and the fixes, cheapest first. Change one thing at a time, with the seed fixed, so you can tell what helped ([pipelines.md](./pipelines.md#seeds-and-takes)).

## Contents

- [Video](#video)
- [Edits](#edits)
- [The rendered look](#the-rendered-look)
- [Checking what went wrong](#checking-what-went-wrong)

## Video

| What you see | Likely cause | Fixes, cheapest first |
| --- | --- | --- |
| A small object splits, doubles or melts as it moves: an open lid becomes a second face, a chain tangles | A part the model can't track: a hinge, an open lid, a thin chain, or a prop that passes between two hands | Reroll. Make the object simple in the start frame with one edit (closed, held in one hand). Give the end state as a last frame ([wan.md](./wan.md#camera-control-and-first-and-last-frame)). Render larger, so the object has more pixels |
| A thin straight thing bends: a sword, a pole, a cane | Few pixels across, and nothing in the prompt says it stays rigid | Name it as solid and whole in the prompt ("the blade stays straight"), in positive words. Reroll. Give an end frame |
| The action finishes in the first second or two, then the clip holds still | The Lightning LoRAs reduce motion (ComfyUI's Wan 2.2 template notes), and one short action does not fill 5 seconds | Add a second beat ("then he slowly lowers it"). Use slower adverbs. Run the full-step path without Lightning |
| Faces, eyes, clothes or textures drift | Small changes build up over the clip | Reroll. Keep the motion small. For a fixed end state, a last frame |
| The character turns into someone else | A big turn, a hand passing over the face, the face leaving the frame | Smaller motion, a shorter move, or a last frame of the same character |
| The camera ignores the move | Two moves asked for, or a move too long for the clip | One move, said once, with where it ends ([camera.md](./camera.md#camera-movement)) |

## Edits

| What you see | Likely cause | Fixes |
| --- | --- | --- |
| A big zoom-out or reframe loses the character and looks generic | The kept part shrinks to a few pixels and the model invents the rest | Step out about 2× at a time with the fixed outpaint wording ([qwen-image-edit.md](./qwen-image-edit.md#write-the-instruction)). Or make the new framing as its own picture and bring the character in as `picture 2`. The multi-angles LoRA's widest framing is a wide shot ([qwen-image-edit.md](./qwen-image-edit.md#camera-angles-on-2511)) |
| Fine detail (a face, a mask, a logo) is mush in a full-body picture | Too few pixels for it at this size | A [detail pass](./pipelines.md#detail-pass) |
| Part of the instruction was ignored | Several changes in one instruction | One change per pass, as Qwen's edit rewriter asks |
| A second character grabs its own copy of a prop, or the wrong one moves | Interactions between characters are hard for edit and image models alike | Build in layers ([pipelines.md](./pipelines.md#build-in-layers)), then a fix pass naming the picture and the part: `Remove the sword from the creature's right hand.` |
| The background was replaced | The instruction did not say what stays | End with what stays the same, as ComfyUI's 2.1 example does |

## The rendered look

The glossy, evenly lit, oversaturated "AI" look has a few common causes.

| Cause | Fix |
| --- | --- |
| Quality and mood words: "masterpiece", "epic", "cinematic", "8k" | Drop them. BFL's guide says they add little, and Qwen-Image 2.1's rewriter strips them ([camera.md](./camera.md#stills-camera-lens-and-film)) |
| No real medium or camera named | Name what records the picture: a film still, a photograph and its lens and light, or a painting medium. Fantasy subjects can be written as practical costumes, puppets or miniatures on a real set |
| Light from everywhere | One light source, with its direction and softness ([camera.md](./camera.md#light)) |
| Characters posed facing the camera | Give them an action and a direction to look: at each other, at the task |
| Too many effects at once | One realism cue, one or two effects ([camera.md](./camera.md#stills-camera-lens-and-film)) |
| The model's own default | On Qwen-Image 2512, keep its card's negative, which names the AI look ([qwen-image.md](./qwen-image.md#negative-prompt)). Or [refine with a second model](./pipelines.md#refine-with-a-second-model) |

## Checking what went wrong

- **The user can't share the result.** Outputs are often private. Ask what is in the picture and what went wrong, and work from that. A description such as "the lid splits at about one second" is enough to pick a fix.
- **Claude can't watch video.** With the user's OK, pull a strip of frames and look at that:

  ```bash
  ffmpeg -i clip.mp4 -vf "select='not(mod(n\,16))',scale=360:-1,tile=6x1" -frames:v 1 -fps_mode vfr strip.png
  ```

  That takes every 16th frame (once a second at 16 fps) into one image. Crop to the problem area to see small objects. `-vsync` was removed from recent ffmpeg; `-fps_mode` replaces it. Delete the frames afterwards.
