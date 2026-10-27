#!/usr/bin/env node
// Tables, trees and boxes with every column counted, including CJK text.
//
//   node layout.mjs table < data.csv        CSV or TSV, first row is the header
//   node layout.mjs tree < outline.txt      indented lines become ├── └── branches
//   node layout.mjs tree --paths < files    a/b/c.ts style paths
//   node layout.mjs box "Text" --title Note a box around wrapped text
//
//   --style light|heavy|double|rounded|ascii   (default light; tables also take markdown)
//   table: --no-header   --align lrc (one letter per column; numbers go right by default)
//   box:   --width 60 (outside width)   --center
//   tree:  --ascii (|-- and `-- like `tree --charset ascii`)

import { readFileSync } from 'node:fs'
import { padEnd, strWidth } from './width.mjs'

const args = process.argv.slice(2)
const mode = args[0]
const flag = (name) => args.includes(name)
const option = (name, fallback) => {
  const i = args.indexOf(name)
  return i === -1 ? fallback : args[i + 1]
}
const VALUED = ['--style', '--align', '--title', '--width']
const positional = args.slice(1).filter((a, i, all) => !a.startsWith('--') && !VALUED.includes(all[i - 1]))
const style = option('--style', flag('--ascii') ? 'ascii' : 'light')

function usage(msg) {
  if (msg) console.error(msg)
  console.error('usage: node layout.mjs table|tree|box [text] [options]   (see the header of this file)')
  process.exit(2)
}

const readInput = () => (positional.length ? positional.join(' ') : process.stdin.isTTY ? '' : readFileSync(0, 'utf8'))

// Corner, edge and join characters for each line style.
//          tl   t    tr   l    m    r    bl   b    br   h    v
const SETS = {
  light: ['┌', '┬', '┐', '├', '┼', '┤', '└', '┴', '┘', '─', '│'],
  heavy: ['┏', '┳', '┓', '┣', '╋', '┫', '┗', '┻', '┛', '━', '┃'],
  double: ['╔', '╦', '╗', '╠', '╬', '╣', '╚', '╩', '╝', '═', '║'],
  rounded: ['╭', '┬', '╮', '├', '┼', '┤', '╰', '┴', '╯', '─', '│'],
  ascii: ['+', '+', '+', '+', '+', '+', '+', '+', '+', '-', '|'],
}
const set = () => {
  const s = SETS[style]
  if (!s) usage(`unknown style "${style}"`)
  const [tl, t, tr, l, m, r, bl, b, br, h, v] = s
  return { tl, t, tr, l, m, r, bl, b, br, h, v }
}

// CSV with quoted fields, or TSV when the first line has a tab.
function parseRows(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n').filter((l) => l.trim())
  if (lines[0]?.includes('\t')) return lines.map((l) => l.split('\t').map((c) => c.trim()))
  return lines.map((line) => {
    const cells = []
    let cell = ''
    let quoted = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (quoted && ch === '"' && line[i + 1] === '"') {
        cell += '"'
        i++
      } else if (ch === '"') quoted = !quoted
      else if (ch === ',' && !quoted) {
        cells.push(cell.trim())
        cell = ''
      } else cell += ch
    }
    cells.push(cell.trim())
    return cells
  })
}

const isNumber = (s) => /^[-+]?[$€£]?[\d,]*\.?\d+\s*(%|[a-zA-Z]{0,3})$/.test(s)

function table() {
  const rows = parseRows(readInput())
  if (!rows.length) usage('no rows on stdin')
  const cols = Math.max(...rows.map((r) => r.length))
  rows.forEach((r) => {
    while (r.length < cols) r.push('')
  })
  const header = !flag('--no-header')
  const body = header ? rows.slice(1) : rows
  const given = option('--align', '')
  const align = Array.from({ length: cols }, (_, c) => {
    if (given[c]) return given[c]
    const values = body.map((r) => r[c]).filter(Boolean)
    return values.length && values.every(isNumber) ? 'r' : 'l'
  })
  const widths = Array.from({ length: cols }, (_, c) => Math.max(3, ...rows.map((r) => strWidth(r[c]))))
  const fit = (s, c) => {
    const gap = widths[c] - strWidth(s)
    if (align[c] === 'r') return ' '.repeat(gap) + s
    if (align[c] === 'c') return ' '.repeat(gap >> 1) + s + ' '.repeat(gap - (gap >> 1))
    return padEnd(s, widths[c])
  }

  if (style === 'markdown') {
    const rule = widths.map((w, c) => {
      const dashes = '-'.repeat(w)
      if (align[c] === 'r') return dashes.slice(1) + ':'
      if (align[c] === 'c') return ':' + dashes.slice(2) + ':'
      return dashes
    })
    const line = (cells) => `| ${cells.join(' | ')} |`
    const out = [line((header ? rows[0] : rows[0].map(() => '')).map(fit)), line(rule)]
    for (const r of body) out.push(line(r.map(fit)))
    console.log(out.join('\n'))
    return
  }

  const s = set()
  const rule = (a, mid, b) => a + widths.map((w) => s.h.repeat(w + 2)).join(mid) + b
  const line = (cells) => s.v + cells.map((c, i) => ` ${fit(c, i)} `).join(s.v) + s.v
  const out = [rule(s.tl, s.t, s.tr)]
  if (header) out.push(line(rows[0]), rule(s.l, s.m, s.r))
  for (const r of body) out.push(line(r))
  out.push(rule(s.bl, s.b, s.br))
  console.log(out.join('\n'))
}

