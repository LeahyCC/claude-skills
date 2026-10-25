// Checks the ascii-art skill against itself:
//   1. every text block in its markdown passes check.mjs, and every FAIL example fails
//   2. check.mjs catches known bad drawings
//   3. script samples shown in the docs are real script output, not hand-typed
//   4. every script's output passes check.mjs
//   5. relative links resolve, and the counts in README and marketplace.json match the files
//
//   node reviews/ascii-art/checks/check-skill.mjs

import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(fileURLToPath(import.meta.url), '../../../..')
const skill = join(root, 'skills/ascii-art')
const script = (name) => join(skill, 'scripts', name)
let failures = 0
const fail = (msg) => {
  console.log(`FAIL  ${msg}`)
  failures++
}
const pass = (msg) => console.log(`ok    ${msg}`)

const run = (name, args, input) => execFileSync('node', [script(name), ...args], { input, encoding: 'utf8' }).replace(/\n$/, '')
const check = (input, args = ['-']) => spawnSync('node', [script('check.mjs'), ...args], { input, encoding: 'utf8' })

// 1. The skill's own drawings.
const docs = ['SKILL.md', 'README.md', ...readdirSync(join(skill, 'resources')).map((f) => `resources/${f}`)]
for (const doc of docs) {
  const r = check('', [join(skill, doc), '--all'])
  if (r.status !== 0) fail(`${doc}: check.mjs --all exit ${r.status}\n${r.stdout}`)
  else if (/\bwarn\b/.test(r.stdout)) fail(`${doc}: warnings\n${r.stdout}`)
  else pass(`${doc}: every text block clean, every FAIL example fails`)
}

// 2. Known bad drawings must be caught.
const BAD = {
  'label row one cell too wide': '┌─────────┐\n│  Input   │\n└─────────┘',
  'split one column off its stem': '   ┌────────┐\n   │ Check  │\n   └───┬────┘\n        │\n   ┌────┴────┐',
  'ASCII box drifting': '+---+    +---+\n|   |-->|   |\n+---+    +---+',
  'tab inside a drawing': '┌───┐\n│\tA│\n└───┘',
}
for (const [name, art] of Object.entries(BAD)) {
  const r = check(art)
  if (r.status === 1) pass(`catches: ${name}`)
  else fail(`missed: ${name}\n${r.stdout}`)
}
const emoji = check('│ 🙂 │')
if (/emoji/.test(emoji.stdout)) pass('warns on emoji')
else fail('no emoji warning')
const outside = check('', [join(root, 'reviews/ascii-art/checks/fixtures/unfenced.md'), '--all'])
if (/outside a code fence/.test(outside.stdout)) pass('warns on art outside a fence')
else fail(`no warning for art outside a fence\n${outside.stdout}`)

// 3. Samples in the docs must match the scripts exactly.
const sprite = '..#.....#..\n...#...#...\n..#######..\n.##.###.##.\n###########\n#.#######.#\n#.#.....#.#\n...##.##...'
const routes = 'Route,p50,p95,Errors\n/api/cart,42 ms,180 ms,0.1%\n/api/login,95 ms,410 ms,1.2%\n/api/search,130 ms,900 ms,0.4%'
const latency = '120 132 128 145 160 151 178 190 185 210'.split(' ')
const SAMPLES = [
  ['README.md', 'banner.mjs', ['ASCII ART', '--half']],
  ['resources/text-art.md', 'banner.mjs', ['HELLO', '--shadow']],
  ['resources/text-art.md', 'banner.mjs', ['Happy birthday', '--half']],
  ['resources/text-art.md', 'banner.mjs', ['v2.0', '--ascii', '--box']],
  ['resources/text-art.md', 'layout.mjs', ['box', 'Run the migration on staging first.', '--title', 'Note', '--style', 'rounded', '--width', '40']],
  ['resources/charts-and-tables.md', 'chart.mjs', ['bar', 'Build=42', 'Test=118', 'Lint=9', 'Deploy=63', '--unit', 's', '--sort', '--width', '30']],
  ['resources/charts-and-tables.md', 'chart.mjs', ['spark', ...latency, '--range', '--unit', 'ms']],
  ['resources/charts-and-tables.md', 'chart.mjs', ['plot', ...latency, '195', '230', '--width', '30', '--height', '6', '--unit', 'ms']],
  ['resources/charts-and-tables.md', 'layout.mjs', ['table'], routes],
  ['resources/diagrams.md', 'layout.mjs', ['tree'], 'src\n  app\n    page.tsx\n    layout.tsx\n  lib\n    db.ts'],
  ['resources/games.md', 'art.mjs', ['maze', '8', '4', '--seed', '3', '--solve']],
  ['resources/pictures.md', 'art.mjs', ['pixels'], sprite],
]
for (const [doc, name, args, input] of SAMPLES) {
  const out = run(name, args, input)
  const text = readFileSync(join(skill, doc), 'utf8')
  const label = `${doc}: ${name} ${args.slice(0, 3).join(' ')}`
  if (text.includes(out)) pass(`${label} matches the script`)
  else fail(`${label} does not match the script. Expected:\n${out}`)
}
const mirrored = run('art.mjs', ['mirror'], '  /\n (  o')
if (mirrored === '  /    \\\n (  oo  )') pass('mirror swaps / \\ and ( )')
else fail(`mirror gave:\n${mirrored}`)

