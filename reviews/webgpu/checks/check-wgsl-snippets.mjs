// Compiles every ```wgsl block in skills/**/*.md with naga, so a shader in
// the docs cannot ship with a syntax or type error.
//
//   node reviews/webgpu/checks/check-wgsl-snippets.mjs
//
// Needs naga on PATH (cargo install naga-cli) or NAGA=/path/to/naga.
// A fragment marks itself in the markdown, just above the block:
//   <!-- wgsl-prelude ...declarations it assumes... -->
//   <!-- wgsl-check: skip, reason -->
// naga does not run every check the browsers do. For example it accepted a
// derivative uniformity error that Dawn rejected, so a pass here is a floor.

import { execFileSync } from 'node:child_process'
import { mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(fileURLToPath(import.meta.url), '../../../..')
const naga = process.env.NAGA || 'naga'
const work = mkdtempSync(join(tmpdir(), 'wgsl-'))

function markdownFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) return markdownFiles(p)
    return p.endsWith('.md') ? [p] : []
  })
}

let checked = 0
let skipped = 0
const failures = []

for (const file of markdownFiles(join(root, 'skills'))) {
  const text = readFileSync(file, 'utf8')
  // An optional HTML comment, blank lines, then the wgsl block.
  const block = /(?:<!--\s*(wgsl-prelude\n[\s\S]*?|wgsl-check:[^\n]*?)\s*-->\n\s*)?```wgsl\n([\s\S]*?)```/g
  for (const m of text.matchAll(block)) {
    const line = text.slice(0, m.index).split('\n').length
    const where = `${relative(root, file)}:${line}`
    const note = m[1] ?? ''
    if (note.startsWith('wgsl-check: skip')) {
      skipped++
      console.log(`skip ${where} (${note.replace(/^wgsl-check: skip,?\s*/, '')})`)
      continue
    }
    const prelude = note.startsWith('wgsl-prelude') ? note.replace(/^wgsl-prelude\n/, '') + '\n' : ''
    const path = join(work, `snippet-${checked}.wgsl`)
    writeFileSync(path, prelude + m[2])
    checked++
    try {
      execFileSync(naga, [path], { stdio: 'pipe' })
      console.log(`ok   ${where}`)
    } catch (err) {
      if (err.code === 'ENOENT') {
        console.error(`naga not found. Install it with: cargo install naga-cli`)
        process.exit(2)
      }
      const msg = String(err.stderr || err.stdout).split('\n').find((l) => /error/i.test(l)) ?? 'failed'
      failures.push(where)
      console.log(`FAIL ${where}\n     ${msg.trim()}`)
    }
  }
}

console.log(`\n${checked} compiled, ${skipped} skipped, ${failures.length} failed`)
process.exit(failures.length ? 1 : 0)
