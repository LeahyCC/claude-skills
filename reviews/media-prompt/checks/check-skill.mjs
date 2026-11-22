// Checks the media-prompt skill against itself:
//   1. inspect-model.mjs names the right family, kind, prediction, triggers and strength for
//      headers built from the keys ComfyUI checks on load, and for each sidecar format
//   2. it reports broken files without crashing, exits 1 when a file can't be read and 2 on bad arguments
//   3. frame counts and sizes in wan.md and ltx.md follow each family's rule
//   4. relative links and anchors resolve, files over 100 lines have a contents list, the
//      frontmatter is valid, and the counts in README.md and marketplace.json match the files
//
//   node reviews/media-prompt/checks/check-skill.mjs

import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(fileURLToPath(import.meta.url), '../../../..')
const skill = join(root, 'skills/media-prompt')
const inspector = join(skill, 'scripts/inspect-model.mjs')
let failures = 0
const fail = (msg) => {
  console.log(`FAIL  ${msg}`)
  failures++
}
const pass = (msg) => console.log(`ok    ${msg}`)

// ---------------------------------------------------------------------------------------------
// Fixtures: header-only safetensors files. The inspector never reads past the header.

const SAFETENSORS_ALIGNMENT = 8

function safetensors(path, tensors, metadata) {
  const header = metadata ? { __metadata__: metadata } : {}
  for (const [name, shape] of Object.entries(tensors)) header[name] = { dtype: 'F16', shape, data_offsets: [0, 0] }
  let json = JSON.stringify(header)
  json += ' '.repeat((SAFETENSORS_ALIGNMENT - (json.length % SAFETENSORS_ALIGNMENT)) % SAFETENSORS_ALIGNMENT)
  const length = Buffer.alloc(8)
  length.writeBigUInt64LE(BigInt(Buffer.byteLength(json)))
  writeFileSync(path, Buffer.concat([length, Buffer.from(json)]))
}

const range = (count, make) => Object.fromEntries(Array.from({ length: count }, (_, i) => make(i)))

const SDXL_CHECKPOINT = {
  'model.diffusion_model.input_blocks.0.0.weight': [320, 4, 3, 3],
  'model.diffusion_model.label_emb.0.0.weight': [1280, 2816],
  'conditioner.embedders.1.model.ln_final.weight': [1280],
  'first_stage_model.decoder.conv_in.weight': [512, 4, 3, 3],
}
const SDXL_LORA = {
  'lora_unet_input_blocks_4_1_transformer_blocks_0_attn2_to_k.lora_down.weight': [16, 2048],
  'lora_unet_input_blocks_4_1_transformer_blocks_0_attn2_to_k.lora_up.weight': [640, 16],
  'lora_unet_input_blocks_4_1_transformer_blocks_0_attn2_to_k.alpha': [],
  'lora_te1_text_model_encoder_layers_0_self_attn_q_proj.lora_down.weight': [16, 768],
}
const FLUX2 = (width) => ({
  'double_blocks.0.img_attn.norm.key_norm.scale': [128],
  'double_stream_modulation_img.lin.weight': [width * 6, width],
  'img_in.weight': [width, 128],
})
const WAN = (width, channels) => ({
  'head.modulation': [1, 2, width],
  'patch_embedding.weight': [width, channels, 1, 2, 2],
  'blocks.0.self_attn.q.weight': [width, width],
})
const json = (value) => JSON.stringify(value)

