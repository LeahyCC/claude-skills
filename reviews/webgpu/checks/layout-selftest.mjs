// Checks skills/webgpu/scripts/wgsl-layout.mjs against the worked layout
// examples in the WGSL spec, so a change to the script cannot silently
// break the offsets the skill tells people to copy.
//
//   node reviews/webgpu/checks/layout-selftest.mjs

import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import assert from 'node:assert/strict'

const here = dirname(fileURLToPath(import.meta.url))
const script = join(here, '../../../skills/webgpu/scripts/wgsl-layout.mjs')
const fixture = (name) => join(here, 'layout-fixtures', name)

function run(file, ...flags) {
  try {
    return { code: 0, out: execFileSync('node', [script, fixture(file), ...flags], { encoding: 'utf8' }) }
  } catch (err) {
    return { code: err.status, out: String(err.stdout) }
  }
}

// Returns { struct: { size, members: { name: offset } } } from the script's output.
function parse(out) {
  const structs = {}
  let cur
  for (const line of out.split('\n')) {
    const head = line.match(/^struct (\w+)\s+size (\d+)/)
    if (head) structs[head[1]] = cur = { size: Number(head[2]), members: {} }
    const member = line.match(/^\s+(\d+)\s+(\w+):/)
    if (member && cur) cur.members[member[2]] = Number(member[1])
  }
  return structs
}

const checks = []
const check = (name, fn) => checks.push([name, fn])

// WGSL spec, memory layout example: struct A and struct B (storage).
check('spec struct B offsets and size', () => {
  const s = parse(run('spec-struct-b.wgsl').out)
  assert.equal(s.A.size, 24)
  assert.equal(s.B.size, 160)
  assert.deepEqual(s.B.members, { a: 0, b: 16, c: 28, d: 32, e: 40, f: 64, g: 80, h: 152 })
})

// Same example with @size and @align, written to be valid in a uniform buffer.
check('spec uniform struct B offsets, size, and uniform rules pass', () => {
  const r = run('spec-struct-b-uniform.wgsl', '--uniform')
  assert.equal(r.code, 0, r.out)
  const s = parse(r.out)
  assert.equal(s.A.size, 32)
  assert.equal(s.B.size, 208)
  assert.deepEqual(s.B.members, { a: 0, b: 16, c: 28, d: 32, e: 48, f: 80, g: 96, h: 192 })
})

// The storage-only struct B breaks the uniform rules in three places.
check('uniform rules flag the storage-only struct B', () => {
  const r = run('spec-struct-b.wgsl', '--uniform')
  assert.equal(r.code, 1)
  assert.match(r.out, /e: offset 40 must be a multiple of 16/)
  assert.match(r.out, /g: array stride 24 is not a multiple of 16/)
})

// Spec example: a member after a nested struct must start 16 bytes later.
check('nested struct spacing rule', () => {
  const r = run('uniform-rules.wgsl', '--uniform')
  assert.equal(r.code, 1)
  assert.match(r.out, /b: must start at least 16 bytes after a/)
  assert.match(r.out, /bad: array stride 4 is not a multiple of 16/)
  assert.doesNotMatch(r.out, /struct Valid[\s\S]*?! uniform[\s\S]*?struct Mats/)
})

// Spec example: a runtime-sized array of a vec3 struct.
check('runtime array struct', () => {
  const out = run('spec-light-storage.wgsl').out
  assert.match(out, /struct PointLight\s+size 32/)
  assert.match(out, /struct LightStorage\s+size 16 \+ 32 per array element/)
})

let failed = 0
for (const [name, fn] of checks) {
  try {
    fn()
    console.log(`ok   ${name}`)
  } catch (err) {
    failed++
    console.log(`FAIL ${name}\n     ${err.message.split('\n')[0]}`)
  }
}
process.exit(failed ? 1 : 0)
