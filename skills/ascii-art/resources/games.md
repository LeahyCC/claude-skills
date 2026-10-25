# Games

Boards, cards, dice, maps and mazes. When playing a game with someone in chat, redraw the whole board every turn and keep the coordinates on the edges, so moves like `e4` or `B2` can be read off it.

Contents: [Tic-tac-toe](#tic-tac-toe) · [Chess](#chess) · [Connect four](#connect-four) · [Sudoku](#sudoku) · [Cards](#cards) · [Dice](#dice) · [Hangman](#hangman) · [Dungeon maps](#dungeon-maps) · [Mazes](#mazes)

## Tic-tac-toe

```text
   A   B   C
1  X │ O │ X
  ───┼───┼───
2    │ X │ O
  ───┼───┼───
3  O │   │ X
```

ASCII: swap `│` for `|`, `─` for `-`, `┼` for `+`.

## Chess

The chess symbols are Neutral width, so 1 cell. Put a space between squares: many fonts draw the pieces wider than a cell.

```text
  a b c d e f g h
8 ♜ ♞ ♝ ♛ ♚ ♝ ♞ ♜ 8
7 ♟ ♟ ♟ ♟ ♟ ♟ ♟ ♟ 7
6 · · · · · · · · 6
5 · · · · · · · · 5
4 · · · · ♙ · · · 4
3 · · · · · · · · 3
2 ♙ ♙ ♙ ♙ · ♙ ♙ ♙ 2
1 ♖ ♘ ♗ ♕ ♔ ♗ ♘ ♖ 1
  a b c d e f g h
```

- Outlined pieces (`♔ ♕ ♖ ♗ ♘ ♙`) are white, solid ones (`♚ ♛ ♜ ♝ ♞ ♟`) black. On a dark terminal that looks reversed. Say which side is which.
- Never follow `♟` with U+FE0F. That makes it an emoji, 2 cells wide.
- ASCII: letters as in FEN notation. White is uppercase `K Q R B N P`, black lowercase `k q r b n p`, empty squares `.`.

## Connect four

```text
│ · · · · · · · │
│ · · · · · · · │
│ · · · ○ · · · │
│ · · ● ○ · · · │
│ · ● ● ○ ○ · · │
│ ○ ● ● ● ○ · · │
└───────────────┘
  1 2 3 4 5 6 7
```

## Sudoku

ASCII keeps the 3 by 3 boxes clear without mixing line weights.

```text
+-------+-------+-------+
| . 2 . | 4 5 . | . . 9 |
| . . 6 | . 8 . | . 2 . |
| 7 . . | . 2 . | . . . |
+-------+-------+-------+
| 2 3 . | . 6 7 | 8 . . |
| 5 6 7 | . . 1 | 2 3 4 |
| 8 9 1 | . 3 . | . . . |
+-------+-------+-------+
| . 4 5 | 6 7 8 | 9 1 . |
| 6 . . | 9 1 2 | . 4 . |
| 9 . 2 | 3 . . | 6 . . |
+-------+-------+-------+
```

A puzzle needs a solution. Generate the full grid with code, check every row, column and box, then blank cells. Never make up the digits.

## Cards

```text
┌─────────┐ ┌─────────┐
│ A       │ │ 10      │
│         │ │         │
│    ♠    │ │    ♥    │
│         │ │         │
│       A │ │      10 │
└─────────┘ └─────────┘
```

`♠ ♥ ♣` are Ambiguous width and `♦` is Neutral. For ASCII, write the suit as a letter: `AS`, `10H`, `QD`, `7C`.

## Dice

```text
+-------+ +-------+ +-------+
|       | | o     | | o   o |
|   o   | |   o   | |   o   |
|       | |     o | | o   o |
+-------+ +-------+ +-------+
```

Unicode has faces too, `⚀ ⚁ ⚂ ⚃ ⚄ ⚅`, but they are small in most fonts.

## Hangman

The classic stages: head `O`, body `|`, arms `/` `\`, legs `/` `\`.

```text
  +---+
  |   |
  O   |
 /|\  |
 / \  |
      |
=========
```

## Dungeon maps

The Rogue and NetHack style. Every symbol means one thing, and the legend goes with the map.

```text
 ----------           ---------
 |........|           |.......|
 |..@.....+###########+...$...|
 |........|           |..g..>.|
 -----+----           ---------
      #
      ###
```

| Symbol | Meaning |
| --- | --- |
| `@` | You |
| `.` | Floor |
| `\|` `-` | Wall |
| `+` | Door |
| `#` | Corridor |
| `$` | Gold |
| `>` `<` | Stairs down, up |
| letters | Monsters (`g` goblin, `D` dragon) |

Draw rooms as rectangles first, then join doors with corridors.

## Mazes

Never freehand a maze. A drawn one almost always has no way through, or several. The script carves a perfect maze (exactly one path between any two cells) and can mark the way through.

```bash
node scripts/art.mjs maze 8 4 --seed 3 --solve
node scripts/art.mjs maze 20 10 --ascii
```

```text
╷   ╶───┬───────────┬───────────┐
│ •   • │     •   • │     •   • │
├───╴   │   ╷   ╷   └───╴   ╷   │
│ •   • │   │ • │ •   •   • │ • │
│   ╶───┼───┘   ├───────────┘   │
│ •   • │ •   • │ •   •   •   • │
├───╴   ╵   ┌───┘   ╶───────────┤
│     •   • │     •   •   •   • │
└───────────┴───────────────╴   ╵
```

The entrance is top left and the exit bottom right. The same `--seed` gives the same maze, so a puzzle can be posted without `--solve` and the answer shared later.
