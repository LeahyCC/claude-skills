# Pipelines: more than one prompt

Most finished pieces take several passes: a still, edits to it, a video from it, a finish. This file covers how the passes fit together. Each pass still uses its own family file for the prompt.

## Contents

- [Pick a route](#pick-a-route)
- [Shots from one master still](#shots-from-one-master-still)
- [Build in layers](#build-in-layers)
- [One still, one idea](#one-still-one-idea)
- [Refine with a second model](#refine-with-a-second-model)
- [Detail pass](#detail-pass)
- [Seeds and takes](#seeds-and-takes)
- [A hosted still as the start frame](#a-hosted-still-as-the-start-frame)

## Pick a route

| The job | Route |
| --- | --- |
| The same characters in several shots | [Shots from one master still](#shots-from-one-master-still) |
| Two characters touching or fighting, or a crowded scene | [Build in layers](#build-in-layers) |
| A still that follows the prompt but looks rendered or plastic | [Refine with a second model](#refine-with-a-second-model) |
| A full-body picture whose face or mask came out small and soft | [Detail pass](#detail-pass) |
| A close-up to turn into a wide or full-body shot | [fixes.md](./fixes.md#edits), big reframes |
| A clip that broke: an object split, the motion stopped early | [fixes.md](./fixes.md) |
| A reel of several shots with one look | Stills first, each from the master still; then one video per still; then one finish for all ([finishing.md](./finishing.md)) |

## Shots from one master still

Prompting every shot from scratch gives a slightly different character each time. Editing one picture keeps them.

1. **Make one master still** that shows each character and the place, with the look you want.
2. **Make each shot's start frame by editing the master,** not by prompting again. Qwen-Image-Edit 2511 does framing and viewpoint edits, and its card lists steadier characters as a change from 2509 ([qwen-image-edit.md](./qwen-image-edit.md)). For set camera angles, use the multi-angles LoRA ([qwen-image-edit.md](./qwen-image-edit.md#camera-angles-on-2511)).
3. **Name each character in the same words** in every prompt and edit.
4. **Animate each start frame** with image to video ([wan.md](./wan.md#image-to-video), [ltx.md](./ltx.md#image-to-video)). The video inherits the still's look, so fix the look in the still.

LTX-2.5 can also cut between shots inside one clip and hold the characters across the cuts ([ltx.md](./ltx.md#several-shots)). Image to video on LTX stays one take.

## Build in layers

A still that must hold two characters, an interaction between them, a setting and a look tends to lose some of it. Split it:

1. Make each part as its own simple still: each character alone, the background alone.
   When a master still exists, make each part as an edit of it (keep only that character), not a new prompt, so the characters still match the other shots.
2. Combine them with a multi-image edit: Qwen-Image-Edit 2509 or 2511 takes up to three pictures, named `picture 1` to `picture 3`; Qwen-Image 2.1 takes up to ten, named `<image1>` and on ([qwen-image-edit.md](./qwen-image-edit.md#several-images)).
3. Then fix one thing per edit pass. Qwen's own edit rewriter asks for one instruction per change.

```text
Place the knight from picture 1 on the left and the branch creature from picture 2 on the right, in the ruined square from picture 3, with the creature's roots wrapped around the knight's sword blade. Keep both characters' look unchanged and keep the light of picture 3.
```

Then, for example: `Remove the sword from the creature's right hand.`

## One still, one idea

Each extra subject, interaction, effect and style word competes with the others. BFL's video guide says over-stuffing makes motion less coherent, and its image guide keeps to one realism cue and one or two effects ([camera.md](./camera.md#build-a-directed-prompt)). As a starting point for a still: up to two main subjects, one interaction, one impossible thing. Past that, build in layers.

## Refine with a second model

One model can follow the instruction and another can give the surface. Make the picture with the first, then run image to image on the second:

1. Resize the image up to the size you want (1 to 2 MP on Krea 2 Turbo). Redrawing at a larger size is what adds detail ([finishing.md](./finishing.md#more-pixels-upscaling), second pass).
2. VAE Encode it and sample at **denoise 0.25 to 0.45**. Low keeps the layout and redraws texture and light; high starts to change shapes.
3. The prompt describes the whole picture, then the look, in the second model's own form.

Settings for Krea 2 are in [krea2.md](./krea2.md#image-to-image). The same pass works on any family with a VAE Encode route.

## Detail pass

At about 1 MP, the face in a full-body shot is only around 100 to 150 pixels wide, too few for fine detail. Redraw it on its own:

1. Crop a square around the head: ImageCrop (width, height, x, y).
2. Enlarge it to about 1024 with ImageScale.
3. Edit it with Qwen-Image-Edit 2511, the crop as `picture 1` and a sharp close-up of the same character as `picture 2`: `Redraw the head in picture 1 in sharp, fine detail so it matches the character's head in picture 2 exactly. Keep the head's angle, size and position, the lighting and the background of picture 1 unchanged.`
4. Shrink it back to the crop size, then paste it with ImageCompositeMasked at the same x and y, through a SolidMask softened by FeatherMask so no seam shows.

Feed x, y and the size from one set of Primitive nodes so the crop and the paste always match. All of these are ComfyUI core nodes.

## Seeds and takes

- **The seed sets the starting noise.** The same seed, prompt and settings give the same result. ComfyUI's `control after generate` set to **randomize** rerolls on every run; **fixed** keeps the seed.
- **To judge a prompt change, fix the seed first.** Otherwise the new seed, not the new words, may be what changed.
- **Plan several takes.** A starting point: 3 or 4 for a simple shot, 6 or more for hands holding things, small or hinged props, contact between characters, or big motion. Say the number in the output block's Takes line.

## A hosted still as the start frame

A still from a hosted model (Midjourney, a hosted FLUX or Nano Banana) can be the start frame for a local image-to-video model. Write only the local video prompt, by that family's image-to-video rules, and set the video size to the still's aspect ratio. This skill still does not write prompts for hosted models. Whether a service's outputs may be used this way is in its terms.
