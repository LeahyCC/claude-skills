#!/usr/bin/env node
// Counts the styling that bypasses the design system's tokens, across a repo.
//
//   node audit-classes.mjs apps packages
//   node audit-classes.mjs src --theme packages/theme/src/theme.css --top 20 --json
//   node audit-classes.mjs src --max-arbitrary 0 --max-palette 0     (CI budget, exit 1 when over)
//
// What it counts, per file and in total:
//
//   arbitrary     w-[320px]  text-[13px]  bg-[#0f0]  grid-cols-[1fr_2fr]   (not data-[...] variants)
//   palette       bg-blue-500  text-gray-700  border-slate-200            (raw Tailwind palette, not a semantic token)
//   literal       #0f172a  rgb(...)  hsl(...)  oklch(...)  outside the theme file(s)
//   inline-style  style={{ ... }}  style="..."
//   important     bg-red-500!  !bg-red-500
//   apply         @apply in CSS files
//
// A design system wants all six near zero outside the theme and the primitives
// package. The script is a measurement. Decide the budget in the repo, then
// enforce it with --max-* in CI so the number can only go down.
//
// Skips node_modules, dist, build, .next, .turbo, coverage, storybook-static, .git.
// Node built-ins only.

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

const args = process.argv.slice(2)
const roots = []
const themeFiles = new Set()
const limits = {}
let top = 10
let json = false
for (let i = 0; i < args.length; i++) {
  const a = args[i]
  if (a === '--theme') themeFiles.add(resolve(args[++i]))
  else if (a === '--top') top = Number(args[++i])
  else if (a === '--json') json = true
  else if (a.startsWith('--max-')) limits[a.slice('--max-'.length)] = Number(args[++i])
  else if (a === '-h' || a === '--help') {
    console.log(readFileSync(new URL(import.meta.url), 'utf8').split('\n').filter((l) => l.startsWith('//')).map((l) => l.slice(3)).join('\n'))
    process.exit(0)
  } else roots.push(a)
}
if (roots.length === 0) {
  console.error('usage: node audit-classes.mjs <dir> [more dirs] [--theme theme.css] [--top 10] [--max-arbitrary N ...] [--json]')
  process.exit(2)
}

const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', '.next', '.turbo', 'coverage', 'storybook-static', '.git', 'out'])
const EXT = /\.(tsx?|jsx?|mjs|cjs|vue|svelte|astro|html|mdx?|css)$/
const PALETTE = 'red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone'
const COLOR_UTIL = 'bg|text|border|ring|fill|stroke|outline|decoration|accent|caret|divide|placeholder|shadow|from|via|to|inset-ring|ring-offset'

const RULES = {
  // `-[` preceded by a utility name, but not an arbitrary variant such as data-[state=open]:
  arbitrary: /(?<![\w-])(?!(?:data|aria|group|peer|has|not|in|supports|nth|nth-last|min|max|\*)-\[)[a-z][\w-]*-\[[^\]\s]+\]/g,
  palette: new RegExp(`(?<![\\w-])(?:${COLOR_UTIL})-(?:${PALETTE})-(?:50|[1-9]00|950)(?![\\w-])`, 'g'),
  literal: /(?<![\w&])#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})(?![\w-])|\b(?:rgba?|hsla?|oklch|oklab|color-mix)\(/gi,
  'inline-style': /\bstyle\s*=\s*(?:\{\{|["'])/g,
  important: /(?<![\w-])![a-z][\w-]*|(?<![\w-])[a-z][\w-]*!(?![\w=!])/g,
  apply: /@apply\b/g,
}

// Where a rule does not apply: palette and important only make sense in class
// strings, so they are counted in every file type; literal is skipped in the
// theme files; apply only counts in CSS.
function countFile(path, text) {
  const isCss = path.endsWith('.css')
  const isTheme = themeFiles.has(resolve(path))
  const counts = {}
  for (const [name, re] of Object.entries(RULES)) {
    if (name === 'apply' && !isCss) continue
    if (name === 'literal' && isTheme) continue
    if (name === 'inline-style' && isCss) continue
    const n = (text.match(re) ?? []).length
    if (n > 0) counts[name] = n
  }
  return counts
}

function* files(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) yield* files(join(dir, entry.name))
    } else if (EXT.test(entry.name)) {
      yield join(dir, entry.name)
    }
  }
}

const perFile = []
const totals = {}
let scanned = 0
for (const root of roots) {
  const start = resolve(root)
  const list = statSync(start).isDirectory() ? files(start) : [start]
  for (const path of list) {
    scanned++
    const counts = countFile(path, readFileSync(path, 'utf8'))
    const sum = Object.values(counts).reduce((a, b) => a + b, 0)
    if (sum === 0) continue
    perFile.push({ file: relative(process.cwd(), path).replaceAll('\\', '/'), total: sum, ...counts })
    for (const [k, v] of Object.entries(counts)) totals[k] = (totals[k] ?? 0) + v
  }
}
perFile.sort((a, b) => b.total - a.total)

const over = Object.entries(limits).filter(([k, max]) => (totals[k] ?? 0) > max)

if (json) {
  console.log(JSON.stringify({ scanned, totals, over: Object.fromEntries(over), files: perFile }, null, 2))
} else {
  const names = Object.keys(RULES)
  console.log(`${scanned} files scanned, ${perFile.length} with findings\n`)
  console.log(names.map((n) => n.padStart(13)).join('') + '  total')
  console.log(names.map((n) => String(totals[n] ?? 0).padStart(13)).join('') + '  ' + Object.values(totals).reduce((a, b) => a + b, 0))
  if (perFile.length > 0) {
    console.log(`\nTop ${Math.min(top, perFile.length)} files`)
    for (const f of perFile.slice(0, top)) {
      const parts = names.filter((n) => f[n]).map((n) => `${n} ${f[n]}`)
      console.log(`  ${String(f.total).padStart(5)}  ${f.file}  (${parts.join(', ')})`)
    }
  }
  for (const [k, max] of over) console.log(`\nOVER BUDGET  ${k}: ${totals[k]} > ${max}`)
}
process.exit(over.length > 0 ? 1 : 0)
