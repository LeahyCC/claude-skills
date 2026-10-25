# Glyphs

Which characters to draw with, and how wide each one really is. Widths come from Unicode 18.0 `EastAsianWidth.txt`, the same table `scripts/width.mjs` uses.

Contents: [Width](#width-in-one-table) · [Box lines](#box-lines) · [ASCII equivalents](#ascii-equivalents) · [Arrows](#arrows) · [Blocks and shading](#blocks-and-shading) · [Braille](#braille) · [Status marks](#status-marks) · [CJK-wide terminals](#cjk-wide-terminals)

## Width in one table

A terminal is a grid. Every character takes 1 or 2 cells, and a drawing only lines up if you count the same way the terminal does.

| Set | Examples | Unicode width | Cells |
| --- | --- | --- | --- |
| Plain ASCII | `+ - \| / \ < > ^ v = * # . : ' _` | Narrow | 1 everywhere |
| Box lines, all weights | `─ │ ┌ ┼ ━ ┃ ═ ║ ╭ ╯` | Ambiguous | 1, or 2 in CJK-wide terminals |
| Arrows | `← ↑ → ↓ ↔` | Ambiguous | 1, or 2 |
| Triangles | `▲ ▼ ◀ ▶` | Ambiguous | 1, or 2 |
| Pointers | `► ◄` | Neutral | 1 |
| Blocks | `█ ▀ ▄ ▌ ▒ ▓` | Ambiguous | 1, or 2 |
| Blocks | `▐ ░` | Neutral | 1 |
| Braille | `⠁ ⠿ ⣿` | Neutral | 1 |
| Shapes | `■ □ ● ○ ◆ ★ ☆` | Ambiguous | 1, or 2 |
| Marks | `✓ ✗ ☐ ☑` | Neutral | 1 |
| Chess, dice | `♔ ♟ ⚀ ⚅` | Neutral | 1 |
| Card suits | `♠ ♥ ♣` Ambiguous, `♦` Neutral | mixed | 1, or 2 |
| CJK text, fullwidth | `東京 （ ）` | Wide | 2 everywhere |
| Emoji | `🙂 ⭐ ✨` | Wide | 2, some fonts wider |

What that means in practice:

- **Plain ASCII is the only set that is 1 cell everywhere.** Use it when the drawing must survive anything.
- **Box lines, arrows and blocks are fine in almost every terminal.** They break only where ambiguous width is set to wide. See [CJK-wide terminals](#cjk-wide-terminals).
- **CJK text is safe when counted as 2.** `layout.mjs` and `check.mjs` count it right. Models usually count it as 1.
- **Emoji do not belong in aligned art.** A text symbol followed by U+FE0F (`❤` becomes `❤️`) can turn 2 wide in one terminal and stay 1 in another. `check.mjs` warns on every emoji and every U+FE0F.

## Box lines

Box Drawing block, U+2500 to U+257F. Four weights. Pick one per drawing.

```text
light       heavy       double      rounded
┌──┬──┐     ┏━━┳━━┓     ╔══╦══╗     ╭──┬──╮
│  │  │     ┃  ┃  ┃     ║  ║  ║     │  │  │
├──┼──┤     ┣━━╋━━┫     ╠══╬══╣     ├──┼──┤
│  │  │     ┃  ┃  ┃     ║  ║  ║     │  │  │
└──┴──┘     ┗━━┻━━┛     ╚══╩══╝     ╰──┴──╯
```

| Job | Light | Heavy | Double |
| --- | --- | --- | --- |
| Lines | `─ │` | `━ ┃` | `═ ║` |
| Corners | `┌ ┐ └ ┘` | `┏ ┓ ┗ ┛` | `╔ ╗ ╚ ╝` |
| Joins | `├ ┤ ┬ ┴ ┼` | `┣ ┫ ┳ ┻ ╋` | `╠ ╣ ╦ ╩ ╬` |
| Dashed | `┄ ┆ ┈ ┊` | `┅ ┇ ┉ ┋` | none |
| Diagonal | `╱ ╲ ╳` | none | none |
| Half lines, for loose ends | `╴ ╵ ╶ ╷` | `╸ ╹ ╺ ╻` | none |

Rounded corners `╭ ╮ ╰ ╯` join the light lines.

Mixing weights needs special join characters (`┝ ┿ ╂` for light with heavy, `╞ ╪ ╫` for single with double). It is easy to pick the wrong one. To make one thing stand out, draw that whole box heavy or double, and do not join it to light lines.

## ASCII equivalents

| Unicode | ASCII |
| --- | --- |
| `─` `━` | `-` |
| `═` | `=` |
| `│` | `\|` |
| every corner and join | `+` |
| rounded corners | `.` on top, `'` below |
| `╱ ╲` | `/ \` |
| `▶ ◀ ▲ ▼` | `> < ^ v` |

```text
+-------+     .-------.
| plain |     | round |
+-------+     '-------'
```

## Arrows

| Style | Right | Left | Both | Down | Up |
| --- | --- | --- | --- | --- | --- |
| ASCII | `-->` | `<--` | `<-->` | `\|` then `v` | `^` then `\|` |
| Unicode lines | `──▶` | `◀──` | `◀──▶` | `│` then `▼` | `▲` then `│` |
| Thin | `──→` | `←──` | `←──→` | `│` then `↓` | `↑` then `│` |

Pick one style per drawing. Triangles are easier to see than thin arrows.

## Blocks and shading

| Use | Characters |
| --- | --- |
| Solid, half cells | `█ ▀ ▄ ▌ ▐` |
| Shade, light to dark | `░ ▒ ▓ █` |
| Bar ends, 1/8 steps | `▏ ▎ ▍ ▌ ▋ ▊ ▉ █` |
| Sparkline levels | `▁ ▂ ▃ ▄ ▅ ▆ ▇ █` |
| ASCII density ramp | `. : - = + * # % @` |

The ramp runs light to dark **on a light background**. On a dark terminal it flips: `@` is the brightest. Ask, or check the destination, before converting a picture.

Block characters fill the whole cell in most terminals. In a browser, line spacing can leave thin gaps between rows. Set `line-height: 1` on the `pre`.

## Braille

U+2800 to U+28FF. Each character is a 2 by 4 grid of dots, so one cell holds 8 pixels. Line plots (`chart.mjs plot`) and fine pixel art (`art.mjs pixels --braille`) use it.

```text
⣿⣿⣿⣿  full    ⠀  empty (U+2800, not a space)
```

Braille is Neutral width, so it stays 1 cell even in CJK-wide terminals. The catch is the font: in a browser, a fallback font can draw Braille at a different width. Look at it rendered before shipping.

## Status marks

| Meaning | Unicode | ASCII |
| --- | --- | --- |
| done | `✓` | `[x]` |
| failed | `✗` | `[!]` |
| to do | `☐` or `○` | `[ ]` |
| current | `●` or `▶` | `>` |
| bullet | `•` | `*` or `-` |

## CJK-wide terminals

Unicode leaves "ambiguous" characters to context: wide in East Asian settings, narrow otherwise, and narrow when the context is unknown (UAX #11). Most terminals use narrow. Some users switch to wide, for example iTerm2's "Treat ambiguous-width characters as double width" or GNOME Terminal's "Ambiguous-width characters: Wide".

In that setting every `─` takes 2 cells while spaces still take 1, so box drawings fall apart. When the reader might use such a terminal, use plain ASCII, or test with:

```bash
node scripts/check.mjs drawing.txt --cjk
```
