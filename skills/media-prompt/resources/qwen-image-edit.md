# Qwen-Image-Edit

Edits with Qwen-Image-Edit (August 2025), Edit-2509 (September 2025), Edit-2511 (December 2025), and the editing side of Qwen-Image-2.1 (September 2026). Text to image is in [qwen-image.md](./qwen-image.md).

## Contents

- [Which editor](#which-editor)
- [Write the instruction](#write-the-instruction)
- [Several images](#several-images)
- [Settings](#settings)
- [FAIL and PASS](#fail-and-pass)

## Which editor

| Model | Images in | What it added |
| --- | --- | --- |
| Qwen-Image-Edit | 1 | Look and meaning edits, Chinese and English text edits |
| Edit-2509 | 1 to 3 (the card: best results with 1 to 3) | Several input images, steadier people, products and text, depth, edge and pose maps as input |
| Edit-2511 | Up to 3 in ComfyUI's node | Less drift, steadier characters and groups, lighting and new-viewpoint edits built in |
| Qwen-Image-2.1 | Up to 10 | Edits and text to image in one model; mark local edits with circles, painted notes or masks |

`inspect-model.mjs` recognises 2511 by its `__index_timestep_zero__` marker and 2.1 by its own keys. ComfyUI checks no key that separates Edit and Edit-2509 from Qwen-Image, so the file name says which one a file is.

## Write the instruction

From Qwen's official edit rewriter (`polish_edit_prompt` in QwenLM/Qwen-Image), which is what Qwen runs on an edit request:

- **Direct and specific.** One instruction per change. Name each change when there are several.
- **Say which image's element changes** when there is more than one image: the rewriter requires it.
- **Replace:** "Replace Y with X", then the key look of X: `Replace the paper cup with a white ceramic mug.`
- **Add:** what, where, and how it looks. **Remove:** what. Leave the rest of the picture out of it.
- **Text:** the new words in double quotes, in their original language and capitals: `Change the sign's text from "SALE" to "OPEN".`
- **People:** keep who they are. Make expression changes natural and subtle, as the rewriter asks.
- **Say what stays the same** when it matters: ComfyUI's official 2.1 example ends with "preserve the original facial features, hair, body shape and pose".
- **Don't describe the whole image again.** ComfyUI's edit node already asks the encoder to describe the input and work out how the instruction changes it.
- **No `(word:1.2)` weights.** ComfyUI passes the brackets through as text.

The rewriter uses fixed wording for three jobs. Use it exactly:

| Job | Prompt |
| --- | --- |
| Restore or colourise an old photo | `Restore and colorize the photo.` |
| Inpaint | `Perform inpainting on this image. The original caption is: <what the whole picture shows>` |
| Outpaint | `Extend the image beyond its boundaries using outpainting. The original caption is: <what the whole picture shows>` |

## Several images

| Model | Node | How to name the images | Most images |
| --- | --- | --- | --- |
| Edit-2509, Edit-2511 | TextEncodeQwenImageEditPlus | `picture 1`, `picture 2`, `picture 3`: the node labels its `image1` to `image3` inputs "Picture 1:" to "Picture 3:" in that order | 3 |
| Qwen-Image-2.1 | Text Encode Qwen Image 2.1 | `<image1>`, `<image2>` and so on. Qwen's 2.1 rewriter forbids "the first image" | 10 in the templates (the node has 16 slots) |

Official examples:

```text
Replace the girl of picture 1 with the boy of picture 2, keeping picture 2's background unchanged
```

```text
Keep the character and pose in <image1> unchanged, put this light blue denim shirt from <image2> on the character, preserve the original facial features, hair, body shape and pose
```

The first is from Qwen's edit rewriter, the second from ComfyUI's 2.1 guide.

## Settings

Every ComfyUI template uses sampler `euler`, scheduler `simple`.

| Setup | Steps | CFG | Notes |
| --- | --- | --- | --- |
| Edit-2509 and Edit-2511, model cards | 40 | true CFG 4 | Negative `" "` (one space) |
| Edit and Edit-2509, ComfyUI templates (ship with a Lightning 4-step LoRA) | 4 | 1 | ModelSamplingAuraFlow shift 3, CFGNorm 1, no negative |
| Edit-2511, ComfyUI, Lightning LoRA on (the default) | 4 | 1 | Shift 3.1, CFGNorm 1, no negative |
| Edit-2511, ComfyUI, Lightning LoRA off | 40 | 4 | ComfyUI's guide says CFG 4; the saved template reads 3 |
| Qwen-Image-2.1 base, ComfyUI | 25 | 1 | No negative at CFG 1 |
| Qwen-Image-2.1-Turbo | 8 | 1 | Its own fixed schedule |

The Lightning LoRAs come from lightx2v (ModelTC), not from Qwen, in 4-step and 8-step versions for each editor.

## FAIL and PASS

The user attaches a photo of a man at a desk and a photo of a green armchair, and asks "put him in that chair" on Edit-2509.

FAIL:

```text
A man with short brown hair in a blue shirt sitting in a green velvet armchair in a bright room, high quality, detailed, no artifacts
```

It re-describes both pictures, names neither image, and ends in a negation.

PASS:

```text
Place the man from picture 1 sitting in the green armchair from picture 2, keeping his face, hair and clothes unchanged and keeping the room from picture 2 as it is.
```

```text
Negative: none: the Lightning template runs at CFG 1
Settings: steps 4, cfg 1, euler, simple, shift 3, image1 = the man, image2 = the chair
```
