#!/usr/bin/env node
// Picture helpers for the parts models get wrong by hand: symmetry, pixel
// sprites, and mazes that actually have a way through.
//
//   node art.mjs mirror < half.txt             add the mirrored right half
//   node art.mjs mirror --center < half.txt    share the last column (odd width)
//   node art.mjs pixels < sprite.txt           # grid to ▀ ▄ █, 2 pixel rows per line
//   node art.mjs pixels --braille < sprite.txt 2x4 pixels per character
//   node art.mjs pixels --wide < sprite.txt    each pixel ██, about square
//   node art.mjs maze 12 6                     12 by 6 cells, one path between any two
//   maze: --seed 7 (same maze every time)  --ascii  --solve (mark the way through)
//
// In a sprite, space and . are off. Any other character is on.

import { readFileSync } from 'node:fs'

const args = process.argv.slice(2)
const mode = args[0]
const flag = (name) => args.includes(name)
const option = (name, fallback) => {
  const i = args.indexOf(name)
  return i === -1 ? fallback : Number(args[i + 1])
}

function usage(msg) {
  if (msg) console.error(msg)
  console.error('usage: node art.mjs mirror|pixels|maze [options]   (see the header of this file)')
  process.exit(2)
}

const stdinLines = () => {
  if (process.stdin.isTTY) usage('pipe the drawing in on stdin')
  const lines = readFileSync(0, 'utf8').replace(/\r\n/g, '\n').replace(/\n+$/, '').split('\n')
  if (!lines.join('').trim()) usage('stdin is empty')
  return lines
}

const PAIRS = ['/\\', '()', '[]', '{}', '<>', 'db', 'pq', "`'", '┌┐', '└┘', '├┤', '╭╮', '╰╯', '▌▐', '◀▶', '«»', '⌐¬']
const SWAP = new Map()
for (const [a, b] of PAIRS) {
  SWAP.set(a, b)
  SWAP.set(b, a)
}

function mirror() {
  const lines = stdinLines().map((l) => [...l])
  const width = Math.max(...lines.map((l) => l.length))
  const out = lines.map((chars) => {
    const left = [...chars, ...Array(width - chars.length).fill(' ')]
    const right = left
      .slice(0, flag('--center') ? -1 : undefined)
      .reverse()
      .map((ch) => SWAP.get(ch) ?? ch)
    return (left.join('') + right.join('')).trimEnd()
  })
  console.log(out.join('\n'))
}

function pixels() {
  const lines = stdinLines()
  const on = lines.map((l) => [...l].map((ch) => ch !== ' ' && ch !== '.'))
  const width = Math.max(...on.map((r) => r.length))
  const at = (r, c) => on[r]?.[c] === true
  const out = []
  if (flag('--wide')) {
    for (let r = 0; r < on.length; r++) {
      let line = ''
      for (let c = 0; c < width; c++) line += at(r, c) ? '██' : '  '
      out.push(line)
    }
  } else if (flag('--braille')) {
    // Dot bits inside one character, indexed [x][y].
    const DOT = [
      [0x01, 0x02, 0x04, 0x40],
      [0x08, 0x10, 0x20, 0x80],
    ]
    for (let r = 0; r < on.length; r += 4) {
      let line = ''
      for (let c = 0; c < width; c += 2) {
        let bits = 0
        for (let x = 0; x < 2; x++) for (let y = 0; y < 4; y++) if (at(r + y, c + x)) bits |= DOT[x][y]
        line += String.fromCodePoint(0x2800 + bits)
      }
      out.push(line)
    }
  } else {
    for (let r = 0; r < on.length; r += 2) {
      let line = ''
      for (let c = 0; c < width; c++) {
        const t = at(r, c)
        const b = at(r + 1, c)
        line += t && b ? '█' : t ? '▀' : b ? '▄' : ' '
      }
      out.push(line)
    }
  }
  console.log(out.map((l) => l.trimEnd()).join('\n'))
}

