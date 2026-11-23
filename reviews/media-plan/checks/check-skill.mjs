// Checks the media-plan skill against itself:
//   1. the worked example in SKILL.md fits the models: its shot lengths add up to the stated length,
//      no Wan 2.2 shot runs past 5 seconds, every LTX-2.5 shot runs 5 to 10, and there is one
//      /media-prompt hand-off line for each shot
//   2. no em dashes in the skill or its tasks
//   3. relative links and anchors resolve (in this file and across files), files over 100 lines
//      have a contents list, the frontmatter is valid, and the counts in README.md and
//      marketplace.json match the files
//
//   node reviews/media-plan/checks/check-skill.mjs

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(fileURLToPath(import.meta.url), '../../../..')
const skill = join(root, 'skills/media-plan')
let failures = 0
const fail = (msg) => {
  console.log(`FAIL  ${msg}`)
  failures++
}
const pass = (msg) => console.log(`ok    ${msg}`)

// Windows checkouts may turn LF into CRLF; the checks below assume LF.
const readAt = (path) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n')
const read = (path) => readAt(join(skill, path))
const docs = ['SKILL.md', 'README.md', 'SOURCES.md', ...readdirSync(join(skill, 'resources')).map((f) => `resources/${f}`)]

// ---------------------------------------------------------------------------------------------
// 1. The worked example fits what the models can make

// Wan 2.2 A14B makes 81 frames at 16 fps, about 5 s. LTX-2.5 makes 5 to 10 s per clip.
// These limits come from media-prompt's wan.md and ltx.md.
const WAN_MAX_SECONDS = 5
const LTX_MIN_SECONDS = 5
const LTX_MAX_SECONDS = 10

