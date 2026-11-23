---
name: media-plan
description: >
  Plans a short AI video from a plain idea before any prompt is written:
  three loglines when the idea is only a mood, story beats sized to the
  length (a hook, a turn, a payoff), a script with action, dialogue and
  voiceover, a shot list (seconds, framing, one camera move, lens, light,
  what changes, sound, and which model makes it), a look bible (character
  sheet, palette, light, medium, one impossible effect), the order to make
  everything in with the risky shots marked, and one hand-off line per shot
  for media-prompt, which writes each model prompt and its ComfyUI settings.
  Plans within what local models make: Wan 2.2 at about 5 seconds and one
  move a shot, LTX-2.5 with its own sound, Krea 2 and Qwen stills, one
  master still for every character. Use when the user has an idea for a
  reel, short, music video or short film made with AI and wants a story,
  script, storyboard, shot list or production plan. Not for a single prompt
  (media-prompt), a live-action shoot, or hosted video tools.
---

# Media plan

The user gives an idea in plain words. This skill plans the piece: story, script, shots, look, the order to make it in, and a ready request to `/media-prompt` for each shot. media-prompt then writes each prompt and its settings.

```text
idea ──> media-plan ──> loglines, beats, script, shot list,
                        look bible, order, hand-off lines
                              │ one line per shot
                              ▼
                        media-prompt ──> prompt + ComfyUI settings
```

**Plan only what the models can make.** Every shot fits one generation. A beat that needs more is split, or flagged.

**Keep it short and visual.** Tables and small diagrams, plain words. A film term appears once with what it does on screen. Never an em dash.

Sources checked: [SOURCES.md](SOURCES.md)

## Read

| Part of the plan | Read |
| --- | --- |
| Loglines, beats, the hook, the script, how many words fit | [story.md](./resources/story.md) |
| Shot sizes, the 180-degree line, match cuts, lenses, 9:16 framing, the shot list | [shots.md](./resources/shots.md) |
| Motivated light, key and rim, light that matches across cuts, the look bible | [lighting.md](./resources/lighting.md) |
| Voice, effects, ambience, music, ElevenLabs, sound across cuts, lip sync | [sound.md](./resources/sound.md) |
| Which model makes each shot, the order, risky shots, gaps, hand-off lines | [production.md](./resources/production.md) |

Read all five for a full plan. For one part ("just the shot list"), read that file and production.md.

## What the models can make

| Model | One generation | Notes |
| --- | --- | --- |
| Krea 2 Turbo | A still | The default for stills: looked the most real in real runs |
| Qwen-Image 2512, then a Krea 2 refine | A still | Busy action, big scale, exact layout |
| Qwen-Image-Edit 2511 | One change to a still | Most stills after the master. New angles with the multi-angles LoRA |
| Wan 2.2 I2V | About 5 s, no sound | **One camera move and one change** |
| LTX-2.5 | Up to about 10 s, with its own sound and voice | Two to four beats. **Cannot lip sync to a supplied voice file** |
| Wan 2.2 S2V, InfiniteTalk | Lip sync to a voice file | **Not installed yet.** Flag it, never plan around it silently |

- **Consistent characters:** one master still; every other still is an edit of it, the layers for two characters touching included. The only fresh still after the master is one wider than the master, written in the look bible's full words.
- **Small hinged props** (an open pocket watch) break in motion. Close or simplify them in the still.
- **Words on screen** go in the edit, not the video.

## Steps

