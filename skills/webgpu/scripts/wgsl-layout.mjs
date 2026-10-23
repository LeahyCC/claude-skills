#!/usr/bin/env node
// Prints the byte layout of every struct in a WGSL file: offset, alignment,
// size, and padding per member, using the WGSL memory layout rules.
//
//   node wgsl-layout.mjs shader.wgsl            storage layout
//   node wgsl-layout.mjs shader.wgsl --uniform  also check the uniform rules
//   cat shader.wgsl | node wgsl-layout.mjs -    read stdin
//
// No dependencies. It parses struct declarations only, so it does not
// validate the rest of the shader. Use naga or a real device for that.

import { readFileSync } from 'node:fs'

const args = process.argv.slice(2)
const uniform = args.includes('--uniform')
const file = args.find((a) => a !== '--uniform')
if (!file) {
  console.error('usage: node wgsl-layout.mjs <file.wgsl|-> [--uniform]')
  process.exit(2)
}

const source = readFileSync(file === '-' ? 0 : file, 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\/\/.*$/gm, '')

const roundUp = (k, n) => Math.ceil(n / k) * k

const SCALARS = { f32: 4, i32: 4, u32: 4, f16: 2, bool: 4 }
const SUFFIX = { f: 'f32', i: 'i32', u: 'u32', h: 'f16' }

// Collect struct bodies first, so a struct can use one declared later.
const bodies = new Map()
for (const m of source.matchAll(/\bstruct\s+(\w+)\s*\{([^}]*)\}/g)) bodies.set(m[1], m[2])
const structs = new Map()

// Returns { align, size, stride?, kind } for a type string.
function layoutOf(type) {
  type = type.replace(/\s+/g, '')
  if (type in SCALARS) return { align: SCALARS[type], size: SCALARS[type], kind: 'scalar' }

  let m = type.match(/^atomic<(\w+)>$/)
  if (m) return layoutOf(m[1])

  m = type.match(/^vec([234])(?:<(\w+)>|([fiuh]))$/)
  if (m) {
    const n = Number(m[1])
    const s = SCALARS[m[2] ?? SUFFIX[m[3]]]
    return { align: (n === 2 ? 2 : 4) * s, size: n * s, kind: 'vector' }
  }

  m = type.match(/^mat([234])x([234])(?:<(\w+)>|([fh]))$/)
  if (m) {
    // A matrix is an array of C column vectors, each vecR.
    const col = layoutOf(`vec${m[2]}<${m[3] ?? SUFFIX[m[4]]}>`)
    return { align: col.align, size: Number(m[1]) * roundUp(col.align, col.size), kind: 'matrix' }
  }

  m = type.match(/^array<(.+?)(?:,(\w+))?>$/)
  if (m) {
    const el = layoutOf(m[1])
    const stride = roundUp(el.align, el.size)
    if (m[2] === undefined) return { align: el.align, size: stride, stride, kind: 'runtime-array' }
    const count = Number(m[2].replace(/[iu]$/, ''))
    if (!Number.isInteger(count)) throw new Error(`array size must be a literal number: ${type}`)
    return { align: el.align, size: count * stride, stride, kind: 'array', element: el }
  }

  if (bodies.has(type)) {
    const s = layoutStruct(type)
    return { align: s.align, size: s.size, kind: 'struct' }
  }
  throw new Error(`unknown type: ${type}`)
}

// Splits members on commas that are not inside <...> or (...), so array<A, 3> stays whole.
function splitTopLevel(body) {
  const out = []
  let depth = 0
  let cur = ''
  for (const ch of body) {
    if (ch === '<' || ch === '(') depth++
    if (ch === '>' || ch === ')') depth--
    if (ch === ',' && depth === 0) {
      out.push(cur)
      cur = ''
    } else cur += ch
  }
  out.push(cur)
  return out.map((d) => d.trim()).filter(Boolean)
}