const FIXTURES = [
  // Full models and diffusion-model files
  { file: 'sdxl_checkpoint.safetensors', tensors: SDXL_CHECKPOINT,
    expect: { family: 'sdxl', kind: /^checkpoint/, prediction: null, unsure: false, promptFile: 'sdxl-tags.md' } },
  { file: 'anime_vpred.safetensors', tensors: { ...SDXL_CHECKPOINT, v_pred: [0], ztsnr: [0] },
    expect: { family: 'sdxl', prediction: 'v-prediction with zero terminal SNR' } },
  { file: 'anime_merge.safetensors', tensors: SDXL_CHECKPOINT,
    sidecars: { '.civitai.info': json({ baseModel: 'Illustrious', trainedWords: [], model: { name: 'Merge' } }) },
    expect: { family: 'sdxl-illustrious', familySource: 'anime_merge.civitai.info', unsure: false } },
  { file: 'old_model.safetensors',
    tensors: { 'model.diffusion_model.input_blocks.0.0.weight': [320, 4, 3, 3], 'cond_stage_model.transformer.text_model.final_layer_norm.weight': [768], 'first_stage_model.encoder.conv_in.weight': [128, 3, 3, 3] },
    expect: { family: 'sd1', promptFile: null } },
  { file: 'my_finetune.safetensors',
    tensors: { 'double_blocks.0.img_attn.norm.key_norm.scale': [128], 'img_in.weight': [3072, 64], 'guidance_in.in_layer.weight': [3072, 256] },
    expect: { family: 'flux1', kind: /^diffusion model only/, notes: /\[dev\]-style/ } },
  { file: 'model_d.safetensors', tensors: FLUX2(6144), expect: { family: 'flux2-dev', promptFile: 'flux.md' } },
  { file: 'model_k9.safetensors', tensors: FLUX2(4096), expect: { family: 'flux2-klein-9b' } },
  { file: 'klein_base_aio.safetensors',
    tensors: {
      ...Object.fromEntries(Object.entries(FLUX2(3072)).map(([k, v]) => [`model.diffusion_model.${k}`, v])),
      'text_encoders.qwen3_4b.transformer.model.norm.weight': [2560],
      'vae.decoder.conv_in.weight': [512, 32, 3, 3],
    },
    expect: { family: 'flux2-klein-4b', kind: /^checkpoint/, notes: /\[klein\] base, 50 steps \(file name\)/ } },
  { file: 'model_q.safetensors', tensors: { 'txt_norm.weight': [3584] },
    expect: { family: 'qwen-image', notes: /no key ComfyUI checks separates/, promptFile: 'qwen-image.md' } },
  { file: 'model_q2511.safetensors', tensors: { 'txt_norm.weight': [3584], '__index_timestep_zero__': [] },
    expect: { family: 'qwen-image-edit', notes: /2511/, promptFile: 'qwen-image-edit.md' } },
  { file: 'model_q21.safetensors', tensors: { 'txt_in.text_norm.weight': [4096], 'modulation.1.weight': [6, 3072] },
    expect: { family: 'qwen-image-2.1' } },
  { file: 'model_k2.safetensors', tensors: { 'txtfusion.projector.weight': [3072, 2560], 'first.weight': [3072, 64], 'blocks.0.attn.wq.weight': [3072, 3072] },
    expect: { family: 'krea2', promptFile: 'krea2.md' } },
  { file: 'wan2.2_t2v_high_noise_14B_fp8_scaled.safetensors', tensors: WAN(5120, 16),
    expect: { family: 'wan22-t2v', unsure: true, notes: /high noise \(file name\)/ } },
  { file: 'model_w_i2v.safetensors', tensors: WAN(5120, 36), expect: { family: 'wan22-i2v', notes: /image to video/ } },
  { file: 'model_w5b.safetensors', tensors: WAN(3072, 48), expect: { family: 'wan22-5b', notes: /TI2V-5B/ } },
  { file: 'model_w21.safetensors', tensors: { ...WAN(5120, 36), 'img_emb.proj.0.bias': [1280] },
    expect: { family: 'wan', notes: /Wan 2\.1 image to video/ } },
  { file: 'model_ltx.safetensors', tensors: { 'adaln_single.emb.timestep_embedder.linear_1.bias': [4096], 'audio_adaln_single.linear.weight': [12288, 2048] },
    expect: { family: 'ltx', notes: /video and audio/, promptFile: 'ltx.md' } },
  { file: 'model_af.safetensors', tensors: { 'double_layers.0.attn.w1q.weight': [3072, 3072] },
    expect: { family: 'auraflow', promptFile: null } },
  { file: 'model_c.safetensors', tensors: { 'distilled_guidance_layer.0.norms.0.scale': [5120] }, expect: { family: 'chroma' } },
  { file: 'vae_file.safetensors', tensors: { 'decoder.conv_in.weight': [512, 16, 3, 3], 'encoder.conv_in.weight': [128, 3, 3, 3] },
    expect: { kind: /^VAE/, family: null } },
  { file: 'encoder_file.safetensors', tensors: { 'encoder.block.0.layer.0.SelfAttention.q.weight': [4096, 4096] },
    expect: { kind: /^text encoder \(T5/ } },

  // LoRAs
  { file: 'char_lora.safetensors', tensors: SDXL_LORA,
    metadata: {
      ss_base_model_version: 'sdxl_base_v1-0',
      ss_sd_model_name: 'ponyDiffusionV6XL_v6StartWithThisOne.safetensors',
      ss_network_dim: '16',
      ss_tag_frequency: json({ '10_mychar': { mychar: 40, '1girl': 40, smile: 12 } }),
      ss_dataset_dirs: json({ '10_mychar': { n_repeats: 10, img_count: 40 } }),
    },
    expect: { kind: 'LoRA', rank: 16, family: 'sdxl-pony', folders: ['mychar'], tags: /mychar \(40\)/, triggers: [] } },
  { file: 'style_HIGH.safetensors',
    tensors: {
      'lora_unet_blocks_0_self_attn_q.lora_down.weight': [32, 5120],
      'lora_unet_blocks_0_self_attn_q.lora_up.weight': [5120, 32],
      'lora_unet_blocks_0_cross_attn_k.lora_down.weight': [32, 5120],
    },
    metadata: { ss_base_model_version: 'wan', 'modelspec.architecture': 'wan2.1/lora', ss_network_dim: '32' },
    expect: { kind: 'LoRA', rank: 32, family: 'wan', unsure: false, notes: /14B \(width 5120\)[\s\S]*high noise \(file name\)/ } },
  { file: 'motion_lora.safetensors',
    tensors: { 'diffusion_model.blocks.0.self_attn.q.lora_A.weight': [16, 5120], 'diffusion_model.blocks.0.self_attn.q.lora_B.weight': [5120, 16] },
    sidecars: { '.metadata.json': json({
      file_name: 'motion_lora', model_name: 'Motion', base_model: 'Wan Video 2.2 I2V-A14B',
      usage_tips: json({ strength: 0.8 }),
      civitai: { trainedWords: ['tw1', 'tw2'], baseModel: 'Wan Video 2.2 I2V-A14B' },
    }) },
    expect: { family: 'wan22-i2v', familySource: 'motion_lora.metadata.json', triggers: ['tw1', 'tw2'], strength: 0.8 } },
  { file: 'ohwx_flux.safetensors',
    tensors: {
      ...range(19, (i) => [`transformer.transformer_blocks.${i}.attn.to_q.lora_A.weight`, [16, 3072]]),
      'transformer.single_transformer_blocks.0.attn.to_q.lora_A.weight': [16, 3072],
    },
    metadata: { ss_base_model_version: 'flux.1', ss_output_name: 'ohwx_flux', ss_tag_frequency: json({ '1_ohwx': { ohwx: 1 } }), software: json({ name: 'ai-toolkit' }) },
    expect: { family: 'flux1', unsure: false, folders: ['ohwx'] } },
  { file: 'dev2_lora.safetensors',
    tensors: { 'diffusion_model.double_blocks.0.img_attn.qkv.lora_A.weight': [16, 6144], 'diffusion_model.single_blocks.0.linear1.lora_A.weight': [16, 6144] },
    expect: { family: 'flux2-dev', unsure: false } },
  { file: 'small_lora.safetensors',
    tensors: {
      ...range(5, (i) => [`diffusion_model.double_blocks.${i}.img_attn.qkv.lora_A.weight`, [8, 3072]]),
      'diffusion_model.single_blocks.0.linear1.lora_A.weight': [8, 3072],
    },
    expect: { family: 'flux2-klein-4b', unsure: true } },
  { file: 'qwen_style.safetensors', tensors: { 'transformer.transformer_blocks.0.img_mlp.net.0.proj.lora_A.weight': [16, 3072] },
    expect: { family: 'qwen-image', unsure: false } },
  { file: 'k2_lora.safetensors', tensors: { 'diffusion_model.blocks.0.attn.wq.lora_A.weight': [16, 3072] },
    metadata: { ss_base_model_version: 'krea2' },
    expect: { family: 'krea2', unsure: false } },
  { file: 'a1111_lora.safetensors', tensors: SDXL_LORA,
    sidecars: { '.json': json({ description: '', 'sd version': 'SDXL', 'activation text': 'trigger one, trigger two', 'preferred weight': 0.7, 'negative text': '', notes: '' }) },
    expect: { family: 'sdxl', triggers: ['trigger one', 'trigger two'], strength: 0.7 } },
  { file: 'ponytail_hair.safetensors', tensors: SDXL_LORA, expect: { family: 'sdxl', unsure: false } },
  // A1111 labels every LoRA that is not SDXL or SD 2 as "SD1"; that must not override FLUX tensors.
  { file: 'a1111_flux.safetensors',
    tensors: range(19, (i) => [`lora_unet_double_blocks_${i}_img_attn_qkv.lora_down.weight`, [16, 3072]]),
    sidecars: { '.json': json({ 'sd version': 'SD1', 'activation text': 'mystyle', 'preferred weight': 0 }) },
    expect: { family: 'flux1', triggers: ['mystyle'], strength: null } },

  // Sidecar only, and a sidecar that disagrees with the tensors
  { file: 'quant-Q8_0.gguf', raw: Buffer.from('GGUF'),
    sidecars: { '.civitai.info': json({ baseModel: 'Flux.1 D', trainedWords: [] }) },
    expect: { kind: /^not read/, family: 'flux1', familySource: 'quant-Q8_0.civitai.info' } },
  { file: 'mislabeled.safetensors', tensors: SDXL_CHECKPOINT,
    sidecars: { '.civitai.info': json({ baseModel: 'Flux.1 D' }) },
    expect: { family: 'sdxl', conflict: /Flux\.1 D/ } },
]

const BROKEN = [
  { file: 'broken_length.safetensors', bytes: (() => { const b = Buffer.alloc(8); b.writeBigUInt64LE(2n ** 40n); return b })(), error: /100 MB/ },
  { file: 'truncated.safetensors', bytes: (() => { const b = Buffer.alloc(18); b.writeBigUInt64LE(100n); return b })(), error: /ends inside/ },
]

const dir = mkdtempSync(join(tmpdir(), 'media-prompt-'))
for (const fixture of FIXTURES) {
  const path = join(dir, fixture.file)
  if (fixture.raw) writeFileSync(path, fixture.raw)
  else safetensors(path, fixture.tensors, fixture.metadata)
  for (const [suffix, text] of Object.entries(fixture.sidecars ?? {})) writeFileSync(path.replace(/\.[^.]+$/, suffix), text)
}
for (const broken of BROKEN) writeFileSync(join(dir, broken.file), broken.bytes)

const run = (args) => spawnSync('node', [inspector, ...args], { encoding: 'utf8' })

// 1. Families, kinds, triggers
const all = run([dir, '--json'])
let reports = []
try {
  reports = JSON.parse(all.stdout)
} catch {
  fail(`--json output did not parse:\n${all.stdout}\n${all.stderr}`)
}
const byFile = Object.fromEntries(reports.map((r) => [r.file, r]))

const matches = (actual, expected) => {
  if (expected instanceof RegExp) return expected.test(Array.isArray(actual) ? actual.join('\n') : String(actual ?? ''))
  if (Array.isArray(expected)) return JSON.stringify((actual ?? []).map((a) => a?.value ?? a)) === JSON.stringify(expected)
  if (expected === null) return actual === null || actual === undefined
  if (typeof expected === 'number' && actual && typeof actual === 'object') return Number(actual.value) === expected
  return actual === expected
}

for (const fixture of FIXTURES) {
  const report = byFile[fixture.file]
  if (!report) {
    fail(`${fixture.file}: no report`)
    continue
  }
  const wrong = Object.entries(fixture.expect).filter(([field, expected]) => !matches(report[field], expected))
  if (wrong.length) fail(`${fixture.file}: ${wrong.map(([f, e]) => `${f} expected ${e} got ${JSON.stringify(report[f])}`).join('; ')}`)
  else pass(`${fixture.file}: ${report.label}${report.familySource ? ` (${report.familySource})` : ''}`)
}

// 2. Broken files and exit codes
for (const broken of BROKEN) {
  const report = byFile[broken.file]
  if (report?.error && broken.error.test(report.error)) pass(`${broken.file}: reported "${report.error}"`)
  else fail(`${broken.file}: expected an error matching ${broken.error}, got ${JSON.stringify(report)}`)
}
if (all.status === 1) pass('exit 1 when a file in the folder cannot be read')
else fail(`expected exit 1 for a folder with broken files, got ${all.status}`)

const one = run([join(dir, 'model_d.safetensors')])
if (one.status === 0 && /FLUX\.2 \[dev\]/.test(one.stdout)) pass('exit 0 and a text block for a good file')
else fail(`single good file: exit ${one.status}\n${one.stdout}${one.stderr}`)

const rows = run([join(dir, 'char_lora.safetensors'), join(dir, 'motion_lora.safetensors'), '--rows'])
const rowLines = rows.stdout.trim().split('\n')
if (rowLines[0] === '| File | Kind | Family | Trigger | Strength | Notes |' && rowLines.length === 4 && /\| tw1, tw2 \| 0\.8 \|/.test(rows.stdout) && /\| mychar \|.*training folder name/.test(rows.stdout)) {
  pass('--rows prints the models.md header, a separator and one row per file')
} else fail(`--rows output:\n${rows.stdout}`)

const noArgs = run([])
if (noArgs.status === 2) pass('exit 2 with no arguments')
else fail(`no arguments: expected exit 2, got ${noArgs.status}`)

rmSync(dir, { recursive: true, force: true })

// ---------------------------------------------------------------------------------------------
// 3. Numbers in the docs follow each family's rule

// Windows checkouts may turn LF into CRLF; the checks below assume LF.
const read = (path) => readFileSync(join(skill, path), 'utf8').replace(/\r\n/g, '\n')
const RULES = [
  { file: 'resources/wan.md', frameStep: 4, sizeStep: 16 },
  { file: 'resources/ltx.md', frameStep: 8, sizeStep: 32 },
]
for (const { file, frameStep, sizeStep } of RULES) {
  const text = read(file)
  const frames = [...text.matchAll(/(\d+) frames/g)].map((m) => Number(m[1]))
  const badFrames = frames.filter((n) => (n - 1) % frameStep !== 0)
  const sizes = [...text.matchAll(/(\d{3,4})×(\d{3,4})/g)].map((m) => [Number(m[1]), Number(m[2])])
  const badSizes = sizes.filter(([w, h]) => w % sizeStep !== 0 || h % sizeStep !== 0)
  if (frames.length === 0 || sizes.length === 0) fail(`${file}: found no frame counts or sizes to check`)
  else if (badFrames.length || badSizes.length) fail(`${file}: frame counts not ${frameStep}n+1: ${badFrames}; sizes not multiples of ${sizeStep}: ${badSizes.map((s) => s.join('×'))}`)
  else pass(`${file}: ${frames.length} frame counts are ${frameStep}n+1, ${sizes.length} sizes are multiples of ${sizeStep}`)
}

// camera.md and effects.md mix families. A "### " section whose title names LTX follows LTX's
// rule; every other section follows Wan's (4n+1 frames, multiples of 16), which every image
// family's sizes also meet.
for (const file of ['resources/camera.md', 'resources/effects.md']) {
  let checked = 0
  const bad = []
  for (const section of read(file).split(/^### /m)) {
    const [frameStep, sizeStep] = /LTX/.test(section.split('\n')[0]) ? [8, 32] : [4, 16]
    for (const [, n] of section.matchAll(/(\d+) frames/g)) {
      checked++
      if ((Number(n) - 1) % frameStep !== 0) bad.push(`${n} frames (${frameStep}n+1)`)
    }
    for (const [, w, h] of section.matchAll(/(\d{3,4})×(\d{3,4})/g)) {
      checked++
      if (w % sizeStep !== 0 || h % sizeStep !== 0) bad.push(`${w}×${h} (multiples of ${sizeStep})`)
    }
  }
  if (file === 'resources/effects.md' && checked === 0) fail(`${file}: found no frame counts or sizes to check`)
  else if (bad.length) fail(`${file}: ${bad.join(', ')}`)
  else pass(`${file}: ${checked} frame counts and sizes follow their family's rule`)
}

// Every tag in camera.md's tag section is a Danbooru tag with at least 3,100 posts in the
// tag list of DominikDoom/a1111-sd-webui-tagcomplete (tags/danbooru.csv), read for this skill.
// Words that failed that check are written there without backticks.
const TAG_POSTS = {
  'upper body': 772446, 'full body': 805933, 'cowboy shot': 556396, portrait: 82065, 'close-up': 46497,
  'wide shot': 15927, 'from above': 98806, 'from below': 82958, 'from side': 222299, 'from behind': 232537,
  'dutch angle': 119425, pov: 122685, 'straight-on': 29201, profile: 129076, 'upside-down': 26072,
  'depth of field': 103629, 'blurry background': 129836, 'blurry foreground': 29948, bokeh: 8130,
  fisheye: 5176, foreshortening: 53286, perspective: 7934, 'chromatic aberration': 24284, 'lens flare': 38902,
  'film grain': 14589, 'motion blur': 25048, backlighting: 33963, 'light rays': 25951, sunbeam: 10937,
  'dappled sunlight': 10660, spotlight: 5349, silhouette: 17459, glowing: 102222, 'light particles': 53660,
  bloom: 3970, 'high contrast': 3195, monochrome: 631227, greyscale: 501387, sepia: 7847,
  'limited palette': 17163, 'muted color': 6406, surreal: 4849, abstract: 3819, glitch: 4389, melting: 3573,
  reflection: 37467, mirror: 27681, 'floating object': 9101, rainbow: 9800, afterimage: 12050,
  'speed lines': 9894, 'motion lines': 70796, 'light trail': 3797, underwater: 22946, scenery: 52470,
}
const tagSection = /^## Tag models\n([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(read('resources/camera.md'))?.[1] ?? ''
const tagsUsed = [...tagSection.matchAll(/`([^`]+)`/g)].map((m) => m[1])
const unknownTags = tagsUsed.filter((tag) => !(tag in TAG_POSTS))
if (tagsUsed.length === 0) fail('camera.md: no tags found under "## Tag models"')
else if (unknownTags.length) fail(`camera.md: tags not in the checked list: ${unknownTags.join(', ')}`)
else pass(`camera.md: ${tagsUsed.length} tags are all in the checked Danbooru list`)

// ---------------------------------------------------------------------------------------------
// 4. Links, contents lists, frontmatter, counts

const slug = (heading) => heading.trim().toLowerCase().replace(/[^\p{L}\p{N} -]/gu, '').replace(/ /g, '-')
const docs = ['SKILL.md', 'README.md', 'SOURCES.md', ...readdirSync(join(skill, 'resources')).map((f) => `resources/${f}`)]
let links = 0
for (const doc of docs) {
  const text = read(doc)
  const anchors = new Set([...text.matchAll(/^#{1,6} (.+)$/gm)].map((m) => slug(m[1])))
  for (const [, target] of text.matchAll(/\]\(([^)\s]+)\)/g)) {
    if (/^(https?:|mailto:)/.test(target)) continue
    links++
    const [path, anchor] = target.split('#')
    if (path === '') {
      if (!anchors.has(anchor)) fail(`${doc}: anchor #${anchor} has no heading`)
      continue
    }
    if (!existsSync(resolve(dirname(join(skill, doc)), path))) fail(`${doc}: link ${target} does not resolve`)
  }
  const lines = text.split('\n')
  if (doc.startsWith('resources/') && lines.length > 100 && !lines.slice(0, 20).some((l) => /^## Contents/.test(l))) {
    fail(`${doc}: ${lines.length} lines and no contents list near the top`)
  }
}
pass(`${links} relative links checked across ${docs.length} files`)

