# The look: polished, art-directed stills

For "make it look like Midjourney", "more aesthetic", "less AI", or a set of stills that must share one look. This skill still writes no prompts for Midjourney. It moves the look onto local models.

## Contents

- [What the look is made of](#what-the-look-is-made-of)
- [Ask first](#ask-first)
- [Photo or painterly](#photo-or-painterly)
- [Write it into the prompt](#write-it-into-the-prompt)
- [Borrow a look from a picture](#borrow-a-look-from-a-picture)
- [Hold a look with a LoRA](#hold-a-look-with-a-lora)
- [The order](#the-order)
- [FAIL and PASS](#fail-and-pass)

## What the look is made of

"The Midjourney look" is not one thing. Midjourney's own pages describe four parts, and each has a different local route:

| Part | In Midjourney | Local route |
| --- | --- | --- |
| A default taste | Standard mode adds Midjourney's own creative touch to whatever the prompt leaves open. Midjourney says that taste is the combined preferences of its community, learned from users rating pictures. Raw mode turns it off | Krea 2, whose training has a stage driven by an aesthetic reward model, and a prompt that leaves less open ([below](#write-it-into-the-prompt)) |
| A look the user picks | A style reference (`--sref`) copies an image's colours, medium, textures and lighting, not its objects or people | [A style reference](#borrow-a-look-from-a-picture) |
| A look held across many pictures | A moodboard (a set of the user's own images) or a personalization profile (learned from the pictures the user likes and ranks) | [A style LoRA](#hold-a-look-with-a-lora), a community one or one trained on the user's own picks |
| A finished surface | Not a control. The pictures arrive graded | [The grade](./finishing.md#grade-colour-glow-and-grain): colour balance, lifted blacks, a soft glow, grain |

Midjourney's V8 notes say its newest model follows the prompt more literally, and looks best when a style reference, a moodboard or a profile carries the look. So prompt words alone are the weakest of the four routes. A reference picture or a LoRA moves the result further than any adjective.

## Ask first

"Like Midjourney" names a taste, not a picture. Ask one question, with the answer deciding the route:

| The user has | Route |
| --- | --- |
| One or two pictures whose look they want | The style reference. Ask them to load it in ComfyUI; they do not need to share it |
| Dozens of pictures in one look | A style LoRA trained on them |
| No picture, only a feeling | Photo or painterly (below), then the prompt, then the grade |

If the user shares a reference, look at it and write its look as a block to reuse in every prompt: medium, palette (two to four colours), light (source, side, softness), shading, texture, how dense the detail is, mood. Leave out the subject, the pose, any text and the composition, so the block carries the look and nothing else. If they can't share it (references are often private), ask for those same lines in their own words.

## Photo or painterly

Midjourney publishes no list of what its default look contains. These two recipes come from people who study its output, so treat them as a menu, not a rule. Pick one column, then one choice from each row:

| | Photo | Painterly |
| --- | --- | --- |
| Medium | A film still or a photograph, named: 35mm, medium format, a film stock | A painting or concept art, named: oil, gouache, digital matte painting, with visible brushwork |
| Light | One named source from one side: window light, a low sun, a practical lamp | One strong key, a warm rim on the subject's edge, haze that shows the beams |
| Colour | Slightly desaturated, two to four palette colours | A graded pair, such as teal shadows and amber highlights |
| Lens | 85mm with shallow focus for a person; 35mm for a person in a place | Wide and low, deep focus, one small figure against a huge setting |
| Surface | Fine grain, soft highlights | Soft edges with one crisp focal point |
| Finish | Grain, lifted blacks, a little warmth | Glow on the brightest parts, the same colour pair in the grade |

- **One subject, one focal point.** Both recipes rest on it. Say where the subject sits and what fills the rest of the frame ([camera.md](./camera.md#composition)).
- **The words for light, lens and film** are in [camera.md](./camera.md#stills-camera-lens-and-film), in each model's own vocabulary.

## Write it into the prompt

A model falls back on its plainest look wherever the prompt is silent. So close the gaps Midjourney's standard mode would have filled:

| Do | Don't |
| --- | --- |
| Name the medium first, and be specific: an era, a print process, a film stock, a kind of paint | Write "Midjourney style", "aesthetic", "award-winning" or "trending". No open model was captioned with those words, and the quality words are already ruled out in [SKILL.md](../SKILL.md#rules) |
| Give one light its source, side and softness | "Cinematic lighting", "dramatic lighting" |
| Name two to four palette colours | "Vibrant colours", "beautiful colours" |
| Say where the subject sits and what the empty part of the frame is | Leave framing to the model, which centres everything |
| Keep it to one realism cue and one or two effects ([camera.md](./camera.md#stills-camera-lens-and-film)) | Stack grain, flare, halation and haze in the prompt. Add those in the grade, where each has a dial |
| Use a community LoRA's trigger exactly as its page gives it | Invent a trigger from the LoRA's name |

- **Krea 2 is the first choice** for this job among the families this skill covers: most community "Midjourney style" LoRAs made since mid-2026 target it. Naming a medium, an era or a printing process steers it hard, and with no direction it settles into a house style of its own ([krea2.md](./krea2.md#write-the-prompt)). If its skin looks plastic or every seed looks alike, see [krea2.md](./krea2.md#community-settings).
- **Qwen-Image for layout, then Krea 2 for surface,** when the picture is busy ([pipelines.md](./pipelines.md#refine-with-a-second-model)).
- **Tag models** take tags, so the look comes from an artist or style tag the checkpoint knows, or a LoRA ([sdxl-tags.md](./sdxl-tags.md)).
- The added look words follow the usual rule: they go in the full prompt, and the minimal version leaves them out.

## Borrow a look from a picture

The local stand-in for a style reference is ostris' style reference LoRA on Krea 2 Turbo. Files and wiring are in [krea2.md](./krea2.md#style-reference).

| Choice | What to do |
| --- | --- |
| The prompt | The new picture's content, said firmly: the subject's shape, its colours, and the one feature that must show. No mood or style words. Midjourney gives the same advice for `--sref`: keep the text about content and let the reference carry the style |
| The reference | One whose subject differs from the new picture's, so what carries over is the look. Use the original file, not a remake of it. Crop it to the part whose look is wanted |
| How many | One or two. The LoRA was trained for that many. Two blend |
| Strength | Start at 0.7. ComfyUI's template loads it at 1.0 and the card gives no number. In this skill's own runs 1.0 pulled the reference's subject into the new one, and 0.7 held the look across ten new subjects. If the subject or layout still leaks in, or the picture breaks up, step down toward 0.5 (a community report, not the author's) |
| Size of the reference | Nothing to set. The nodes shrink it before the model sees it, so a small, clean reference works as well as a large one |

- **What the reference carries, and what it doesn't.** In this skill's own runs on Krea 2 Turbo the finish came across with no style words in the prompt: sharpness, background blur, surface detail, fog, glow. Colour and a small key feature did not come across reliably. A prompt that named only the subject lost the reference's palette and its glowing eyes, and naming both brought them back. So name the palette even when the reference already has it.
- **Say what makes the new subject different from the reference's.** The model fills any gap in a shape from the reference. An octopus described as floating, with long thin arms hanging straight down, came out as the reference's jellyfish. The same words with no reference still hung the arms straight down, so the prompt was the cause and the reference finished the job. The second case in [FAIL and PASS](#fail-and-pass) shows the rewrite.
- **Colour only.** To match a picture's palette without its texture, make the still as usual, then run ComfyUI's Transfer Color node (ColorTransfer) with the reference as `image_ref`. Methods: `reinhard_lab`, `mkl_lab`, `histogram`. Its strength runs from 0 to 10, and 1.0 is a full match.
- **No style code.** Midjourney's numeric sref codes point into its own library. There is no local equivalent to look one up: the nearest thing is a LoRA.
- **Other families:** FLUX.2 [klein] and Qwen-Image 2.1 take reference images in an edit ([flux.md](./flux.md), [qwen-image-edit.md](./qwen-image-edit.md#several-images)). Neither vendor documents how well they copy a style while leaving the content.

## Hold a look with a LoRA

A style reference steers one picture. A LoRA holds the look across a whole set, the job a moodboard or a profile does in Midjourney.

| Route | When | How |
| --- | --- | --- |
| A community style LoRA | The look wanted is a common one: film still, a named illustration style, "Midjourney-like" | Find it on its model page, check the base model is the one in use, and take the trigger and strength from the page ([loras.md](./loras.md#find-the-trigger)) |
| A LoRA trained on the user's own picks | The look is personal, or must stay the same across a project | A set of pictures in one look (one published Krea 2 run used 67 and 96). Settings in [krea2.md](./krea2.md#train-a-style-lora) |

- **A style LoRA and the style reference do the same job.** Use one at a time until each is known to work, then stack with both strengths lowered ([loras.md](./loras.md#strength)).
- **Pictures made by a hosted service** can be the training set. Whether a service's terms allow that use is for the user to check, as with a hosted start frame ([pipelines.md](./pipelines.md#a-hosted-still-as-the-start-frame)).

## The order

```text
prompt with the look  ->  still  ->  refine (optional)  ->  upscale  ->  grade
        ^                   ^
   look block          style reference
   or LoRA trigger     or style LoRA
```

- **Fix the look in the still.** Video made from it inherits the look ([pipelines.md](./pipelines.md#shots-from-one-master-still)).
- **Grade last,** after the final upscale, and give every still in a set the same grade ([finishing.md](./finishing.md#grade-colour-glow-and-grain)). Say the grade in the output block's Finish line.
- **Grade the last thing made.** A still that becomes a clip's start frame is graded as part of the clip, not before, or the grade lands twice.
- **Judge with the seed fixed.** Change one thing at a time: the look block, then the reference, then the grade ([pipelines.md](./pipelines.md#seeds-and-takes)).

## FAIL and PASS

The user asks for "a lighthouse keeper on the gallery at dusk, make it look like Midjourney", on Krea 2 Turbo, and has no reference picture. They pick painterly.

FAIL:

```text
lighthouse keeper at dusk, midjourney style, v8, --stylize 750, aesthetic, cinematic lighting, masterpiece, trending on artstation, 8k
```

Parameters and praise words that no open model was captioned with. Nothing says what the medium, the light or the colours are, so the model's plainest look fills every gap.

PASS:

```text
A digital matte painting with visible brushwork of an old lighthouse keeper standing on the iron gallery of a lighthouse at dusk, small in the lower left of the frame, one hand on the rail, looking out to sea. The tower and its lamp rise above him and the open sky fills the right half. The lamp behind him is the only strong light: it rims his coat and cap in warm amber and its beam shows in the sea haze. Deep teal shadows, amber highlights, a slate-grey sea. Soft edges everywhere except his face and hands.
```

```text
Negative: none: Turbo runs without CFG
Settings: 1024×1024, steps 8, cfg 1, euler, simple, enhancer off
Finish: grade after the upscale: cool shadows and warm highlights, glow on the lamp, no grain on a painting
```

```text
Minimal version (the user's words in this model's form, nothing added):
An old lighthouse keeper standing on the gallery of a lighthouse at dusk.
```

A second case. The user has loaded a foggy picture of a giant jellyfish over a moor as the style reference and wants an octopus in that look.

FAIL:

```text
A colossal octopus floats low over a misty shoreline like an airship. Its long thin arms hang straight down and glow orange, fading into the fog. Moody, atmospheric, cinematic.
```

Floating, with thin glowing arms that hang straight down: those words fit the reference's jellyfish, so a jellyfish comes back. The mood words add nothing, because the reference already carries the mood.

PASS:

```text
A colossal octopus rises out of thick fog over a misty grey shoreline and fills the upper two thirds of the picture. It has a smooth, sack shaped head with two large eyes, and eight thick arms lined with round suckers that curl outward, some resting on the wet sand. Its skin is mottled grey blue and glows warm orange between the arms. A tiny distant fisherman in a teal raincoat stands on the sand, seen from behind, looking up.
```

```text
Negative: none: Turbo runs without CFG
Settings: 1024×1024, steps 8, cfg 1, euler, simple
Finish: style reference at 0.7, the jellyfish picture as the one reference
```

```text
Minimal version (the user's words in this model's form, nothing added):
A colossal octopus on a misty shoreline.
```
