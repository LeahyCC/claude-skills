// Parses the frontmatter of every skills/*/SKILL.md with the YAML parser pi
// uses, and checks the fields skill loaders need. A skill that fails here is
// one pi skips and Claude Code lists without its description.
//
//   node reviews/all-skills/checks/check-frontmatter.mjs
//
// Each SKILL.md must open with a frontmatter block that:
//   1. parses with the yaml package (YAML_VERSION, default 2.9.0, the version
//      pi 1.4.0 loads skills with). A plain value with ": " in it fails here.
//   2. has no comment after a plain value. " #" starts a YAML comment, so
//      "description: Fixes issue #42" parses as "Fixes issue".
//   3. has a name made of lowercase letters, digits and single hyphens, at
//      most 64 characters, the same as the skill's folder.
//   4. has a description that is not blank, at most 1024 characters.
//
// Fix 1 and 2 by writing the value as a folded block, like the other skills:
// "description: >" with the text on indented lines below it. Quoting the
// value works too.
//
// `claude plugin validate . --strict` passes a SKILL.md whose frontmatter is
// not valid YAML, so it does not cover this. Needs network on the first run
// (npm installs yaml into a temp folder).

import { execSync } from 'node:child_process'
import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(fileURLToPath(import.meta.url), '../../../..')
const version = process.env.YAML_VERSION || '2.9.0'

// Agent Skills spec limits, which pi enforces.
const NAME_MAX = 64
const DESCRIPTION_MAX = 1024
// Lowercase letters and digits, joined by single hyphens.
const NAME_SHAPE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

let failures = 0
const fail = (msg) => {
  console.log(`FAIL  ${msg}`)
  failures++
}
const pass = (msg) => console.log(`ok    ${msg}`)

// ---------- install yaml ----------
const work = mkdtempSync(join(tmpdir(), `yaml-${version}-`))
writeFileSync(join(work, 'package.json'), '{"private":true}')
execSync(`npm install --silent --no-audit --no-fund --prefer-offline yaml@${version}`, {
  cwd: work,
  stdio: ['ignore', 'ignore', 'inherit'],
})
const YAML = createRequire(join(work, 'index.js'))('yaml')

// pi's cut: drop a BOM, turn CRLF and CR into LF, then take the text between
// the opening --- and the next line that starts with ---.
function frontmatter(text) {
  const t = text.replace(/^﻿/, '').replace(/\r\n?/g, '\n')
  if (!t.startsWith('---')) return null
  const end = t.indexOf('\n---', 3)
  return end === -1 ? null : t.slice(4, end)
}

// What is wrong with one SKILL.md, one message per problem.
function problems(text, folder) {
  const source = frontmatter(text)
  if (source === null) return ['has no frontmatter: open the file with a --- line and close the block with another']

  // parse() in pi throws the first of these errors.
  const doc = YAML.parseDocument(source)
  if (doc.errors.length) {
    const [error] = doc.errors
    // yaml counts from the line after the opening ---, so add 1 for the file.
    const { line, col } = error.linePos?.[0] ?? { line: 0, col: 0 }
    const reason = error.message.split(' at line ')[0]
    const hint =
      error.code === 'BLOCK_AS_IMPLICIT_KEY'
        ? ' A plain value cannot contain ": ". Quote the value, or write it as a folded block (description: >).'
        : ''
    return [`line ${line + 1}, column ${col}: not valid YAML: ${reason}.${hint}`]
  }
  if (!YAML.isMap(doc.contents)) return ['frontmatter is not a set of key: value lines']

  const found = []
  for (const { key, value } of doc.contents.items) {
    if (value?.type === 'PLAIN' && value.comment) {
      found.push(`${key}: "#${value.comment}" is a YAML comment, not part of the value. Quote the value, or write it as a folded block.`)
    }
  }
  const { name, description } = doc.toJS()
  if (typeof name !== 'string') found.push('name is missing or not text')
  else {
    if (!NAME_SHAPE.test(name)) found.push(`name "${name}" must be lowercase letters, digits and single hyphens`)
    if (name.length > NAME_MAX) found.push(`name is ${name.length} characters, over ${NAME_MAX}`)
    if (name !== folder) found.push(`name "${name}" does not match its folder, ${folder}`)
  }
  if (typeof description !== 'string' || !description.trim()) found.push('description is missing or blank')
  else if (description.length > DESCRIPTION_MAX) found.push(`description is ${description.length} characters, over ${DESCRIPTION_MAX}`)
  return found
}

// ---------- every skill ----------
const skills = join(root, 'skills')
const folders = readdirSync(skills, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)
for (const folder of folders) {
  const where = `skills/${folder}/SKILL.md`
  const file = join(skills, folder, 'SKILL.md')
  if (!existsSync(file)) {
    fail(`${where} is missing`)
    continue
  }
  const found = problems(readFileSync(file, 'utf8'), folder)
  for (const problem of found) fail(`${where} ${problem}`)
  if (!found.length) pass(where)
}

// ---------- the check still catches what it is for ----------
// Each bad file must fail for its own reason, not for a side effect.
const fileWith = (lines) => `---\n${lines}\n---\n\n# Demo\n`
const BAD = [
  [
    'a plain description with ": " in it, as plain-docs had',
    fileWith('name: demo\ndescription: Use when writing or fixing documentation: README files, guides.'),
    'not valid YAML',
  ],
  ['a plain description cut short by " #"', fileWith('name: demo\ndescription: Fixes the bug in issue #42 and more.'), 'YAML comment'],
  ['a description over 1024 characters', fileWith(`name: demo\ndescription: ${'x'.repeat(DESCRIPTION_MAX + 1)}`), 'over 1024'],
  ['a name that does not match its folder', fileWith('name: other\ndescription: Does one thing.'), 'does not match its folder'],
  ['a file with no frontmatter', '# Demo\n', 'no frontmatter'],
]
for (const [label, text, reason] of BAD) {
  const found = problems(text, 'demo')
  if (found.length === 1 && found[0].includes(reason)) pass(`catches ${label}`)
  else fail(`expected only "${reason}" for ${label}, got: ${found.join('; ') || 'nothing'}`)
}
// Inside a folded block, ": " and " #" are plain text.
const folded = fileWith('name: demo\ndescription: >\n  Use when writing documentation: README files,\n  issue #42 and more.')
const extra = problems(folded, 'demo')
if (extra.length) fail(`flags a valid folded description: ${extra.join('; ')}`)
else pass('passes a folded description with ": " and " #" in it')

console.log(failures ? `\n${failures} failures` : '\nAll frontmatter checks pass.')
process.exit(failures ? 1 : 0)
