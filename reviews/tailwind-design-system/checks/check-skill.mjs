// Checks the tailwind-design-system skill against real Tailwind CSS and against itself.
//
//   node reviews/tailwind-design-system/checks/check-skill.mjs
//
//   1. Every ```css block compiles with Tailwind (TW_VERSION, default 4.3.3).
//      A block without `@import "tailwindcss"` gets it prepended.
//      Markers in HTML comments just above a block:
//        <!-- css-check: skip, reason -->
//        <!-- css-expect: class class ... -->   each must produce CSS
//        <!-- css-reject: class class ... -->   each must produce nothing
//   2. Every class in a ```tsx, ```jsx or ```html block exists under the starter
//      theme (templates/theme.css). Blocks whose first line says FAIL are not
//      checked, and <!-- classes: skip, reason --> skips one block.
//   3. The starter theme passes check-contrast.mjs, closes the palette, and
//      known colour pairs give the WCAG ratios they should.
//   4. audit-classes.mjs and inspect.mjs give the expected counts on fixtures.
//   5. A package that declares @source in its own theme file is scanned when an
//      app only imports that file (the architecture the skill recommends).
//   6. ```json blocks marked <!-- json-check: parse --> parse.
//   7. Relative links and #anchors resolve, counts in README and
//      marketplace.json match the files, and no em or en dashes appear.
//
// Installs tailwindcss, @tailwindcss/node and @tailwindcss/cli into a temp dir.