// 4. Whatever the scripts draw must pass the checker.
const OUTPUTS = [
  ['banner.mjs', ['TEST 123 !?', '--shadow', '--box']],
  ['banner.mjs', ['abc xyz', '--half']],
  ['chart.mjs', ['bar', 'a=1', 'b=2.5', 'c=10']],
  ['layout.mjs', ['table', '--style', 'double'], 'a,b\n東京,2'],
  ['layout.mjs', ['box', '東京 and some text that wraps around', '--width', '20']],
  ['layout.mjs', ['tree', '--paths'], 'a/b/c\na/d\ne'],
  ['art.mjs', ['maze', '15', '8', '--seed', '42']],
  ['art.mjs', ['maze', '15', '8', '--seed', '42', '--ascii', '--solve']],
]
for (const [name, args, input] of OUTPUTS) {
  const r = check(run(name, args, input))
  if (r.status === 0 && !/\bwarn\b/.test(r.stdout)) pass(`${name} ${args[0]} output is clean`)
  else fail(`${name} ${args.join(' ')} output fails check.mjs\n${r.stdout}`)
}

// 5. Links and counts.
for (const doc of docs) {
  const text = readFileSync(join(skill, doc), 'utf8')
  for (const [, target] of text.matchAll(/\]\((\.{0,2}\/?[^)#\s]+)(?:#[^)]*)?\)/g)) {
    if (/^https?:/.test(target)) continue
    if (!existsSync(join(dirname(join(skill, doc)), target))) fail(`${doc}: broken link ${target}`)
  }
}
pass('relative links checked')

const resources = readdirSync(join(skill, 'resources')).filter((f) => f.endsWith('.md'))
const readme = readFileSync(join(skill, 'README.md'), 'utf8')
const listed = [...readme.matchAll(/\[([\w-]+\.md)\]\(\.\/resources\//g)].map((m) => m[1])
if (listed.length === resources.length && resources.every((r) => listed.includes(r))) pass(`README lists all ${resources.length} resource files`)
else fail(`README lists ${listed.length} resources, folder has ${resources.length}`)

const scripts = readdirSync(join(skill, 'scripts')).filter((f) => f.endsWith('.mjs') && f !== 'width.mjs')
const listedScripts = [...readme.matchAll(/\[([\w-]+\.mjs)\]\(\.\/scripts\//g)].map((m) => m[1]).filter((s) => s !== 'width.mjs')
if (listedScripts.length === scripts.length && /All five share/.test(readme) && scripts.length === 5) pass('README lists all 5 scripts')
else fail(`README lists ${listedScripts.length} scripts, folder has ${scripts.length}`)

const market = JSON.parse(readFileSync(join(root, '.claude-plugin/marketplace.json'), 'utf8'))
const entry = market.plugins.find((p) => p.name === 'ascii-art')
if (entry?.metadata?.resource_files === resources.length) pass('marketplace.json resource_files matches')
else fail(`marketplace.json resource_files is ${entry?.metadata?.resource_files}, folder has ${resources.length}`)

console.log(failures ? `\n${failures} failure(s)` : '\nall checks passed')
process.exit(failures ? 1 : 0)
