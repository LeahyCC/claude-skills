#!/usr/bin/env node
// Big text from a built-in 5-row font. Models cannot freehand letters this
// size without breaking them, so the letters come from a table.
//
//   node banner.mjs "HELLO"               █ blocks
//   node banner.mjs "HELLO" --ascii       # characters, safe in code comments
//   node banner.mjs "HELLO" --shadow      drop shadow (░, or : with --ascii)
//   node banner.mjs "HELLO" --half        3 rows tall, using ▀ ▄ █
//   node banner.mjs "HELLO" --box         a box around it
//   node banner.mjs "HELLO" --char '*'    any fill character
//   --width 60                            wrap words to fit (default 80)
//
// Letters, digits, space and . , ! ? : ; ' " - _ + = / ( ) < > * # & @ % $ ♥
// Lowercase prints as uppercase. For more fonts, use figlet or toilet if installed.

const FONT = {
  A: [' ### ', '#   #', '#####', '#   #', '#   #'],
  B: ['#### ', '#   #', '#### ', '#   #', '#### '],
  C: [' ####', '#    ', '#    ', '#    ', ' ####'],
  D: ['#### ', '#   #', '#   #', '#   #', '#### '],
  E: ['#####', '#    ', '#### ', '#    ', '#####'],
  F: ['#####', '#    ', '#### ', '#    ', '#    '],
  G: [' ####', '#    ', '#  ##', '#   #', ' ####'],
  H: ['#   #', '#   #', '#####', '#   #', '#   #'],
  I: ['###', ' # ', ' # ', ' # ', '###'],
  J: ['  ###', '    #', '    #', '#   #', ' ### '],
  K: ['#   #', '#  # ', '###  ', '#  # ', '#   #'],
  L: ['#    ', '#    ', '#    ', '#    ', '#####'],
  M: ['#   #', '## ##', '# # #', '#   #', '#   #'],
  N: ['#   #', '##  #', '# # #', '#  ##', '#   #'],
  O: [' ### ', '#   #', '#   #', '#   #', ' ### '],
  P: ['#### ', '#   #', '#### ', '#    ', '#    '],
  Q: [' ### ', '#   #', '# # #', '#  # ', ' ## #'],
  R: ['#### ', '#   #', '#### ', '#  # ', '#   #'],
  S: [' ####', '#    ', ' ### ', '    #', '#### '],
  T: ['#####', '  #  ', '  #  ', '  #  ', '  #  '],
  U: ['#   #', '#   #', '#   #', '#   #', ' ### '],
  V: ['#   #', '#   #', '#   #', ' # # ', '  #  '],
  W: ['#   #', '#   #', '# # #', '## ##', '#   #'],
  X: ['#   #', ' # # ', '  #  ', ' # # ', '#   #'],
  Y: ['#   #', ' # # ', '  #  ', '  #  ', '  #  '],
  Z: ['#####', '   # ', '  #  ', ' #   ', '#####'],
  0: [' ### ', '#  ##', '# # #', '##  #', ' ### '],
  1: [' # ', '## ', ' # ', ' # ', '###'],
  2: [' ### ', '#   #', '  ## ', ' #   ', '#####'],
  3: ['#### ', '    #', ' ### ', '    #', '#### '],
  4: ['#   #', '#   #', '#####', '    #', '    #'],
  5: ['#####', '#    ', '#### ', '    #', '#### '],
  6: [' ### ', '#    ', '#### ', '#   #', ' ### '],
  7: ['#####', '    #', '   # ', '  #  ', '  #  '],
  8: [' ### ', '#   #', ' ### ', '#   #', ' ### '],
  9: [' ### ', '#   #', ' ####', '    #', ' ### '],
  ' ': ['   ', '   ', '   ', '   ', '   '],
  '.': [' ', ' ', ' ', ' ', '#'],
  ',': ['  ', '  ', '  ', ' #', '# '],
  '!': ['#', '#', '#', ' ', '#'],
  '?': [' ### ', '#   #', '  ## ', '     ', '  #  '],
  ':': [' ', '#', ' ', '#', ' '],
  ';': ['  ', ' #', '  ', ' #', '# '],
  "'": ['#', '#', ' ', ' ', ' '],
  '"': ['# #', '# #', '   ', '   ', '   '],
  '-': ['   ', '   ', '###', '   ', '   '],
  _: ['    ', '    ', '    ', '    ', '####'],
  '+': ['   ', ' # ', '###', ' # ', '   '],
  '=': ['   ', '###', '   ', '###', '   '],
  '/': ['    #', '   # ', '  #  ', ' #   ', '#    '],
  '(': [' #', '# ', '# ', '# ', ' #'],
  ')': ['# ', ' #', ' #', ' #', '# '],
  '<': ['  #', ' # ', '#  ', ' # ', '  #'],
  '>': ['#  ', ' # ', '  #', ' # ', '#  '],
  '*': ['   ', '# #', ' # ', '# #', '   '],
  '#': [' # # ', '#####', ' # # ', '#####', ' # # '],
  '&': [' ##  ', '#  # ', ' ## #', '#  # ', ' ## #'],
  '@': [' ### ', '# ###', '# # #', '# ###', ' ##  '],
  '%': ['##  #', '## # ', '  #  ', ' # ##', '#  ##'],
  $: [' ####', '# #  ', ' ### ', '  # #', '#### '],
  '♥': [' # # ', '#####', '#####', ' ### ', '  #  '],
}
const ROWS = 5