const skillText = read('SKILL.md')
const example = skillText.split(/^## Worked example$/m)[1]?.split(/^## /m)[0] ?? ''
const statedLength = Number(/Length: (\d+) s/.exec(example)?.[1])
const shotList = example.split(/^### Shot list$/m)[1]?.split(/^### /m)[0] ?? ''
const tableRows = shotList.split('\n').filter((line) => /^\| \d+ \|/.test(line))
const header = shotList.split('\n').find((line) => line.startsWith('| #')) ?? ''
const columns = header.split('|').map((cell) => cell.trim())
const secondsColumn = columns.indexOf('Sec')
const routeColumn = columns.indexOf('Route')

if (!example) fail('SKILL.md has no "## Worked example" section')
else if (!statedLength) fail('worked example: no "Length: <n> s" line')
else if (tableRows.length === 0 || secondsColumn < 0 || routeColumn < 0) fail('worked example: no shot list table with Sec and Route columns')
else {
  let total = 0
  for (const row of tableRows) {
    const cells = row.split('|').map((cell) => cell.trim())
    const seconds = Number(cells[secondsColumn])
    const route = cells[routeColumn]
    total += seconds
    if (/Wan/.test(route) && !/LTX/.test(route) && seconds > WAN_MAX_SECONDS) fail(`worked example: shot ${cells[1]} is ${seconds} s on Wan 2.2, which makes about ${WAN_MAX_SECONDS}`)
    if (/LTX/.test(route) && (seconds < LTX_MIN_SECONDS || seconds > LTX_MAX_SECONDS)) fail(`worked example: shot ${cells[1]} is ${seconds} s on LTX-2.5, which makes ${LTX_MIN_SECONDS} to ${LTX_MAX_SECONDS}`)
  }
  if (total !== statedLength) fail(`worked example: shots add up to ${total} s, the plan says ${statedLength} s`)
  else pass(`worked example: ${tableRows.length} shots add up to ${total} s, each within its model's length`)

  const handOff = example.split(/^### Hand-off$/m)[1]?.split(/^### /m)[0] ?? ''
  const handOffLines = handOff.split('\n').filter((line) => line.startsWith('/media-prompt '))
  const shotsHandedOff = new Set(handOffLines.flatMap((line) => [...line.matchAll(/\bshot (\d+)\b/gi)].map((m) => m[1])))
  const missing = tableRows.map((row) => row.split('|')[1].trim()).filter((n) => !shotsHandedOff.has(n))
  if (handOffLines.length === 0) fail('worked example: no /media-prompt hand-off lines')
  else if (missing.length) fail(`worked example: no hand-off line names shot ${missing.join(', ')}`)
  else pass(`worked example: ${handOffLines.length} hand-off lines cover all ${tableRows.length} shots`)
}

// ---------------------------------------------------------------------------------------------
// 2. No em dashes

const EM_DASH = '—'
const tasks = join(root, 'reviews/media-plan/tasks.md')
const dashFiles = [...docs.map((doc) => join(skill, doc)), tasks].filter((path) => existsSync(path) && readAt(path).includes(EM_DASH))
if (dashFiles.length) fail(`em dashes in ${dashFiles.map((p) => relative(root, p)).join(', ')}`)
else pass(`no em dashes in ${docs.length + 1} files`)

// ---------------------------------------------------------------------------------------------
// 3. Links, contents lists, frontmatter, counts

const slug = (heading) => heading.trim().toLowerCase().replace(/[^\p{L}\p{N} -]/gu, '').replace(/ /g, '-')
const anchorsOf = (path) => new Set([...readAt(path).matchAll(/^#{1,6} (.+)$/gm)].map((m) => slug(m[1])))
let links = 0
for (const doc of docs) {
  const here = join(skill, doc)
  const text = read(doc)
  for (const [, target] of text.matchAll(/\]\(([^)\s]+)\)/g)) {
    if (/^(https?:|mailto:)/.test(target)) continue
    links++
    const [path, anchor] = target.split('#')
    const file = path === '' ? here : resolve(dirname(here), path)
    if (!existsSync(file)) {
      fail(`${doc}: link ${target} does not resolve`)
      continue
    }
    if (anchor && file.endsWith('.md') && !anchorsOf(file).has(anchor)) fail(`${doc}: anchor #${anchor} has no heading in ${relative(skill, file)}`)
  }
  const lines = text.split('\n')
  if (doc.startsWith('resources/') && lines.length > 100 && !lines.slice(0, 20).some((l) => /^## Contents/.test(l))) {
    fail(`${doc}: ${lines.length} lines and no contents list near the top`)
  }
}
pass(`${links} relative links checked across ${docs.length} files`)

// The skill is read on its own after install, so it must not link into media-prompt's folder.
const crossLinks = docs.filter((doc) => /\]\((\.\.\/)+media-prompt\//.test(read(doc)))
if (crossLinks.length) fail(`links into media-prompt's folder break after install: ${crossLinks.join(', ')}`)
else pass('no links into media-prompt\'s folder')

const SKILL_DESCRIPTION_LIMIT = 1024
const frontmatter = /^---\n([\s\S]*?)\n---/.exec(skillText)?.[1] ?? ''
const keys = [...frontmatter.matchAll(/^([a-z_]+):/gm)].map((m) => m[1])
const description = /description: >\n([\s\S]*)/.exec(frontmatter)?.[1].split('\n').map((l) => l.trim()).join(' ').trim() ?? ''
if (keys.join(',') !== 'name,description') fail(`frontmatter keys should be name and description, got ${keys}`)
else if (!/^name: media-plan$/m.test(frontmatter)) fail('frontmatter name is not media-plan')
else if (description.length === 0 || description.length > SKILL_DESCRIPTION_LIMIT) fail(`description is ${description.length} characters (must be 1 to ${SKILL_DESCRIPTION_LIMIT})`)
else if (!/media-prompt/.test(description)) fail('description does not say it hands off to media-prompt')
else pass(`frontmatter: name and description only, description ${description.length} characters, names media-prompt`)

const resourceCount = readdirSync(join(skill, 'resources')).filter((f) => f.endsWith('.md')).length
const readmeCount = Number(/(\d+) resource files/.exec(read('README.md'))?.[1])
const marketplace = JSON.parse(readFileSync(join(root, '.claude-plugin/marketplace.json'), 'utf8'))
const entry = marketplace.plugins.find((p) => p.name === 'media-plan')
if (readmeCount !== resourceCount) fail(`README says ${readmeCount} resource files, folder has ${resourceCount}`)
else if (entry?.metadata?.resource_files !== resourceCount) fail(`marketplace.json resource_files is ${entry?.metadata?.resource_files}, folder has ${resourceCount}`)
else pass(`README and marketplace.json both count ${resourceCount} resource files`)

console.log(failures ? `\n${failures} failed` : '\nall checks passed')
process.exit(failures ? 1 : 0)
