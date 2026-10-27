# Text art

Big letters, boxes, dividers, speech bubbles, kaomoji, one-line art and spinners.

Contents: [Banners](#banners) · [Boxes and callouts](#boxes-and-callouts) · [Dividers](#dividers) · [Speech bubbles](#speech-bubbles) · [Kaomoji and emoticons](#kaomoji-and-emoticons) · [One-line art](#one-line-art) · [Spinners](#spinners) · [Fancy Unicode letters](#fancy-unicode-letters)

## Banners

Never freehand big letters. Every model breaks them: uneven heights, missing strokes, an S that reads as a 5. Use the script.

```bash
node scripts/banner.mjs "HELLO"                    # █ blocks
node scripts/banner.mjs "HELLO" --shadow           # drop shadow
node scripts/banner.mjs "Happy birthday" --half    # 3 rows tall
node scripts/banner.mjs "v2.0" --ascii --box       # plain ASCII, boxed
```

```text
█   █ █████ █     █      ███
█░  █░█░░░░░█░    █░    █ ░░█
█████░████  █░    █░    █░  █░
█░░░█░█░░░░ █░    █░    █░  █░
█░  █░█████ █████ █████  ███ ░
 ░   ░ ░░░░░ ░░░░░ ░░░░░  ░░░
```

```text
█   █ ▄▀▀▀▄ █▀▀▀▄ █▀▀▀▄ ▀▄ ▄▀     █▀▀▀▄ ▀█▀ █▀▀▀▄ ▀▀█▀▀ █   █ █▀▀▀▄ ▄▀▀▀▄ ▀▄ ▄▀
█▀▀▀█ █▀▀▀█ █▀▀▀  █▀▀▀    █       █▀▀▀▄  █  █▀▀█    █   █▀▀▀█ █   █ █▀▀▀█   █
▀   ▀ ▀   ▀ ▀     ▀       ▀       ▀▀▀▀  ▀▀▀ ▀   ▀   ▀   ▀   ▀ ▀▀▀▀  ▀   ▀   ▀
```

```text
+---------------------+
| #   #  ###     ###  |
| #   # #   #   #  ## |
| #   #   ##    # # # |
|  # #   #      ##  # |
|   #   ##### #  ###  |
+---------------------+
```

Long text wraps by word at `--width` (default 80). A banner is a title: 1 to 3 words reads best.

More fonts: `figlet` and `toilet` have hundreds, if installed (`figlet -f slant "Hi"`). Their output is full of `\` and `_`, so fence it. In C or C++ comments, watch for a line that ends in `\` (see [destinations.md](./destinations.md#code-comments)).

## Boxes and callouts

```bash
node scripts/layout.mjs box "Run the migration on staging first." --title Note --style rounded --width 40
```

```text
╭─ Note ──────────────────────────────╮
│ Run the migration on staging first. │
╰─────────────────────────────────────╯
```

Styles: `light`, `heavy`, `double`, `rounded`, `ascii`. Text wraps by word at the width, and CJK text is counted as 2 cells.

Section headers in code, ASCII only:

```text
// ---- Auth ------------------------------------------------
# ===== Config ==============================================
```

## Dividers

```text
────────────────────────────────────────
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
════════════════════════════════════════
- - - - - - - - - - - - - - - - - - - -
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
          *      *      *
```

In markdown, outside a code block, these do other things:

| You type | Markdown does |
| --- | --- |
| `---` or `***` or `___` on its own line | Horizontal rule |
| `---` or `===` right under a line of text | Turns that text into a heading |
| `~~~` or 3 backticks at the start of a line | Opens a code block |

Fence them, or use a markdown horizontal rule on purpose.

## Speech bubbles

A box from `layout.mjs box --style rounded`, then swap one bottom `─` for `┬` and hang the tail from it.

```text
╭───────────────────────╮
│ Did you run the tests │
│ before merging?       │
╰──┬────────────────────╯
   │
 (•_•)
```

ASCII version: box with `+ - |`, tail from `+`, then a `|` or `\` down to the speaker.

## Kaomoji and emoticons

Japanese-style faces, read upright. Keep them in code spans in markdown: bare, the `\` vanishes and `_` or `*` pairs turn text italic.

| Meaning | Kaomoji |
| --- | --- |
| Shrug | `¯\_(ツ)_/¯` |
| Flip the table | `(╯°□°)╯︵ ┻━┻` |
| Put it back | `┬─┬ノ( º _ ºノ)` |
| Happy | `(◕‿◕)` |
| Cheer | `\(^o^)/` |
| Excited | `(ノ◕ヮ◕)ノ*:･ﾟ✧` |
| Disapproval | `ಠ_ಠ` |
| Cool | `(⌐■_■)` |
| Hug | `(っ◕‿◕)っ` |
| Crying | `(╥﹏╥)` |
| Sleepy | `(-_-) zzZ` |
| Bear | `ʕ•ᴥ•ʔ` |
| Cat | `(=^･ω･^=)` |
| Dance | `(>^_^)> <(^_^<)` |

Western, read sideways: `:-)` `;-)` `:-(` `:-D` `:-P` `<3` `\o/` `o/` `^_^` `-_-` `T_T` `>_<` `o_O`.

Kaomoji mix widths (`ツ` and `︵` are 2 cells), so they do not belong inside aligned art. A screen reader reads them as character names ("macron, backslash, low line..."). Where the meaning matters, say it in words too.

## One-line art

Old, unsigned, and still fun at the end of a message:

| Thing | Art |
| --- | --- |
| Fish | `><(((('>` |
| Rose | `@}-;-'---` |
| Sword | `o==[]::::::::::::::>` |
| Arrow | `>>---------->` |
| Snake | `~~~~~~~~:>` |

## Spinners

Frames for a terminal spinner, from the `cli-spinners` collection:

| Name | Frames |
| --- | --- |
| dots | `⠋ ⠙ ⠹ ⠸ ⠼ ⠴ ⠦ ⠧ ⠇ ⠏` |
| line | `- \ \| /` |
| circle halves | `◐ ◓ ◑ ◒` |
| grow | `▁ ▃ ▄ ▅ ▆ ▇ ▆ ▅ ▄ ▃` |
| dots scrolling | `.  ` `.. ` `...` ` ..` `  .` |

Every frame must be the same width, or the text after it jitters. Draw each frame with `\r` and no newline, about every 80 ms. Clear the line when done. Skip the spinner when the output is not a terminal (piped to a file or CI log): it fills the log with frames.

## Fancy Unicode letters

Generators that turn text into 𝐛𝐨𝐥𝐝, 𝓈𝒸𝓇𝒾𝓅𝓉 or ｆｕｌｌｗｉｄｔｈ letters use math and fullwidth symbols, not letters. Screen readers read them symbol by symbol or skip them, search does not match them, and fullwidth letters take 2 cells. Fine as a joke. Never for anything someone needs to read or find.
