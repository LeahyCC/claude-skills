// Type-checks every ```ts block in skills/typescript-safety/**/*.md, so a
// sample in the docs cannot ship with a type error.
//
//   node reviews/typescript-safety/checks/check-ts-snippets.mjs
//
// Each block becomes its own module and is compiled under the baseline
// tsconfig from config.md (the block marked <!-- ts-config: baseline -->), so
// the config the skill recommends is the config its samples pass under.
//
// FAIL samples mark the line that must not compile with // @ts-expect-error.
// tsc reports an unused @ts-expect-error (TS2578), so a FAIL sample that
// compiles fails this check. That is what makes the check able to fail.
//
// Markers, in an HTML comment just above a block:
//   <!-- ts-prelude ...declarations the block assumes... -->
//   <!-- ts-check: skip, reason -->
//   <!-- ts-only: 7 -->            only checked when the major version matches
//
// TS_VERSIONS picks the compilers (default "7.0.2 6.0.3"). Only this skill is
// scanned: the other skills' TS samples import frameworks and were never
// written to compile alone.

import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(fileURLToPath(import.meta.url), '../../../..')
const skill = join(root, 'skills/typescript-safety')
const versions = (process.env.TS_VERSIONS || '7.0.2 6.0.3').split(/\s+/).filter(Boolean)

function markdownFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) return markdownFiles(p)
    return p.endsWith('.md') ? [p] : []
  })
}

const baselinePattern = /<!--\s*ts-config: baseline\s*-->\n\s*```jsonc\n([\s\S]*?)```/
const baselineMatch = readFileSync(join(skill, 'resources/config.md'), 'utf8').match(baselinePattern)
if (!baselineMatch) {
  console.error('No <!-- ts-config: baseline --> jsonc block in resources/config.md')
  process.exit(1)
}

const blocks = []
let skipped = 0
for (const file of markdownFiles(skill)) {
  const text = readFileSync(file, 'utf8')
  // An optional HTML comment, blank lines, then the ts block.
  const block = /(?:<!--\s*(ts-prelude\n[\s\S]*?|ts-check:[^\n]*?|ts-only:[^\n]*?)\s*-->\n\s*)?```ts\n([\s\S]*?)```/g
  for (const m of text.matchAll(block)) {
    const marker = m[1] ?? ''
    const line = text.slice(0, m.index).split('\n').length + (marker ? marker.split('\n').length : 0)
    if (marker.startsWith('ts-check: skip')) {
      skipped++
      continue
    }
    const only = marker.startsWith('ts-only:') ? marker.slice('ts-only:'.length).trim() : null
    const prelude = marker.startsWith('ts-prelude') ? marker.slice('ts-prelude'.length).trim() + '\n' : ''
    blocks.push({ where: `${relative(root, file)}:${line}`, only, prelude, code: m[2] })
  }
}

const failures = []
for (const version of versions) {
  const major = version.split('.')[0]
  const work = mkdtempSync(join(tmpdir(), `ts-${version}-`))
  mkdirSync(join(work, 'src'))
  writeFileSync(join(work, 'base.json'), baselineMatch[1])

  // Prelude lines sit above the sample, so error lines are shifted back.
  const files = new Map()
  blocks.forEach((b, i) => {
    if (b.only && b.only !== major) return
    const name = `src/block${i}.ts`
    writeFileSync(join(work, name), b.prelude + b.code)
    files.set(name, { ...b, offset: b.prelude.split('\n').length - 1 })
  })
  // noEmit: the check is about types. types: [] keeps @types/* out.
  writeFileSync(
    join(work, 'tsconfig.json'),
    JSON.stringify({ extends: './base.json', compilerOptions: { noEmit: true, types: [] }, include: ['src'] }),
  )

  let out = ''
  try {
    execFileSync('npx', ['--yes', '-p', `typescript@${version}`, 'tsc', '-p', work, '--pretty', 'false'], {
      cwd: work,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
  } catch (err) {
    out = `${err.stdout ?? ''}${err.stderr ?? ''}`
    if (!out.trim()) throw err
  }

  for (const line of out.split('\n').filter(Boolean)) {
    const m = line.match(/^(?:.*\/)?(src\/block\d+\.ts)\((\d+),(\d+)\): (.*)$/)
    const b = m && files.get(m[1])
    if (!b) {
      failures.push(`[ts ${version}] ${line}`)
      continue
    }
    const at = Number(m[2]) - b.offset
    failures.push(`[ts ${version}] ${b.where} (block line ${at}): ${m[4]}`)
  }
  console.log(`ts ${version}: ${files.size} blocks compiled`)
}

if (skipped) console.log(`${skipped} blocks skipped by marker`)
if (failures.length) {
  console.error(`\n${failures.length} errors:\n${failures.join('\n')}`)
  process.exit(1)
}
console.log('All TypeScript samples pass.')
