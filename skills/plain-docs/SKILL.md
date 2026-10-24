---
name: plain-docs
description: Use when writing or fixing documentation: README files, guides, how-tos, API references, concept pages, and ADRs. Cuts docs to what the reader needs, puts a picture before detail, and uses plain words. Two modes: write a new doc in a fixed 5 layer shape, or trim an existing doc and report what was cut.
---

# Plain Docs

Docs fail two ways: too much in them, and too dry to read. Fix both before writing a word.

```
Ponytail   -> what to cut     does this section need to exist?
Humanizer  -> how it sounds   does this sentence sound like AI wrote it?
Shape      -> where it goes   5 layers, same order, every doc
```

Sources checked: [SOURCES.md](SOURCES.md)

## The shape

Every doc, every type, same order. Only layer 3 changes by type.

```
1 FOUNDATION   Why this exists, what problem it solves. 1 to 2 lines.
2 PICTURE      Diagram or mental model. Before any detail.
3 SUBSTANCE    What the reader came for. Working example first.
4 EDGES        Limits, gotchas, when not to use it.
5 DETAIL       Deep detail, at the end or linked. Reader pulls it.
      |
   most docs stop at 3 or 4
```

Layer rules:

- No layer repeats the one above it.
- No jargon in layers 1 to 2. Name things the way a new reader would.
- Layer 5 never holds a step needed to finish layer 3.
- If a layer would be empty, drop it. Do not pad it.

Per type table and a skeleton to copy: [page-shape.md](./resources/page-shape.md)

## Mode 1: write

1. Say who the reader is and what they will do after reading. One line. If you cannot, ask.
2. Run the cut ladder below on the outline, before drafting.
3. Draft layer 3 first: the example or steps the reader came for. Build out from it.
4. Add layers 1, 2, 4 in that order. Add 5 only if someone will ask for it.
5. Run the sound list. Read it aloud. Ship.

## Mode 2: trim

Point it at a file. It changes prose only. Code, links, headings it must keep, and facts stay as they are.

1. Cut ladder first: whole sections go before sentences get polished.
2. Sound list second: fix the tells that are left.
3. Report at the end: what was cut, what was moved to layer 5, word count before and after.

Never invent a fact to fill a gap. Cut the sentence, or leave it marked `<needs: ...>`.

## The cut ladder

Before writing or keeping a section, stop at the first rung that holds:

```
1  Does it need to exist at all?
2  Already said somewhere else?      -> link, do not repeat
3  Can a picture say it?             -> draw it, drop the prose
4  Can an example say it?            -> show it, drop the explanation
5  Can it be one line?               -> one line
6  Only then write it, as short as works.
```

Never cut:

- A step the reader must follow to finish the task
- A warning that stops lost work, lost data, or harm
- The one working example

Full worked cuts: [cut-and-sound.md](./resources/cut-and-sound.md)

## The sound list

Fix on sight. Short version; before and after pairs are in [cut-and-sound.md](./resources/cut-and-sound.md).

| Tell | Fix |
| --- | --- |
| Inflated importance: "plays a crucial role in modern workflows" | State the fact, drop the importance |
| AI words: delve, leverage, seamless, robust, comprehensive, streamline | Plain word: use, look at, works with |
| Not X but Y: "It is not just a tool, it is a platform" | Say what it is |
| Staged run up: "Let's dive in", "In this section we will explore" | Start with the point |
| One line closers: "And that is the real win." | Cut. End on the last fact |
| Sales talk: "powerful, effortless, cutting edge" | Say what it does, with a number if you have one |
| Borrowed authority: "experts recommend", "studies show" | Name the source or cut the claim |
| Bold as decoration, forced lists of three | Bold only what the reader must find fast. Use the number of items the meaning needs |
| Writing about the doc: "This page covers..." after the heading | Let the heading do that job |
| Re-explaining what the reader just read | Cut the summary. Trust the section above it |
| Avoiding plain verbs: "serves as", "features", "boasts" | "is", "has" |
| Chat leftovers: "Great question!", "I hope this helps" | Cut |

Weak alone, fix in groups: em dashes as every join, stacked qualifiers ("could potentially possibly"), hyphen pairs everywhere. One is a style choice. Five on a page is a tell.

## Rules that do not bend

- Give less. If a reply or doc runs past one screen, cut it. Do not reorganise it.
- Draw it. A small diagram beats a paragraph. ASCII is fine.
- Plain words. No jargon the reader has not used first or that the doc has not explained.
- Let the reader pull. Stop at the layer they need. Detail waits at layer 5, it is not pushed at them.
- One thing, one name. Same concept, same word, every page.
- Short lines. One idea per sentence. If a sentence needs a comma twice, split it.

## Review checklist

- [ ] Layers in order, none repeating the one above
- [ ] Picture sits before detail, not after it
- [ ] Layer 3 opens with a working example or the first step, not background
- [ ] Cut ladder run on the outline, not just on sentences
- [ ] No tell from the sound list left standing
- [ ] No fact added that the source did not have
- [ ] Code, links, and link targets untouched in trim mode
- [ ] Reads aloud like a person explaining it
- [ ] Trim report given: cut, moved, word count before and after

One full doc cut down end to end: [examples.md](./resources/examples.md)
