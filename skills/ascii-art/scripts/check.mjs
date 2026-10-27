#!/usr/bin/env node
// Checks text art before it is shown. Finds what an eye misses: box lines
// that drift a column, tabs, trailing spaces, emoji and wide characters,
// lines too wide for the destination, and art left outside a code fence.
//
//   node check.mjs art.txt               one drawing
//   node check.mjs - < art.txt           stdin
//   node check.mjs notes.md --block 2    the 2nd fenced block in a markdown file
//   node check.mjs notes.md --all        every text block, and art outside fences
//   --max 72                             width limit (default 80)
//   --cjk                                count ambiguous characters as 2 cells
//
// Exit 0 clean, 1 errors, 2 bad usage. Warnings do not fail.
// In --all mode a block fenced as ```text fail must have an error (FAIL examples).

import { readFileSync } from 'node:fs'
import { charWidth, isAmbiguous, isWide, UNICODE_VERSION } from './width.mjs'

const args = process.argv.slice(2)
const flag = (name) => args.includes(name)
const option = (name) => {
  const i = args.indexOf(name)
  return i === -1 ? undefined : args[i + 1]
}
const cjk = flag('--cjk')
const maxWidth = Number(option('--max') ?? 80)
const blockNo = option('--block')
const file = args.find((a, i) => !a.startsWith('--') && !['--max', '--block'].includes(args[i - 1]))
if (!file || Number.isNaN(maxWidth) || (blockNo !== undefined && !(Number(blockNo) >= 1))) {
  console.error('usage: node check.mjs <file|-> [--block N | --all] [--max 80] [--cjk]')
  process.exit(2)
}

const U = 1
const D = 2
const L = 4
const R = 8

// Stroke directions for every box-drawing character a diagram is likely to use.
const STROKES = new Map()
const setStrokes = (chars, dirs) => {
  for (const ch of chars) STROKES.set(ch, dirs)
}
setStrokes('─━═┄┅┈┉╌╍', L | R)
setStrokes('│┃║┆┇┊┋╎╏', U | D)
setStrokes('┌┍┎┏╒╓╔╭', D | R)
setStrokes('┐┑┒┓╕╖╗╮', D | L)
setStrokes('└┕┖┗╘╙╚╰', U | R)
setStrokes('┘┙┚┛╛╜╝╯', U | L)
setStrokes('├┝┞┟┠┡┢┣╞╟╠', U | D | R)
setStrokes('┤┥┦┧┨┩┪┫╡╢╣', U | D | L)
setStrokes('┬┭┮┯┰┱┲┳╤╥╦', D | L | R)
setStrokes('┴┵┶┷┸┹┺┻╧╨╩', U | L | R)
setStrokes('┼┽┾┿╀╁╂╃╄╅╆╇╈╉╊╋╪╫╬', U | D | L | R)
setStrokes('╵╹', U)
setStrokes('╷╻', D)
setStrokes('╽╿', U | D)

// Arrowheads end a line coming from the named side.
const ENDS_FROM_ABOVE = new Set([...'▼↓▽vV'])
const ENDS_FROM_BELOW = new Set([...'▲↑△^'])

// A plain │ may start or stop anywhere. A corner or join that leads nowhere is a missing line.
const isJoin = (ch) => STROKES.has(ch) && STROKES.get(ch) !== (U | D) && STROKES.get(ch) !== (L | R)

// Splits a drawing into display cells. A wide character fills two cells.
function toGrid(lines) {
  return lines.map((line) => {
    const cells = []
    for (const ch of line) {
      const w = charWidth(ch, cjk)
      if (w === 0) continue
      cells.push(ch)
      if (w === 2) cells.push('')
    }
    return cells
  })
}

// ASCII + and | only count as lines when they sit in a drawing, not in prose.
function strokesAt(grid, r, c) {
  const ch = grid[r]?.[c] ?? ' '
  if (STROKES.has(ch)) return STROKES.get(ch)
  if (ch === '|') return U | D
  if (ch === '+') {
    const near = [grid[r]?.[c - 1], grid[r]?.[c + 1], grid[r - 1]?.[c], grid[r + 1]?.[c]]
    return near.some((n) => n === '-' || n === '=' || n === '|' || n === '+') ? U | D | L | R : 0
  }
  return 0
}

