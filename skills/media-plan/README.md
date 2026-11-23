# media-plan

Plans a short AI video before any prompt is written. Give it an idea in plain words ("a fractal god that travels through time", "rust giant vs bloom giant") and it hands back the story, a script with dialogue and voiceover, a shot list, a look bible, the order to make everything in, and one ready request per shot for [media-prompt](https://github.com/LeahyCC/claude-skills/tree/main/skills/media-prompt), which writes each model prompt and its ComfyUI settings.

```text
idea ──> media-plan ──> one line per shot ──> media-prompt ──> prompt + settings
```

## Install

```bash
npx skills add LeahyCC/claude-skills@media-plan
npx skills add LeahyCC/claude-skills@media-prompt
```

Or inside Claude Code:

```text
/plugin install media-plan --marketplace LeahyCC/claude-skills
```

Install media-prompt too: the plan's hand-off lines are requests for it.

## What it does

| Part | What you get |
| --- | --- |
| Loglines | Three to pick from when the idea is only a mood, then the one you picked |
| Beats | A hook in the first 1 to 2 s, a turn, a payoff, sized to the length |
| Script | Action lines, and each voice line in quotes with who speaks and how |
| Shot list | Seconds, framing, one camera move, lens, light, what changes, sound, and which model makes it |
| Look bible | What must stay the same for each character, the palette, the light, the medium, the one impossible effect |
| Order | Voice draft, master still, edited stills, video per shot, final voice and lip sync, sound, finish. Risky shots marked with takes |
| Gaps | What the setup can't make yet (lip sync to a voice file), at the shot it affects |
| Hand-off | One `/media-prompt` line for the master and one per shot |

Every shot fits what one generation makes: Wan 2.2 at about 5 seconds with one move and one change, LTX-2.5 at up to about 10 seconds with its own sound, stills on Krea 2 or Qwen. Characters stay the same because one master still sets them, and every other still is an edit of it or a fresh still in the same look bible words.

Version 0.1.0. 5 resource files.

## Coverage

| Resource | Topics |
| --- | --- |
| [story.md](./resources/story.md) | Loglines, beats per length, the hook, the turn and payoff, loops, script format (scene headings, action, V.O. and O.S.), how many words fit |
| [shots.md](./resources/shots.md) | One shot per generation, shot sizes, coverage wide first, the 180-degree line, screen direction, the 30-degree rule, eyelines, match cuts, lens and distance, 9:16 framing and safe zones, the shot list columns |
| [lighting.md](./resources/lighting.md) | Motivated light, key, fill and rim, hard and soft, high and low key, light that matches across cuts, the look bible |
| [sound.md](./resources/sound.md) | The four layers, where each comes from (ElevenLabs, LTX-2.5, none on Wan), voice lines and audio tags, J-cuts, L-cuts and sound bridges, lip sync, loudness |
| [production.md](./resources/production.md) | What each model makes, the route per shot, the order, the master as the widest shot, risky shots and takes, gaps, hand-off lines |

## What's different

| A typical AI script helper | This skill |
| --- | --- |
| Writes shots any length | Every shot fits one generation, and shots that don't are split |
| A new prompt for every shot | One master still, every other still an edit of it |
| "Dramatic lighting" | One light source and side, in the same words in every line that states the light |
| Dialogue with a face on screen, whatever the setup | Says when a line needs lip sync the setup can't do, and offers a voiceover or a hidden mouth |
| Every shot one take | Risky shots marked, with how many takes |

Checked sources are in [SOURCES.md](./SOURCES.md).

## License

[MIT](../../LICENSE)
