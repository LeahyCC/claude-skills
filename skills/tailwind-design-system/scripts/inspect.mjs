#!/usr/bin/env node
// Reports what a repo's Tailwind design-system setup actually is, before any change.
//
//   node inspect.mjs            (from the repo root)
//   node inspect.mjs path/to/repo --json
//
// Prints:
//   versions    tailwindcss and friends, declared and installed, per package.json
//   entries     every CSS file that imports Tailwind, with its @source lines,
//               dark variant, @theme blocks (option, token count per namespace),
//               whether the default palette is cleared, and theme selectors
//   pairs       surface tokens with no -foreground partner
//   leftovers   v3 signs: tailwind.config.*, @tailwind directives, @config
//   shadcn      components.json style, base colour, aliases, registries
//
// It reads files only. It never installs, builds or edits anything.
// Skips node_modules, dist, build, .next, .turbo, coverage, .git. Node built-ins only.

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'

const args = process.argv.slice(2)
const json = args.includes('--json')
const root = resolve(args.find((a) => !a.startsWith('--')) ?? '.')
const SKIP = new Set(['node_modules', 'dist', 'build', '.next', '.turbo', 'coverage', '.git', 'out', 'storybook-static'])
const rel = (p) => relative(root, p).replaceAll('\\', '/') || '.'

const WATCH = [
  'tailwindcss',
  '@tailwindcss/vite',
  '@tailwindcss/postcss',
  '@tailwindcss/cli',
  '@tailwindcss/webpack',
  '@tailwindcss/typography',
  '@tailwindcss/forms',
  'shadcn',
  'cn',
  'class-variance-authority',
  'tailwind-variants',
  'tailwind-merge',
  'clsx',
  'radix-ui',
  '@base-ui/react',
  'react-aria-components',
  'tw-animate-css',
  'tailwindcss-animate',
  'prettier-plugin-tailwindcss',
  'eslint-plugin-better-tailwindcss',
  'eslint-plugin-tailwindcss',
  'storybook',
  '@changesets/cli',
  'style-dictionary',
  '@terrazzo/cli',
]

function* walk(dir, depth = 0) {
  if (depth > 6) return
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const e of entries) {
    const p = join(dir, e.name)
    if (e.isDirectory()) {
      if (!SKIP.has(e.name) && !e.name.startsWith('.')) yield* walk(p, depth + 1)
    } else yield p
  }
}

const readJson = (p) => {
  try {
    return JSON.parse(readFileSync(p, 'utf8'))
  } catch {
    return null
  }
}

// Installed version: walk up from the package dir looking in node_modules.
function installed(fromDir, name) {
  let dir = fromDir
  while (true) {
    const pj = readJson(join(dir, 'node_modules', name, 'package.json'))
    if (pj?.version) return pj.version
    const up = dirname(dir)
    if (up === dir || !up.startsWith(root)) return null
    dir = up
  }
}

const files = [...walk(root)]
const report = { root, versions: [], entries: [], pairs: [], leftovers: [], shadcn: [] }

// ---------- versions ----------
for (const p of files.filter((f) => f.endsWith('package.json'))) {
  const pj = readJson(p)
  if (!pj) continue
  const all = { ...pj.dependencies, ...pj.devDependencies, ...pj.peerDependencies }
  const found = WATCH.filter((n) => all[n]).map((n) => ({ name: n, declared: all[n], installed: installed(dirname(p), n) }))
  if (found.length) report.versions.push({ package: pj.name ?? rel(dirname(p)), path: rel(p), deps: found, exports: pj.exports ? Object.keys(pj.exports) : [] })
}

