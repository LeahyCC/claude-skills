# Sources

Checked 2026-10-24.

## Specs and docs

| Source | Read | Used for |
| --- | --- | --- |
| Unicode 18.0 [EastAsianWidth.txt](https://www.unicode.org/Public/UCD/latest/ucd/EastAsianWidth.txt) (dated 2026-06-29) | whole file, by script | `scripts/width.mjs` is generated from it by `reviews/ascii-art/gen-width-tables.mjs`. The width of every character named in glyphs.md was looked up in it. Finding: all box lines, most arrows, triangles and blocks are Ambiguous. Braille, `░`, `▐`, `► ◄`, chess and dice are Neutral. |
| [UAX #11 East Asian Width](https://www.unicode.org/reports/tr11/), revision 46 | definitions and recommendations | Ambiguous characters are wide in East Asian contexts and narrow otherwise, and narrow when the context is unknown. Basis for "1 cell in most terminals, 2 in CJK-wide ones". |
| [CommonMark 0.31.2](https://spec.commonmark.org/0.31.2/) | fenced code blocks, backslash escapes, tabs, setext headings, thematic breaks | Why art must be fenced, why `\` and `_` vanish outside a fence, why `---` under text makes a heading. `check.mjs` follows its fence rules. |
| [GitHub Docs: Creating diagrams](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-diagrams) | page | GitHub renders Mermaid, GeoJSON, TopoJSON and ASCII STL in fenced blocks. Basis for the Mermaid advice. |
| [WCAG 2.2](https://www.w3.org/TR/WCAG22/), non-text content definition | note under the definition | "This includes ASCII art... emoticons, leetspeak". So art needs a text alternative under 1.1.1. |
| [W3C technique H86](https://www.w3.org/WAI/WCAG22/Techniques/html/H86) | examples 3 and 4 | `role="img"` with `aria-label` on the element holding the art, or a caption before it with a skip link. |
| [git-commit](https://git-scm.com/docs/git-commit), `--cleanup` | modes | `strip` removes `#` commentary and is the default when the message is edited. `whitespace` keeps it and is the default otherwise. `verbatim` changes nothing. |
| [cppreference: phases of translation](https://en.cppreference.com/w/cpp/language/translation_phases) | phase 2 | A backslash at the end of a line joins the next line, before comments are removed. Reproduced with `clang++ -Wall`: the next line became part of the comment and the variable was undeclared. |
| [GCC warning options](https://gcc.gnu.org/onlinedocs/gcc/Warning-Options.html), `-Wcomment` | entry | Warns on backslash-newline in a `//` comment, and `-Wall` turns it on. |
| [Python 3.12 What's New](https://docs.python.org/3/whatsnew/3.12.html) | invalid escape sequences | Unknown escapes like `\_` raise `SyntaxWarning`, a `SyntaxError` later. Reproduced with `python3 -W error`. |

## Prior art

| Source | Read | Used for |
| --- | --- | --- |
| [webreactiva/skills](https://github.com/webreactiva/skills) `skills/engineering/ascii-flow/SKILL.md` | in full | The centre formula and odd box widths, boxes before connectors, spaces never tabs, one line weight per drawing. |
| [jasnell/opencode-skill-ascii-art-diagrams](https://github.com/jasnell/opencode-skill-ascii-art-diagrams) `SKILL.md` | tools section and phase headings | The plan, draw, verify loop, and the idea of a verifier script. `check.mjs` is a new Node version with different checks. |
| [sindresorhus/cli-spinners](https://github.com/sindresorhus/cli-spinners) `spinners.json` | 5 entries | Frames for dots, line, circle halves, grow and dots scrolling in text-art.md. |
| [asciimoo/drawille](https://github.com/asciimoo/drawille) | README | Braille characters as a 2 by 4 pixel grid. The dot bit order in `chart.mjs` and `art.mjs` follows the Unicode Braille Patterns block. |

## Not taken

- The earlier draft of this skill (`diagramming`) said only symbols like `★ ●` go wide in CJK terminals. The width table shows box lines are Ambiguous too, so the warning covers them as well.
- ascii-flow says box-drawing characters are single-cell everywhere. They are Ambiguous in Unicode 18.0, so this skill says 1 cell in most terminals instead.
- jasnell's skill requires a fixed workflow for every diagram and asks the model to confirm each step. This skill keeps the loop but lets the checker decide when a drawing is done.
- Two sources the earlier draft listed: `joonakim/glyph` returns 404, and `whoamihealay/whiteboard` and `marcoskichel/empire` were not read for this version, so they are not cited.

## Not claimed

- `check.mjs` checks vertical alignment, characters and width. It does not judge whether a drawing is clear, check horizontal lines for gaps, or understand labels. A clean result means "lined up", not "good".
- Terminal behaviour (iTerm2 and GNOME Terminal ambiguous-width settings, Gmail showing plain text in a proportional font, old Windows consoles) comes from those products' settings and common use. It was not tested on every version.
- The convention of keeping an ASCII artist's initials is community practice, not a rule from a standards body.
- Every picture in pictures.md was drawn for this skill. The kaomoji, one-line art and hangman stages are old, unsigned folk pieces in wide use.