function layoutStruct(name) {
  if (structs.has(name)) return structs.get(name)
  const members = []
  let offset = 0
  let align = 1
  const decls = splitTopLevel(bodies.get(name))
  for (const decl of decls) {
    const m = decl.match(/^((?:@\w+(?:\([^)]*\))?\s*)*)(\w+)\s*:\s*(.+)$/s)
    if (!m) throw new Error(`cannot parse member in ${name}: ${decl}`)
    const attrs = m[1]
    const type = m[3].trim()
    const t = layoutOf(type)
    const alignAttr = attrs.match(/@align\(\s*(\d+)\s*\)/)
    const sizeAttr = attrs.match(/@size\(\s*(\d+)\s*\)/)
    const a = alignAttr ? Number(alignAttr[1]) : t.align
    const size = sizeAttr ? Number(sizeAttr[1]) : t.size
    const start = roundUp(a, offset)
    members.push({ name: m[2], type, offset: start, align: a, size, pad: start - offset, t, alignAttr: !!alignAttr })
    offset = start + size
    align = Math.max(align, a)
  }
  const size = roundUp(align, offset)
  const last = members[members.length - 1]
  const runtime = last?.t.kind === 'runtime-array'
  const result = { name, align, size, tail: runtime ? 0 : size - offset, members, runtime }
  structs.set(name, result)
  return result
}

// Uniform address space rules, for implementations without the
// uniform_buffer_standard_layout language extension.
function uniformProblems(s) {
  const out = []
  s.members.forEach((m, i) => {
    if (m.t.kind === 'array' && m.t.stride % 16 !== 0)
      out.push(`${m.name}: array stride ${m.t.stride} is not a multiple of 16`)
    if (m.t.kind === 'array' || m.t.kind === 'struct') {
      const need = roundUp(16, m.t.align)
      if (m.offset % need !== 0) out.push(`${m.name}: offset ${m.offset} must be a multiple of ${need}`)
    }
    if (m.t.kind === 'struct' && i + 1 < s.members.length) {
      const gap = s.members[i + 1].offset - m.offset
      const need = roundUp(16, m.t.size)
      if (gap < need) out.push(`${s.members[i + 1].name}: must start at least ${need} bytes after ${m.name}`)
    }
    if (m.t.kind === 'runtime-array') out.push(`${m.name}: runtime-sized arrays are not allowed in uniform buffers`)
  })
  return out
}

let failed = false
for (const name of bodies.keys()) {
  let s
  try {
    s = layoutStruct(name)
  } catch (err) {
    console.error(`struct ${name}: ${err.message}`)
    failed = true
    continue
  }
  const last = s.members[s.members.length - 1]
  const sizeText = s.runtime
    ? `size ${last.offset} + ${last.t.stride} per array element`
    : `size ${s.size}`
  console.log(`struct ${name}  ${sizeText}  align ${s.align}`)
  for (const m of s.members) {
    if (m.alignAttr && m.align % m.t.align !== 0) {
      console.log(`  ! ${m.name}: @align(${m.align}) must be a multiple of ${m.t.align}`)
      failed = true
    }
    const pad = m.pad ? `  (${m.pad} bytes padding before)` : ''
    const f32 = m.offset % 4 === 0 ? `  [f32 index ${m.offset / 4}]` : ''
    const msize = m.t.kind === 'runtime-array' ? `stride ${m.t.stride}` : `size ${m.size}`
    console.log(`  ${String(m.offset).padStart(5)}  ${m.name}: ${m.type}  ${msize} align ${m.align}${f32}${pad}`)
  }
  if (s.tail) console.log(`  ${String(s.size - s.tail).padStart(5)}  (${s.tail} bytes padding at end)`)
  if (uniform) {
    for (const p of uniformProblems(s)) {
      console.log(`  ! uniform: ${p}`)
      failed = true
    }
  }
  console.log()
}
process.exit(failed ? 1 : 0)