const takesFromAbove = (grid, r, c) =>
  (strokesAt(grid, r, c) & U) !== 0 || ENDS_FROM_ABOVE.has(grid[r]?.[c])
const givesDown = (grid, r, c) => (strokesAt(grid, r, c) & D) !== 0
const takesFromBelow = (grid, r, c) => (strokesAt(grid, r, c) & U) !== 0
const endsAbove = (grid, r, c) => givesDown(grid, r, c) || ENDS_FROM_BELOW.has(grid[r]?.[c])
const isEmpty = (ch) => ch === undefined || ch === ' '

function checkDrawing(lines, firstLine) {
  const issues = []
  const add = (level, row, col, msg) => issues.push({ level, line: firstLine + row, col, msg })
  const grid = toGrid(lines)
  let ambiguous = 0

  lines.forEach((line, r) => {
    if (line.includes('\t')) add('error', r, line.indexOf('\t') + 1, 'tab: width depends on the viewer, use spaces')
    if (/[  ]+$/.test(line)) add('warn', r, grid[r].length, 'trailing spaces: editors strip them')
    if (grid[r].length > maxWidth) add('warn', r, maxWidth + 1, `${grid[r].length} cells wide, over the ${maxWidth} limit`)
    let col = 0
    for (const ch of line) {
      const cp = ch.codePointAt(0)
      if (cp < 0x20 && ch !== '\t') add('error', r, col + 1, `control character U+${cp.toString(16).padStart(4, '0')}`)
      else if (ch === ' ') add('warn', r, col + 1, 'non-breaking space: looks like a space, is not one')
      else if (ch === '️') add('warn', r, col, 'emoji selector (U+FE0F): the character before it may draw 2 cells wide')
      else if (ch === '‍') add('warn', r, col, 'zero-width joiner: emoji sequence, width varies by terminal')
      else if (isWide(cp) && /\p{Extended_Pictographic}/u.test(ch))
        add('warn', r, col + 1, `emoji ${ch}: 2 cells, and some fonts draw it wider`)
      if (isAmbiguous(cp)) ambiguous++
      col += charWidth(ch, cjk)
    }
  })

  // A vertical line must continue in the same column. When it misses by one
  // column, the drawing has drifted. When it misses entirely, it is a loose end.
  const seen = new Set()
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      const ch = grid[r][c]
      if (r + 1 < grid.length && givesDown(grid, r, c) && !takesFromAbove(grid, r + 1, c)) {
        const off = [c - 1, c + 1].find((x) => takesFromAbove(grid, r + 1, x) && !givesDown(grid, r, x))
        if (off !== undefined) {
          seen.add(`${r + 1}:${off}`)
          add('error', r, c + 1, `'${ch}' goes down, but the line below is one column ${off < c ? 'left' : 'right'} (col ${off + 1})`)
        } else if (isJoin(ch) && isEmpty(grid[r + 1][c])) add('warn', r, c + 1, `'${ch}' goes down into nothing`)
      }
      if (r > 0 && takesFromBelow(grid, r, c) && !endsAbove(grid, r - 1, c)) {
        const off = [c - 1, c + 1].find((x) => givesDown(grid, r - 1, x) && !takesFromBelow(grid, r, x))
        if (off !== undefined) {
          if (!seen.has(`${r}:${c}`))
            add('error', r, c + 1, `'${ch}' goes up, but the line above is one column ${off < c ? 'left' : 'right'} (col ${off + 1})`)
        } else if (isJoin(ch) && isEmpty(grid[r - 1][c])) add('warn', r, c + 1, `'${ch}' goes up into nothing`)
      }
    }
  }

  const all = lines.join('\n')
  if (/[─-╿]/.test(all) && /\+[-=]{2,}|[-=]{2,}\+/.test(all))
    issues.push({ level: 'warn', line: firstLine, col: 1, msg: 'mixes ASCII (+--) and Unicode (┌──) box lines' })

  const width = Math.max(0, ...grid.map((g) => g.length))
  return { issues, width, ambiguous }
}

