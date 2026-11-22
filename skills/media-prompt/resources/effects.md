# Trippy and impossible effects

Effects a real camera could not film: dolly zooms, morphs, dissolves, impossible reveals, tricks with time, recursion, symmetry and glitches. Each entry says what it looks like, how to write it so the model sees how it works, and which route makes it on a local model. The camera, lens and light words are in [camera.md](./camera.md).

None of these effects was rendered for this skill. Wan 2.2's guide names time-lapse and tilt-shift photography, and LTX-2.5's names slow motion, time-lapse and freeze-frame. The rest are film terms neither guide names, so the sentence that describes the mechanism is what carries them.

## Contents

- [What makes trippy work](#what-makes-trippy-work)
- [Offer treatments](#offer-treatments)
- [Camera tricks](#camera-tricks)
- [Time](#time)
- [Transformations](#transformations)
- [World swaps](#world-swaps)
- [Optics and layers](#optics-and-layers)
- [Which route](#which-route)
- [FAIL and PASS](#fail-and-pass)

## What makes trippy work

The pattern in Black Forest Labs' FLUX 3 examples, such as clouds grazing on a meadow and a snow leopard that turns to powder snow mid-leap:

- **One impossible thing per shot.** Everything around it obeys physics: light, shadow, weight, wind. Qwen-Image 2.1's own rewriter works the same way: it draws an impossible request as asked and keeps the rest of the scene physically coherent.
- **Play it straight.** Describe the impossible thing in the same plain camera language as the rest. BFL frames its grazing clouds as a static telephoto wildlife shot, "absolutely matter-of-fact".
- **Write the mechanism, not the mood.** Say what stays fixed, what moves, what turns into what, and in what order. "Trippy" and "psychedelic" give the model nothing it can draw. BFL: vague adjectives "leave the result to chance".
- **Let the world react.** Real, small motion around the impossible thing sells it: leaves tremble, a coat stirs, dust settles. On LTX-2.5, sound sells it too.
- **Time it: set up, change, hold.** Wan 2.2's 5 seconds fit one change. A 10-second LTX-2.5 clip fits a setup, the change and a held payoff. A move the clip is too short for gets cut off, not slowed (Lightricks' camera blog).
- **Big motion needs the full model.** ComfyUI's Wan 2.2 template notes say the Lightning LoRAs reduce motion. For a morph or a time-lapse, try without them first.

## Offer treatments

When the user gives a mood but no idea ("something trippy with a jellyfish"), offer three treatments, one line each, naming the effect and the payoff:

1. **Scale swap:** a jellyfish as big as a building drifts down an empty avenue at dawn, the streetlights glowing through its bell.
2. **Time split:** a jellyfish pulses slowly in an aquarium tank while the crowd behind the glass races past in time-lapse.
3. **Material swap:** a jellyfish made of steam rises from a cup of tea, its tentacles fading back into vapour as they trail.

Write the one the user picks. On "surprise me", pick one and say which. Each one is the user's subject with one effect, not a new story.

## Camera tricks

| Effect | On screen | Write it as | Route |
| --- | --- | --- | --- |
| Dolly zoom | The subject keeps its size while the background stretches away or swells toward the lens | "The camera pulls back as the lens zooms in, so she stays the same size in frame while the street behind her stretches and looms" | Prompt. Lightricks' camera blog calls it a stress case, and no local camera control makes it |
| Push through | The camera passes through a gap (a window, a screen, a keyhole) into another space | "The camera pushes through the cracked phone screen and comes out above a motorway at night" | Prompt; first and last frame to land on an exact view |
| Locked-on | The subject stays fixed in frame while the world swings or rushes behind | "The camera rides with the cyclist, her face steady in frame while the forest smears past behind her" | Prompt |
| Camera roll | The frame turns around the lens; the horizon spins | "The camera slowly rolls as he walks, the horizon turning around him" | Prompt. On Wan 2.2 image to video, the Fun Camera ClockWise or Anti Clockwise preset |
| Bullet time | Time stops and the camera keeps moving around the frozen moment | "Everything freezes mid-splash while the camera keeps circling through the hanging droplets" | Prompt. LTX-2.5's guide names freeze-frame |

## Time

| Effect | On screen | Write it as | Route |
| --- | --- | --- | --- |
| Time-lapse | Hours pass in seconds: clouds race, light sweeps, shadows swing | "Time-lapse photography: clouds race over the ridge as shadows swing across the valley from noon to dusk" | Prompt. Both guides name it: "time-lapse photography" on Wan, "time-lapse" on LTX |
| Time split | One subject at normal speed while everything else races or freezes | "She stands still on the platform at normal speed while the crowd streaks past her in fast motion" | Prompt |
| Slow motion | Movement stretched out | "In slow motion, the water balloon bursts and the skin of water hangs in the air before it falls" | Prompt on LTX, whose guide names slow motion; on Wan, "slowly", since its guide has no slow-motion term. LTX-2.5 image to video: the Slow-Motion-Control LoRA ([ltx.md](./ltx.md#camera-control-and-speed)), with no speed words in the prompt. To slow a finished clip, see [Which route](#which-route) |
| Long-exposure trails | Moving lights smear into streaks | "Long-exposure look: car lights smear into red and white streaks along the bridge" | Prompt |
| Afterimage | A moving body leaves stuttering copies of itself | "Every movement leaves a trail of fading copies behind her, like stuttered film frames" | Prompt |
| Slit-scan | Moving things stretch into ribbons across the frame | "The passing train stretches into long smeared bands of colour, as in a slit-scan photograph" | Prompt |
| Reverse, boomerang | The clip plays backward, or forward then back | Write the forward action only. Wan's default negative pushes against walking backwards (倒着走) | After generation |

## Transformations

| Effect | On screen | Write it as | Route |
| --- | --- | --- | --- |
| Morph | One thing reshapes into another | What changes first, next and last: "the coffee cup softens and stretches upward, its handle becoming a wing, until a white bird lifts off the saucer" | First and last frame |
| Dissolve and reform | A body breaks into a material (sand, smoke, snow, petals) and comes back | Name the material, the moment it breaks up, how it keeps the shape while apart, and when it reforms | Prompt |
| Grow or decay | Growth or decay at time-lapse speed: moss covers a car, frost spreads across glass | "Time-lapse: frost spreads across the window from the corners until only a small clear circle remains" | Prompt |

## World swaps

| Effect | On screen | Write it as | Route |
| --- | --- | --- | --- |
| Impossible reveal | A camera move shows the world is wrong: the streets are rivers, the moon is close enough to touch | Set up the normal scene, move the camera, reveal the swap, and hold on it | Prompt |
| Scale swap | Something small is huge, or a real place looks like a model | "A teacup the size of a house stands in a wheat field" | Prompt. For the model look, Wan's guide names "tilt-shift photography" |
| Physics swap | Things float, water falls upward, clouds graze | Describe it as ordinary, in documentary camera language | Prompt |
| Material swap | Things made of the wrong stuff: a glass horse, a city of sugar | Name the material and how light behaves in it: "light passes through the glass horse and throws coloured caustics on the sand" | Prompt |

## Optics and layers

These work best as images. In video they are hard to hold steady, so try them as stills on FLUX.2, Krea 2 or Qwen-Image first.

| Effect | On screen | Write it as | Route |
| --- | --- | --- | --- |
| Double exposure | One picture inside another, often a silhouette filled with a landscape | "Double exposure: a fox's silhouette filled with a city skyline at night, the two images blended into one" | Prompt, sentence models |
| Kaleidoscope | The frame mirrored into a repeating pattern | "Seen from directly above, mirrored into six symmetrical segments like a kaleidoscope" | Prompt, sentence models |
| Recursion | A picture that contains itself, again and again | "She holds a framed photo of herself holding the same photo, repeating inward" | Prompt, sentence models |
| Glitch | Colours split, pixels smear, the frame tears | "Chromatic aberration splits the edges into red and cyan, and the frame tears sideways for a moment" | Prompt. Real datamoshing is done in an editor |
| False colour | A heat or infrared palette: warm things glow white, cold things go deep blue | "Thermal camera footage in a false-colour palette, the warm bodies glowing white against cold blue ground" | Prompt |

Tag models know few of these as tags. "Psychedelic", "kaleidoscope" and "double exposure" are not tags with many posts; see [camera.md](./camera.md#tag-models) for the ones that are.

## Which route

| Route | Use it for | How |
| --- | --- | --- |
| The prompt alone | Most effects | The family file's form, with the mechanism written out |
| First and last frame | Morphs, a before and after, landing on an exact view, loops | Make both stills with an image model, related in subject and framing; BFL's image-to-video guide says the wider the gap between them, the less predictable the result. In the prompt, describe how the change happens. Wan 2.2: `video_wan2_2_14B_flf2v`, whose example prompts are transformations ([wan.md](./wan.md#camera-control-and-first-and-last-frame)). LTX-2.5: `video_ltx2_5_flf2v`, which Lightricks' docs name for morphing ([ltx.md](./ltx.md#image-to-video)) |
| Camera control | A move the prompt alone won't make | Wan 2.2 image to video: the Fun Camera template, one preset per clip (pans that slide, zooms that dolly, two rolls) ([wan.md](./wan.md#camera-control-and-first-and-last-frame)). LTX-2: seven camera LoRAs, for the 19B model only. LTX-2.5: no camera LoRA; the Layout-To-Render IC-LoRA follows a layout video's camera path ([ltx.md](./ltx.md#camera-control-and-speed)) |
| After generation | Slow motion, reverse, a 2.39:1 crop | Slow motion: interpolate ×2 with RIFE and save at the source fps, which plays at half speed ([finishing.md](./finishing.md)). Reverse or crop in a video editor |

A loop is a first and last frame with the same image at both ends. BFL lists loops as a use of a start and end frame for FLUX 3; on local models it is untested.

## FAIL and PASS

### LTX-2.5: a portal in a laundromat

The user asks for "a trippy video, a woman watching a washing machine, it's like a portal to space", on LTX-2.5 distilled.

FAIL:

```text
trippy psychedelic surreal laundromat, woman, washing machine portal to space, galaxy, (cosmic:1.3), 8k, masterpiece. No on-screen text.
```

Mood words the camera can't see, a weight that reaches the model as text, no motion, no sound, and a negation.

PASS:

```text
A slow push-in toward a woman sitting alone on a plastic bench in an empty laundromat at night, watching the round glass door of a front-loading washer. Inside the drum, where the clothes should be, a spiral galaxy turns, its stars smearing through the soap foam as the drum spins. The camera keeps pushing until the glass fills the frame and the laundromat falls away at its edges, leaving only the galaxy drifting past with her calm reflection floating over it. Flat green-white fluorescent light, cool and low in saturation, with fine grain. The washer thumps and sloshes in a steady rhythm under the buzz of the lights, and a low synth drone swells as the galaxy fills the frame.
```

```text
Negative: none: distilled runs at CFG 1
Settings: 768×512 then 2× to 1536×1024, 121 frames at 24 fps (5 s), steps 8 then 4, cfg 1, euler_ancestral, prompt enhancer off
Terms: push-in: the camera moves steadily toward the subject; low saturation: muted, greyish colour; fine grain: a light film texture
Minimal version: A woman watches a washing machine whose drum is a portal to space.
```

### FLUX.2 [dev]: a whale over a wheat field

The user asks for "a trippy photo of a whale in the sky over a wheat field".

PASS:

```text
A humpback whale swims through the clear sky a hundred metres above a ripe wheat field, its long pectoral fins spread and barnacles crusted on its pale belly. Its shadow falls across the wheat below, which bends in the wind. Photographed from the ground with a wide-angle lens looking up, the whale backlit by the late-afternoon sun, a gold rim of light along its body, the sky pale and empty.
```

```text
Negative: none: the [dev] template has no negative input
Settings: 1344×768, steps 20, FluxGuidance 4, euler
Terms: wide-angle lens: takes in a wide view and makes near things loom; backlit: lit from behind, so the subject's edges glow
Minimal version: A whale floating in the sky over a wheat field.
```