const frontmatter = /^---\n([\s\S]*?)\n---/.exec(read('SKILL.md'))?.[1] ?? ''
const keys = [...frontmatter.matchAll(/^([a-z_]+):/gm)].map((m) => m[1])
const description = /description: >\n([\s\S]*)/.exec(frontmatter)?.[1].split('\n').map((l) => l.trim()).join(' ').trim() ?? ''
if (keys.join(',') !== 'name,description') fail(`frontmatter keys should be name and description, got ${keys}`)
else if (!/^name: media-prompt$/m.test(frontmatter)) fail('frontmatter name is not media-prompt')
else if (description.length === 0 || description.length >= 1024) fail(`description is ${description.length} characters (must be 1 to 1023)`)
else pass(`frontmatter: name and description only, description ${description.length} characters`)

const resourceCount = readdirSync(join(skill, 'resources')).filter((f) => f.endsWith('.md')).length
const readmeCount = Number(/(\d+) resource files/.exec(read('README.md'))?.[1])
const marketplace = JSON.parse(readFileSync(join(root, '.claude-plugin/marketplace.json'), 'utf8'))
const entry = marketplace.plugins.find((p) => p.name === 'media-prompt')
if (readmeCount !== resourceCount) fail(`README says ${readmeCount} resource files, folder has ${resourceCount}`)
else if (entry?.metadata?.resource_files !== resourceCount) fail(`marketplace.json resource_files is ${entry?.metadata?.resource_files}, folder has ${resourceCount}`)
else pass(`README and marketplace.json both count ${resourceCount} resource files`)

console.log(failures ? `\n${failures} failed` : '\nall checks passed')
process.exit(failures ? 1 : 0)
