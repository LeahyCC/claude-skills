#!/usr/bin/env node
// Says what a local model file is, from the file itself, so the prompt is written for the right model.
//
//   node inspect-model.mjs <file or folder> [...]   one block per model file; folders are searched recursively
//   node inspect-model.mjs <folder> --rows          table rows for ~/.claude/media-prompt/models.md
//   node inspect-model.mjs <file> --json            everything found, as JSON
//   node inspect-model.mjs <file> --tags 25         training caption tags to list (default 10, 0 hides them)
//
// It reads the safetensors header only (tensor names, shapes and the __metadata__ block), never
// the weights, plus the sidecar files that model managers leave next to a model:
//
//   tensor names        family, checkpoint or LoRA, LoRA rank, v-prediction (the keys ComfyUI checks on load)
//   __metadata__        modelspec.* (title, architecture, trigger phrase) and ss_* (trainer's base model, caption tags)
//   NAME.civitai.info   Civitai base model and trained words (Civitai Helper)
//   NAME.json           activation text and preferred weight (A1111 and Forge)
//   NAME.swarm.json     SwarmUI's copy of the modelspec fields
//   NAME.metadata.json  ComfyUI LoRA Manager
//
// Every value says where it came from. What the file can't show stays unknown: SDXL tensors look
// the same for Pony, Illustrious and NoobAI, and Wan 2.2's high and low noise experts have the same
// tensors. Only .safetensors headers are read; .gguf files get their sidecars only.
// Exit 0 when every file was read, 1 when one could not be, 2 for bad arguments. Node built-ins only.

import { closeSync, existsSync, openSync, readFileSync, readSync, readdirSync, statSync } from 'node:fs'
import { basename, extname, join } from 'node:path'

// safetensors refuses headers over 100 MB (MAX_HEADER_SIZE in its tensor.rs), so a bigger
// length prefix means the file is not safetensors at all.
const MAX_HEADER_BYTES = 100_000_000
const LENGTH_PREFIX_BYTES = 8
const DEFAULT_TAG_COUNT = 10
const BYTES_PER_GB = 1024 ** 3
const MODEL_EXTENSIONS = new Set(['.safetensors', '.gguf'])

// ---------------------------------------------------------------------------------------------
// Families. `file` is the resource that holds the prompt rules for that family.

const FAMILIES = {
  'sdxl': { label: 'SDXL (Pony, Illustrious, NoobAI or another SDXL finetune)', file: 'sdxl-tags.md' },
  'sdxl-pony': { label: 'SDXL, Pony', file: 'sdxl-tags.md' },
  'sdxl-illustrious': { label: 'SDXL, Illustrious', file: 'sdxl-tags.md' },
  'sdxl-noobai': { label: 'SDXL, NoobAI', file: 'sdxl-tags.md' },
  'sd1': { label: 'Stable Diffusion 1.x or 2.x', file: null },
  'flux1': { label: 'FLUX.1', file: 'flux.md' },
  'flux1-krea': { label: 'FLUX.1 Krea [dev]', file: 'flux.md' },
  'flux2': { label: 'FLUX.2', file: 'flux.md' },
  'flux2-dev': { label: 'FLUX.2 [dev]', file: 'flux.md' },
  'flux2-klein-4b': { label: 'FLUX.2 [klein] 4B', file: 'flux.md' },
  'flux2-klein-9b': { label: 'FLUX.2 [klein] 9B', file: 'flux.md' },
  'flux3': { label: 'FLUX 3', file: null },
  'krea2': { label: 'Krea 2', file: 'krea2.md' },
  'qwen-image': { label: 'Qwen-Image', file: 'qwen-image.md' },
  'qwen-image-edit': { label: 'Qwen-Image-Edit', file: 'qwen-image-edit.md' },
  'qwen-image-2.1': { label: 'Qwen-Image-2.1 (text to image and edit in one model)', file: 'qwen-image.md' },
  'wan': { label: 'Wan', file: 'wan.md' },
  'wan22-t2v': { label: 'Wan 2.2 T2V-A14B', file: 'wan.md' },
  'wan22-i2v': { label: 'Wan 2.2 I2V-A14B', file: 'wan.md' },
  'wan22-5b': { label: 'Wan 2.2 TI2V-5B', file: 'wan.md' },
  'ltx': { label: 'LTX', file: 'ltx.md' },
  'chroma': { label: 'Chroma', file: null },
  'auraflow': { label: 'AuraFlow (Pony V7)', file: null },
  'hunyuan-video': { label: 'HunyuanVideo', file: null },
  'lumina': { label: 'Lumina 2 or Z-Image', file: null },
}

