---
name: diagramming
description: >
  Draws clear ASCII and Unicode diagrams in terminal and markdown:
  architecture, sequence, state machine, data pipeline, before/after refactor.
  Matches diagram type to content, keeps glyphs consistent, and validates
  alignment. Use when the user asks for a diagram, or when a relationship
  between three or more things is clearer visually than in prose.
  Not for simple comparisons (use a table), UI mock-ups (use an Artifact),
  or production diagrams with precise sizing (use Excalidraw/Mermaid).
---

# Diagramming

A diagram earns its place when it shows a relationship between three or more things that prose would describe with "first this, then that, but if X, else Y."

**Match the shape of the information to the shape of the diagram.** Flowcharts for control flow, trees for hierarchy, state machines for lifecycle, pipeline/layer for data or architecture, and comparison tables for side-by-side.

**Default to pure ASCII.** Pure ASCII (`+-|`) works everywhere — code comments, old terminals, GitHub markdown. Use Unicode box-drawing (`─│┌┐`) only for READMEs and docs that are read in a browser.

**Never mix character sets.** Pick one tier per diagram and stick with it. Trailing whitespace is an error.

**Keep diagrams under fifteen nodes.** Beyond that you have a wall, not a picture. Split into layers.

## Glyph tiers

### Tier 1 — Pure ASCII (default)

+---+    +---+
|   |-->|   |
+---+    +---+
    ^
    |
   /
  /   \

Characters: `+`, `-`, `|`, `/`, `\`, `>`, `<`, `^`, `v`, space.

### Tier 2 — Unicode box-drawing (READMEs, browser docs)

┌─────┐  ┌─────┐
│     │→ │     │
└─────┘  └─────┘
    ↑
    │
  ┌─┴─┐
  │   │
  └───┘

Characters: `─`, `│`, `┌`, `┐`, `└`, `┘`, `├`, `┤`, `┬`, `┴`, `┼`, `→`, `↑`, `←`, `↓`.

### Tier 3 — Geometry (arrows, status glyphs)

  ◄  ►  ▲  ▼  ◆  ○  ●  ■  □  ★  ☆

Use sparingly. CJK terminals render some of these as double-width, which breaks alignment.

## Workflow

1. **PLAN** — List the entities and relationships. Choose the diagram type. Pick a tier. If the content fits in one line, skip the diagram.
2. **DRAFT** — Build on a mental fixed grid. Compute attachment points arithmetically: `center_col = left_border + floor(inner_width / 2)`. Pad labels uniformly so connectors land in the same relative column.
3. **VERIFY** — Check alignment visually. Walk every row for trailing whitespace. Confirm the legend matches the glyph set. Ensure labels are inside or directly beside what they label.

## Diagram patterns

### Flowchart

┌─────────┐     ┌─────────┐     ┌─────────┐
│  Input   │────▶│ Process  │────▶│ Output   │
└─────────┘     └────┬────┘     └─────────┘
                      │
                   ┌──┴──┐
                   │  X?  │
                   └──┬──┘
                   yes│  \no
                 ┌────┘   └─────┐
                 │              ▼
                 │        ┌─────────┐
                 │        │ Default  │
                 │        └─────────┘
                 ▼              ▲
           ┌─────────┐          │
           │ Branch A │──────────┘
           └─────────┘

### Architecture / component network

┌─────────────────────────────────────────────┐
│                Frontend                     │
│        ┌──────────┐     ┌──────────┐        │
│        │  UI      │◀───▶│  Store   │        │
│        └──────────┘     └──────────┘        │
└─────────────┬───────────────────────────────┘
              │ HTTPS
┌─────────────┴───────────────────────────────┐
│               Backend                       │
│     ┌──────────────┐     ┌──────────────┐   │
│     │  API Layer   │────▶│  Auth        │   │
│     └──────────────┘     └──────────────┘   │
│     ┌──────────────┐     ┌──────────────┐   │
│     │  Worker      │────▶│  Queue       │   │
│     └──────────────┘     └──────────────┘   │
└─────────────┬───────────────────────────────┘
              │
┌─────────────┴───────────────────────────────┐
│               Database                      │
│           ┌──────────┐                       │
│           │  PG      │                       │
│           └──────────┘                       │
└─────────────────────────────────────────────┘

### State machine

    ┌───────────────────────┐
    │                       ▼
┌────┐  ┌──────┐  ┌──────┐  ┌──────┐
│Init│─▶│Ready │─▶│Work  │─▶│Done  │
└────┘  └──┬───┘  └──┬───┘  └──────┘
      ┌────┘        │         ▲
      │     ┌───────┘         │
      └─────┤Fail             │
            └─────────────────┘

### Before/After (refactor)

BEFORE                  AFTER
┌──────────┐            ┌──────────┐
│ App      │            │ App      │
│  ┌────┐  │            │  ┌────┐  │
│  │Ctrl│──┼───────     │  │Ctrl│──┼──▶ Service
│  └────┘  │            │  └────┘  │
│  ┌────┐  │            │  ┌────┐  │
│  │View│──┼───────     │  │View│──┼──▶ Service
│  └────┘  │            │  └────┘  │
└──────────┘            └──────────┘

### Decision tree

        ┌─────┐
        │Start│
        └──┬──┘
           ▼
        ┌─────┐
      ┌─┤Has  ├─yes─▶ Continue
      │   │cfg  │
      │   └──┬──┘
      │    no│
    ┌─┴─────┐│
    │Load    ││
    │default ├┘
    └────┬──┘
         ▼
     ┌───────┐
     │Finish  │
     └────────┘

## Checklist

Before showing a diagram:

- [ ] Diagram type matches content shape (not just whatever looks nice)
- [ ] Glyph tier is consistent (no mixing ASCII and Unicode boxes)
- [ ] Labels are inside or directly beside what they label
- [ ] No trailing whitespace on any row
- [ ] Under fifteen nodes (or clearly split into layers)
- [ ] One-line summary accompanies the diagram (don't make the reader decode)
