# Charts and tables

Numbers drawn in text. The rule for this whole page: **a script does the arithmetic.** A bar drawn by feel is a wrong bar. Models routinely draw 7.5 longer than 12.

Contents: [Tables](#tables) · [Bar charts](#bar-charts) · [Sparklines](#sparklines) · [Line plots](#line-plots) · [Progress bars](#progress-bars) · [Heat strips](#heat-strips) · [Calendars](#calendars)

## Tables

Pick by where it will be read:

| Destination | Table |
| --- | --- |
| Renders markdown (GitHub, Claude Code, docs sites) | Markdown table |
| Plain text: code comments, logs, CLI output, email | Box table from `layout.mjs table` |
| Read as source and rendered, like a README | Markdown table padded to line up: `--style markdown` |

```bash
node scripts/layout.mjs table < data.csv                    # box table
node scripts/layout.mjs table --style markdown < data.csv   # padded markdown
node scripts/layout.mjs table --align lrrr < data.tsv       # force alignment per column
```

```text
┌─────────────┬────────┬────────┬────────┐
│ Route       │    p50 │    p95 │ Errors │
├─────────────┼────────┼────────┼────────┤
│ /api/cart   │  42 ms │ 180 ms │   0.1% │
│ /api/login  │  95 ms │ 410 ms │   1.2% │
│ /api/search │ 130 ms │ 900 ms │   0.4% │
└─────────────┴────────┴────────┴────────┘
```

Numbers go right, so the digits line up. The script does this when every value in a column looks like a number. Text goes left.

## Bar charts

```bash
node scripts/chart.mjs bar Build=42 Test=118 Lint=9 Deploy=63 --unit s --sort --width 30
```

```text
Test    ██████████████████████████████  118s
Deploy  ████████████████                 63s
Build   ██████████▋                      42s
Lint    ██▎                               9s
```

- Bars start at zero. A bar that starts anywhere else lies about size.
- Sort by size, unless the order means something (days, steps, versions).
- Put the value at the end of the bar. The bar shows size, the number says it.
- `--ascii` gives `#` bars, for code comments and logs.

The partial blocks (`▋ ▎`) split each cell into 8 steps, so 42 and 44 still look different.

## Sparklines

A trend in one line, small enough to sit in a sentence or a table cell.

```bash
node scripts/chart.mjs spark 120 132 128 145 160 151 178 190 185 210 --range --unit ms
```

```text
p95 latency  ▁▂▂▃▄▃▆▆▆█  120..210ms
```

A sparkline shows shape, not values. Always give the range next to it.

## Line plots

For more detail than a sparkline: Braille dots, 2 across and 4 down per character.

```bash
node scripts/chart.mjs plot 120 132 128 145 160 151 178 190 185 210 195 230 --width 30 --height 6 --unit ms
```

```text
230ms ┤⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⠎
      │⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⠔⠑⠢⢄⡰⠁⠀
      │⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡠⠔⠊⠉⠑⠒⠁⠀⠀⠀⠀⠀⠀⠀
      │⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡀⠀⠀⢀⠎⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
      │⠀⠀⠀⠀⠀⠀⠀⣀⠔⠊⠁⠈⠉⠒⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
120ms ┤⡠⠔⠊⠉⠒⠒⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
```

Good in terminals. In a browser the Braille font may be a different width, so look at it rendered (see [glyphs.md](./glyphs.md#braille)).

## Progress bars

`filled = round(fraction × width)`. Same width every time, so a bar that redraws in place does not jump.

```text
[##############----------]  58%
██████████████░░░░░░░░░░  58%
```

For a bar that updates in a terminal, print `\r` and the new line without a newline. Keep the line shorter than the terminal, or it wraps and every redraw adds a line.

## Heat strips

One character per day, shade for amount. The legend is not optional.

```text
    Aug       Sep       Oct
Mon ▓ ░ ▒ █ ▓ ▒ █ █ · █ ░ ░ █ · ░ ·
    · ▓ █ █ ▓ · ▓ ▒ ░ █ · █ · · ▓ ▓
Wed █ █ █ ▓ · ░ · ▓ ░ ░ █ ░ █ ▒ ░ ▒
    ▒ ▒ ░ █ ▓ ░ ▓ ▓ ▒ ▒ ░ · ▓ ▒ ▒ ░
Fri ▒ · █ ░ · █ ▓ ▓ █ ░ ▒ ▒ ▓ ▓ ░ ·
    · · · ░ ░ · · · · · ░ · · · ░ ·
Sun · · ░ · · · ░ · · · · ░ · · · ░
    less · ░ ▒ ▓ █ more
```

Map values to the 5 shades with `Math.min(4, Math.floor(value / max * 5))`. Do not pick shades by eye.

## Calendars

`cal` (macOS, Linux) prints one. To mark a day, swap the spaces on each side for brackets. The width stays the same:

```text
    October 2026
Su Mo Tu We Th Fr Sa
             1  2  3
 4  5  6  7  8  9 10
11 12 13 14 15 16 17
18 19 20 21 22 23[24]
25 26 27 28 29 30 31
```

`cal` pads lines with trailing spaces. Strip them before pasting.
