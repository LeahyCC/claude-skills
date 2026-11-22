# SDXL tag models

Pony Diffusion V6 XL, NoobAI-XL (epsilon and v-prediction), Illustrious XL, and checkpoints built on them. They read comma-separated tags, mostly Danbooru tags, through SDXL's two CLIP encoders. A checkpoint takes its base model's tags.

Pony V7 is built on AuraFlow, not SDXL, and its special tags are much weaker than V6's. It is not covered here.

## Contents

- [Which base](#which-base)
- [Tag rules for all of them](#tag-rules-for-all-of-them)
- [Pony Diffusion V6 XL](#pony-diffusion-v6-xl)
- [NoobAI-XL](#noobai-xl)
- [Illustrious XL](#illustrious-xl)
- [Sizes](#sizes)
- [FAIL and PASS](#fail-and-pass)

## Which base

The tensors cannot tell Pony, Illustrious and NoobAI apart: all three are SDXL. `inspect-model.mjs` reads the split from a sidecar file (Civitai's base model: `Pony`, `Illustrious`, `NoobAI`, `SDXL 1.0`), or, for a LoRA, from the checkpoint it was trained on (`ss_sd_model_name`). Otherwise the model page's "Base Model" field says.

It also reports v-prediction. ComfyUI switches to v-prediction when the checkpoint carries a `v_pred` key, and turns on zero terminal SNR when it also carries `ztsnr`. If the model page says v-prediction but the script found no key, add a ModelSamplingDiscrete node set to `v_prediction` with `zsnr` on.

## Tag rules for all of them

- **Commas between tags, spaces inside them.** The model cards write `best quality` and `very awa`, not `best_quality`.
- **Escape brackets that belong to a tag name:** `ganyu \(genshin impact\)`. ComfyUI reads bare brackets as weight.
- **Weights:** `(tag:1.2)` raises a tag, `(tag:0.8)` lowers it, and bare `(tag)` means 1.1 (ComfyUI's text encode docs). Weight one or two tags, not every tag.
- **Variations:** `{red|blue|green} dress` picks one option each time the prompt is queued.
- **Order:** count first (`1girl`, `2boys`), then who, then what they look like and do, then the place. NoobAI's card gives the full order below.
- **CLIP skip.** ComfyUI already runs SDXL on the second-to-last CLIP layer, which is what "CLIP skip 2" means elsewhere, so no node is needed. A CLIP Set Last Layer node at its default of -1 switches SDXL to the last layer instead. If a workflow has that node, set it to -2.
- **LoRAs** load with LoraLoader, which has a model strength and a clip strength. See [loras.md](./loras.md).

## Pony Diffusion V6 XL

Start every prompt with the full score string. The author says `score_9` on its own still works but has a much weaker effect, because of how the scores were trained:

```text
score_9, score_8_up, score_7_up, score_6_up, score_5_up, score_4_up
```

Then, in this order:

1. A source tag: `source_anime`, `source_cartoon`, `source_furry` or `source_pony`.
2. A rating tag: `rating_safe`, `rating_questionable` or `rating_explicit`.
3. The description, in tags or short phrases.

- No "masterpiece", "best quality" or similar words. The score string does that job.
- The model is built to need no negative prompt. Pseudo-signatures can still appear, and a negative does not remove them.
- Settings from the author: Euler a (`euler_ancestral`), 25 steps, around 1024 px, CLIP skip 2. The author gives no CFG. Pony-based checkpoint pages commonly list 5 to 7 (community).

## NoobAI-XL

Built on Illustrious, with Danbooru data up to about October 2024. The official tag order:

```text
<1girl/1boy/1other/...>, <character>, <series>, <artists>, <special tags>, <general tags>, <other tags>
```

The card's recommended prompts start with the special tags:

```text
masterpiece, best quality, newest, absurdres, highres, safe,
```

```text
Negative: nsfw, worst quality, old, early, low quality, lowres, signature, username, logo, bad hands, mutated hands, mammal, anthro, furry, ambiguous form, feral, semi-anthro
```

`safe` in the positive and `nsfw` in the negative are rating tags. The card's defaults are for safe images.

| Special tags | Meaning |
| --- | --- |
| `masterpiece`, `best quality`, `good quality`, `normal quality`, `worst quality` | Quality, by percentile: above the 95th, the 85th, the 60th, the 30th, and the bottom 30% |
| `very awa`, `worst aesthetic` | Aesthetic score, top and bottom 5% (v-pred card). Yes, `very awa` is the real tag |
| `newest`, `recent`, `mid`, `early`, `old` | Period: 2021 to 2024, 2018 to 2020, 2014 to 2017, 2011 to 2014, 2005 to 2010 |
| `year 2021` | A single year (v-pred card) |

| Model | Sampler | CFG | Steps |
| --- | --- | --- | --- |
| NoobAI-XL 1.1 (epsilon) | Euler a | 5 to 6 | 25 to 30 |
| NoobAI-XL V-Pred 1.0 | Euler only; the card says other samplers "will not work properly" | 4 to 5 | 28 to 35 |

## Illustrious XL

| Version | Prompts | Notes |
| --- | --- | --- |
| v0.1 | Tags | Euler a, 20 to 28 steps, CFG 5 to 7.5. Quality tags: `worst quality`, `bad quality`, `average quality`, `good quality`, `best quality`, `masterpiece`. Don't lean on composition tags such as `close-up` or `cowboy shot` |
| v1.0 | Tags plus natural language | Native 1536×1536, works from 512 to 1536 |
| v1.1 | More natural language | Settings not given |
| v2.0 | Not documented further | Settings not given |

Illustrious-based checkpoints use Danbooru tags, so NoobAI's order is a good default for them. A checkpoint's own page gives its sampler and CFG, and those win over this table.

Other SDXL checkpoints, such as photographic ones, follow their own model page. The rules above (weights, escapes, CLIP skip) still apply.

## Sizes

Keep the total near 1024×1024 and pick from NoobAI's list: 768×1344, 832×1216, 896×1152, 1024×1024, 1152×896, 1216×832, 1344×768. Illustrious v1.0 and later go up to 1536.

## FAIL and PASS

The user asks for "an anime girl with long silver hair reading a book in a cafe" on Pony V6.

FAIL:

```text
masterpiece, best quality, a beautiful anime girl with long silver hair reading a book in a cafe, 8k, ultra detailed
```

No score string, quality words Pony ignores, and a sentence where the model wants tags.

PASS (Pony V6):

```text
score_9, score_8_up, score_7_up, score_6_up, score_5_up, score_4_up, source_anime, rating_safe, 1girl, solo, long hair, silver hair, reading, holding book, cafe
```

```text
Negative: none (Pony needs none)
Settings: 832×1216, steps 25, cfg 6, euler_ancestral, no CLIP Set Last Layer node
```

The same idea on NoobAI-XL V-Pred:

```text
masterpiece, best quality, newest, absurdres, highres, safe, 1girl, solo, long hair, silver hair, reading, holding book, cafe
```

```text
Negative: the card's negative above
Settings: 832×1216, steps 30, cfg 4.5, euler, v-prediction (from the file's v_pred key)
```
