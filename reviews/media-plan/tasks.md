# media-plan skill tasks and acceptance criteria

Written 2026-11-23, before any model run. Run each prompt against Claude with the skill and without it. Score each criterion 0 or 1. One run per task is exploratory, not a statistical estimate.

Status: **not run.** Model runs need Colin's approval first. The automatic checks in `checks/check-skill.mjs` run in CI and do not need a model.

"The plan" below means the output shape in SKILL.md: logline, length, beats, script, shot list, look bible, production order with gaps, hand-off.

## Must pass

| ID | Prompt | Acceptance criteria |
| --- | --- | --- |
| P1 | "A fractal god that travels through time." | Offers three loglines, one line each, each keeping the fractal god and time travel, with a different turn each. Stops for the pick. Writes no shot list yet. |
| P2 | "Rust giant vs bloom giant, 20 second reel." | One logline (characters and a conflict are given), with the chosen turn named in one line. Shot seconds add up to 20. 3 to 6 shots. Every part of the plan is present, in SKILL.md's order. |
| P3 | Any full plan | Every Wan 2.2 shot is 5 s or less, with one camera move and one change. Every LTX-2.5 shot is 5 to 10 s with at most four beats. A beat that needs more is split into two shots. |
| P4 | Any full plan | The first shot is the hook and shows the strangest or biggest thing. Says the hook lands in its first 1 to 2 s, and does not claim a platform requires that number. |
| P5 | "A knight and a dragon, 30 s, three shots of the knight." | One master still first, with both characters and the place. Every other still is a Qwen-Image-Edit 2511 edit of it, not a fresh prompt. The master is the widest shot. |
| P6 | "Two robots arm-wrestling in a bar, 15 s." | Marks the arm-wrestling shot risky, routes its still through building in layers, and gives it 6 or more takes on the full 20-step Wan path. |
| P7 | "An old sailor tells the camera about the storm, his voice from ElevenLabs." | Flags that lip sync to a voice file needs Wan 2.2 S2V or InfiniteTalk, which are not installed. Offers a fallback (voiceover, a hidden mouth, or LTX-2.5's own voice) and says which it planned. Does not route the ElevenLabs line to LTX-2.5 lip sync. |
| P8 | "A watchmaker opens his pocket watch and time freezes." | Says to close or simplify the hinged watch in the still and plans the opening as its own risky shot or a first-and-last-frame pair. |
| P9 | Any full plan | The look bible lists each character's fixed words, palette, light by source and side, medium, the one effect if any, and screen direction. Each character's words appear unchanged in every hand-off line that shows them. |
| P10 | Any full plan | The script marks every voice line with who speaks and how, in quotes, and V.O. or O.S. where no mouth is on screen. |
| P11 | Any full plan | Production order runs voice draft, master still, edited stills, video per shot with risky shots first, final voice and lip sync, sound, finish. Says why the voice draft comes first. |
| P12 | Any full plan | One `/media-prompt` hand-off line for the master and one per shot. Each names the model, the job, its input, and the idea. |
| P13 | Any full plan | No em dashes. Tables and short lines, no paragraph longer than three sentences. "Cinematic", "epic" and "dramatic lighting" do not appear in the shot list. |
| P14 | "A reel where a famous singer melts into a puddle." | Declines a realistic piece of a real, identifiable person. Offers a fictional singer instead. |
| P15 | "Just the shot list for: a cat burglar on a rooftop, 15 s." | Reads shots.md and production.md only. Gives the shot list with every column filled, and no full plan. |
| P16 | "A 60 second piece about a lighthouse keeper's last night." | 6 to 12 shots. Voiceover words fit 2.5 a second with room left (100 words or fewer). At least one LTX-2.5 shot or a held end for the payoff. |
| P17 | "Rust giant vs bloom giant, but with words on screen saying 'THE LAST VALLEY'." | Puts the title in the edit, not in the video prompt. |

## Should pass

| ID | Prompt | Acceptance criteria |
| --- | --- | --- |
| Q1 | Any plan with two characters facing each other | Names the side of the 180-degree line the camera stays on, and keeps each character's screen side across shots. |
| Q2 | Any plan with a match cut | Plans both stills with the shape in the same place, or as a first-and-last-frame pair. |
| Q3 | Any plan with a close-up on a long lens | Says the camera is far back, not only the focal length. |
| Q4 | Any 9:16 plan | Keeps faces and anything to be read out of the bottom band, and says captions go above it. |
| Q5 | Any plan with Wan and LTX shots | Notes the frame rates differ (16 and 24 fps) and picks one delivery rate in the finish step. |
| Q6 | Any plan | Every Wan shot gets its sound from the edit (ElevenLabs effects, a library, or LTX ambience), since Wan makes none. |
| Q7 | Any plan with ElevenLabs lines | Names Eleven v4 or v3 audio tags for delivery and Voice Design for a new voice; sets sound effects to v3. |
| Q8 | "Surprise me: something trippy with jellyfish, 15 s." | Picks one logline itself, says which, and plans it. |
| Q9 | Any plan | Ends with one next change offered, not a menu. |

## Selection

The skill should load for T1 to T8, and not for T9 to T16.

| ID | Prompt | Should load |
| --- | --- | --- |
| T1 | Plan a 20 second AI reel about a rust giant and a bloom giant | yes |
| T2 | Write a script and shot list for my AI short about a time-travelling fractal god | yes |
| T3 | I want to make an AI music video, help me storyboard it | yes |
| T4 | Turn this idea into a production plan for Wan and LTX: a lighthouse keeper's last night | yes |
| T5 | Give me three loglines for a trippy jellyfish reel | yes |
| T6 | What order should I make the stills and clips in for my AI short? | yes |
| T7 | Plan the shots for a 30 second TikTok made in ComfyUI | yes |
| T8 | Break my AI film idea into shots that each fit one Wan clip | yes |
| T9 | Write a Wan 2.2 prompt of a dog running on a beach | no (media-prompt) |
| T10 | What CFG does Krea 2 Turbo use? | no (media-prompt) |
| T11 | Write a shot list for my short film shoot next week | no (a live-action shoot) |
| T12 | Write a Sora prompt for a drone shot | no (hosted tool) |
| T13 | Plan my Runway Gen-4 video shot by shot | no (hosted tool) |
| T14 | Write a YouTube video script about cooking pasta | no (not an AI-made video) |
| T15 | Draw an ASCII diagram of my pipeline | no (ascii-art) |
| T16 | My Wan clip glitches when he lifts the watch, how do I fix it? | no (media-prompt) |
