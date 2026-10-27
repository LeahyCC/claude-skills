#!/usr/bin/env node
// Checks WCAG 2.2 contrast for the colour tokens in one or more theme CSS files.
//
//   node check-contrast.mjs app/globals.css
//   node check-contrast.mjs packages/theme/src/theme.css --pair accent:canvas --json
//
// It reads every rule block (`:root`, `.dark`, `[data-theme="x"]`, `@theme`, ...),
// collects `--custom-property: <colour>` declarations, resolves `var()` chains,
// and measures the pairs a design system relies on:
//
//   text pairs, need 4.5:1     --X-foreground on --X   (shadcn convention)
//                               --foreground on --background, --card, --popover
//                               --muted-foreground on --background, --card, --muted
//   non-text pairs, need 3:1   --input, --ring, --primary on --background
//                               (--border is skipped: WCAG 1.4.11 exempts decorative
//                               borders. A border that alone shows where a control is
//                               belongs in --input, which is checked.)
//
// Extra pairs: --pair fg:bg (repeatable). Thresholds: --text 4.5 --ui 3.
// Only a ratio from a measurement counts. Guessing from a palette name does not.
//
// Colour syntaxes: #hex (3/4/6/8), rgb()/rgba(), hsl()/hsla(), oklch(), oklab(),
// transparent, white, black. Alpha is composited over the background in sRGB,
// which is what browsers do for a text colour with an opacity modifier.
// Colours outside sRGB are clipped and marked, so a wide-gamut OKLCH value is
// measured a little differently from what a P3 screen shows.
//
// Exit 1 when any measured pair fails. Node built-ins only.

import { readFileSync } from 'node:fs'

const args = process.argv.slice(2)
const files = []
const extraPairs = []
let textMin = 4.5
let uiMin = 3
let json = false
for (let i = 0; i < args.length; i++) {
  const a = args[i]
  if (a === '--pair') extraPairs.push(args[++i])
  else if (a === '--text') textMin = Number(args[++i])
  else if (a === '--ui') uiMin = Number(args[++i])
  else if (a === '--json') json = true
  else if (a === '-h' || a === '--help') {
    console.log(readFileSync(new URL(import.meta.url), 'utf8').split('\n').filter((l) => l.startsWith('//')).map((l) => l.slice(3)).join('\n'))
    process.exit(0)
  } else files.push(a)
}
if (files.length === 0) {
  console.error('usage: node check-contrast.mjs <theme.css> [more.css] [--pair fg:bg] [--text 4.5] [--ui 3] [--json]')
  process.exit(2)
}

// ---------- CSS reading ----------

// Strips comments, then walks `selector { declarations }` blocks. Nested at-rules
// such as `@layer base { :root { ... } }` are flattened by recursion. Returns
// [{ selector, vars: Map<name, rawValue> }] in source order.
function readBlocks(css) {
  const out = []
  const src = css.replace(/\/\*[\s\S]*?\*\//g, '')
  walk(src, out)
  return out
}

function walk(src, out) {
  let i = 0
  while (i < src.length) {
    const open = src.indexOf('{', i)
    if (open === -1) return
    const selector = src.slice(i, open).trim().split(/[;}]/).pop().trim()
    const close = matchBrace(src, open)
    const body = src.slice(open + 1, close)
    if (body.includes('{')) {
      // Nested rules. Declarations before the first nested rule still belong here.
      const firstNested = body.indexOf('{')
      const head = body.slice(0, body.lastIndexOf(';', firstNested) + 1)
      addBlock(out, selector, head)
      walk(body.slice(head.length), out)
    } else {
      addBlock(out, selector, body)
    }
    i = close + 1
  }
}

function matchBrace(src, open) {
  let depth = 0
  for (let i = open; i < src.length; i++) {
    if (src[i] === '{') depth++
    else if (src[i] === '}' && --depth === 0) return i
  }
  return src.length
}

function addBlock(out, selector, body) {
  const vars = new Map()
  for (const decl of body.split(';')) {
    const m = decl.match(/^\s*(--[\w-]+)\s*:\s*([\s\S]+?)\s*$/)
    if (m) vars.set(m[1], m[2])
  }
  if (vars.size > 0) out.push({ selector, vars })
}

// ---------- colour parsing ----------

const NAMED = { white: [1, 1, 1, 1], black: [0, 0, 0, 1], transparent: [0, 0, 0, 0] }