// Small seeded generator (mulberry32), so --seed gives the same maze each time.
function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const U = 1
const D = 2
const L = 4
const R = 8
const JOIN = {
  [U | D]: '│', [L | R]: '─', [D | R]: '┌', [D | L]: '┐', [U | R]: '└', [U | L]: '┘',
  [U | D | R]: '├', [U | D | L]: '┤', [D | L | R]: '┬', [U | L | R]: '┴', [U | D | L | R]: '┼',
  [U]: '╵', [D]: '╷', [L]: '╴', [R]: '╶', 0: ' ',
}

function maze() {
  const [W, H] = args.slice(1, 3).map(Number)
  if (!(W >= 2 && H >= 2 && W <= 60 && H <= 40)) usage('maze needs a width and height, 2 to 60 by 2 to 40')
  const random = rng(option('--seed', Date.now() % 100000))
  // top[y][x]: wall above cell (x, y). left[y][x]: wall left of it. Row H and column W close the edges.
  const top = Array.from({ length: H + 1 }, () => Array(W).fill(true))
  const left = Array.from({ length: H }, () => Array(W + 1).fill(true))
  const seen = Array.from({ length: H }, () => Array(W).fill(false))

  // Depth-first carving: walk to a random unvisited neighbour, back up when stuck.
  const stack = [[0, 0]]
  seen[0][0] = true
  while (stack.length) {
    const [x, y] = stack.at(-1)
    const next = [
      [x, y - 1],
      [x, y + 1],
      [x - 1, y],
      [x + 1, y],
    ].filter(([nx, ny]) => nx >= 0 && ny >= 0 && nx < W && ny < H && !seen[ny][nx])
    if (!next.length) {
      stack.pop()
      continue
    }
    const [nx, ny] = next[Math.floor(random() * next.length)]
    if (nx === x) top[Math.max(y, ny)][x] = false
    else left[y][Math.max(x, nx)] = false
    seen[ny][nx] = true
    stack.push([nx, ny])
  }
  top[0][0] = false
  top[H][W - 1] = false

  // The way through, by breadth-first search from the entrance.
  const path = new Set()
  if (flag('--solve')) {
    const from = new Map([['0,0', null]])
    const queue = [[0, 0]]
    while (queue.length) {
      const [x, y] = queue.shift()
      const moves = [
        [x, y - 1, !top[y][x]],
        [x, y + 1, !top[y + 1][x]],
        [x - 1, y, !left[y][x]],
        [x + 1, y, !left[y][x + 1]],
      ]
      for (const [nx, ny, open] of moves) {
        const key = `${nx},${ny}`
        if (open && nx >= 0 && ny >= 0 && nx < W && ny < H && !from.has(key)) {
          from.set(key, `${x},${y}`)
          queue.push([nx, ny])
        }
      }
    }
    for (let k = `${W - 1},${H - 1}`; k; k = from.get(k)) path.add(k)
  }

  const ascii = flag('--ascii')
  const mark = ascii ? ' . ' : ' • '
  const out = []
  for (let y = 0; y <= H; y++) {
    let line = ''
    for (let x = 0; x <= W; x++) {
      if (ascii) line += '+'
      else {
        const bits =
          (y > 0 && left[y - 1][x] ? U : 0) |
          (y < H && left[y][x] ? D : 0) |
          (x > 0 && top[y][x - 1] ? L : 0) |
          (x < W && top[y][x] ? R : 0)
        line += JOIN[bits]
      }
      if (x < W) line += top[y][x] ? (ascii ? '---' : '───') : '   '
    }
    out.push(line.trimEnd())
    if (y === H) break
    line = ''
    for (let x = 0; x <= W; x++) {
      line += left[y][x] ? (ascii ? '|' : '│') : ' '
      if (x < W) line += path.has(`${x},${y}`) ? mark : '   '
    }
    out.push(line.trimEnd())
  }
  console.log(out.join('\n'))
}

if (mode === 'mirror') mirror()
else if (mode === 'pixels') pixels()
else if (mode === 'maze') maze()
else usage()
