# Destinations

The same drawing breaks differently in every place it lands. Find the place, use its characters, avoid its trap.

Contents: [Markdown](#markdown) · [Chat replies and terminals](#chat-replies-and-terminals) · [Code comments](#code-comments) · [Strings in code](#strings-in-code) · [Commit messages](#commit-messages) · [Chat apps](#chat-apps) · [Email](#email) · [HTML](#html) · [CLI output](#cli-output) · [Screen readers](#screen-readers)

## Markdown

GitHub, GitLab, docs sites, and any `.md` file.

- **Always fence it**, with `text` as the language so nothing gets coloured as code:

  ````markdown
  ```text
  ┌──────┐
  │ here │
  └──────┘
  ```
  ````

- Outside a fence, runs of spaces collapse to one, `\` escapes the next character, and `_` or `*` pairs turn into italics. That is why `¯\_(ツ)_/¯` loses an arm.
- Tabs in a fence are kept as tabs, and every viewer expands them differently. Spaces only.
- A line of `---` or `===` directly under text turns that text into a heading. Inside a fence it is safe.
- `check.mjs file.md --all` flags box lines outside a fence.

For big graphs, GitHub draws Mermaid from a `mermaid` fence. See [diagrams.md](./diagrams.md#when-to-use-mermaid).

## Chat replies and terminals

Claude Code, terminal chat, any reply rendered as markdown.

- Fence it. A reply is markdown.
- Keep it under 80 wide, and narrower when you can. The reader's window may be small, and a wrapped line wrecks the drawing.
- Unicode box lines are fine. Emoji are not, in anything aligned.

## Code comments

Plain ASCII. It survives every editor, font, diff viewer and code review tool. Stay inside the project's line limit.

**C and C++: a `\` at the end of a line joins the next line on.** It happens before comments are removed, so a `//` comment ending in `\` swallows the next line of code. GCC and Clang warn with `-Wcomment`, which `-Wall` turns on.

```cpp
// FAIL: the \ at the end of the next line comments out `int depth = 0;`
//      root
//     /    \
int depth = 0;
```

```cpp
// PASS: nothing after the last \ on the line, so close it off
//      root
//     /    \ .
int depth = 0;
```

Or use a `/* */` block, or flip the drawing so no line ends in `\`.

**Block comments end at `*/`.** Art inside `/* */` must not contain `*/` anywhere, not even inside an arrow like `--*/`.

**Python: `\` in a normal docstring is an escape.** Since Python 3.12, `\_` and other unknown escapes raise `SyntaxWarning: invalid escape sequence`. Use a raw docstring:

```python
def shrug():
    r"""Returns ¯\_(ツ)_/¯"""
```

## Strings in code

| Where | Do this |
| --- | --- |
| JavaScript | `` String.raw`...` `` keeps `\` as typed. Watch for `` ` `` and `${` in the art |
| JSX | Put the art in a string inside `<pre>{...}</pre>`. Bare `{` and `}` are JSX syntax |
| Python | `r"""..."""` |
| JSON | Escape `\` as `\\` and line breaks as `\n`. JSON has no multi-line strings |
| YAML | A literal block, `key: \|`, keeps every space and `\` |
| TOML | Literal multi-line string, `'''...'''` |

## Commit messages

- Plain ASCII, 72 wide. Many tools show commit messages at that width.
- **Lines starting with `#` vanish** when git opens an editor for the message: the default cleanup mode strips them as comments. `git commit -m` keeps them. To keep them in the editor, use `git commit --cleanup=verbatim`, or start art lines with a space.
- PR descriptions and issues are markdown. Fence the art there.

## Chat apps

Slack, Discord and Teams use a proportional font for normal text, so art only lines up inside a code block. Slack and Discord take three backticks. In Teams, use the code snippet button.

## Email

Many mail apps show even plain-text email in a proportional font. Gmail on the web does. For art that must line up, send HTML with the art in a `<pre>`, or attach it.

## HTML

```html
<figure>
  <pre role="img" aria-label="Flowchart: read the config, parse it or use the default, then start the app">
...art...
  </pre>
  <figcaption>How the app starts</figcaption>
</figure>
```

```css
pre {
  font-family: ui-monospace, Menlo, Consolas, 'DejaVu Sans Mono', monospace;
  line-height: 1.2;
  white-space: pre;
  overflow-x: auto;
}
```

- `line-height: 1` for block art, so `█` rows touch.
- `overflow-x: auto` scrolls a wide drawing instead of wrapping it.
- A font missing a character falls back to another font, which may be a different width. Braille and some symbols are the usual culprits. Look at it in the browser.

## CLI output

For a program that prints art:

- Use Unicode only when output is a terminal (`process.stdout.isTTY` in Node, `sys.stdout.isatty()` in Python) and the locale is UTF-8 (`LANG` or `LC_ALL` contains `UTF-8`). Otherwise print ASCII.
- No spinners or redraws when piped to a file or CI log.
- Old Windows consoles not set to UTF-8 print box lines as junk. Windows Terminal is fine. `chcp 65001` switches an old console to UTF-8.

## Screen readers

To a screen reader, art is a stream of symbol names: "box drawings light down and right, box drawings light horizontal...". WCAG counts ASCII art as non-text content (success criterion 1.1.1), so it needs a text alternative.

- In docs and replies: one line before the drawing that says what it shows. Plain-docs style captions do this already.
- In HTML: `role="img"` and `aria-label` on the `pre`, as above (W3C technique H86).
- Kaomoji and emoticons: say the feeling in words where it matters.