import { execSync, spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, statSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(fileURLToPath(import.meta.url), '../../../..')
const skill = join(root, 'skills/tailwind-design-system')
const fixtures = join(root, 'reviews/tailwind-design-system/fixtures')
const version = process.env.TW_VERSION || '4.3.3'
const script = (name) => join(skill, 'scripts', name)

let failures = 0
const fail = (msg) => {
  console.log(`FAIL  ${msg}`)
  failures++
}
const pass = (msg) => console.log(`ok    ${msg}`)

// ---------- install Tailwind ----------
const work = mkdtempSync(join(tmpdir(), `tw-${version}-`))
writeFileSync(join(work, 'package.json'), '{"private":true}')
execSync(`npm install --silent --no-audit --no-fund tailwindcss@${version} @tailwindcss/node@${version} @tailwindcss/cli@${version}`, {
  cwd: work,
  stdio: ['ignore', 'ignore', 'inherit'],
})
const req = createRequire(join(work, 'index.js'))
const tw = await import(pathToFileURL(req.resolve('@tailwindcss/node')).href)
const twCli = join(work, 'node_modules', '@tailwindcss', 'cli', 'dist', 'index.mjs')
pass(`installed tailwindcss ${JSON.parse(readFileSync(join(work, 'node_modules/tailwindcss/package.json'), 'utf8')).version}`)

// Comments are stripped before looking: the starter theme's header shows the import line as an example.
const withImport = (css) => (/@import\s+["']tailwindcss/.test(css.replace(/\/\*[^]*?\*\//g, '')) ? css : `@import "tailwindcss";\n${css}`)
const designSystem = (css) => tw.__unstable__loadDesignSystem(withImport(css), { base: work })
const compile = (css) => tw.compile(withImport(css), { base: work, onDependency() {} })

// ---------- collect markdown ----------
function walk(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
}
const docs = walk(skill).filter((p) => p.endsWith('.md'))
// Windows checkouts with core.autocrlf get CRLF files. Every regex here assumes LF.
const read = (p) => readFileSync(p, 'utf8').replaceAll('\r\n', '\n')
const where = (file, text, index) => `${relative(root, file).replaceAll('\\', '/')}:${text.slice(0, index).split('\n').length}`

// A fenced block plus the HTML comments directly above it.
function blocks(file) {
  const text = read(file)
  const out = []
  const re = /((?:<!--[^]*?-->\s*\n)*)```(\w+)[^\n]*\n([^]*?)```/g
  for (const m of text.matchAll(re)) {
    const markers = {}
    for (const c of m[1].matchAll(/<!--\s*([\w-]+):\s*([^]*?)\s*-->/g)) markers[c[1]] = c[2]
    out.push({ lang: m[2], code: m[3], markers, at: where(file, text, m.index + m[1].length) })
  }
  return out
}
const all = docs.flatMap((f) => blocks(f))

// ---------- 1. css blocks ----------
let cssChecked = 0
let cssSkipped = 0
for (const b of all.filter((b) => b.lang === 'css')) {
  if (b.markers['css-check']?.startsWith('skip')) {
    cssSkipped++
    continue
  }
  cssChecked++
  try {
    await compile(b.code)
  } catch (e) {
    fail(`${b.at} does not compile: ${e.message.split('\n')[0]}`)
    continue
  }
  const expect = (b.markers['css-expect'] ?? '').split(/\s+/).filter(Boolean)
  const reject = (b.markers['css-reject'] ?? '').split(/\s+/).filter(Boolean)
  if (expect.length || reject.length) {
    const ds = await designSystem(b.code)
    const got = ds.candidatesToCss([...expect, ...reject])
    expect.forEach((c, i) => got[i] || fail(`${b.at} expected class ${c} does not compile`))
    reject.forEach((c, i) => got[expect.length + i] && fail(`${b.at} class ${c} should not compile but does`))
  }
}
pass(`${cssChecked} css blocks compiled (${cssSkipped} skipped by marker)`)

// ---------- 2. classes in markup samples ----------
const theme = read(join(skill, 'templates/theme.css'))
const themeDs = await designSystem(theme)
// Classes with no CSS of their own that are still correct to write.
const MARKER_CLASSES = /^(group|peer|dark)(\/[\w-]+)?$|^@container(\/[\w-]+)?$/

function classStrings(code, lang) {
  const found = []
  if (lang === 'html') {
    for (const m of code.matchAll(/\bclass="([^"]*)"/g)) found.push(m[1])
    return found
  }
  // className="..." and className={"..."}
  for (const m of code.matchAll(/\bclassName=(?:\{\s*)?(["'])([^"'`]*?)\1/g)) found.push(m[2])
  // String literals elsewhere: inside cn(), cva(), tv(), objects of class lists.
  for (const m of code.matchAll(/(["'`])((?:(?!\1)[^\\\n$])*)\1/g)) {
    const s = m[2]
    const before = code.slice(Math.max(0, m.index - 40), m.index)
    const after = code.slice(m.index + m[0].length, m.index + m[0].length + 3)
    if (/\b[\w-]+=\{?\s*$/.test(before)) continue // a JSX attribute value; className handled above
    if (/(from|import|require\()\s*$/.test(before)) continue
    if (/^\s*:/.test(after)) continue // an object key
    const tokens = s.split(/\s+/).filter(Boolean)
    if (tokens.length === 0) continue
    if (!tokens.every((t) => /^[!@\w\[\]&>*:().%,#/'=-]+!?$/.test(t))) continue
    if (!tokens.some((t) => /[-:]/.test(t))) continue // single words like "default" are variant names
    found.push(s)
  }
  return found
}

let markupChecked = 0
let classCount = 0
for (const b of all.filter((b) => ['tsx', 'jsx', 'html'].includes(b.lang))) {
  if (b.markers.classes?.startsWith('skip')) continue
  if (/FAIL/.test(b.code.split('\n').find((l) => l.trim()) ?? '')) continue
  markupChecked++
  const classes = [...new Set(classStrings(b.code, b.lang).flatMap((s) => s.split(/\s+/)).filter(Boolean))].filter((c) => !MARKER_CLASSES.test(c))
  classCount += classes.length
  const css = themeDs.candidatesToCss(classes)
  classes.forEach((c, i) => css[i] || fail(`${b.at} class "${c}" does not exist under templates/theme.css`))
}
pass(`${markupChecked} markup blocks, ${classCount} classes checked against the starter theme`)

// ---------- 3. contrast and the starter theme ----------
const contrast = (args) => spawnSync('node', [script('check-contrast.mjs'), ...args], { encoding: 'utf8' })
{
  const r = contrast([join(skill, 'templates/theme.css'), '--json'])
  const j = JSON.parse(r.stdout)
  if (r.status !== 0 || j.failures) fail(`templates/theme.css has ${j.failures} failing contrast pairs`)
  else if (j.results.length < 30) fail(`templates/theme.css: only ${j.results.length} pairs measured`)
  else pass(`templates/theme.css: ${j.results.length} contrast pairs pass`)

  const known = contrast([join(fixtures, 'known-ratios.css'), '--json'])
  const k = JSON.parse(known.stdout)
  const get = (fg, sel = ':root') => k.results.find((x) => x.fg === fg && x.selector === sel)?.ratio
  const expectRatio = (label, got, want) => (Math.abs(got - want) <= 0.02 ? pass(`contrast ${label} = ${got}`) : fail(`contrast ${label} = ${got}, want ${want}`))
  expectRatio('#767676 on white', get('--grey-foreground'), 4.54)
  expectRatio('#999 on white', get('--pale-foreground'), 2.85)
  expectRatio('oklch red on white', get('--red-foreground'), 4.0)
  expectRatio('black at 50% over white', get('--half-foreground'), 3.98)
  expectRatio('white on black', get('--max-foreground'), 21)
  if (known.status !== 1) fail('check-contrast.mjs must exit 1 when a pair fails')

  const ds = await designSystem(theme)
  const reject = ['bg-blue-500', 'text-gray-700', 'text-4xl', 'rounded-3xl', 'shadow-xl']
  const accept = ['bg-primary', 'text-muted-foreground', 'border-input', 'dark:bg-card', 'bg-transparent', 'text-current', 'z-(--z-modal)', 'type-label', 'data-open:opacity-100', 'focus-ring']
  const got = ds.candidatesToCss([...reject, ...accept])
  reject.forEach((c, i) => (got[i] ? fail(`starter theme still compiles ${c}`) : null))
  accept.forEach((c, i) => (got[reject.length + i] ? null : fail(`starter theme does not compile ${c}`)))
  pass('starter theme closes the palette and keeps the semantic classes')
}

// ---------- 4. audit and inspect ----------
{
  const r = spawnSync('node', [script('audit-classes.mjs'), join(fixtures, 'app'), '--json'], { encoding: 'utf8' })
  const j = JSON.parse(r.stdout)
  const want = { arbitrary: 4, palette: 3, literal: 5, 'inline-style': 1, important: 2, apply: 1 }
  const wrong = Object.entries(want).filter(([k, v]) => (j.totals[k] ?? 0) !== v)
  if (wrong.length) fail(`audit-classes totals ${JSON.stringify(j.totals)}, want ${JSON.stringify(want)}`)
  else pass('audit-classes counts every planted bypass, and no data-[...] or group-[...] variant')
  const budget = spawnSync('node', [script('audit-classes.mjs'), join(fixtures, 'app'), '--max-palette', '2'], { encoding: 'utf8' })
  budget.status === 1 ? pass('audit-classes exits 1 over budget') : fail('audit-classes must exit 1 over budget')

  const ins = spawnSync('node', [script('inspect.mjs'), join(fixtures, 'repo'), '--json'], { encoding: 'utf8' })
  const i = JSON.parse(ins.stdout)
  const entry = i.entries.find((e) => e.path.endsWith('theme.css'))
  const checks = [
    [i.versions.some((v) => v.deps.some((d) => d.name === 'tailwindcss')), 'finds tailwindcss in package.json'],
    [entry?.sources.includes('"./components"'), 'reads @source from the package theme'],
    [entry?.paletteCleared === true, 'sees --color-*: initial'],
    [i.leftovers.some((l) => l.path.endsWith('tailwind.config.js')), 'flags tailwind.config.js'],
    [i.pairs.some((p) => p.surface === '--brand'), 'flags a surface with no foreground'],
  ]
  for (const [ok, label] of checks) ok ? pass(`inspect ${label}`) : fail(`inspect does not: ${label}`)
}

// ---------- 5. a package that owns its @source ----------
{
  const mono = mkdtempSync(join(tmpdir(), 'tw-mono-'))
  cpSync(join(fixtures, 'repo'), mono, { recursive: true })
  mkdirSync(join(mono, 'node_modules/@acme'), { recursive: true })
  symlinkSync(join(mono, 'packages/ui'), join(mono, 'node_modules/@acme/ui'), process.platform === 'win32' ? 'junction' : 'dir')
  const app = join(mono, 'apps/web')
  const build = (input) => {
    writeFileSync(join(app, 'app/in.css'), input)
    spawnSync('node', [twCli, '-i', 'app/in.css', '-o', 'out.css'], { cwd: app, encoding: 'utf8', env: { ...process.env, NODE_PATH: join(work, 'node_modules') } })
    return readFileSync(join(app, 'out.css'), 'utf8')
  }
  const out = build('@import "tailwindcss";\n@import "@acme/ui/theme.css";\n')
  const fromPkg = ['.bg-brand', '.px-7']
  fromPkg.every((c) => out.includes(c)) ? pass('an app that imports the package theme scans the package through its own @source') : fail(`package @source not followed: ${fromPkg.filter((c) => !out.includes(c))}`)
  out.includes('.mt-11') ? pass('the app still scans its own files') : fail('the app lost its own classes')
}

// ---------- 6. json blocks ----------
for (const b of all.filter((b) => b.lang === 'json' && b.markers['json-check'] === 'parse')) {
  try {
    JSON.parse(b.code)
  } catch (e) {
    fail(`${b.at} json does not parse: ${e.message}`)
  }
}

// ---------- 7. links, counts, dashes ----------
// Built from code points so this file does not contain the characters it looks for.
const DASHES = new RegExp(`[${String.fromCharCode(0x2013)}${String.fromCharCode(0x2014)}]`)
const slug = (h) => h.trim().toLowerCase().replace(/[`*_]/g, '').replace(/[^\w\s-]/g, '').replace(/\s/g, '-')
const anchors = (file) => new Set([...read(file).replace(/```[^]*?```/g, '').matchAll(/^#{1,6}\s+(.+)$/gm)].map((m) => slug(m[1])))
let links = 0
for (const file of [...docs, join(root, 'README.md')]) {
  const text = read(file).replace(/```[^]*?```/g, '')
  for (const m of text.matchAll(/\]\(([^)\s]+)\)/g)) {
    const target = m[1]
    if (/^(https?:|mailto:)/.test(target)) continue
    if (file.endsWith(join(root, 'README.md')) && !target.includes('tailwind-design-system')) continue
    links++
    const [path, hash] = target.split('#')
    const resolved = path ? resolve(dirname(file), path) : file
    if (!existsSync(resolved)) {
      fail(`${relative(root, file)} links to missing ${target}`)
      continue
    }
    if (hash && resolved.endsWith('.md') && !anchors(resolved).has(hash)) fail(`${relative(root, file)} links to missing anchor ${target}`)
  }
}
pass(`${links} relative links resolve`)

const resources = readdirSync(join(skill, 'resources')).filter((f) => f.endsWith('.md'))
const readme = read(join(skill, 'README.md'))
const m = readme.match(/(\d+) resource files/)
m && Number(m[1]) === resources.length ? pass(`README says ${m[1]} resource files`) : fail(`README resource count ${m?.[1]} != ${resources.length}`)
for (const r of resources) if (!readme.includes(`(./resources/${r})`)) fail(`README coverage table does not list ${r}`)
const market = JSON.parse(readFileSync(join(root, '.claude-plugin/marketplace.json'), 'utf8')).plugins.find((p) => p.name === 'tailwind-design-system')
market?.metadata?.resource_files === resources.length ? pass('marketplace.json resource count matches') : fail(`marketplace.json resource_files ${market?.metadata?.resource_files} != ${resources.length}`)

const skillMd = read(join(skill, 'SKILL.md'))
const desc = skillMd.match(/^description:\s*>?\s*\n?([^]*?)\n---/m)?.[1].replace(/\s+/g, ' ').trim() ?? ''
desc.length > 0 && desc.length <= 1024 ? pass(`description is ${desc.length} characters`) : fail(`description is ${desc.length} characters`)
const lines = skillMd.split('\n').length
lines <= 500 ? pass(`SKILL.md is ${lines} lines`) : fail(`SKILL.md is ${lines} lines, over 500`)

for (const file of [...walk(skill), ...walk(join(root, 'reviews/tailwind-design-system'))].filter((f) => /\.(md|mjs|css|json)$/.test(f))) {
  const text = read(file)
  const i = text.search(DASHES)
  if (i >= 0) fail(`${where(file, text, i)} has an em or en dash`)
}

console.log(failures ? `\n${failures} failures` : '\nAll checks pass.')
process.exit(failures ? 1 : 0)
