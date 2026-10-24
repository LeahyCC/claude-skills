// Type-checks every ```ts block in skills/gotchas/**/*.md, so no sample in
// the gotchas skill ships with a type error.
//
//   node reviews/gotchas/checks/check-ts-snippets.mjs

import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(fileURLToPath(import.meta.url), '../../../..')
const skill = join(root, 'skills/gotchas')
const versions = (process.env.TS_VERSIONS || '7.0.2 6.0.3').split(/\s+/).filter(Boolean)

function markdownFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) return markdownFiles(p)
    return p.endsWith('.md') ? [p] : []
  })
}

const blocks = []
for (const file of markdownFiles(skill)) {
  const text = readFileSync(file, 'utf8')
  const block = /```ts\r?\n([\s\S]*?)```/g
  for (const m of text.matchAll(block)) {
    const line = text.slice(0, m.index).split('\n').length
    blocks.push({ where: `${relative(root, file)}:${line}`, code: m[1] })
  }
}

const failures = []
for (const version of versions) {
  const work = mkdtempSync(join(tmpdir(), `gotchas-ts-${version}-`))
  mkdirSync(join(work, 'src'))

  const files = new Map()
  blocks.forEach((b, i) => {
    const name = `src/block${i}.ts`
    writeFileSync(join(work, name), b.code)
    files.set(name, b)
  })

  writeFileSync(
    join(work, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        target: 'es2024',
        lib: ['es2024', 'dom', 'dom.iterable'],
        module: 'preserve',
        moduleResolution: 'bundler',
        strict: true,
        noUncheckedIndexedAccess: true,
        noImplicitOverride: true,
        noImplicitReturns: true,
        noFallthroughCasesInSwitch: true,
        verbatimModuleSyntax: true,
        erasableSyntaxOnly: true,
        noEmit: true,
        types: [],
      },
      include: ['src'],
    }),
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
    failures.push(`[ts ${version}] ${b.where} (block line ${m[2]}): ${m[4]}`)
  }
  console.log(`ts ${version}: ${files.size} blocks compiled`)
}

if (failures.length) {
  console.error(`\n${failures.length} errors:\n${failures.join('\n')}`)
  process.exit(1)
}
console.log('All gotchas TypeScript samples pass.')