// Returns [r, g, b, a] in 0..1 sRGB, plus `clipped: true` when the source was out of gamut, or null.
function parseColor(raw) {
  const s = raw.trim().toLowerCase()
  if (NAMED[s]) return { rgba: NAMED[s] }
  if (s[0] === '#') return parseHex(s)
  const fn = s.match(/^([a-z]+)\((.*)\)$/s)
  if (!fn) return null
  const [, name, inner] = fn
  const [main, alphaPart] = inner.split('/')
  const parts = main.replace(/,/g, ' ').trim().split(/\s+/)
  let alpha = alphaPart !== undefined ? num(alphaPart, 1) : 1
  if (name.endsWith('a') && name !== 'oklab' && parts.length === 4) alpha = num(parts.pop(), 1)
  if (parts.length < 3) return null
  switch (name) {
    case 'rgb':
    case 'rgba':
      return { rgba: [num(parts[0], 255) / 255, num(parts[1], 255) / 255, num(parts[2], 255) / 255, alpha] }
    case 'hsl':
    case 'hsla':
      return { rgba: [...hslToRgb(angle(parts[0]), num(parts[1], 100) / 100, num(parts[2], 100) / 100), alpha] }
    case 'oklch': {
      const L = num(parts[0], 1)
      const C = num(parts[1], 0.4)
      const H = angle(parts[2])
      const rad = (H * Math.PI) / 180
      return oklabToSrgb(L, C * Math.cos(rad), C * Math.sin(rad), alpha)
    }
    case 'oklab':
      return oklabToSrgb(num(parts[0], 1), num(parts[1], 0.4), num(parts[2], 0.4), alpha)
    default:
      return null
  }
}

// `num("50%", 1)` is 0.5; `num("0.5", 1)` is 0.5; `num("128", 255)` is 128.
function num(token, percentScale) {
  const t = token.trim()
  if (t === 'none') return 0
  if (t.endsWith('%')) return (parseFloat(t) / 100) * percentScale
  return parseFloat(t)
}

function angle(token) {
  const t = token.trim()
  if (t === 'none') return 0
  if (t.endsWith('turn')) return parseFloat(t) * 360
  if (t.endsWith('rad')) return (parseFloat(t) * 180) / Math.PI
  if (t.endsWith('grad')) return parseFloat(t) * 0.9
  return parseFloat(t)
}

function parseHex(s) {
  let h = s.slice(1)
  if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join('')
  if (h.length !== 6 && h.length !== 8) return null
  const n = (i) => parseInt(h.slice(i, i + 2), 16) / 255
  return { rgba: [n(0), n(2), n(4), h.length === 8 ? n(6) : 1] }
}

function hslToRgb(h, s, l) {
  const k = (n) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return [f(0), f(8), f(4)]
}

// OKLab to linear sRGB, Björn Ottosson's matrices, then sRGB transfer curve.
function oklabToSrgb(L, a, b, alpha) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.291485548 * b
  const l = l_ ** 3
  const m = m_ ** 3
  const s = s_ ** 3
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
  const clipped = lin.some((c) => c < -0.0005 || c > 1.0005)
  const rgb = lin.map((c) => encode(Math.min(1, Math.max(0, c))))
  return { rgba: [...rgb, alpha], clipped }
}

function encode(c) {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055
}

function decode(c) {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

// ---------- contrast ----------

function luminance([r, g, b]) {
  return 0.2126 * decode(r) + 0.7152 * decode(g) + 0.0722 * decode(b)
}

function over(fg, bg) {
  const a = fg[3]
  return [0, 1, 2].map((i) => a * fg[i] + (1 - a) * bg[i])
}

function ratio(fg, bg) {
  const bgFlat = bg[3] < 1 ? over(bg, [1, 1, 1, 1]) : bg
  const l1 = luminance(over(fg, bgFlat))
  const l2 = luminance(bgFlat)
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1]
  return (hi + 0.05) / (lo + 0.05)
}

// ---------- resolution ----------

// Resolves `var(--x, fallback)` chains inside one block, falling back to the
// first `:root`-like block for names the block does not define.
function resolve(name, block, root, seen = new Set()) {
  if (seen.has(name)) return null
  seen.add(name)
  const raw = block.vars.get(name) ?? root?.vars.get(name)
  if (raw === undefined) return null
  const m = raw.match(/^var\(\s*(--[\w-]+)\s*(?:,\s*([\s\S]+))?\)$/)
  if (m) return resolve(m[1], block, root, seen) ?? (m[2] ? parseColor(m[2]) : null)
  return parseColor(raw)
}

