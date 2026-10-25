---
name: ascii-art
description: Use when drawing anything out of text characters, for work or fun. Diagrams (flowcharts, architecture, sequence, state machines, file trees), tables and charts in plain text (bar charts, sparklines, line plots, progress bars), big banner letters, boxes and callouts, ASCII art pictures and pixel sprites, kaomoji and emoticons, game boards, dungeon maps and mazes. Also when a terminal reply, README, code comment or commit message needs a picture instead of prose. Draws on a grid, uses bundled Node scripts for the counting, and checks alignment before showing. Not for rendered images, SVG, or HTML and canvas charts.
---

# ASCII Art

Pictures made of text: diagrams, charts, tables, banners, art, games. They break in three ways, and this skill fixes each one.

```text
Breaks because                    Fix
columns counted by feel           draw on a grid, run check.mjs
big letters and bars freehand     a script draws them
pasted where spacing collapses    fence it, pick characters for the place
```

Sources checked: [SOURCES.md](SOURCES.md)

## Pick the shape

| To show | Draw | How |
| --- | --- | --- |
| Steps with a yes/no branch | Flowchart, top to bottom | [diagrams.md](./resources/diagrams.md) |
| Parts of a system and how they talk | Boxes in layers | [diagrams.md](./resources/diagrams.md) |
| Who sends what, in order | Sequence diagram | [diagrams.md](./resources/diagrams.md) |
| Something that changes state | State machine | [diagrams.md](./resources/diagrams.md) |
| A change to a design | Before, then after, stacked | [diagrams.md](./resources/diagrams.md) |
| A folder or a hierarchy | Tree | `layout.mjs tree` |
| Rows of facts | Table | `layout.mjs table`, or markdown where it renders |
| Compare amounts | Bar chart | `chart.mjs bar` |
| A trend | Sparkline or line plot | `chart.mjs spark`, `chart.mjs plot` |
| A title in big letters | Banner | `banner.mjs` |
| A note that must stand out | Box | `layout.mjs box` |
| A thing, an animal, a scene | Picture | [pictures.md](./resources/pictures.md) |
| A feeling in one line | Kaomoji | [text-art.md](./resources/text-art.md) |
| A board, map, maze, cards | Grid | [games.md](./resources/games.md) |

Only two things, or one link between them? Write a sentence. A diagram earns its place at three or more things, or a branch.

## Rules that do not bend

1. **Fence it.** In markdown, art goes in a `text` code block. Outside one, spaces collapse and `\` and `_` vanish.
2. **One character, one cell. Count.** Plain ASCII is 1 cell everywhere. Box lines, arrows and blocks are 1 cell in most terminals, 2 in CJK-wide ones. CJK text is 2. Emoji are 2 and some fonts draw them wider, so they stay out of anything that must line up.
3. **Spaces, never tabs.**
4. **Scripts count, you draw.** Banners, bar lengths, sparklines, plots, tables, trees, mazes and mirrored halves come from `scripts/`. Never freehand them.
5. **Check before showing.** Run `check.mjs` on every drawing with lines or boxes. Fix every error.
6. **One line style per drawing.** ASCII `+ - |` or Unicode `┌ ─ │`, not both. Heavy or double lines only to pick out one whole box.
7. **Fit the width.** 80 for terminals and replies, 72 for commit messages, the project's limit in code. Too wide? Split it, or go top to bottom.
8. **Small.** About 15 boxes at most. Pictures up to 20 lines. Bigger: split into an overview and a close-up.
9. **Say what it shows** in one line next to it. To a screen reader, art is noise.

## Pick the characters for where it goes

| Destination | Characters | Trap |
| --- | --- | --- |
| Code comment | Plain ASCII | In C and C++, a `//` line ending in `\` swallows the next line of code |
| Commit message | Plain ASCII, 72 wide | Lines starting with `#` vanish when git opens an editor |
| Terminal or chat reply | Unicode box lines | Must be fenced, under 80 wide |
| GitHub README | Unicode, fenced as `text` | A big graph may read better as Mermaid, which GitHub draws |
| Slack, Discord, Teams | Either, in a code block | Proportional font outside the block |
| Email | Plain ASCII in an HTML `<pre>` | Many mail apps show plain text in a proportional font |

Every destination and its fix: [destinations.md](./resources/destinations.md). Every character set and its real width: [glyphs.md](./resources/glyphs.md).

## Workflow

1. **Plan.** What it shows, which shape, where it goes, how wide it may be.
2. **Boxes first.** Give each box an odd width, so it has a middle. Write down each box's left column.
3. **Then connectors.** A box's middle is at `left + (width - 1) / 2`. Every `┬`, `│` and `▼` on that path uses that column.
4. **Check.** Fix what the checker reports, run it again, repeat until it says ok.
5. **Show it** with its one-line caption.

```bash
node scripts/check.mjs - <<'EOF'
┌───────┐
│ draft │
└───────┘
EOF
node scripts/check.mjs README.md --all      # every text block in a file
```

## Scripts

Paths are relative to this skill's folder. Node 18 or newer, no packages. Options are listed at the top of each file.

| Script | Does | Example |
| --- | --- | --- |
| `check.mjs` | Finds drifted lines, tabs, emoji, wide lines, art outside a fence | `node scripts/check.mjs art.txt` |
| `banner.mjs` | Big letters: blocks, ASCII, shadow, half height, boxed | `node scripts/banner.mjs "SHIP IT" --shadow` |
| `chart.mjs` | Bar chart, sparkline, Braille line plot | `node scripts/chart.mjs bar Mon=3 Tue=7` |
| `layout.mjs` | Table, tree, box, with CJK text counted right | `node scripts/layout.mjs tree < outline.txt` |
| `art.mjs` | Mirror a half drawing, pixel sprites, mazes with a solution | `node scripts/art.mjs maze 12 6 --solve` |

## FAIL and PASS

The drift every model makes: the label row is one cell wider than the border.

```text fail
┌─────────┐
│  Input   │
└─────────┘
```

`check.mjs` says `'┐' goes down, but the line below is one column right (col 12)`.

```text
┌─────────┐
│  Input  │
└─────────┘
```

## Fun requests

A cat, a birthday banner, a dungeon, a maze: same rules, more play.

- Start from a script or the gallery in [pictures.md](./resources/pictures.md), then change it.
- Symmetric picture? Draw the left half, then `art.mjs mirror`.
- Has a formula (heart, circle, wave)? Compute it. Cells are about twice as tall as wide.
- Keep it small enough to read at a glance.
- When copying a known piece, keep the artist's initials. Otherwise draw an original.

## Checklist

- [ ] Shape matches the content: table for facts, flowchart for branches, tree for nesting
- [ ] Fenced in markdown, inside a comment block in code
- [ ] Characters suit the destination
- [ ] `check.mjs` says ok
- [ ] Banners, bars, sparklines, plots, tables, trees and mazes came from a script
- [ ] Fits the width limit
- [ ] One-line caption says what it shows
