// Checks the media-plan skill against itself:
//   1. the worked example in SKILL.md fits the models: its shot lengths add up to the stated length,
//      no Wan 2.2 shot runs past 5 seconds, no LTX-2.5 shot runs past 10, and there is one
//      /media-prompt hand-off line for each shot
//   2. the hand-off lines follow the look bible: the master line holds every character's full
//      words and the Place, Light and Medium lines word for word; fresh stills carry the full
//      words of each character they name; edits and video use only the short names, spelled the
//      same every time; and every line that states the light uses the Light words unchanged
//   3. no em dashes in the skill or its tasks
//   4. relative links and anchors resolve (in this file and across files), files over 100 lines
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

// Wan 2.2 A14B makes 81 frames at 16 fps, about 5 s. LTX-2.5 makes up to about 10 s per clip (its templates default to 97 frames, 4 s).
// These limits come from media-prompt's wan.md and ltx.md.
const WAN_MAX_SECONDS = 5
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
    if (/LTX/.test(route) && seconds > LTX_MAX_SECONDS) fail(`worked example: shot ${cells[1]} is ${seconds} s on LTX-2.5, which makes up to about ${LTX_MAX_SECONDS}`)
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
// 2. The hand-off lines follow the look bible
//
// media-prompt's edit and image-to-video rules say to write only the change, never the picture
// again. So the full words go in fresh stills, and edits and video use one fixed short name.

const section = (title) => example.split(new RegExp(`^### ${title}$`, 'm'))[1]?.split(/^### /m)[0] ?? ''
const bibleRows = section('Look bible')
  .split('\n')
  .filter((line) => line.startsWith('| ') && !line.startsWith('| Line ') && !line.startsWith('| ---'))
  .map((line) => line.split('|').slice(1, -1).map((cell) => cell.trim()))
const characters = bibleRows.filter(([, shortName]) => shortName).map(([, shortName, full]) => ({ shortName, full }))
const bibleLine = (label) => bibleRows.find(([name]) => name === label)?.[2]
const [place, light, medium] = ['Place', 'Light', 'Medium'].map(bibleLine)
const lines = section('Hand-off').split('\n').filter((line) => line.startsWith('/media-prompt '))
// The master is the one line that names no shot; a fresh still is any text-to-image line.
const masterLine = lines.find((line) => !/\bshot \d+\b/i.test(line))
const isFresh = (line) => /text to image/.test(line)
const lineName = (line) => (line === masterLine ? 'the master line' : /\bshot \d+( layer \w)?/i.exec(line)?.[0] ?? line.slice(0, 40))

if (characters.length === 0 || !place || !light || !medium) fail('look bible: needs character rows with a short name, and Place, Light and Medium rows')
else if (!masterLine) fail('hand-off: no master line (a line that names no shot)')
else {
  const before = failures
  for (const [label, words] of [...characters.map((c) => [c.shortName, c.full]), ['Place', place], ['Light', light], ['Medium', medium]]) {
    if (!masterLine.includes(words)) fail(`look bible: the master line does not hold the ${label} words word for word: "${words}"`)
  }
  // Each character's head noun ("giant") left over once the short names and full words are taken
  // out means a character named some other way: "the iron giant", "the Rust Giant".
  const headNouns = [...new Set(characters.map((c) => c.shortName.split(' ').at(-1)))]
  for (const line of lines) {
    const name = lineName(line)
    for (const { shortName, full } of characters) {
      if (isFresh(line) && line.includes(shortName) && !line.includes(full)) fail(`look bible: ${name} is a fresh still but leaves out the full words for ${shortName}`)
      if (!isFresh(line) && line.includes(full)) fail(`look bible: ${name} is an edit or video but repeats the full words for ${shortName}`)
    }
    if (isFresh(line) && !(line.includes(light) && line.includes(medium))) fail(`look bible: ${name} is a fresh still without the Light and Medium words`)
    if (/\b(sun|light)\b/i.test(line) && !line.includes(light)) fail(`look bible: ${name} states the light without the Light words: "${light}"`)
    let rest = line
    for (const { shortName, full } of characters) rest = rest.split(full).join('').split(shortName).join('')
    for (const noun of headNouns) if (new RegExp(`\\b${noun}\\b`, 'i').test(rest)) fail(`look bible: ${name} names a ${noun} without a short name from the look bible`)
  }
  if (failures === before) pass(`look bible: the master holds ${characters.length} characters, Place, Light and Medium word for word; ${lines.length} lines use the short names and Light words as written`)
}

// ---------------------------------------------------------------------------------------------
// 3. No em dashes

const EM_DASH = '\u2014'
const tasks = join(root, 'reviews/media-plan/tasks.md')
const dashFiles = [...docs.map((doc) => join(skill, doc)), tasks].filter((path) => existsSync(path) && readAt(path).includes(EM_DASH))
if (dashFiles.length) fail(`em dashes in ${dashFiles.map((p) => relative(root, p)).join(', ')}`)
else pass(`no em dashes in ${docs.length + 1} files`)

// ---------------------------------------------------------------------------------------------
// 4. Links, contents lists, frontmatter, counts

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
