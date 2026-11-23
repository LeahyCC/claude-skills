# Sound and voice

The sound layers, where each one comes from on this setup, how to write voice lines for ElevenLabs and LTX-2.5, and carrying sound across cuts. Wan 2.2 makes no sound, so most shots get all of theirs in the edit.

## Contents

- [Four layers](#four-layers)
- [Where each layer comes from](#where-each-layer-comes-from)
- [Writing voice lines](#writing-voice-lines)
- [Sound across cuts](#sound-across-cuts)
- [Lip sync](#lip-sync)
- [The mix](#the-mix)
- [FAIL and PASS](#fail-and-pass)

## Four layers

| Layer | What it is | Example |
| --- | --- | --- |
| Voice | Dialogue and voiceover | "It came for the last green valley." |
| Effects | Hard effects tied to one action, and Foley (steps, cloth, handled props) | An iron boom as the foot lands |
| Ambience | The place, under the whole scene | Wind over wheat, distant birds |
| Music | Score or a track | A low drone that swells at the payoff |

- **Voice first.** Mixing sources agree: nothing buries the speech.
- **Few at once.** Walter Murch's rule of thumb: about five layers at once is the most an audience follows, and only two or three of the same kind. Drop a layer to make room for a new one.
- **Name the source,** not the mood: "rain ticking on a tin roof", not "moody ambience".
- **Every shot gets something.** Meta says over 75% of Reels views on Instagram are sound on. Even a still moment has room tone or wind.

## Where each layer comes from

| Layer | On Wan shots | On LTX-2.5 shots |
| --- | --- | --- |
| Voice | ElevenLabs text to speech, laid in the edit | LTX's own voice, from a line in quotes in the prompt. Or ElevenLabs as voiceover with LTX's speech left out |
| Effects | ElevenLabs sound effects, or a library | LTX's own, described in the prompt |
| Ambience | ElevenLabs sound effects (loop on), a library, or LTX ambience from another clip | LTX's own |
| Music | ElevenLabs Music, or a licensed track | Better added in the edit than generated in the clip |

ElevenLabs, per its docs:

- **Text to speech:** Eleven v4 is the flagship. Eleven v3 is the previous generation; Multilingual v2 and Flash v2.5 remain.
- **Voice Design** makes a voice from a description and gives three previews. Start with language, gender, age and quality, then a persona and up to three emotion words. Save the one you pick and use it for every line of that character.
- **Sound effects:** v3, 0.1 to 30 seconds a generation, with a seamless loop option for ambience. The default model is still the older v2, so pick v3.
- **Music:** 3 seconds to 5 minutes, with vocals or instrumental.

## Writing voice lines

In the script, each line says who speaks, how, and the words in quotes:

```text
NARRATOR (V.O., old woman, low and calm, close to the mic): "It came for the last green valley."
```

- **V.O.** is a voice not in the scene (a narrator). **O.S.** is a character in the scene but out of frame. Neither shows a mouth, so neither needs lip sync.
- **For ElevenLabs v3 and v4,** direct delivery with audio tags in square brackets: `[whispers]`, `[sighs]`, `[laughs]`. Name a voice quality rather than a vague mood; a vague tag can come out as a sound effect. Pauses come from punctuation and ellipses, not break tags.
- **For LTX-2.5,** the line goes in double quotes inside the prompt, with who speaks and how. Leave room: a short line in a longer clip is safer than words that fill every second.
- **Keep lines short.** A beat of a reel holds one short sentence. Check each line's real length in the voice draft before fixing the shot's seconds.

## Sound across cuts

| Term | What happens | Use it to |
| --- | --- | --- |
| J-cut | The next shot's sound starts before its picture | Pull the viewer into the next shot: the boom heard before the foot is seen |
| L-cut | The picture cuts, the last shot's sound carries on | Let a line finish over a reaction |
| Sound bridge | Any sound that carries across a cut | Hide that two shots came from different generations |

Adobe's definitions are used here; some guides swap J and L. A continuous ambience or music bed across every cut is the cheapest way to make separate clips feel like one scene.

## Lip sync

- **Voice before picture.** Animation records the dialogue before animating the mouth, and a lip-sync model needs the file as its input.
- **Dry and clean.** Background music, crowd noise and overlapping voices hurt lip sync. Generate the line alone, with no music or effects, and add those only in the final mix.
- **On this setup:** Wan 2.2 S2V and InfiniteTalk take a voice file but are not installed yet. LTX-2.5 can't take a voice file in ComfyUI. Until the gap closes, an ElevenLabs line on screen needs a hidden mouth ([production.md](./production.md#gaps)).

## The mix

- **Voice on top,** music ducked under it, effects and ambience between.
- **Loudness:** about -14 LUFS integrated with peaks under -1 dBTP is the usual delivery for social video. That is convention, measured by engineers; TikTok, Instagram and YouTube publish no target.
- **Captions** for every line, burned in or as the platform's own, kept out of the bottom band ([shots.md](./shots.md#framing-for-916)).

## FAIL and PASS

FAIL:

```text
Sound: epic music, sound effects, voiceover
```

PASS:

```text
Sound: VO 1 (narrator, [low, calm]) over a deep iron boom on the landing at 1 s; wind through wheat under the whole shot; no music until shot 4
```