// Fenced blocks per CommonMark: 3+ backticks or tildes, closed by the same run or longer.
function fencedBlocks(text) {
  const lines = text.split('\n')
  const blocks = []
  const outside = []
  let open = null
  lines.forEach((line, i) => {
    const m = line.match(/^ {0,3}(`{3,}|~{3,})\s*(.*)$/)
    if (!open && m) open = { fence: m[1], info: m[2].trim(), start: i + 2, body: [] }
    else if (open && m && m[1][0] === open.fence[0] && m[1].length >= open.fence.length && !m[2]) {
      blocks.push(open)
      open = null
    } else if (open) open.body.push(line)
    else outside.push({ line: i + 1, text: line })
  })
  return { blocks, outside }
}

const ART_LANGS = new Set(['', 'text', 'txt', 'plain', 'plaintext', 'ascii', 'art', 'diagram'])

function report(label, result) {
  const errors = result.issues.filter((i) => i.level === 'error').length
  const warns = result.issues.length - errors
  const summary = errors || warns ? `${errors} error(s), ${warns} warning(s)` : 'ok'
  console.log(`${label}: ${summary}, ${result.width} cells wide`)
  for (const i of result.issues) console.log(`  ${i.level.padEnd(5)}  line ${i.line} col ${i.col}  ${i.msg}`)
  if (result.ambiguous && !cjk)
    console.log(`  info   ${result.ambiguous} ambiguous-width character(s): 1 cell in most terminals, 2 in CJK-wide ones (--cjk to check)`)
  return errors
}

const text = readFileSync(file === '-' ? 0 : file, 'utf8').replace(/\r\n/g, '\n')
let failed = 0

if (flag('--all')) {
  const { blocks, outside } = fencedBlocks(text)
  let skipped = 0
  blocks.forEach((b, n) => {
    const words = b.info.split(/\s+/)
    if (!ART_LANGS.has(words[0])) return skipped++
    const result = checkDrawing(b.body, b.start)
    const errors = report(`block ${n + 1} (line ${b.start})${words.includes('fail') ? ' [fail example]' : ''}`, result)
    if (words.includes('fail')) {
      if (!errors) {
        console.log('  error  marked fail, but the checker found nothing wrong')
        failed++
      }
    } else failed += errors
  })
  // Inline code is safe. Indented code is a code block. Anything else with box
  // lines in it collapses when the markdown renders.
  const loose = outside
    .filter(({ text: t }) => !/^( {4}|\t)/.test(t))
    .filter(({ text: t }) => /[─-╿▀-▟⠀-⣿]/.test(t.replace(/`[^`]*`/g, '')))
    .map((o) => o.line)
  for (let i = 0; i < loose.length; ) {
    let j = i
    while (loose[j + 1] === loose[j] + 1) j++
    const where = i === j ? `line ${loose[i]}` : `lines ${loose[i]}-${loose[j]}`
    console.log(`${where}: warn  art outside a code fence, markdown will collapse its spaces`)
    i = j + 1
  }
  if (skipped) console.log(`${skipped} code block(s) skipped (not text)`)
} else if (blockNo) {
  const { blocks } = fencedBlocks(text)
  const b = blocks[Number(blockNo) - 1]
  if (!b) {
    console.error(`no fenced block ${blockNo}, the file has ${blocks.length}`)
    process.exit(2)
  }
  failed += report(`block ${blockNo} (line ${b.start})`, checkDrawing(b.body, b.start))
} else {
  const lines = text.replace(/\n$/, '').split('\n')
  failed += report(file === '-' ? 'stdin' : file, checkDrawing(lines, 1))
}

if (failed) console.log(`\n${failed} error(s). Fix and run again. (Unicode ${UNICODE_VERSION} widths)`)
process.exit(failed ? 1 : 0)