1. **Read the idea.** Take length and platform if given. Otherwise: a 20 s, 9:16 reel. Ask at most one question, and only if the answer changes the story.
2. **Loglines.** Only a mood or one image: three loglines, one line each, then stop and let the user pick. Characters and a conflict given: one logline ([story.md](./resources/story.md#loglines)).
3. **Beats** sized to the length: a hook in the first 1 to 2 s, a turn, a payoff. 15 to 30 s is 3 to 6 shots.
4. **Script:** action lines, then each voice line in quotes with who speaks and how. Mark V.O. or O.S. when no mouth is on screen.
5. **Shot list:** one row per shot, every column filled, every shot within its model's length.
6. **Look bible:** what must stay the same. Each character gets full words and one short name; then the place, palette, light and medium ([lighting.md](./resources/lighting.md#the-look-bible)).
7. **Production order:** voice draft, master still, edited stills, video per shot (risky first), final voice and lip sync, sound, finish. Mark risky shots with their takes. List the gaps.
8. **Hand-off:** one `/media-prompt` line for the master, then one per shot. Offer one next change ("a faster cut", "a darker ending"), not a menu.

## Rules

| Do | Don't |
| --- | --- |
| Keep the user's subjects, places and tone | Add characters or subplots they didn't ask for |
| One move and one change per Wan shot | Two moves, or a shot longer than its model makes |
| Make the master the widest shot, and crop in | Plan a still wider than the master as an edit of it |
| Put the look bible's full words in every fresh still: the master, and a still wider than the master (the only fresh still after it) | Describe a character in new words each shot |
| In edits and video, use each character's short name, the same every time, and write only the change | Describe the picture again: media-prompt's edit and image-to-video rules forbid it |
| When a line states the light, use the look bible's Light words unchanged | Reword the light from shot to shot |
| Plan ElevenLabs lines as voiceover, or a hidden mouth, until lip sync is installed | Plan a mouth speaking an ElevenLabs file on LTX-2.5 |
| Name light by source and side ("low sun from the left") | Write "cinematic", "epic", "dramatic lighting" |
| Mark risky shots and how many takes | Treat every shot as one take |
| Say what is preference | Present a rule of thumb as a platform rule |

## Output

Always this shape, each part short:

```text
Logline: <one sentence>  (or three to pick from, then stop)
Length: <n> s, <platform and aspect>

Beats
<hook, turn, payoff, one line each, with the shot numbers>

Script
<numbered to match the shots>

Shot list
| # | Sec | Framing | Move | Lens | Light | Change | Sound | Route |

Look bible
| Line | Short name | Full words |

Production order
<numbered steps, risky shots marked with takes>
Gaps: <each gap and the shot it affects> | none

Hand-off
/media-prompt <model>, <job>, from <input>: <idea>
```

## Worked example

The user: "rust giant vs bloom giant, 20 second reel".

The idea has two characters and a conflict, so one logline. Turn chosen: the bloom giant wins without fighting.

### Plan

Logline: A giant of moss and branches must stop a rust giant crushing the last green valley, and wins without throwing a punch.
Length: 20 s, 9:16 reel.

| Beat | Shot | What happens |
| --- | --- | --- |
| Hook | 1 | An iron foot slams into the wheat and the wheat rusts |
| Setup | 2 | The bloom giant rises from the forest |
| Turn | 3 | It catches the punch instead of hitting back |
| Payoff | 4 | The rust giant kneels and flowers open across it until it is a hill |

### Script

```text
1. EXT. WHEAT VALLEY, DAWN
An iron foot the size of a church slams into the wheat. Rust spreads out through the stalks in a ring.
NARRATOR (V.O., old woman, low and calm, close to the mic): "It came for the last green valley."

2. The bloom giant rises out of the forest. Birds burst from its shoulders.

3. The rust giant swings. The bloom giant catches the iron fist in both hands. Vines climb the iron arm.
NARRATOR (V.O.): "She didn't fight back."

4. The rust giant sinks to one knee. Flowers open across its back and shoulders until it is a green hill.
NARRATOR (V.O.): "She gave it roots."
```

### Shot list

| # | Sec | Framing | Move | Lens | Light | Change | Sound | Route |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 4 | Low angle from the wheat, re-angled from the master | Static | 24mm | Look bible light | The iron foot lands at 1 s; the wheat browns to rust in a ring | Iron boom, wind; VO 1 | Edit of the master, Wan 2.2 I2V |
| 2 | 4 | Full shot of the bloom giant, cropped from the master, farmhouse small in front | Slow tilt up | 85mm, from far back | Look bible light, rim light on the moss | It stands up; birds lift off its shoulders | Wood creak, birds | Edit of the master, Wan 2.2 I2V |
| 3 | 5 | Medium two-shot, side on | Static | 50mm | Look bible light | The bloom giant catches the fist; vines climb the iron arm | Metal groan, rustling vines; VO 2 | Layers, Wan 2.2 I2V full 20 steps. **Risky** |
| 4 | 7 | High angle, a closer crop of the master | Slow pull back, ending at the master's framing | 35mm | Look bible light | The rust giant kneels, then flowers open across it | LTX ambience: wind settles, birdsong; VO 3 | Edit of the master, LTX-2.5 I2V |

### Look bible

The fresh still (here only the master) carries the full words. Edits and video use the short name and the change. Any line that states the light uses the Light words as written.

| Line | Short name | Full words |
| --- | --- | --- |
| Character | the rust giant | a giant of riveted iron plates flaking orange rust, a dented bucket-shaped head with two dark eye slits |
| Character | the bloom giant | a giant woven from mossy oak branches, white and yellow wildflowers along its shoulders, a bark face with two knot-hole eyes |
| Place | | a narrow wheat valley at dawn with one small stone farmhouse, forest on the right slope |
| Palette | | rust orange, moss green, wheat gold, pale grey sky |
| Light | | low dawn sun from screen left through haze, hard and warm |
| Medium | | 35mm film still, Kodak Portra 400, natural grain |
| Effect | | flowers and vines grow over iron at time-lapse speed, shots 3 and 4 only |
| Screen direction | | the rust giant on the left facing right, the bloom giant on the right facing left, camera on the farmhouse side |

### Order

1. **Voice draft:** the three narrator lines in ElevenLabs. VO 1 must fit inside shot 1's 4 s.
2. **Master:** the widest shot, a high-angle wide of the valley with both giants apart. Qwen 2512 for the scale and layout, then a Krea 2 refine. 4 takes, pick one.
3. **Stills:** 1, 2 and 4 are edits of the master, each closer than it; shot 4 starts on a closer crop so its pull back ends at the master's framing. 3 is built in layers: each giant isolated from the master in its own edit, then the two combined with the fist caught. **Risky, 6 takes.**
4. **Video:** shot 3 first (two characters touching, 6 takes, no Lightning), then 4 (4 takes), then 1 and 2 (3 takes each).
5. **Final voice and sound:** narrator lines, effects from ElevenLabs sound effects, LTX's ambience under shot 4.
6. **Finish:** Wan's 16 fps clips interpolated ×2, one delivery rate, an upscale, captions above the bottom band.

Gaps: none. The narrator is never on screen, so no lip sync.

### Hand-off

```text
/media-prompt Qwen-Image 2512, text to image, then a Krea 2 Turbo refine, the master: 9:16, a high-angle wide view of a narrow wheat valley at dawn with one small stone farmhouse, forest on the right slope; on the left the rust giant, a giant of riveted iron plates flaking orange rust, a dented bucket-shaped head with two dark eye slits, faces right; on the right the bloom giant, a giant woven from mossy oak branches, white and yellow wildflowers along its shoulders, a bark face with two knot-hole eyes, crouches at the forest edge facing left; low dawn sun from screen left through haze, hard and warm; 35mm film still, Kodak Portra 400, natural grain
/media-prompt Shot 1, Qwen-Image-Edit 2511 edit of the master, then Wan 2.2 I2V-A14B: re-angle to a low view from inside the wheat, close on the rust giant's iron foot lifted above the stalks; then the foot slams into the wheat at 1 s and the stalks brown to rust in a ring; static camera, 24mm, low dawn sun from screen left through haze, hard and warm; 3 takes
/media-prompt Shot 2, Qwen-Image-Edit 2511 edit of the master, then Wan 2.2 I2V-A14B: crop in to a full shot of the bloom giant crouched at the forest edge, the farmhouse small in front, as if from far back on an 85mm lens; then the bloom giant stands up as birds lift off its shoulders; slow tilt up; low dawn sun from screen left through haze, hard and warm, rim light on the moss; 3 takes
/media-prompt Shot 3 layer A, risky, Qwen-Image-Edit 2511 edit of the master: keep only the rust giant, turned side on facing right with its right fist thrown forward, on bare ground; keep its look unchanged
/media-prompt Shot 3 layer B, risky, Qwen-Image-Edit 2511 edit of the master: keep only the bloom giant, turned side on facing left with both hands raised, on bare ground; keep its look unchanged
/media-prompt Shot 3, risky, Qwen-Image-Edit 2511 multi-image edit from layer A, layer B and the master, then Wan 2.2 I2V-A14B on the full 20-step path: a medium two-shot side on in the valley, the rust giant on the left, the bloom giant on the right holding the rust giant's iron fist in both hands; then green vines climb slowly up the iron arm; static camera, 50mm, low dawn sun from screen left through haze, hard and warm; 6 takes
/media-prompt Shot 4, Qwen-Image-Edit 2511 edits of the master, then LTX-2.5 image to video, 7 s: a closer high-angle crop of the master, the bloom giant standing beside the rust giant, green vines on the rust giant's right arm; the rust giant slowly kneels, then white and yellow flowers open across its back until it is a green hill; the camera pulls back slowly to the master's framing; low dawn sun from screen left through haze, hard and warm; only wind settling and birdsong; 4 takes
```

## Limits

These hold for every plan, as in media-prompt's Limits:

- Characters are fictional. No real, identifiable person, and no realistic fakes of a real person.
- Nothing sexual or suggestive involving anyone under 18 or who looks it. Anything suggestive involves adults only, stated as adults.
- No sexual content that shows non-consent.

Decline these whatever the framing.

## Checklist

- [ ] Three loglines only for a mood or one image, and the plan stops for the pick
- [ ] The hook is the first shot and lands in its first 1 to 2 s
- [ ] Every Wan shot is 5 s or less with one move and one change; every LTX shot is up to about 10 s with 2 to 4 beats
- [ ] The shot seconds add up to the length
- [ ] Every still after the master is an edit of it, layers included; the only fresh still after it is one wider than the master; the master is the widest shot
- [ ] Fresh stills carry the look bible's full words; edits and video use the same short names and only the change; stated light is the Light words unchanged
- [ ] One light source and side, the same in every shot unless a shot changes it on purpose
- [ ] Each voice line says who speaks and how, and whether a mouth is on screen
- [ ] Risky shots are marked with takes; gaps are listed at the shot they affect
- [ ] One hand-off line for the master and one per shot
- [ ] No em dashes; the limits hold