// Base model names as trainers, SwarmUI and Civitai write them, most specific first. Civitai says
// its list changes as it adds families, so these are patterns, not a fixed enum.
// Short names need a boundary so that "swan" is not Wan and "ponytail" is not Pony.
const NAME_PATTERNS = [
  [/pony[ _-]?v7|auraflow/i, 'auraflow'],
  [/pony(?!tail)/i, 'sdxl-pony'],
  [/illustrious/i, 'sdxl-illustrious'],
  [/noobai/i, 'sdxl-noobai'],
  [/sdxl|sd_xl|stable-diffusion-xl/i, 'sdxl'],
  [/flux[ ._-]?3/i, 'flux3'],
  [/flux[ ._-]?2.*klein.*4b/i, 'flux2-klein-4b'],
  [/flux[ ._-]?2.*klein.*9b/i, 'flux2-klein-9b'],
  [/flux[ ._-]?2/i, 'flux2-dev'],
  [/flux[ ._-]?1.*krea/i, 'flux1-krea'],
  [/krea[ ._-]?2/i, 'krea2'],
  [/flux/i, 'flux1'],
  [/qwen.*2\.1/i, 'qwen-image-2.1'],
  [/qwen.*edit/i, 'qwen-image-edit'],
  [/qwen/i, 'qwen-image'],
  [/(^|[^a-z])wan.*ti2v|ti2v.*5b/i, 'wan22-5b'],
  [/(^|[^a-z])wan.*2[._]?2.*(i2v|image2video)/i, 'wan22-i2v'],
  [/(^|[^a-z])wan.*2[._]?2.*t2v/i, 'wan22-t2v'],
  [/(^|[^a-z])wan([^a-z]|$)/i, 'wan'],
  [/(^|[^a-z])ltx|lightricks/i, 'ltx'],
  [/(^|[^a-z])chroma([^a-z]|$)/i, 'chroma'],
  [/hunyuan/i, 'hunyuan-video'],
  [/(^|[^a-z])(lumina|z[ _-]?image)([^a-z]|$)/i, 'lumina'],
  [/(^|[^a-z])sd[ _]?v?[12]([^0-9]|5|$)|stable-diffusion-v[12]/i, 'sd1'],
]

const familyFromName = (text) => NAME_PATTERNS.find(([pattern]) => pattern.test(text))?.[1] ?? null

// ---------------------------------------------------------------------------------------------
// Reading files

function readExactly(fd, length, position) {
  const buffer = Buffer.alloc(length)
  let filled = 0
  while (filled < length) {
    const read = readSync(fd, buffer, filled, length - filled, position + filled)
    if (read === 0) throw new Error('the file ends inside its header')
    filled += read
  }
  return buffer
}

function readSafetensorsHeader(path) {
  const fd = openSync(path, 'r')
  try {
    const length = readExactly(fd, LENGTH_PREFIX_BYTES, 0).readBigUInt64LE(0)
    if (length > BigInt(MAX_HEADER_BYTES)) {
      throw new Error(`the header length (${length} bytes) is over the 100 MB safetensors limit, so this is not a safetensors file`)
    }
    const text = readExactly(fd, Number(length), LENGTH_PREFIX_BYTES).toString('utf8')
    if (!text.startsWith('{')) throw new Error('the header does not start with "{", so this is not a safetensors file')
    const { __metadata__: metadata = {}, ...tensors } = JSON.parse(text)
    return { metadata, tensors }
  } finally {
    closeSync(fd)
  }
}

const readJson = (path) => {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return null
  }
}

