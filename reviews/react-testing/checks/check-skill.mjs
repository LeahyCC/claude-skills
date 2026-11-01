// Runs every ```tsx test block in skills/react-testing/**/*.md as its own
// Vitest file against the pinned stack below, so no example in the skill
// ships failing or hanging. Also checks that relative links resolve and that
// the README resource count matches the files on disk.
//
//   node reviews/react-testing/checks/check-skill.mjs
//
// Needs network on the first run (npm install into a temp folder).

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(fileURLToPath(import.meta.url), '../../../..')
const skill = join(root, 'skills/react-testing')

// Keep in step with the versions named in skills/react-testing/SOURCES.md.
const stack = {
  vitest: '5.0.5',
  '@vitejs/plugin-react': '6.1.2',
  jsdom: '30.1.3',
  react: '19.3.1',
  'react-dom': '19.3.1',
  '@testing-library/react': '16.3.3',
  '@testing-library/dom': '10.4.2',
  '@testing-library/user-event': '14.6.8',
  '@testing-library/jest-dom': '7.0.1',
  msw: '3.0.3',
}

function markdownFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) return markdownFiles(p)
    return p.endsWith('.md') ? [p] : []
  })
}

const failures = []
const blocks = []

for (const file of markdownFiles(skill)) {
  const text = readFileSync(file, 'utf8')

  for (const m of text.matchAll(/```tsx test\r?\n([\s\S]*?)```/g)) {
    const line = text.slice(0, m.index).split('\n').length
    blocks.push({ where: `${relative(root, file)}:${line}`, code: m[1] })
  }

  // Relative links, ignoring anchors and code spans.
  const prose = text.replace(/```[\s\S]*?```/g, '').replace(/`[^`]*`/g, '')
  for (const [, target] of prose.matchAll(/\]\(([^)#\s]+)(?:#[^)]*)?\)/g)) {
    if (/^[a-z]+:/i.test(target)) continue
    if (!existsSync(resolve(dirname(file), target))) {
      failures.push(`broken link in ${relative(root, file)}: ${target}`)
    }
  }
}

const resources = readdirSync(join(skill, 'resources')).filter((f) => f.endsWith('.md'))
const readme = readFileSync(join(skill, 'README.md'), 'utf8')
const claimed = readme.match(/(\d+) resource files/)
if (!claimed || Number(claimed[1]) !== resources.length) {
  failures.push(`README says ${claimed?.[1] ?? '?'} resource files, disk has ${resources.length}`)
}

const work = mkdtempSync(join(tmpdir(), 'react-testing-'))
mkdirSync(join(work, 'src'))
writeFileSync(
  join(work, 'package.json'),
  JSON.stringify({ name: 'react-testing-check', private: true, type: 'module', devDependencies: stack }),
)
writeFileSync(
  join(work, 'vitest.config.ts'),
  `import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
export default defineConfig({
  plugins: [react()],
  test: { environment: 'jsdom', setupFiles: ['./setup.ts'], restoreMocks: true, testTimeout: 5000 },
})
`,
)
// The same setup file the skill recommends in resources/setup.md.
writeFileSync(
  join(work, 'setup.ts'),
  `import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
afterEach(() => {
  cleanup()
})
`,
)

const byFile = new Map()
blocks.forEach((b, i) => {
  const name = `src/block${i}.test.tsx`
  writeFileSync(join(work, name), b.code)
  byFile.set(name, b)
})

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx'
const shell = process.platform === 'win32'
execFileSync(npm, ['install', '--no-audit', '--no-fund', '--silent'], { cwd: work, stdio: 'inherit', shell })

let report
try {
  execFileSync(npx, ['vitest', 'run', '--reporter=json', '--outputFile=report.json'], {
    cwd: work,
    stdio: ['ignore', 'ignore', 'pipe'],
    shell,
  })
} catch {
  // Failing tests exit non-zero. The JSON report below says which.
}
try {
  report = JSON.parse(readFileSync(join(work, 'report.json'), 'utf8'))
} catch {
  failures.push(`vitest produced no report in ${work}`)
}

if (report) {
  const ran = new Set()
  for (const result of report.testResults) {
    const name = relative(work, result.name).replaceAll('\\', '/')
    ran.add(name)
    const b = byFile.get(name)
    for (const t of result.assertionResults) {
      if (t.status !== 'passed') {
        failures.push(`${b?.where ?? name} "${t.title}": ${t.status}\n  ${(t.failureMessages[0] ?? '').split('\n')[0]}`)
      }
    }
    if (result.status !== 'passed' && result.assertionResults.length === 0) {
      failures.push(`${b?.where ?? name}: ${result.message.split('\n')[0]}`)
    }
  }
  for (const [name, b] of byFile) if (!ran.has(name)) failures.push(`${b.where}: never ran`)
  console.log(`${blocks.length} blocks, ${report.numPassedTests} of ${report.numTotalTests} tests passed`)
}

if (failures.length) {
  console.error(`\n${failures.length} problems:\n${failures.join('\n')}`)
  process.exit(1)
}
console.log('All react-testing examples pass, links resolve, counts match.')