// ---------- CSS entries ----------
const IMPORTS_TW = /@import\s+["']tailwindcss(?:\/[\w.-]+)?["']/
const css = files.filter((f) => f.endsWith('.css'))
for (const p of css) {
  const text = readFileSync(p, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
  const isEntry = IMPORTS_TW.test(text)
  const hasTheme = /@theme\b/.test(text)
  if (/@tailwind\s+(base|components|utilities)/.test(text)) report.leftovers.push({ path: rel(p), sign: '@tailwind directives (v3)' })
  if (/@config\s+["']/.test(text)) report.leftovers.push({ path: rel(p), sign: '@config loads a JS config (v3 compatibility)' })
  if (!isEntry && !hasTheme) continue

  const themes = []
  for (const m of text.matchAll(/@theme\b([^{]*)\{([\s\S]*?)\n\}/g)) {
    const option = m[1].trim() || '(none)'
    const ns = {}
    for (const d of m[2].matchAll(/(--[\w-]+?)(?:-[\w-]+)?\s*:/g)) {
      const name = d[0].replace(/\s*:$/, '')
      const space = name.match(/^--(color|font-weight|font|text-shadow|text|tracking|leading|breakpoint|container|spacing|radius|inset-shadow|drop-shadow|shadow|blur|perspective|aspect|ease|animate|tab-size|zoom)\b/)
      const key = space ? space[1] : name === '--*' ? '* (reset all)' : 'other'
      ns[key] = (ns[key] ?? 0) + 1
    }
    themes.push({ option, tokens: ns })
  }

  const selectors = [...text.matchAll(/(^|\n)\s*([^@\n{}][^{}\n]*?)\s*\{[^{}]*--[\w-]+\s*:/g)].map((m) => m[2].trim())
  report.entries.push({
    path: rel(p),
    importsTailwind: isEntry,
    imports: [...text.matchAll(/@import\s+["']([^"']+)["']([^;]*);/g)].map((m) => (m[1] + m[2]).trim()),
    sources: [...text.matchAll(/@source\s+([^;]+);/g)].map((m) => m[1].trim()),
    darkVariant: text.match(/@custom-variant\s+dark\s*([^;{]+)/)?.[1].trim() ?? 'default (prefers-color-scheme)',
    customVariants: [...text.matchAll(/@custom-variant\s+([\w-]+)/g)].map((m) => m[1]).filter((n) => n !== 'dark'),
    utilities: [...text.matchAll(/@utility\s+([\w*-]+)/g)].map((m) => m[1]),
    themes,
    paletteCleared: /--color-\*\s*:\s*initial/.test(text),
    themeReset: /--\*\s*:\s*initial/.test(text),
    plugins: [...text.matchAll(/@plugin\s+["']([^"']+)["']/g)].map((m) => m[1]),
    selectors: [...new Set(selectors)],
  })

  // Surfaces with no foreground partner, judged on the token names in this file.
  const defined = new Set([...text.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]))
  const SURFACES = ['primary', 'secondary', 'accent', 'muted', 'destructive', 'card', 'popover', 'success', 'warning', 'info', 'danger', 'brand', 'inverse', 'sidebar']
  for (const s of SURFACES) {
    if (defined.has(`--${s}`) && !defined.has(`--${s}-foreground`)) report.pairs.push({ path: rel(p), surface: `--${s}`, missing: `--${s}-foreground` })
  }
}

// ---------- v3 config files, shadcn ----------
for (const p of files) {
  if (/[\\/]tailwind\.config\.(js|cjs|mjs|ts)$/.test(p)) report.leftovers.push({ path: rel(p), sign: 'tailwind.config file (v3, or v4 via @config)' })
  if (p.endsWith('components.json')) {
    const c = readJson(p)
    if (c?.$schema?.includes('shadcn') || c?.aliases) {
      report.shadcn.push({ path: rel(p), style: c.style, baseColor: c.tailwind?.baseColor, css: c.tailwind?.css, cssVariables: c.tailwind?.cssVariables, prefix: c.tailwind?.prefix, aliases: c.aliases, registries: c.registries ? Object.keys(c.registries) : [] })
    }
  }
}

// ---------- output ----------
if (json) {
  console.log(JSON.stringify(report, null, 2))
  process.exit(0)
}

const line = (s = '') => console.log(s)
line(`repo  ${root}`)
line('\nVERSIONS')
if (report.versions.length === 0) line('  no package.json declares tailwindcss or related packages')
for (const v of report.versions) {
  line(`  ${v.package}  (${v.path})`)
  for (const d of v.deps) line(`    ${d.name.padEnd(36)} declared ${String(d.declared).padEnd(12)} installed ${d.installed ?? '-'}`)
  if (v.exports.length) line(`    exports: ${v.exports.join(', ')}`)
}

line('\nCSS ENTRIES AND THEME FILES')
if (report.entries.length === 0) line('  none found: no CSS file imports tailwindcss or declares @theme')
for (const e of report.entries) {
  line(`  ${e.path}${e.importsTailwind ? '' : '  (theme only, no tailwindcss import)'}`)
  if (e.imports.length) line(`    imports        ${e.imports.join(' | ')}`)
  line(`    @source        ${e.sources.length ? e.sources.join(' | ') : 'none (automatic detection only)'}`)
  line(`    dark variant   ${e.darkVariant}`)
  if (e.customVariants.length) line(`    variants       ${e.customVariants.join(', ')}`)
  if (e.utilities.length) line(`    @utility       ${e.utilities.join(', ')}`)
  if (e.plugins.length) line(`    @plugin        ${e.plugins.join(', ')}`)
  for (const t of e.themes) line(`    @theme ${t.option.padEnd(9)} ${Object.entries(t.tokens).map(([k, n]) => `${k} ${n}`).join(', ')}`)
  line(`    palette        ${e.themeReset ? 'whole default theme reset (--*: initial)' : e.paletteCleared ? 'default colours cleared (--color-*: initial)' : 'default colours still available'}`)
  if (e.selectors.length) line(`    token blocks   ${e.selectors.join(', ')}`)
}

line('\nSURFACES WITHOUT A FOREGROUND TOKEN')
if (report.pairs.length === 0) line('  none')
for (const p of report.pairs) line(`  ${p.path}  ${p.surface} has no ${p.missing}`)

line('\nV3 LEFTOVERS')
if (report.leftovers.length === 0) line('  none')
for (const l of report.leftovers) line(`  ${l.path}  ${l.sign}`)

line('\nSHADCN')
if (report.shadcn.length === 0) line('  no components.json')
for (const s of report.shadcn) {
  line(`  ${s.path}  style ${s.style ?? '-'}, baseColor ${s.baseColor ?? '-'}, css ${s.css ?? '-'}, cssVariables ${s.cssVariables ?? '-'}${s.prefix ? `, prefix ${s.prefix}` : ''}`)
  if (s.registries.length) line(`    registries: ${s.registries.join(', ')}`)
}
