# Camera, lens and light

How to direct a shot on any model in this skill: build the prompt, fit it to the family, and pick the words for framing, angle, composition, camera movement, focus, lens, time, light and colour. The structure follows Black Forest Labs' FLUX 3 video guide and its cheatsheet. FLUX 3 Video is API only, so the tables mark which words each local model's own guide uses. A film term no local guide names works best written out: its name, then what it does on screen.

Trippy and impossible effects are in [effects.md](./effects.md).

## Contents

- [Build a directed prompt](#build-a-directed-prompt)
- [Fit it to the model](#fit-it-to-the-model)
- [Shot size and angle](#shot-size-and-angle)
- [Composition](#composition)
- [Camera movement](#camera-movement)
- [Focus and lens](#focus-and-lens)
- [Time](#time)
- [Light](#light)
- [Colour and texture](#colour-and-texture)
- [Stills: camera, lens and film](#stills-camera-lens-and-film)
- [Tag models](#tag-models)
- [From a FLUX 3 prompt](#from-a-flux-3-prompt)
- [FAIL and PASS](#fail-and-pass)

## Build a directed prompt

BFL's advice is to direct a scene rather than list objects. A directed prompt has these parts, in this order:

1. **The shot:** its size and angle and, for video, whether it is one continuous take.
2. **The technique, named and then shown.** Name it ("dolly zoom"), then write what the camera does and what the viewer sees, as if the model had never heard the term.
3. **Subject and action,** in nouns and verbs a camera can see.
4. **The change:** what happens across the clip and where it ends. A still has one moment instead.
5. **Small motion that reacts:** hair, cloth, dust, water, leaves.
6. **Light and colour:** the light's source, direction and softness, the palette, the texture.
7. **Sound,** on LTX-2.5 only ([ltx.md](./ltx.md#sound-and-dialogue)).

- **One framing, one move, one action.** BFL's cheatsheet says to start with one framing term, one movement term and one clear action, because more camera words in one sentence make the shot harder to read. The same goes for Wan's vocabulary: use the terms that fit and leave the rest out.
- **Words a camera can see.** "Cinematic", "epic" and "trippy" name a feeling, not a picture.
- **Length is control, not quality.** BFL: a short prompt leaves framing, motion and mood to the model, and over-stuffing makes motion less coherent. Add camera, light and texture only where they change the result.
- **Beats that fit the clip.** BFL suggests two or three beats for 5 seconds on FLUX 3. Wan 2.2's 5 seconds hold one or two. A 10-second LTX-2.5 clip holds up to four, written in time order.

## Fit it to the model

| Family | Where the shot words go | Notes |
| --- | --- | --- |
| FLUX.2, FLUX.1 | Sentences after the subject, action and place | Light by source, direction and softness (BFL's [klein] guide). A still has no camera move |
| Krea 2 | The one paragraph | Keep the user's medium ([krea2.md](./krea2.md)) |
| Qwen-Image | Sentences | Name what is there, no negations ([qwen-image.md](./qwen-image.md)) |
| SDXL tag models | Tags from [Tag models](#tag-models) | A tag with few posts barely moves the picture |
| Wan 2.2 | "Aesthetic control", after entity, scene and motion ([wan.md](./wan.md#text-to-video)) | One move. With a move, Wan's own prompt extender leaves the camera angle out. Wan makes no sound |
| LTX-2.5 | Inside the paragraph, the camera relative to the subject, sound last ([ltx.md](./ltx.md#write-the-prompt)) | 4 to 8 sentences, one light source, no numbered shot lists. One move per shot, and where the subject ends up |

## Shot size and angle

| Term | What it shows | Wan 2.2's word |
| --- | --- | --- |
| Extreme close-up | One detail: an eye, a fingertip, a drop of water | extreme close-up shot |
| Close-up | A face or a hand fills the frame | close-up |
| Medium close-up | Head and shoulders | medium close-up |
| Medium shot | From the waist up | medium shot |
| Cowboy shot | From mid-thigh up | |
| Full shot | The whole body, head to feet | |
| Wide shot | The subject small in a big place | |
| Establishing shot | The place, before the action | establishing shot |
| Macro | Something tiny, shown large | |
| Two-shot | Two people in one frame | two-shot |
| Eye level | The camera at the subject's eye height | eye-level |
| Low angle | Looking up: the subject looms | low angle |
| High angle | Looking down: the subject shrinks | high-angle |
| Worm's-eye view | From the ground, straight up | |
| Top-down, bird's-eye | Straight down from above | top-down angle, overhead shot |
| Aerial | From high in the air | aerial shot |
| Dutch angle | The horizon tilted, for unease | Dutch angle shot |
| Over-the-shoulder | Past one person toward another | over-the-shoulder angle |
| Point of view | Through someone's eyes | |
| Profile | A strict side view | |

Wan's words come from its guide and its own prompt extender ([wan.md](./wan.md#the-official-vocabulary)). The guide also lists close shot, medium full shot, wide-angle and extreme full shot as shot sizes, and the extender runs from extreme close-up shot to extreme wide shot. LTX-2.5's guide adds overhead view and wide establishing shot.

## Composition

| Term | What it does | Wan 2.2's word |
| --- | --- | --- |
| Center framing | The subject dead center | center composition |
| Symmetry | Mirror-balanced left and right | symmetrical composition |
| Rule of thirds | The subject on a third line, space on the other side | |
| Leading lines | Roads, rails or walls that pull the eye to the subject | |
| Negative space | A small subject in a big empty area | |
| Frame within a frame | The subject seen through a window, door or arch | |
| Foreground occlusion | Out-of-focus things in front, partly hiding the subject | |
| Silhouette | The subject dark against a bright background | |
| Reflection | The subject seen in a mirror, water or glass | |

## Camera movement

| Move | What the camera does | Wan 2.2's words | LTX-2.5's words |
| --- | --- | --- | --- |
| Static | Does not move | fixed camera | static frame |
| Push in, dolly in | Moves toward the subject | camera pushes in | pushes in |
| Pull out, dolly out | Moves away from the subject | camera pulls out | pulls back |
| Truck | Slides sideways | camera moves left | |
| Pan | Turns left or right on the spot | slowly pans to the right | pans across |
| Tilt | Turns up or down on the spot | camera tilts up, pans down | tilts upward |
| Track, follow | Moves along with the subject | tracking shot, follow-cam perspective | follows, tracks |
| Rise | Lifts straight up, like a crane | low-angle camera rises | |
| Orbit, arc | Circles the subject | orbiting camera movement | circles around |
| Handheld | Moves with a natural shake | | handheld movement |
| Compound | Two moves at once | compound camera movement | |

Wan's own texts use "pans" and "tilts" interchangeably for up and down. LTX-2.5's guide asks for the move relative to the subject and what is seen after it: "the camera circles around him until the city skyline is behind him".

Pick the move for what it does. Wan's guide (the English page) gives each one a job:

| Move | What it does to the viewer |
| --- | --- |
| Push in | Intimacy or tension |
| Pull out | Reveals scale |
| Tracking | Rides alongside the subject |
| Orbit | Makes the subject important. Keep the arc under 45°; the guide says wider orbits distort the space |
| Fixed | Stillness |

Film terms that neither guide's vocabulary names. Lightricks' blogs mention a few of them (whip pan, crane, dolly), but its guide does not. Write the name, then the mechanism:

| Term | Write it as |
| --- | --- |
| Crane, pedestal | "the camera rises straight up the side of the building to the roof" |
| Whip pan | "the camera whips sideways so fast the street blurs, landing on the door" |
| Zoom | "the lens zooms in while the camera stays still" |
| Dolly zoom | See [effects.md](./effects.md#camera-tricks) |
| Locked-on | "the camera is fixed to the runner, her face steady while the station rushes past behind her" |
| FPV drone | "a small drone flies fast and low through the canyon, banking around the rocks" |
| Turntable | "the shoe turns slowly on a turntable while the camera stays still" |

## Focus and lens

| Term | What it does | Wan 2.2's word |
| --- | --- | --- |
| Shallow depth of field | The subject sharp, the background soft | |
| Deep focus | Everything sharp, front to back | |
| Rack focus | The focus moves from one thing to another during the shot | |
| Tilt-shift | A real scene looks like a miniature model | tilt-shift photography (a special-effect shot) |
| Wide-angle lens (about 14 to 24mm) | A wide view; near things loom, edges stretch | wide-angle lens (in an example) |
| Normal lens (about 35 to 50mm) | Close to how the eye sees | |
| Telephoto, long lens (85mm and longer) | Compresses distance: far things stack up behind the subject | long-focus lens |
| Fisheye | Extremely wide; straight lines and the horizon curve | ultra-wide-angle fisheye |
| Macro lens | Tiny things large and sharp | |
| Anamorphic | A wide frame, long horizontal lens flares, oval out-of-focus lights | |
| Split diopter | A near thing and a far thing both sharp, a soft band between them | |
| Halation | A glowing halo around bright highlights, a film look | |
| Vignette | Darker corners pull the eye to the center | |

LTX-2.5's guide lists depth of field, motion blur, film grain and lens flares.

## Time

| Term | What it does | Wan 2.2's word | LTX-2.5's word |
| --- | --- | --- | --- |
| Slow motion | Movement stretched out | "slowly" (no slow-motion term) | slow motion |
| Fast motion | Movement sped up | "quickly" | |
| Time-lapse | Hours pass in seconds | time-lapse photography | time-lapse |
| Speed ramp | Slows down, then snaps back to speed, in one shot | | |
| Freeze frame | Everything stops, sometimes while the camera keeps moving | | freeze-frame |
| Lingering shot | Holds on a moment longer than expected | | lingering shot |
| Long-exposure look | Moving lights smear into trails | | |
| Cinemagraph | One thing moves; everything else is frozen | | |

Tricks with time are in [effects.md](./effects.md#time).

## Light

| Term | What it does | Wan 2.2's word |
| --- | --- | --- |
| Soft light | Large, diffuse light; gentle shadows | soft light |
| Hard light | A small, strong source; crisp shadows | hard light |
| Side light | From one side; half the face in shadow | side light |
| Backlight | From behind the subject | backlight |
| Rim light | Outlines the subject's edge from behind | rim light, edge lighting |
| Top light | From straight above; deep eye shadows | top lighting |
| Underlighting | From below; eerie | underlighting |
| High contrast | Bright highlights, deep shadows | high contrast |
| Golden hour | Low, warm sun and long shadows | sunrise, sunset |
| Blue hour | Cool, even light after sunset | |
| Overcast | Flat, shadowless daylight | overcast light |
| Firelight | Warm, flickering, from below or the side | firelight |
| Moonlight | Cool, dim, soft-edged night light | moonlight |
| Fluorescent | Flat, greenish-white overhead light | fluorescent lighting |
| Chiaroscuro | One strong light, deep black shadow | |
| Practical light | A lamp, screen or neon sign in the shot lights the scene | practical |
| Volumetric light | Beams visible in haze, dust or smoke | |
| Caustics | Rippling light patterns thrown by water or glass | |

- **One source, kept consistent.** Lightricks' guide asks for this on LTX-2.5. Its lighting words include flickering candles, neon glow, natural sunlight and dramatic shadows.
- **Source, direction, softness.** BFL's [klein] guide: "warm window light from the left, soft" says more than "nice lighting".

## Colour and texture

- **Wan 2.2's tone words:** warm tones, cool tones, low saturation, and mixed colors in its prompt extender. **LTX-2.5's palette words:** vibrant, muted, monochromatic, high contrast.
- **Name two to four palette colours** ("ochre, amber and dusty teal") rather than "colourful". BFL's FLUX 3 schema calls these palette anchors.
- **Texture:** fine grain, heavy 16mm grain, halation, soft focus, a high dynamic range that keeps both bright sky and dark shadow.
- **Film and video looks:** black and white, faded colour film, a home camcorder look (soft, 4:3, colours bleeding), thermal false colour. Name what the look does as well as its name.
- **Exact colours on FLUX.2:** hex codes tied to an object ([flux.md](./flux.md#words-to-draw-colours-json)).

## Stills: camera, lens and film

For photographs on FLUX.2, Krea 2 and Qwen-Image. Each vendor documents a different amount:

| Model | What its vendor shows | So write |
| --- | --- | --- |
| FLUX.2 | BFL's FLUX.2 guide (now filed under [pro] and [max]; at launch it covered the whole family) gets a photo look by naming a camera, lens and settings ("shot on [camera], [lens], [settings]") and gives four looks: modern digital (shot on a Sony A7IV, clean, sharp, high dynamic range), 2000s digicam (slight noise, flash, candid), 80s vintage (film grain, warm cast, soft focus), analog film (shot on Kodak Portra 400, natural grain). BFL's archived [klein] guide says light matters most, and ends its example with a film note (35mm film, Kodak Portra 400) | Camera, lens, aperture and film when the photo look matters. On [klein], light first |
| Krea 2 | Krea's examples use plain photo words (macro photograph, extremely shallow depth of field, creamy bokeh, film grain, editorial portrait) and no camera bodies, film stocks or f-numbers | Photo words rather than brand names |
| Qwen-Image | Qwen's rewriters name the style first (realistic or documentary photography) and give the light its own sentence: source, direction, quality, shadows. 2.1's rewriter names objects by class, not brand, and drops quality boosters. Qwen's 2512 post gets realism from phone-snapshot cues: shot on a smartphone, plain indoor light, a wide-angle lens | Style first, then light. Brands only if the user names them |

| Choice | Words | What it does |
| --- | --- | --- |
| Focal length | 24mm, 35mm, 50mm, 85mm, 135mm | From wide and close, through natural, to flattering portrait compression and telephoto |
| Aperture | f/1.4 to f/2.8; f/8 to f/16 | Shallow: the subject sharp, the background soft. Deep: everything sharp |
| Shutter | a fast shutter; a slow shutter | A fast one freezes a splash; a slow one blurs motion into streaks |
| Grain | ISO 100; ISO 1600 to 3200 | Clean; grainy, like fast film |
| Light | window light, golden hour, overcast, harsh direct flash, softbox, Rembrandt, split, rim, practical | Where the light comes from and how hard it is |
| Look | modern digital, 2000s digicam with flash, 80s vintage, analog film, Polaroid, VHS, sepia | The era and the medium |

The focal lengths, apertures, ISO values and the light and look names are from BFL's prompt reference.

- **Describe what a real camera records:** grain, slight chromatic aberration at the edges, haze. BFL's FLUX 3 guide says "highly detailed" and "ultrarealistic" add little; Qwen-Image 2.1's rewriter drops quality boosters too.
- **One realism cue, one or two effects.** BFL's FLUX 3 guide gives that limit. Grain, flare, halation and aberration together read as a filter.
- **Rewrite negations as what is there.** BFL's FLUX.2 guide: "no blur" becomes "sharp focus throughout".

For example, on FLUX.2 [dev]: "An old fisherman mends a net on the harbour wall at dawn, his hands cracked and salt-stained. Shot on a 35mm film camera with an 85mm lens at f/2, soft overcast light from the sea, Kodak Portra 400 colours with natural grain."

## Tag models

Pony, NoobAI and Illustrious learned each tag from the images that carry it. Every tag below had at least 3,100 posts in the Danbooru tag list of a1111-sd-webui-tagcomplete; the number is posts, in thousands. Fewer posts means a weaker effect, so give a weak tag a weight such as (tag:1.2), or leave it out. Illustrious v0.1's card says not to lean on composition tags such as `close-up` and `cowboy shot`.

| Group | Tags |
| --- | --- |
| Framing | `full body` (806), `upper body` (772), `cowboy shot` (556), `portrait` (82), `scenery` (52), `close-up` (46), `wide shot` (16) |
| Angle | `from behind` (233), `from side` (222), `profile` (129), `pov` (123), `dutch angle` (119), `from above` (99), `from below` (83), `straight-on` (29), `upside-down` (26) |
| Lens and focus | `blurry background` (130), `depth of field` (104), `foreshortening` (53), `blurry foreground` (30), `motion blur` (25), `chromatic aberration` (24), `film grain` (15), `bokeh` (8), `perspective` (8), `fisheye` (5) |
| Light | `glowing` (102), `light particles` (54), `lens flare` (39), `backlighting` (34), `light rays` (26), `silhouette` (17), `sunbeam` (11), `dappled sunlight` (11), `spotlight` (5), `bloom` (4), `high contrast` (3) |
| Colour | `monochrome` (631), `greyscale` (501), `limited palette` (17), `sepia` (8), `muted color` (6) |
| Strange | `motion lines` (71), `reflection` (37), `mirror` (28), `underwater` (23), `afterimage` (12), `speed lines` (10), `rainbow` (10), `floating object` (9), `surreal` (5), `glitch` (4), `abstract` (4), `light trail` (4), `melting` (4) |

Not found among tags with 3,100 or more posts, so not worth writing on a tag model: psychedelic, kaleidoscope, double exposure, Droste effect, fractal, optical illusion, vaporwave, liminal space, chiaroscuro, rim lighting, volumetric lighting, cinematic lighting, dramatic lighting, tilt-shift, vignetting, long exposure, split screen. For those looks, use a sentence model (FLUX.2, Krea 2, Qwen-Image).

## From a FLUX 3 prompt

BFL's FLUX 3 examples are a good source of ideas, but FLUX 3 Video is a larger, hosted model with sound and clips up to 20 seconds. To run one locally:

| The FLUX 3 prompt has | On Wan 2.2 | On LTX-2.5 | On an image model |
| --- | --- | --- | --- |
| "One continuous unbroken shot" | Drop it: Wan makes one shot anyway | Keep "one continuous shot": LTX-2.5 can cut, so saying it is one take matters | Drop it |
| Words in capitals for emphasis | Normal case. No local model's guide uses capitals; say the key rule once, plainly | Normal case | Normal case |
| Timed phases ("0–3s", "Phase 2") | Keep the strongest beat: one change in 5 seconds | Time words inside one paragraph ("at first", "then", "by the end"). Lightricks: no numbered shot lists | One moment |
| "Audio: ..." | Drop it: Wan makes no sound | A sound sentence at the end of the paragraph | Drop it |
| "No on-screen text, no subtitles" | Wan's default negative already has 字幕 (subtitles). At CFG 1, leave it out | Into the negative on dev (CFG 2 to 5). On distilled, leave it out | Leave it out |
| "10 seconds, 16:9" | Settings, not prompt: 81 frames at 16 fps is about 5 seconds | Settings: 241 frames at 24 fps is 10 seconds | Settings |
| 150 words or more | Cut to what 5 seconds can show | 4 to 8 sentences | A few sentences |
| A named technique | Keep the name and the mechanism | Keep the name and the mechanism | Turn a move into a lens and an angle: a dolly zoom's stacked background becomes telephoto compression |

## FAIL and PASS

### Wan 2.2: a surfer at dawn

The user asks for "a surfer at dawn, make it look like a film", on T2V-A14B without Lightning.

FAIL:

```text
cinematic, epic, surfer, dawn, masterpiece, 8k, dramatic lighting, drone shot, slow motion, handheld, orbit, dolly zoom
```

Four camera moves at once, mood words with nothing to draw, and no action.

PASS:

```text
A lone surfer paddles out through calm grey-blue water at dawn, then rises to her feet as a small wave lifts the board, spray trailing off its rail. The camera moves left with her at water level, low and steady. Long-focus lens, the distant headland soft behind her. Soft side light from the low sun, a rim light on her shoulders, cool tones with low saturation.
```

```text
Negative: Wan's Chinese default (wan.md)
Settings: 832×480, 81 frames at 16 fps, steps 20 (high-noise 0 to 10, low-noise 10 to 20), cfg 3.5, euler, simple, shift 5
Terms: long-focus lens: a telephoto that flattens distance, so the headland sits close behind her; side light: light from one side; rim light: light from behind that outlines her edge
Minimal version: A surfer paddles out and stands up on a small wave at dawn.
```