// Metadata values are strings; kohya and ai-toolkit store JSON inside some of them.
const parseJsonString = (value) => {
  if (typeof value !== 'string') return value ?? null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------------------------
// Full models: the key checks from ComfyUI's detect_unet_config, in the order it runs them.

// ComfyUI strips one of these before matching (unet_prefix_from_state_dict). Files holding only
// the diffusion model have no prefix.
const PREFIXES = ['model.diffusion_model.', 'model.model.', 'model.', 'diffusion_model.', '']

const MODEL_CHECKS = [
  ['krea2', (has) => has('txtfusion.projector.weight')],
  ['qwen-image-2.1', (has) => has('txt_in.text_norm.weight') && has('modulation.1.weight')],
  ['qwen-image', (has) => has('txt_norm.weight')],
  ['flux2', (has) => has('double_stream_modulation_img.lin.weight')],
  ['chroma', (has, hasStart) => hasStart('distilled_guidance_layer.0.norms.0.') || hasStart('distilled_guidance_layer.norms.0.')],
  ['flux1', (has) => has('double_blocks.0.img_attn.norm.key_norm.weight') || has('double_blocks.0.img_attn.norm.key_norm.scale')],
  ['auraflow', (has) => has('double_layers.0.attn.w1q.weight')],
  ['hunyuan-video', (has) => has('txt_in.individual_token_refiner.blocks.0.norm1.weight')],
  ['wan', (has) => has('head.modulation')],
  ['ltx', (has) => has('adaln_single.emb.timestep_embedder.linear_1.bias')],
  ['lumina', (has) => has('cap_embedder.1.weight') && has('noise_refiner.0.attention.k_norm.weight')],
  ['sd-unet', (has) => has('input_blocks.0.0.weight')],
]

// Wan's width (head.modulation's last dimension) gives the size, and the input channels of
// patch_embedding say what the model is conditioned on.
const WAN_SIZE_BY_WIDTH = { 5120: '14B', 3072: '5B', 1536: '1.3B' }
const WAN_INPUT_BY_CHANNELS = {
  16: 'text to video',
  36: 'image to video (image latent joined to the noise)',
  48: 'text and image to video (TI2V-5B, Wan 2.2 VAE)',
}
const WAN_VARIANT_KEYS = [
  ['vace_patch_embedding.weight', 'VACE'],
  ['control_adapter.conv.weight', 'camera control'],
  ['casual_audio_encoder', 'S2V (speech to video)'],
  ['audio_proj', 'HuMo'],
  ['face_adapter', 'Animate'],
]

// FLUX.2 hidden sizes from BFL's flux2 model.py (Flux2Params, Klein9BParams, Klein4BParams).
// ComfyUI reads the same number from img_in.weight. [dev] has 8 double blocks, [klein] 4B 5.
const FLUX2_BY_WIDTH = { 6144: 'flux2-dev', 4096: 'flux2-klein-9b', 3072: 'flux2-klein-4b' }
const FLUX1_WIDTH = 3072
const KLEIN_4B_DOUBLE_BLOCKS = 5

// SDXL's ADM input (label_emb) is 2816 wide for the base model and 2560 for the refiner.
const SDXL_BASE_ADM_WIDTH = 2816
const SDXL_REFINER_ADM_WIDTH = 2560

function detectModel(tensors) {
  const keys = Object.keys(tensors)
  for (const prefix of PREFIXES) {
    const has = (key) => (prefix + key) in tensors
    const hasStart = (start) => keys.some((key) => key.startsWith(prefix + start))
    const match = MODEL_CHECKS.find(([, test]) => test(has, hasStart))
    if (match) return describeModel(match[0], prefix, tensors, keys)
  }
  return null
}

function describeModel(check, prefix, tensors, keys) {
  const shape = (key) => tensors[prefix + key]?.shape
  const has = (key) => (prefix + key) in tensors
  const hasAnywhere = (part) => keys.some((key) => key.includes(part))
  const found = { family: check, notes: [], evidence: '' }

  if (check === 'qwen-image-2.1') found.evidence = 'txt_in.text_norm.weight and modulation.1.weight'
  if (check === 'qwen-image') {
    found.evidence = 'txt_norm.weight'
    if (has('__index_timestep_zero__')) {
      found.family = 'qwen-image-edit'
      found.notes.push('Qwen-Image-Edit-2511 (its __index_timestep_zero__ marker)')
    } else if (has('time_text_embed.addition_t_embedding.weight')) {
      found.notes.push('Qwen-Image-Layered')
    } else {
      found.notes.push('no key ComfyUI checks separates Qwen-Image, 2512, Edit and Edit-2509: the file name or model page says which')
    }
  }
  if (check === 'flux2') {
    const width = shape('img_in.weight')?.[0]
    found.evidence = `double_stream_modulation_img.lin.weight, ${width} wide`
    if (hasAnywhere('qwen3_4b.transformer.')) found.family = 'flux2-klein-4b'
    else if (hasAnywhere('qwen3_8b.transformer.')) found.family = 'flux2-klein-9b'
    else if (hasAnywhere('mistral3_24b.transformer.')) found.family = 'flux2-dev'
    else if (FLUX2_BY_WIDTH[width]) found.family = FLUX2_BY_WIDTH[width]
    else found.notes.push('[dev] or [klein]: the width did not match a known FLUX.2')
    if (found.family.startsWith('flux2-klein')) found.notes.push('distilled and base [klein] share these tensors: "base" in the file name means the 50-step model')
  }
  if (check === 'krea2') found.evidence = 'txtfusion.projector.weight'
  if (check === 'auraflow') found.evidence = 'double_layers.0.attn.w1q.weight'
  if (check === 'flux1') {
    found.evidence = 'double_blocks.0.img_attn.norm.key_norm'
    found.notes.push(has('guidance_in.in_layer.weight')
      ? 'has a guidance input: [dev]-style (dev, Krea [dev], Kontext and their finetunes)'
      : 'no guidance input: [schnell]-style')
  }
  if (check === 'wan') {
    found.evidence = 'head.modulation'
    const width = shape('head.modulation')?.at(-1)
    const channels = shape('patch_embedding.weight')?.[1]
    if (WAN_SIZE_BY_WIDTH[width]) found.notes.push(`${WAN_SIZE_BY_WIDTH[width]} (width ${width})`)
    if (WAN_INPUT_BY_CHANNELS[channels]) found.notes.push(WAN_INPUT_BY_CHANNELS[channels])
    if (has('img_emb.proj.0.bias')) found.notes.push('Wan 2.1 image to video (CLIP image input)')
    for (const [key, name] of WAN_VARIANT_KEYS) if (hasAnywhere(key)) found.notes.push(name)
    if (width === 3072 && channels === 48) found.family = 'wan22-5b'
    else if (width === 5120 && channels === 36 && !has('img_emb.proj.0.bias')) found.family = 'wan22-i2v'
    if (width === 5120) found.notes.push("Wan 2.1 and 2.2's high and low noise experts share these tensors: the file name says which")
  }
  if (check === 'ltx') {
    found.evidence = 'adaln_single.emb.timestep_embedder.linear_1.bias'
    found.notes.push(has('audio_adaln_single.linear.weight')
      ? 'video and audio: LTX-2, 2.3 or 2.5'
      : 'video only: LTX-Video 0.9.x')
  }
  if (check === 'chroma') found.evidence = 'distilled_guidance_layer'
  if (check === 'hunyuan-video') found.evidence = 'txt_in.individual_token_refiner'
  if (check === 'lumina') found.evidence = 'cap_embedder.1.weight'
  if (check === 'sd-unet') {
    found.evidence = 'input_blocks.0.0.weight'
    const admWidth = shape('label_emb.0.0.weight')?.[1]
    if (admWidth === SDXL_BASE_ADM_WIDTH) found.family = 'sdxl'
    else if (admWidth === SDXL_REFINER_ADM_WIDTH) {
      found.family = 'sdxl'
      found.notes.push('SDXL refiner')
    } else found.family = 'sd1'
  }
  return found
}

// Prediction type. ComfyUI reads these top-level keys in supported_models.SDXL.model_type.
function predictionType(tensors) {
  if ('edm_mean' in tensors && 'edm_std' in tensors) return 'EDM (Playground v2.5 style)'
  if ('edm_vpred.sigma_max' in tensors) return 'v-prediction, EDM schedule'
  if ('v_pred' in tensors) return 'ztsnr' in tensors ? 'v-prediction with zero terminal SNR' : 'v-prediction'
  return null
}

// A full checkpoint carries its text encoder and VAE; a diffusion-model file does not.
function modelKind(keys) {
  const hasTextEncoder = keys.some((key) => /^(conditioner\.embedders\.|cond_stage_model\.|text_encoders?\.)/.test(key))
  const hasVae = keys.some((key) => /^(first_stage_model\.|vae\.)/.test(key))
  return hasTextEncoder && hasVae ? 'checkpoint (model, text encoder and VAE)' : 'diffusion model only (text encoder and VAE are separate files)'
}

// Files that are not a diffusion model or a LoRA, so the user is not told "unknown" about a VAE.
const OTHER_KINDS = [
  [/(^|\.)encoder\.block\.0\.layer\.0\.SelfAttention\.q\.weight$/, 'text encoder (T5 or umT5)'],
  [/(^|\.)layers\.0\.self_attn\.q_proj\.weight$/, 'text encoder (a language model such as Qwen, Mistral or Gemma)'],
  [/^text_model\.encoder\.layers\.0\./, 'CLIP text encoder'],
  [/^vision_model\.encoder\.layers\.0\./, 'CLIP vision encoder'],
  [/(^|\.)decoder\.(conv_in|up\.0|up_blocks\.0)/, 'VAE'],
]

const otherKind = (keys) => OTHER_KINDS.find(([pattern]) => keys.some((key) => pattern.test(key)))?.[1] ?? null

// ---------------------------------------------------------------------------------------------
// LoRAs. Metadata and sidecars name the base model directly; tensor names are a fallback hint.

const LORA_KEY = /(lora_down|lora_up|lora_A|lora_B|lora\.down|lora\.up|lokr_w[12]|hada_w[12]_[ab])(\.weight)?$/
const LORA_DOWN = /(lora_down|lora_A|lora\.down)\.weight$/

const isLora = (keys) => keys.some((key) => LORA_KEY.test(key))

function loraRank(tensors) {
  const down = Object.keys(tensors).find((key) => LORA_DOWN.test(key))
  return down ? tensors[down].shape?.[0] ?? null : null
}

// Input width of the first matching lora_down / lora_A tensor (shape is [rank, in_features]).
function loraInputWidth(tensors, pattern) {
  const key = Object.keys(tensors).find((name) => pattern.test(name) && LORA_DOWN.test(name))
  return key ? tensors[key].shape?.[1] ?? null : null
}

// SDXL cross-attention reads a 2048-wide text embedding, SD 1.x 768 and SD 2.x 1024.
const SD_CONTEXT_WIDTH = { 2048: 'sdxl', 768: 'sd1', 1024: 'sd1' }

// Highest block index + 1 for a pattern whose first group is the index.
function countBlocks(keys, pattern) {
  let count = 0
  for (const key of keys) {
    const match = pattern.exec(key)
    if (match) count = Math.max(count, Number(match[1]) + 1)
  }
  return count
}

// FLUX.1 and FLUX.2 LoRAs use the same block names. The attention width and the number of
// double blocks tell them apart when the LoRA trains those layers.
function fluxLoraFamily(tensors, keys) {
  const width = loraInputWidth(tensors, /(double_blocks[._]\d+[._]img_attn[._]qkv|(?<!single_)transformer_blocks[._]\d+[._]attn[._]to_q)[._]/)
  const doubles = countBlocks(keys, /(?:double_blocks|(?<!single_)transformer_blocks)[._](\d+)[._]/)
  if (width && width !== FLUX1_WIDTH && FLUX2_BY_WIDTH[width]) {
    return { family: FLUX2_BY_WIDTH[width], evidence: `FLUX-style blocks, ${width} wide` }
  }
  if (width === FLUX1_WIDTH && doubles > KLEIN_4B_DOUBLE_BLOCKS) {
    return { family: 'flux1', evidence: `FLUX-style blocks, ${width} wide, ${doubles} double blocks (FLUX.1 has 19; HunyuanVideo LoRAs look alike)` }
  }
  if (width === FLUX1_WIDTH) {
    return { family: 'flux2-klein-4b', evidence: `FLUX-style blocks, ${width} wide, ${doubles} double blocks ([klein] 4B has 5; a FLUX.1 LoRA that skips later blocks looks the same)`, unsure: true }
  }
  return { family: 'flux1', evidence: 'FLUX-style double and single blocks (FLUX.1 or FLUX.2: the width did not say)', unsure: true }
}

function loraFamilyFromTensors(tensors) {
  const keys = Object.keys(tensors)
  const any = (pattern) => keys.some((key) => pattern.test(key))
  if (any(/(^|[._])double_layers[._]\d+[._]attn[._]w1q/)) {
    return { family: 'auraflow', evidence: 'AuraFlow block names (double_layers, w1q)' }
  }
  if (any(/(^|[._])blocks[._]\d+[._]attn[._]w[qkvo][._]/)) {
    return { family: 'krea2', evidence: 'Krea 2 block names (blocks.N.attn.wq)', unsure: true }
  }
  if (any(/(^|[._])(input_blocks|output_blocks|middle_block|down_blocks|up_blocks|mid_block)[._]/)) {
    if (any(/lora_te[12]_|text_encoder_2/)) return { family: 'sdxl', evidence: 'UNet block names and two text encoders' }
    const width = loraInputWidth(tensors, /attn2[._]to_k/)
    if (SD_CONTEXT_WIDTH[width]) return { family: SD_CONTEXT_WIDTH[width], evidence: `UNet block names, cross-attention ${width} wide` }
    return { family: 'sdxl', evidence: 'UNet block names (SDXL or SD 1.x; the width did not say)', unsure: true }
  }
  if (any(/(^|[._])blocks[._]\d+[._](self_attn|cross_attn|ffn)[._]/)) {
    const width = loraInputWidth(tensors, /self_attn[._]q[._]/)
    const size = WAN_SIZE_BY_WIDTH[width]
    const notes = size ? [`${size} (width ${width})`] : []
    if (any(/cross_attn[._](k|v)_img/)) notes.push('Wan 2.1 image to video (trains the CLIP image layers)')
    return { family: size === '5B' ? 'wan22-5b' : 'wan', evidence: 'Wan block names (self_attn, cross_attn, ffn)', notes }
  }
  if (any(/transformer_blocks[._]\d+[._](img_mlp|txt_mlp|img_mod|txt_mod)/)) {
    return { family: 'qwen-image', evidence: 'Qwen-Image block names (img_mlp, txt_mlp)' }
  }
  if (any(/(^|[._])(double_blocks|single_blocks|single_transformer_blocks)[._]\d+/)) return fluxLoraFamily(tensors, keys)
  // Qwen-Image has 60 dual-stream blocks and no single blocks; FLUX.1 has 19 plus single blocks.
  const qwenAttention = any(/transformer_blocks[._]\d+[._]attn[._](add_q_proj|add_k_proj|to_add_out)/)
  if (qwenAttention && countBlocks(keys, /transformer_blocks[._](\d+)[._]/) > 19) {
    return { family: 'qwen-image', evidence: 'dual-stream attention in more than 19 blocks and no single blocks (Qwen-Image has 60)', unsure: true }
  }
  if (any(/transformer_blocks[._]\d+[._](attn1|attn2)[._]/)) {
    return { family: 'ltx', evidence: 'attn1 and attn2 block names (LTX style)', unsure: true }
  }
  return null
}

// ---------------------------------------------------------------------------------------------
// Metadata and sidecars

const KOHYA_FOLDER = /^(\d+)_(.+)$/

function fromMetadata(metadata, tagCount) {
  const found = { base: [], triggers: [], folders: [], tags: [], strength: null, title: null, prediction: null }
  const note = (list, value, source) => value && list.push({ value: String(value), source })
  note(found.base, metadata['modelspec.architecture'], 'modelspec.architecture')
  note(found.base, metadata.ss_base_model_version, 'ss_base_model_version')
  note(found.base, metadata.ss_sd_model_name, 'ss_sd_model_name, the checkpoint it was trained on')
  note(found.triggers, metadata['modelspec.trigger_phrase'], 'modelspec.trigger_phrase')
  note(found.triggers, metadata['modelspec.usage_hint'], 'modelspec.usage_hint')
  found.title = metadata['modelspec.title'] ?? metadata.ss_output_name ?? null
  found.prediction = metadata['modelspec.prediction_type'] ?? null
  const swarmWeight = metadata['modelspec.lora_default_weight'] ?? metadata.lora_default_weight
  if (swarmWeight) found.strength = { value: swarmWeight, source: 'lora_default_weight (SwarmUI)' }

  // kohya names training folders "<repeats>_<words>": the words are usually the trigger.
  // ai-toolkit writes {"1_<trigger>": {"<trigger>": 1}} on purpose so A1111 shows it.
  const tagFrequency = parseJsonString(metadata.ss_tag_frequency) ?? {}
  const folders = new Set([...Object.keys(parseJsonString(metadata.ss_dataset_dirs) ?? {}), ...Object.keys(tagFrequency)])
  for (const folder of folders) {
    const match = KOHYA_FOLDER.exec(folder)
    if (match) found.folders.push({ value: match[2], source: `training folder "${folder}"` })
  }
  const counts = new Map()
  for (const tags of Object.values(tagFrequency)) {
    for (const [tag, count] of Object.entries(tags ?? {})) counts.set(tag, (counts.get(tag) ?? 0) + Number(count))
  }
  found.tags = [...counts].sort((a, b) => b[1] - a[1]).slice(0, tagCount).map(([tag, count]) => `${tag} (${count})`)
  return found
}

// Sidecar names, most specific first. A1111 writes NAME.json; Civitai Helper NAME.civitai.info;
// SwarmUI NAME.swarm.json; ComfyUI LoRA Manager NAME.metadata.json.
const SIDECARS = ['.civitai.info', '.metadata.json', '.swarm.json', '.cm-info.json', '.json']

// Keys that hold trigger words, base model and weight across those tools. LoRA Manager nests
// the Civitai object, so one level of nesting is searched too. A1111's "sd version" is left
// out: it calls every LoRA that is not SDXL or SD 2 "SD1", FLUX included.
const TRIGGER_KEYS = ['trainedWords', 'TrainedWords', 'activation text', 'modelspec.trigger_phrase']
const BASE_KEYS = ['baseModel', 'base_model', 'modelspec.architecture']
const WEIGHT_KEYS = ['preferred weight', 'modelspec.lora_default_weight', 'lora_default_weight']

function findKey(object, names, depth = 1) {
  if (!object || typeof object !== 'object') return undefined
  for (const name of names) if (object[name] !== undefined && object[name] !== '') return object[name]
  if (depth === 0) return undefined
  for (const value of Object.values(object)) {
    const found = findKey(value, names, depth - 1)
    if (found !== undefined) return found
  }
  return undefined
}

const asWords = (value) => (Array.isArray(value) ? value : String(value).split(','))
  .map((word) => String(word).trim())
  .filter(Boolean)

function fromSidecars(modelPath) {
  const extension = extname(modelPath)
  const stem = extension ? modelPath.slice(0, -extension.length) : modelPath
  const found = { base: [], triggers: [], strength: null, files: [] }
  for (const suffix of SIDECARS) {
    const path = stem + suffix
    if (!existsSync(path)) continue
    const data = readJson(path)
    if (!data) continue
    const source = basename(path)
    found.files.push(source)
    const base = findKey(data, BASE_KEYS)
    if (base) found.base.push({ value: String(base), source })
    const triggers = findKey(data, TRIGGER_KEYS)
    if (triggers) for (const word of asWords(triggers)) found.triggers.push({ value: word, source })
    // LoRA Manager keeps the recommended strength inside usage_tips, a JSON string. A1111 saves
    // a preferred weight of 0 when nobody chose one, so 0 counts as unset.
    const weight = findKey(data, WEIGHT_KEYS) ?? parseJsonString(data.usage_tips)?.strength
    if (weight !== undefined && Number(weight) !== 0 && !found.strength) found.strength = { value: weight, source }
  }
  return found
}

// ---------------------------------------------------------------------------------------------
// Putting it together

// Hints from the file name are labelled as hints. Wan's high and low noise experts, and FLUX.2
// [klein] base and distilled, cannot be told apart any other way.
function nameHints(name) {
  const hints = []
  if (/(^|[^a-z])high([^a-z]|$)/i.test(name)) hints.push('high noise (file name)')
  if (/(^|[^a-z])low([^a-z]|$)/i.test(name)) hints.push('low noise (file name)')
  if (/klein/i.test(name) && /(^|[^a-z])base([^a-z]|$)/i.test(name)) hints.push('[klein] base, 50 steps (file name)')
  return hints
}

function inspect(path, tagCount) {
  const report = { file: basename(path), path, sizeGb: Number((statSync(path).size / BYTES_PER_GB).toFixed(2)) }
  const sidecars = fromSidecars(path)
  report.hints = nameHints(report.file)
  if (extname(path).toLowerCase() !== '.safetensors') {
    report.kind = 'not read (only .safetensors headers are read; sidecars below)'
    return finish(report, null, null, sidecars)
  }
  const { metadata, tensors } = readSafetensorsHeader(path)
  const keys = Object.keys(tensors)
  report.tensorCount = keys.length
  const meta = fromMetadata(metadata, tagCount)

  if (isLora(keys)) {
    report.kind = 'LoRA'
    report.rank = Number(metadata.ss_network_dim) || loraRank(tensors)
    return finish(report, loraFamilyFromTensors(tensors), meta, sidecars)
  }
  const model = detectModel(tensors)
  if (model) {
    report.kind = modelKind(keys)
    report.prediction = predictionType(tensors) ?? meta.prediction
    return finish(report, model, meta, sidecars)
  }
  report.kind = otherKind(keys) ?? 'unknown (no family this script knows)'
  return finish(report, null, meta, sidecars)
}

// Architecture each family belongs to, and the families that name only the architecture.
const ARCHITECTURE = {
  'sdxl-pony': 'sdxl', 'sdxl-illustrious': 'sdxl', 'sdxl-noobai': 'sdxl',
  'flux1-krea': 'flux1',
  'flux2-dev': 'flux2', 'flux2-klein-4b': 'flux2', 'flux2-klein-9b': 'flux2',
  'qwen-image-edit': 'qwen-image',
  'wan22-t2v': 'wan', 'wan22-i2v': 'wan', 'wan22-5b': 'wan',
}
const architectureOf = (family) => ARCHITECTURE[family] ?? family
const GENERIC = new Set(['sdxl', 'flux1', 'flux2', 'qwen-image', 'wan', 'ltx'])

// Named bases from sidecars and metadata, most specific first. The file name counts only when
// neither names a family.
function pickNamed(named, fileName) {
  const withFamily = named.map((entry) => ({ ...entry, family: familyFromName(entry.value) })).filter((entry) => entry.family)
  const best = withFamily.find((entry) => !GENERIC.has(entry.family)) ?? withFamily[0]
  if (best) return best
  const family = familyFromName(fileName)
  return family ? { value: fileName, source: 'file name, a hint only', family, fromFileName: true } : null
}

// A named base refines the tensors when both are the same architecture and the tensors only
// name the architecture (a name alone splits SDXL into Pony, Illustrious and NoobAI). Sure
// tensors beat a name from another architecture; an unsure tensor hint never does.
function chooseFamily(fromTensors, named) {
  const tensorFamily = fromTensors?.family ?? null
  if (!named) return { family: tensorFamily, from: 'tensors' }
  if (!tensorFamily) return { family: named.family, from: 'name' }
  if (named.family === tensorFamily) return { family: tensorFamily, from: 'tensors', confirmedBy: named.fromFileName ? null : named }
  const sameArchitecture = architectureOf(tensorFamily) === architectureOf(named.family)
  if (sameArchitecture && GENERIC.has(tensorFamily)) return { family: named.family, from: 'name' }
  if (sameArchitecture) return { family: tensorFamily, from: 'tensors', conflict: !GENERIC.has(named.family) && !named.fromFileName }
  if (fromTensors.unsure) return { family: named.family, from: 'name' }
  return { family: tensorFamily, from: 'tensors', conflict: !named.fromFileName }
}

function finish(report, fromTensors, meta, sidecars) {
  const named = [...(sidecars?.base ?? []), ...(meta?.base ?? [])]
  const best = pickNamed(named, report.file)
  const choice = chooseFamily(fromTensors, best)
  report.family = choice.family
  const tensorSource = fromTensors ? `tensor names: ${fromTensors.evidence}` : null
  report.familySource = choice.from === 'name'
    ? best.source
    : choice.confirmedBy ? `${tensorSource}; ${choice.confirmedBy.source} agrees` : tensorSource
  if (choice.conflict) {
    report.conflict = `the tensors look like ${FAMILIES[fromTensors.family]?.label ?? fromTensors.family}, but ${best.source} says "${best.value}"`
  }
  report.unsure = choice.from === 'name' ? Boolean(best.fromFileName) : Boolean(fromTensors?.unsure && !choice.confirmedBy)
  report.label = FAMILIES[report.family]?.label ?? 'unknown'
  report.notes = [...(fromTensors?.notes ?? []), ...report.hints]
  report.baseNames = named
  report.title = meta?.title ?? null
  report.triggers = dedupe([...(sidecars?.triggers ?? []), ...(meta?.triggers ?? [])])
  report.folders = meta?.folders ?? []
  report.tags = meta?.tags ?? []
  report.strength = sidecars?.strength ?? meta?.strength ?? null
  report.sidecars = sidecars?.files ?? []
  report.promptFile = FAMILIES[report.family]?.file ?? null
  delete report.hints
  return report
}

const dedupe = (entries) => {
  const seen = new Set()
  return entries.filter((entry) => !seen.has(entry.value.toLowerCase()) && seen.add(entry.value.toLowerCase()))
}

// ---------------------------------------------------------------------------------------------
// Output

function printBlock(report) {
  const line = (label, value) => value && console.log(`  ${label.padEnd(10)}${value}`)
  console.log(report.file)
  line('kind', `${report.kind}${report.rank ? `, rank ${report.rank}` : ''}, ${report.sizeGb} GB`)
  line('family', `${report.label}${report.familySource ? `  (${report.familySource})` : ''}${report.unsure ? '  [hint: confirm on the model page]' : ''}`)
  line('conflict', report.conflict)
  line('base', report.baseNames.map((b) => `${b.value}  (${b.source})`).join('\n            ') || null)
  line('predicts', report.prediction)
  for (const note of report.notes) line('note', note)
  line('title', report.title)
  line('triggers', report.triggers.map((t) => `${t.value}  (${t.source})`).join('\n            ') || null)
  line('folders', report.folders.map((f) => `${f.value}  (${f.source}, often the trigger)`).join('\n            ') || null)
  line('top tags', report.tags.join(', ') || null)
  line('strength', report.strength ? `${report.strength.value}  (${report.strength.source})` : null)
  line('prompt', report.promptFile ? `resources/${report.promptFile}${report.kind === 'LoRA' ? ' and resources/loras.md' : ''}` : 'not covered by this skill')
  console.log('')
}

const cell = (text) => String(text ?? '').replaceAll('|', '/').replaceAll('\n', ' ')

function printRow(report) {
  const stated = report.triggers.map((t) => t.value).join(', ')
  const fromFolders = stated ? '' : report.folders.map((f) => f.value).join(', ')
  const kind = report.kind === 'LoRA' ? 'LoRA' : report.kind.startsWith('checkpoint') ? 'checkpoint' : report.kind.startsWith('diffusion') ? 'diffusion model' : report.kind
  const folderNote = fromFolders ? 'trigger taken from the training folder name' : null
  const notes = [report.prediction, ...report.notes, folderNote, report.conflict].filter(Boolean).join('; ')
  const triggers = stated || fromFolders
  console.log(`| ${cell(report.file)} | ${cell(kind)} | ${cell(report.label)} | ${cell(triggers)} | ${cell(report.strength?.value)} | ${cell(notes)} |`)
}

function collect(target, files) {
  const stats = statSync(target)
  if (stats.isFile()) return files.push(target)
  for (const entry of readdirSync(target, { withFileTypes: true })) {
    const path = join(target, entry.name)
    if (entry.isDirectory()) collect(path, files)
    else if (MODEL_EXTENSIONS.has(extname(entry.name).toLowerCase())) files.push(path)
  }
}

function usage(message) {
  if (message) console.error(message)
  const header = readFileSync(new URL(import.meta.url), 'utf8').split('\n').filter((l) => l.startsWith('//')).map((l) => l.slice(3))
  console.error(header.join('\n'))
  process.exit(2)
}

const args = process.argv.slice(2)
const options = { json: false, rows: false, tags: DEFAULT_TAG_COUNT }
const targets = []
for (let i = 0; i < args.length; i++) {
  const arg = args[i]
  if (arg === '--json') options.json = true
  else if (arg === '--rows') options.rows = true
  else if (arg === '--tags') options.tags = Number(args[++i])
  else if (arg === '-h' || arg === '--help') usage()
  else if (arg.startsWith('--')) usage(`unknown option ${arg}`)
  else targets.push(arg)
}
if (targets.length === 0 || !Number.isInteger(options.tags) || options.tags < 0) usage(targets.length ? '--tags takes a whole number' : 'give a model file or folder')

const files = []
for (const target of targets) {
  if (!existsSync(target)) usage(`not found: ${target}`)
  collect(target, files)
}

const reports = []
let failed = 0
for (const path of files) {
  try {
    reports.push(inspect(path, options.tags))
  } catch (error) {
    failed++
    reports.push({ file: basename(path), path, error: error.message })
  }
}

if (options.json) console.log(JSON.stringify(reports, null, 2))
else if (options.rows) {
  console.log('| File | Kind | Family | Trigger | Strength | Notes |')
  console.log('| --- | --- | --- | --- | --- | --- |')
  for (const report of reports) {
    if (report.error) console.error(`${report.file}: ${report.error}`)
    else printRow(report)
  }
} else {
  for (const report of reports) {
    if (report.error) console.log(`${report.file}\n  error     ${report.error}\n`)
    else printBlock(report)
  }
}
process.exit(failed ? 1 : 0)
