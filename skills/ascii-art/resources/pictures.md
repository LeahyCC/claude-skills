# Pictures

Animals, objects, scenes, sprites. Pictures go wrong when they are big, freehand and lopsided. Keep them small, mirror what is symmetric, and compute what has a formula.

Contents: [Pick a style](#pick-a-style) · [Rules](#rules) · [Characters by slope](#characters-by-slope) · [Steps](#steps) · [Gallery](#gallery) · [Shapes from a formula](#shapes-from-a-formula) · [Pixel sprites](#pixel-sprites) · [Photos](#photos) · [Credit](#credit)

## Pick a style

| Style | Looks like | Good for | Where |
| --- | --- | --- | --- |
| Line art | `/\_/\` | Animals, objects, small scenes | Anywhere, ASCII only |
| Solid blocks | `▄█▀` | Sprites, logos, bold shapes | Terminals, READMEs |
| Shading ramp | `.:-=+*#%@` | Photos, gradients | Large, monospace only |
| Braille | `⣿⡇⠿` | Fine detail at small size | Terminals |

## Rules

- **Small.** Up to 20 lines and 40 wide. Small art reads at a glance. Big freehand art smears.
- **Cells are tall.** A cell is about twice as tall as it is wide. A circle 10 rows tall needs about 20 columns.
- **Outline first, details last.** Get the silhouette right before adding eyes and texture.
- **Mirror what is symmetric.** Draw the left half and let `art.mjs mirror` make the right half. Hand-drawn symmetry always drifts.
- **Fence it.** Line art is full of `\` and `_`, which markdown eats outside a code block.

## Characters by slope

| Line | Characters |
| --- | --- |
| Vertical | `\|` |
| Steep diagonal | `/` `\` |
| Flat, at the bottom of a cell | `_` |
| Flat, in the middle | `-` `~` `=` |
| Round sides | `(` `)` |
| Round corner, top | `.` `,` |
| Round corner, bottom | `'` `` ` `` |
| Eyes | `o` `O` `.` `^` `-` `x` `@` |

`_` sits low and `-` sits in the middle, so a box drawn with `_` on top and `-` on the bottom looks uneven. Use `.` `-` `'` for round boxes and `+` `-` `|` for square ones.

## Steps

1. Pick the size. Write the width and height down.
2. Draw the outline with the slope table.
3. If it is symmetric, draw only the left half, then mirror it:

   ```bash
   node scripts/art.mjs mirror < half.txt            # even width
   node scripts/art.mjs mirror --center < half.txt   # odd width, shares the middle column
   ```

   With `--center`, every line of the half must be the same length, and the middle column must hold a symmetric character (`| o O ^ v _ - .` or space). The mirror swaps pairs: `/` `\`, `(` `)`, `[` `]`, `{` `}`, `<` `>`, `` ` `` `'`, `d` `b`, `p` `q`.

4. Add details: eyes, windows, texture.
5. Run `check.mjs` for tabs and trailing spaces.
6. Look at it as a whole. If the shape is not clear from across the room, simplify it.

## Gallery

All originals for this skill. Copy them, change them.

Made with `mirror`. Half on the left, result on the right:

```text
      /           /\
     /           /  \
    |           |    |
    | (         | () |
    |           |    |
   /|          /|    |\
  /_|__       /_|____|_\
    /_/         /_/\_\
     (           (  )
```

```text
      *                *
     /                / \
    /                /   \
   /_               /_   _\
    /                /   \
   /                /     \
  /_               /_     _\
   /                /     \
  /                /       \
 /_____           /_________\
     |                | |
```

```text
   .-----.
  /       \
 |  o   o  |
 |    O    |
 |         |
 `.^.^.^.^.'
```

Drawn by hand:

```text
   /\_/\          ) ) )
  ( o.o )        ( ( (
   > ^ <       .--------.
  /     \      |        |--.
 (  | |  )     |        |  |
  \_|_|_/      |        |--'
                \______/
```

```text
          ||
       ___||___
      /        \
     /          \
    /____________\
     |  _    _  |
     | |_|  |_| |
     |    __    |
     |___|  |___|
```

```text
                          .       *
      .        /\
              /  \      /\
       /\    /    \    /  \
      /  \  /      \  /    \
     /    \/        \/      \
 ___/________________________\___
```

```text
   .------------------.
   | $ npm test       |
   | 42 passing       |
   | _                |
   '------------------'
  /____________________\
```

## Shapes from a formula

If a shape has an equation, sample it on the grid. Do not freehand a circle or a heart. Step `x` half as much as `y`, because cells are tall.

```bash
node -e '
for (let y = 1.2; y >= -1.1; y -= 0.2) {
  let line = ""
  for (let x = -1.3; x <= 1.3; x += 0.1) {
    const a = x * x + y * y - 1
    line += a * a * a - x * x * y * y * y <= 0 ? "#" : " "
  }
  console.log(line.trimEnd())
}'
```

```text
      #####     #####
   #####################
  #######################
  #######################
  #######################
   #####################
   #####################
     #################
      ###############
        ###########
           #####
```

Circle: `x * x + y * y <= 1`. Ring: between two radii. Swap `#` for `█` in a terminal.

## Pixel sprites

For blocky art, draw the sprite as a grid of `#` (on) and `.` (off). A grid is easy to reason about one cell at a time. Then let the script pack it.

```text
..#.....#..
...#...#...
..#######..
.##.###.##.
###########
#.#######.#
#.#.....#.#
...##.##...
```

```bash
node scripts/art.mjs pixels < sprite.txt            # half blocks: 2 pixel rows per line
node scripts/art.mjs pixels --wide < sprite.txt     # ██ per pixel, about square
node scripts/art.mjs pixels --braille < sprite.txt  # 8 pixels per character, tiny
```

```text
  ▀▄   ▄▀
 ▄█▀███▀█▄
█▀███████▀█
▀ ▀▄▄ ▄▄▀ ▀
```

## Photos

Turning an image into text needs the pixels, which a model cannot read exactly. Use a converter if one is installed:

| Tool | Command |
| --- | --- |
| chafa | `chafa --symbols ascii --size 60x30 photo.jpg` |
| jp2a | `jp2a --width=60 photo.jpg` |

Nothing installed? Draw a simple line-art version from what the picture shows, and say that is what it is.

Every converter maps brightness to a ramp like ` .:-=+*#%@`. On a dark terminal the ramp runs the other way (`--invert` in jp2a). Check which background the reader has.

## Credit

ASCII artists sign work with their initials, usually in a corner. When reproducing a known piece, keep the initials. Do not present someone else's piece as new. When in doubt, draw an original: the steps above are enough for small pieces.
