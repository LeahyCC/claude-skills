#!/usr/bin/env node
// Text charts with the arithmetic done for you: bar lengths, sparkline
// levels, and line plots at 2x4 dots per character.
//
//   node chart.mjs bar Mon=3 Tue=7.5 Wed=5     bar chart (or "label value" lines on stdin)
//   node chart.mjs spark 3 5 9 4 12 8          one-line trend
//   node chart.mjs plot 3 5 9 4 12 8 15 11     line chart in Braille dots
//
//   bar:   --width 40 (longest bar)  --ascii (# only)  --sort  --unit ms
//   spark: --range (append min..max)  --ascii (density ramp)
//   plot:  --width 60  --height 10  (in characters)
//
// Values on stdin work for every mode: numbers split by spaces, commas or lines.

import { readFileSync } from 'node:fs'
import { padEnd, padStart, strWidth } from './width.mjs'

const args = process.argv.slice(2)
const mode = args[0]
const flag = (name) => args.includes(name)
const option = (name, fallback) => {
  const i = args.indexOf(name)
  return i === -1 ? fallback : Number(args[i + 1])
}
const VALUED = ['--width', '--height', '--unit']
const positional = args.slice(1).filter((a, i, all) => !a.startsWith('--') && !VALUED.includes(all[i - 1]))
const unitAt = args.indexOf('--unit')
const unit = unitAt === -1 ? '' : args[unitAt + 1]

function usage(msg) {
  if (msg) console.error(msg)
  console.error('usage: node chart.mjs bar|spark|plot <values...> [options]   (see the header of this file)')
  process.exit(2)
}

const input = positional.length ? positional : process.stdin.isTTY ? [] : [readFileSync(0, 'utf8')]

// 12 stays 12, 2.345 becomes 2.35. Labels stay short.
const fmt = (n) => (Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100))

function numbers() {
  const nums = input
    .join(' ')
    .split(/[\s,]+/)
    .filter(Boolean)
    .map(Number)
  if (!nums.length || nums.some(Number.isNaN)) usage('values must be numbers')
  return nums
}

// Accepts label=value, label,value, or a line whose last word is the value.
function pairs() {
  const items = positional.length ? positional : input.join('\n').split('\n')
  const out = []
  for (const raw of items) {
    const line = raw.trim()
    if (!line) continue
    const m = line.match(/^(.*?)(?:\s*[=,\t]\s*|\s+)(-?[\d.]+)$/)
    if (!m || Number.isNaN(Number(m[2]))) usage(`cannot read "${line}", use label=value`)
    out.push({ label: m[1], value: Number(m[2]) })
  }
  if (!out.length) usage('no values')
  return out
}

function bar() {
  const rows = pairs()
  if (rows.some((r) => r.value < 0)) usage('bars start at zero here. For negative values, chart the change from a baseline instead')
  if (flag('--sort')) rows.sort((a, b) => b.value - a.value)
  const width = option('--width', 40)
  const max = Math.max(...rows.map((r) => r.value)) || 1
  const labelW = Math.max(...rows.map((r) => strWidth(r.label)))
  const valueW = Math.max(...rows.map((r) => fmt(r.value).length))
  const EIGHTHS = ['', '▏', '▎', '▍', '▌', '▋', '▊', '▉']
  for (const { label, value } of rows) {
    // Eighth blocks give 8 steps per cell, so close values still look different.
    const eighths = Math.round((value / max) * width * 8)
    const body = flag('--ascii')
      ? '#'.repeat(Math.round(eighths / 8))
      : '█'.repeat(Math.floor(eighths / 8)) + EIGHTHS[eighths % 8]
    console.log(`${padEnd(label, labelW)}  ${padEnd(body, width)}  ${padStart(fmt(value), valueW)}${unit}`)
  }
}

function spark() {
  const nums = numbers()
  const levels = flag('--ascii') ? [...'_.:-=+*#'] : [...'▁▂▃▄▅▆▇█']
  const min = Math.min(...nums)
  const span = Math.max(...nums) - min || 1
  const line = nums.map((n) => levels[Math.round(((n - min) / span) * (levels.length - 1))]).join('')
  console.log(flag('--range') ? `${line}  ${fmt(min)}..${fmt(Math.max(...nums))}${unit}` : line)
}

// Braille dot bits, indexed [x][y] inside one 2x4 character cell.
const DOT = [
  [0x01, 0x02, 0x04, 0x40],
  [0x08, 0x10, 0x20, 0x80],
]

function plot() {
  const nums = numbers()
  if (nums.length < 2) usage('plot needs at least 2 values')
  const W = option('--width', 60)
  const H = option('--height', 10)
  const dotsX = W * 2
  const dotsY = H * 4
  const min = Math.min(...nums)
  const max = Math.max(...nums)
  const span = max - min || 1
  const cells = Array.from({ length: H }, () => new Array(W).fill(0))
  const set = (x, y) => {
    const row = H - 1 - Math.floor(y / 4)
    cells[row][Math.floor(x / 2)] |= DOT[x % 2][3 - (y % 4)]
  }
  const points = nums.map((n, i) => [
    Math.round((i / (nums.length - 1)) * (dotsX - 1)),
    Math.round(((n - min) / span) * (dotsY - 1)),
  ])
  // Joins each pair of points with a straight run of dots (Bresenham).
  for (let i = 1; i < points.length; i++) {
    let [x0, y0] = points[i - 1]
    const [x1, y1] = points[i]
    const dx = Math.abs(x1 - x0)
    const dy = -Math.abs(y1 - y0)
    const sx = x0 < x1 ? 1 : -1
    const sy = y0 < y1 ? 1 : -1
    let err = dx + dy
    for (;;) {
      set(x0, y0)
      if (x0 === x1 && y0 === y1) break
      const e2 = 2 * err
      if (e2 >= dy) {
        err += dy
        x0 += sx
      }
      if (e2 <= dx) {
        err += dx
        y0 += sy
      }
    }
  }
  const top = fmt(max) + unit
  const bottom = fmt(min) + unit
  const labelW = Math.max(top.length, bottom.length)
  cells.forEach((row, r) => {
    const label = r === 0 ? top : r === H - 1 ? bottom : ''
    const axis = label ? '┤' : '│'
    const dots = row.map((bits) => String.fromCodePoint(0x2800 + bits)).join('')
    console.log(`${label.padStart(labelW)} ${axis}${dots}`.trimEnd())
  })
}

if (mode === 'bar') bar()
else if (mode === 'spark') spark()
else if (mode === 'plot') plot()
else usage()
