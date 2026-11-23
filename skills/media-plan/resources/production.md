# Production: routes, order and hand-off

Which model makes each shot, the order to make everything in, which shots are risky, and how each shot is handed to `media-prompt`. The routes follow media-prompt's own files (`pipelines.md`, `wan.md`, `ltx.md`, `qwen-image-edit.md`, `krea2.md`, `finishing.md`) and real runs on a local ComfyUI setup. When those files change, this one follows them.

## Contents

- [What each model can make](#what-each-model-can-make)
- [Pick the route](#pick-the-route)
- [The order](#the-order)
- [Make the master the widest shot](#make-the-master-the-widest-shot)
- [Risky shots and takes](#risky-shots-and-takes)
- [Gaps](#gaps)
- [Hand-off lines](#hand-off-lines)
- [FAIL and PASS](#fail-and-pass)

## What each model can make

| Model | One generation holds | Sound | Use it for |
| --- | --- | --- | --- |
| Krea 2 Turbo | One still | | Most stills. It looked the most real in side-by-side runs: film grain, fabric, skin |
| Qwen-Image 2512 | One still | | Busy action, big scale, an exact layout. Then a Krea 2 refine pass for the look |
| Qwen-Image 2.1 | One still | | Words drawn in the picture |
| Qwen-Image-Edit 2511 | One change to a still, or a new camera angle of it | | Every still after the master: new framing, a closed prop, a pose |
| Wan 2.2 I2V-A14B | About 5 s at 16 fps: **one camera move, one change** | None | Most shots. The best motion on the rig. Lightning is fast but calmer |
| Wan 2.2 first and last frame | About 5 s between two stills | None | A morph, or landing on an exact end view |
| LTX-2.5 | Up to about 10 s at 24 fps: **two to four beats**, in time order | Its own voice, effects and ambience | Shots where the model's own sound helps, a longer payoff, speech when the voice can be the model's |
| Wan 2.2 S2V, InfiniteTalk | A face speaking or singing to a voice file | Yours | Lip sync to an ElevenLabs file. **Not installed yet** ([Gaps](#gaps)) |

- **LTX-2.5 cannot lip sync to a supplied voice file.** Its ComfyUI templates all generate their own audio. Plan an ElevenLabs line as voiceover, or as a speaker whose mouth is not seen, unless the lip-sync gap is closed.
- **Wan 2.2 makes no sound.** Every Wan shot's sound comes from ElevenLabs, a library, or LTX ambience laid under it.
- **An image is one moment.** Stills hold no camera move.

## Pick the route

Each shot in the shot list names its route: the still and the video model.

| The shot needs | Still | Video |
| --- | --- | --- |
| The first picture of the piece | Master: Krea 2 Turbo. Busy action or big scale: Qwen 2512, then a Krea 2 refine | |
| The same characters as the master | An edit of the master in Qwen Edit 2511, never a fresh prompt | |
| A new camera angle of the same place | Qwen Edit 2511 with the multi-angles LoRA (widest framing: a wide shot) | |
| Two characters touching or fighting | Build in layers: each character an edit of the master that isolates it, then one Qwen Edit 2511 multi-image edit combines them | Wan 2.2 I2V on the full 20-step path; risky |
| One move and one change | | Wan 2.2 I2V |
| A transformation (A becomes B) | Two stills, A and B, both edits of the master | Wan 2.2 or LTX-2.5 first and last frame |
| Two to four beats in one take, or the model's own sound | | LTX-2.5 I2V |
| Several cuts in one clip with the characters held | | LTX-2.5 text to video can cut inside a clip; image to video stays one take |
| Big motion (a morph, a time-lapse, a fall) | | Wan without Lightning first: the Lightning LoRAs reduce motion |
| Speech to an ElevenLabs file, mouth on screen | | Wan 2.2 S2V or InfiniteTalk. **Gap**: flag it |
| Words on screen (titles, captions) | Add them in the editor, not in the video | |

## The order

```text
 1. voice draft    ElevenLabs, minutes: sets each shot's length
 2. master still   Krea 2 Turbo, or Qwen 2512 then a Krea refine
 3. fix master     Qwen Edit 2511, one change per pass
 4. shot stills    edits of the master, one per shot
 5. video          one clip per shot, risky shots first
 6. voice, sync    final lines, then lip sync if a mouth is on screen
 7. sound          effects, ambience, music under the voice
 8. finish         cut, frame rate, upscale, captions
```

Creators and vendors who publish their method agree on the shape: script, then references, then a shot list, then stills, then image to video with several takes each, then the edit and sound last (Curious Refuge's course, PJ Ace's breakdowns, Google Flow's tips). This order adds the voice draft at the front, because on this setup a voice file drives lip sync and each line's length sets its shot.

1. **Voice draft.** Generate the voiceover and dialogue lines first, as a rough take. Each line's real length sets its shot's length; a lip-sync model needs the audio as input anyway. Cheap to redo.
2. **Master still.** One still with every character and the place, in the look bible's words. It decides the look of everything after it: video inherits the still's look, so fix the look here.
3. **Fix the master** one change per pass: close or simplify small hinged props (an open pocket watch's lid turned into a second face in motion, and the still models drew it open even when told closed), remove extra limbs, set the light.
4. **Shot stills.** Each shot's start frame is an edit of the master, written as the change only, with each character's short name. media-prompt's edit rule is to describe only the change, and its image-to-video rule is not to describe the picture again; the master already holds the full description. BFL's and Lightricks' video guides both say to keep one fixed description, so the full words live in the look bible and go, unchanged, into every fresh still (the master, and a still wider than the master). For many angles of one character, first edit the master into a character sheet (front, side, back, close-up, as Curious Refuge teaches); Runway says one good reference is enough for most projects and a turnaround helps with varied angles. Contact between two characters: build in layers. A small soft face: a detail pass.
5. **Video, one clip per shot,** from its start frame. Make the risky shots first: if one fails, the plan changes before the easy ones are spent.
6. **Final voice and lip sync.** Regenerate any line whose timing changed. Lip sync only shots that show a speaking mouth.
7. **Sound** in layers under the voice ([sound.md](./sound.md)).
8. **Finish.** Cut, then interpolate Wan's 16 fps clips ×2 to 32 or let the editor convert to one delivery rate (24 or 30), upscale, add captions.

## Make the master the widest shot

Edits zoom in well and zoom out badly. A big zoom-out from a close-up loses the character, and the multi-angles LoRA's widest framing is a wide shot. So:

- **Make the master the widest framing the piece needs,** with every character in it.
- **Make closer shots by cropping in or re-angling the master.**
- **A shot wider than the master** is its own fresh still in the look bible's full words, with the character brought in from the master as a second picture.
- **A pull back** starts on a crop of the master and ends at its framing or closer.

## Risky shots and takes

Mark a shot risky when it has any of these. Each one came out wrong at least once in real runs or is named as hard in media-prompt's files:

| Risk | Why | Plan for it |
| --- | --- | --- |
| Hands holding things, small or hinged props | The model can't track a hinge, a lid, a chain | Close or simplify the prop in the still. 6 or more takes |
| Two characters touching | Edit and image models both lose the interaction | Build in layers. 6 or more takes |
| Big motion: a morph, a fall, a time-lapse | Lightning reduces motion; the action can finish in the first 2 s | Full 20-step path. A second beat in the prompt |
| A face that turns away, or a hand passing over it | The character can turn into someone else | Smaller motion, or a last frame of the same face |
| A move too long for the clip | It gets cut off, not slowed | One move, with where it ends |
| A thin rigid thing: a sword, a pole | It bends | Say it stays straight. An end frame |

A simple shot: 3 or 4 takes. A risky shot: 6 or more. That is a floor: PJ Ace reports 300 to 400 generations for 15 usable clips on one hosted ad. Set the seed to randomize for takes; fix it before changing words.

## Gaps

Say these in the plan, at the shot they affect. Never plan around one silently.

| Gap | Affects | Until it closes |
| --- | --- | --- |
| Lip sync to a voice file (Wan 2.2 S2V, InfiniteTalk) is not installed | Any shot that shows a mouth speaking an ElevenLabs line | Voiceover, a speaker seen from behind or far away, a mask or a hand over the mouth, or LTX-2.5's own voice with the line in quotes |
| LTX-2.5 makes a new voice each clip | Two LTX shots with the same speaker | One LTX speaking shot per character, or voiceover |
| Wan 2.2 makes no sound | Every Wan shot | Sound from ElevenLabs effects, a library, or LTX ambience |

The LTX voice row is inferred, not documented: nothing in Lightricks' docs ties a voice to a character across separate generations. Plan for it and check on the first run.

## Hand-off lines

One line per pass, ready to paste. Each names the model, the job, what feeds it, and the idea in plain words:

```text
/media-prompt <model>, <job>, from <input>: <the idea>
```

- **Job:** text to image, edit, image to video, first and last frame, refine, finishing.
- **From:** "the master", "still 3", "layer A, layer B and the master", or nothing for a fresh still.
- **The idea** carries the shot's framing, move, lens, light, change and sound from the shot list. media-prompt keeps the user's words, so the look bible's words reach the model as written.

| Line | Characters | Light |
| --- | --- | --- |
| Fresh still: the master, or a still wider than the master | The short name, then the full words: "the rust giant, a giant of riveted iron plates..." | The Light words, unchanged, plus the Medium words |
| Edit or video | The short name only ("the rust giant"), spelled the same every time, and only what changes | The Light words, unchanged, when the line states the light |

The master's line holds every character's full words, the Place, the Light and the Medium, word for word.
- **Risky shots** say so, so media-prompt adds its Takes line.
- **Gaps** stay out of hand-off lines. A shot blocked by a gap gets its fallback route instead.

## FAIL and PASS

FAIL:

```text
/media-prompt Wan: the giant fights the other giant and wins, cinematic, epic, then the camera orbits and zooms out and they become flowers
```

No still to start from, a new prompt instead of an edit of the master, three camera moves and two changes in 5 seconds, and mood words a camera can't see.

PASS:

```text
/media-prompt Wan 2.2 I2V-A14B, image to video, from still 3, risky: the bloom giant catches the rust giant's iron fist in both hands and green vines climb slowly up the iron arm; static camera, 50mm, low dawn sun from screen left through haze, hard and warm; full 20-step path, 6 takes
```

The short names stand for the full words already in still 3, and the light is the look bible's, as written.

FAIL, an image-to-video line that describes the picture again:

```text
/media-prompt Wan 2.2 I2V-A14B, image to video, from still 3: a giant of riveted iron plates flaking orange rust swings at a giant woven from mossy oak branches; low sun from the left
```
