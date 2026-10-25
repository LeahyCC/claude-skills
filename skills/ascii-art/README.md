# ASCII Art

Everything drawn with text characters: diagrams, tables, charts, banners, boxes, pictures, kaomoji, game boards, maps and mazes. For work and for fun.

Models get text art wrong in three ways: they count columns by feel, they freehand big letters and bar lengths, and they paste art where the spacing collapses. This skill draws on a grid, hands the counting to small Node scripts, and checks every drawing before it is shown.

## Install

```bash
npx skills add LeahyCC/claude-skills@ascii-art
```

Or inside Claude Code:

```text
/plugin install ascii-art --marketplace LeahyCC/claude-skills
```

## What it does

**Before:** a label row one cell wider than its box, the drift every model makes.

```text fail
┌─────────┐
│  Input   │
└─────────┘
```

**After:** the checker catches it, and the fix is shown only once the checker says ok.

```text
┌─────────┐
│  Input  │
└─────────┘
```

The things models cannot freehand come from scripts:

```text
▄▀▀▀▄ ▄▀▀▀▀ ▄▀▀▀▀ ▀█▀ ▀█▀     ▄▀▀▀▄ █▀▀▀▄ ▀▀█▀▀
█▀▀▀█  ▀▀▀▄ █      █   █      █▀▀▀█ █▀▀█    █
▀   ▀ ▀▀▀▀   ▀▀▀▀ ▀▀▀ ▀▀▀     ▀   ▀ ▀   ▀   ▀

Test    ██████████████████████████████  118s
Deploy  ████████████████                 63s
Build   ██████████▋                      42s

p95 latency  ▁▂▂▃▄▃▆▆▆█  120..210ms
```

## Coverage

| Resource | Topics |
| --- | --- |
| [diagrams.md](./resources/diagrams.md) | Flowchart, layers, sequence, state machine, pipeline, before and after, timeline, bit layout, tree, when to use Mermaid |
| [charts-and-tables.md](./resources/charts-and-tables.md) | Box and markdown tables, bar charts, sparklines, Braille line plots, progress bars, heat strips, calendars |
| [pictures.md](./resources/pictures.md) | Styles, characters by slope, mirroring, a gallery of originals, shapes from a formula, pixel sprites, photos, credit |
| [text-art.md](./resources/text-art.md) | Banners, boxes, dividers, speech bubbles, kaomoji and emoticons, one-line art, spinners, fancy Unicode letters |
| [games.md](./resources/games.md) | Tic-tac-toe, chess, connect four, sudoku, cards, dice, hangman, dungeon maps, mazes |
| [glyphs.md](./resources/glyphs.md) | Every character set with its real width, box line weights, ASCII equivalents, arrows, blocks, Braille, CJK-wide terminals |
| [destinations.md](./resources/destinations.md) | Markdown, replies, code comments, strings, commit messages, chat apps, email, HTML, CLI output, screen readers |

## Scripts

Node 18 or newer, no packages.

| Script | Does |
| --- | --- |
| [check.mjs](./scripts/check.mjs) | Finds lines that drift a column, tabs, emoji, lines too wide, art outside a code fence |
| [banner.mjs](./scripts/banner.mjs) | Big letters from a built-in font: blocks, ASCII, shadow, half height, boxed |
| [chart.mjs](./scripts/chart.mjs) | Bar charts in 1/8 steps, sparklines, Braille line plots |
| [layout.mjs](./scripts/layout.mjs) | Tables, trees and boxes, with CJK text counted as 2 cells |
| [art.mjs](./scripts/art.mjs) | Mirrors a half drawing, packs pixel sprites, generates mazes with one way through |

All five share [width.mjs](./scripts/width.mjs), generated from Unicode 18.0 `EastAsianWidth.txt`.

## Verified against

- [Unicode 18.0 EastAsianWidth.txt](https://www.unicode.org/Public/UCD/latest/ucd/EastAsianWidth.txt) and [UAX #11](https://www.unicode.org/reports/tr11/): which characters take 1 or 2 cells
- [CommonMark 0.31.2](https://spec.commonmark.org/0.31.2/): code fences, escapes, tabs, headings made by `---`
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/) and technique [H86](https://www.w3.org/WAI/WCAG22/Techniques/html/H86): text alternatives for ASCII art
- [git commit](https://git-scm.com/docs/git-commit), [cppreference translation phases](https://en.cppreference.com/w/cpp/language/translation_phases), [Python 3.12 changes](https://docs.python.org/3/whatsnew/3.12.html): the traps in commit messages and code comments

Detail and what was not taken from each: [SOURCES.md](./SOURCES.md)

Last verified: October 2026

## License

[MIT](../../LICENSE)