// ---------- pairs ----------

const TEXT_ON = ['background', 'card', 'popover']
const MUTED_ON = ['background', 'card', 'muted']
const UI_ON_BACKGROUND = ['input', 'ring', 'primary']

// A pair is checked in a block when both names are defined (here or in :root)
// and at least one of them is set in this block. So a `.dark` block that only
// overrides `--background` still re-checks `--foreground` on it.
function pairsFor(block, root) {
  const defined = (n) => block.vars.has(n) || root.vars.has(n)
  const pairs = []
  const add = (fg, bg, min, kind) => {
    if (defined(fg) && defined(bg) && (block.vars.has(fg) || block.vars.has(bg))) pairs.push({ fg, bg, min, kind })
  }
  for (const n of new Set([...block.vars.keys(), ...root.vars.keys()])) {
    const stem = n.endsWith('-foreground') ? n.slice(0, -'-foreground'.length) : ''
    if (stem.length > 2) add(n, stem, textMin, 'text')
  }
  for (const bg of TEXT_ON) add('--foreground', `--${bg}`, textMin, 'text')
  for (const bg of MUTED_ON) add('--muted-foreground', `--${bg}`, textMin, 'text')
  for (const fg of UI_ON_BACKGROUND) add(`--${fg}`, '--background', uiMin, 'ui')
  for (const p of extraPairs) {
    const [fg, bg] = p.split(':').map((s) => (s.startsWith('--') ? s : `--${s}`))
    if (fg && bg) add(fg, bg, textMin, 'text')
  }
  const key = (p) => `${p.fg}|${p.bg}`
  return [...new Map(pairs.map((p) => [key(p), p])).values()]
}

// ---------- run ----------

const results = []
let failures = 0
let skipped = 0

const IS_ROOT = /^(:root|html|:host)$/
const IS_PURE_ALIAS = /^var\(\s*--[\w-]+\s*\)$/

for (const file of files) {
  const all = readBlocks(readFileSync(file, 'utf8'))
  // Every plain :root block is one scope, measured once. A theme often splits
  // primitives and semantic tokens into separate :root blocks.
  const root = { selector: ':root', vars: new Map(all.filter((b) => IS_ROOT.test(b.selector)).flatMap((b) => [...b.vars])) }
  const blocks = [...(root.vars.size ? [root] : []), ...all.filter((b) => !IS_ROOT.test(b.selector))]
  for (const block of blocks) {
    for (const pair of pairsFor(block, root)) {
      // In @theme inline { --color-x: var(--x) } a pair of plain aliases repeats
      // what :root and the mode blocks already measured, so it is not counted twice.
      const aliasOnly = [pair.fg, pair.bg].every((n) => IS_PURE_ALIAS.test(block.vars.get(n) ?? 'var(--x)'))
      if (block.selector.startsWith('@theme') && aliasOnly) continue
      const fg = resolve(pair.fg, block, root)
      const bg = resolve(pair.bg, block, root)
      if (!fg || !bg) {
        skipped++
        results.push({ file, selector: block.selector, ...pair, ratio: null, note: 'unparsed colour' })
        continue
      }
      const r = ratio(fg.rgba, bg.rgba)
      const ok = r >= pair.min
      if (!ok) failures++
      results.push({ file, selector: block.selector, ...pair, ratio: Number(r.toFixed(2)), ok, note: fg.clipped || bg.clipped ? 'clipped to sRGB' : '' })
    }
  }
}

if (json) {
  console.log(JSON.stringify({ textMin, uiMin, failures, skipped, results }, null, 2))
} else {
  let lastSelector = ''
  for (const r of results) {
    if (r.selector !== lastSelector) {
      console.log(`\n${r.file}  ${r.selector}`)
      lastSelector = r.selector
    }
    const status = r.ratio === null ? 'skip' : r.ok ? 'ok  ' : 'FAIL'
    const shown = r.ratio === null ? '  -  ' : `${r.ratio.toFixed(2)}:1`.padStart(7)
    console.log(`  ${status} ${shown}  needs ${r.min}:1  ${r.fg} on ${r.bg}${r.note ? `  (${r.note})` : ''}`)
  }
  console.log(`\n${results.length - skipped} pairs measured, ${failures} failed, ${skipped} skipped`)
}
process.exit(failures > 0 ? 1 : 0)