// Builds { name, children } nodes from an indented outline or from paths.
function parseTree(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n').filter((l) => l.trim())
  const roots = []
  if (flag('--paths')) {
    for (const path of lines) {
      let level = roots
      for (const part of path.trim().split('/').filter(Boolean)) {
        let node = level.find((n) => n.name === part)
        if (!node) level.push((node = { name: part, children: [] }))
        level = node.children
      }
    }
    return roots
  }
  const indents = lines.map((l) => l.replace(/\t/g, '    ').match(/^ */)[0].length)
  const unit = Math.min(...indents.filter((n) => n > 0)) || 1
  const stack = []
  lines.forEach((l, i) => {
    const depth = Math.round(indents[i] / unit)
    const node = { name: l.trim().replace(/^[-*+]\s+/, ''), children: [] }
    stack.length = Math.min(depth, stack.length)
    ;(stack.length ? stack.at(-1).children : roots).push(node)
    stack.push(node)
  })
  return roots
}

function tree() {
  const roots = parseTree(readInput())
  if (!roots.length) usage('no lines on stdin')
  const ascii = style === 'ascii'
  const [mid, last, pipe] = ascii ? ['|-- ', '`-- ', '|   '] : ['├── ', '└── ', '│   ']
  const out = []
  // A branch keeps its │ running down only while siblings below it remain.
  const walk = (nodes, prefix) =>
    nodes.forEach((n, i) => {
      const end = i === nodes.length - 1
      out.push(prefix + (end ? last : mid) + n.name)
      walk(n.children, prefix + (end ? '    ' : pipe))
    })
  for (const root of roots) {
    out.push(root.name)
    walk(root.children, '')
  }
  console.log(out.join('\n'))
}

// Greedy word wrap by display width. Words longer than the line are split,
// always taking at least one character so a narrow width cannot loop forever.
function wrap(text, maxWidth) {
  const width = Math.max(2, maxWidth)
  const out = []
  for (const para of text.split('\n')) {
    let line = ''
    for (let word of para.split(/\s+/).filter(Boolean)) {
      while (strWidth(word) > width) {
        if (line) out.push(line)
        line = ''
        let head = ''
        for (const ch of word) {
          if (head && strWidth(head + ch) > width) break
          head += ch
        }
        out.push(head)
        word = word.slice(head.length)
      }
      if (!word) continue
      if (line && strWidth(`${line} ${word}`) > width) {
        out.push(line)
        line = word
      } else line = line ? `${line} ${word}` : word
    }
    out.push(line)
  }
  return out
}

function box() {
  const text = readInput().trim()
  if (!text) usage('no text')
  const s = set()
  const outer = Number(option('--width', 60))
  const title = option('--title', '')
  const lines = wrap(text, outer - 4)
  const inner = Math.max(...lines.map((l) => strWidth(l)), title ? strWidth(title) + 2 : 0)
  const center = flag('--center')
  const fit = (l) => {
    const gap = inner - strWidth(l)
    return center ? ' '.repeat(gap >> 1) + l + ' '.repeat(gap - (gap >> 1)) : l + ' '.repeat(gap)
  }
  const top = title
    ? s.tl + s.h + ` ${title} ` + s.h.repeat(inner - strWidth(title) - 1) + s.tr
    : s.tl + s.h.repeat(inner + 2) + s.tr
  const out = [top, ...lines.map((l) => `${s.v} ${fit(l)} ${s.v}`), s.bl + s.h.repeat(inner + 2) + s.br]
  console.log(out.join('\n'))
}

if (mode === 'table') table()
else if (mode === 'tree') tree()
else if (mode === 'box') box()
else usage()
