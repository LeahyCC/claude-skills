// Encodes the balanced floating-number rule from
// skills/code-readability/resources/magic-numbers.md as runnable cases, and
// checks every relative link in the skill resolves.
//
//   node reviews/code-readability/checks/check-magic-numbers.mjs
//
// This is a heuristic spec, not a linter: it proves the FAIL/PASS pairs the
// skill teaches are exactly what the stated rule (named, labelled, exempt)
// accepts and rejects. Real enforcement is ESLint no-magic-numbers — see
// skills/code-readability/resources/linting.md.
//
// FAIL = a bare literal carrying time/retries/a threshold in an expression.
// PASS = the same value named, labelled by its property, documented with
// unit+why, or exempt (0, 1, -1, identity math, its own const definition).

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(fileURLToPath(import.meta.url), '../../../..')
const skill = join(root, 'skills/code-readability')

const ALLOWED = new Set(['0', '1', '-1'])
const NUM = /-?\d[\d_]*(?:\.\d+)?/g

function stripComments(line) {
  return line.replace(/\/\/.*$/, '')
}

// A unit+why comment documents a literal: it names a unit AND gives a reason
// (a colon or semicolon clause, or a "matches/because/so/never/see" clause).
// "// 180000 ms" (unit only) and "// timeout" (label only) do not qualify.
function hasUnitWhyComment(line) {
  const m = line.match(/\/\/\s*(.+)$/)
  if (!m) return false
  const text = m[1]
  const hasUnit = /\b(ms|s|sec|seconds?|min|minutes?|h|hours?|bytes?|KiB|MiB|%|cents?|retries|attempts)\b/i.test(text)
  const hasWhy = /[:;]|\b(matches|because|so that|never|see|per|limit|cap)\b/i.test(text)
  return hasUnit && hasWhy
}

export function floatingNumbers(code) {
  const hits = []
  code.split('\n').forEach((raw, i) => {
    if (hasUnitWhyComment(raw)) return
    let line = stripComments(raw)
    // The named constant's own definition is the fix, not the problem.
    if (/^\s*(export\s+)?const\s+[A-Z][A-Z0-9_]*\s*=/.test(line)) return
    // Labelled by its slot: { timeoutMs: 5000 }, maxRetries: 3
    line = line.replace(/[A-Za-z_$][\w$]*\s*:\s*-?\d[\d_]*(?:\.\d+)?/g, '')
    // Array indexes: arr[0]
    line = line.replace(/\[\s*-?\d+\s*\]/g, '[]')
    for (const m of line.matchAll(NUM)) {
      if (ALLOWED.has(m[0])) continue
      // Self-evident identity math: / 2 (centre), * 100 is NOT exempt on its
      // own, but division by 2 in a width/centre formula is taught as PASS.
      const before = line.slice(0, m.index).trimEnd()
      if (m[0] === '2' && before.endsWith('/')) continue
      hits.push({ line: i + 1, literal: m[0], text: raw.trim() })
    }
  })
  return hits
}

// --- Cases copied from resources/magic-numbers.md (keep in sync) -----------

const FAIL = [
  'const deadline = performance.now() + 180_000',
  'if (retries > 5) await sleep(250)',
  'if (score >= 0.85) promote()',
  'setTimeout(fn, 86400000)',
  'deadline = performance.now() + 180_000 // timeout',
]

const PASS = [
  'const SESSION_TIMEOUT_MS = 180_000 // 3 min, matches the server session TTL',
  'const deadline = performance.now() + SESSION_TIMEOUT_MS',
  'connect(host, { port: 22, retries: 3 })',
  'deadline = performance.now() + 180_000 // 180 s: matches the server session TTL',
  'const centre = width / 2',
  'if (items.length - 1 >= 0) arr[0]',
  'const MS_PER_DAY = 86_400_000',
]

const failures = []
for (const code of FAIL) {
  if (floatingNumbers(code).length === 0) failures.push(`FAIL case not flagged: ${code}`)
}
for (const code of PASS) {
  const hits = floatingNumbers(code)
  if (hits.length) failures.push(`PASS case flagged (${hits.map((h) => h.literal).join(', ')}): ${code}`)
}

// --- Every relative link in the skill must resolve --------------------------

function markdownFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) return markdownFiles(p)
    return p.endsWith('.md') ? [p] : []
  })
}

let links = 0
for (const file of markdownFiles(skill)) {
  const text = readFileSync(file, 'utf8')
  for (const m of text.matchAll(/\]\((\.[^)\s]+)\)/g)) {
    links++
    const target = join(dirname(file), m[1].split('#')[0])
    if (!existsSync(target)) failures.push(`Broken link in ${relative(root, file)}: ${m[1]}`)
  }
}

console.log(`${FAIL.length} FAIL cases flagged, ${PASS.length} PASS cases clean, ${links} links checked`)
if (failures.length) {
  console.error(`\n${failures.length} failures:\n${failures.join('\n')}`)
  process.exit(1)
}
console.log('All code-readability checks pass.')