const args = process.argv.slice(2)
const flag = (name) => args.includes(name)
const option = (name) => {
  const i = args.indexOf(name)
  return i === -1 ? undefined : args[i + 1]
}
const ascii = flag('--ascii')
const half = flag('--half')
const shadow = flag('--shadow') && !half
const fill = option('--char') ?? (ascii ? '#' : '█')
const shade = ascii ? ':' : '░'
const maxWidth = Number(option('--width') ?? 80)
const text = args.find((a, i) => !a.startsWith('--') && !['--char', '--width'].includes(args[i - 1]))
if (!text || Number.isNaN(maxWidth)) {
  console.error('usage: node banner.mjs "TEXT" [--ascii] [--shadow] [--half] [--box] [--char X] [--width 80]')
  process.exit(2)
}
if (half && ascii) {
  console.error('--half needs ▀ ▄ █, so it cannot be combined with --ascii')
  process.exit(2)
}

const glyphOf = (ch) => {
  const g = FONT[ch.toUpperCase()]
  if (!g) console.error(`no glyph for '${ch}', skipped`)
  return g
}

// Pixel rows for a run of text: glyphs side by side, one blank column between.
function pixels(word) {
  const rows = Array.from({ length: ROWS }, () => '')
  const glyphs = [...word].map(glyphOf).filter(Boolean)
  glyphs.forEach((g, i) => {
    for (let r = 0; r < ROWS; r++) rows[r] += g[r] + (i < glyphs.length - 1 ? ' ' : '')
  })
  return rows
}

// The shadow sits one row down and one column right of every filled pixel.
function render(rows) {
  const height = rows.length + (shadow ? 1 : 0)
  const width = Math.max(...rows.map((r) => r.length)) + (shadow ? 1 : 0)
  const on = (r, c) => rows[r]?.[c] === '#'
  const out = []
  for (let r = 0; r < height; r++) {
    let line = ''
    for (let c = 0; c < width; c++) line += on(r, c) ? fill : shadow && on(r - 1, c - 1) ? shade : ' '
    out.push(line)
  }
  return out
}

// Two pixel rows per text row: ▀ top only, ▄ bottom only, █ both.
function renderHalf(rows) {
  const out = []
  for (let r = 0; r < rows.length; r += 2) {
    const top = rows[r]
    const bottom = rows[r + 1] ?? ''
    let line = ''
    for (let c = 0; c < top.length; c++) {
      const t = top[c] === '#'
      const b = bottom[c] === '#'
      line += t && b ? '█' : t ? '▀' : b ? '▄' : ' '
    }
    out.push(line)
  }
  return out
}

// Words wrap onto new banner lines when the next word would pass the width.
const cellWidth = (s) => pixels(s)[0].length + (shadow ? 1 : 0)
const lines = []
let current = ''
for (const word of text.split(/\s+/).filter(Boolean)) {
  const next = current ? `${current} ${word}` : word
  if (current && cellWidth(next) + (flag('--box') ? 4 : 0) > maxWidth) {
    lines.push(current)
    current = word
  } else current = next
}
if (current) lines.push(current)

let out = []
lines.forEach((l, i) => {
  if (i > 0) out.push('')
  out.push(...(half ? renderHalf(pixels(l)) : render(pixels(l))))
})
out = out.map((l) => l.trimEnd())

if (flag('--box')) {
  const w = Math.max(...out.map((l) => [...l].length))
  const [tl, tr, bl, br, h, v] = ascii ? ['+', '+', '+', '+', '-', '|'] : ['┌', '┐', '└', '┘', '─', '│']
  out = [
    tl + h.repeat(w + 2) + tr,
    ...out.map((l) => `${v} ${l}${' '.repeat(w - [...l].length)} ${v}`),
    bl + h.repeat(w + 2) + br,
  ]
}

const widest = Math.max(...out.map((l) => [...l].length))
if (widest > maxWidth) console.error(`warning: ${widest} cells wide, over ${maxWidth}. One word is too long to wrap.`)
console.log(out.join('\n'))
