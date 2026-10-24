# Page shape

Same 5 layers, every doc. What goes in each layer changes by type. Length is a guide: past the limit, run trim mode before adding more.

## The layers

```
1 FOUNDATION   Why. The problem, in the reader's words. No solution yet.
2 PICTURE      The shape of the thing. Diagram, flow, or before/after.
3 SUBSTANCE    The work. Example first, then the steps or facts.
4 EDGES        Where it breaks, what it cannot do, when to pick something else.
5 DETAIL       Reference, deep reasons, history. Linked or last. Optional.
```

## By type

| Type | 1 Foundation | 2 Picture | 3 Substance | 4 Edges | 5 Detail | Trim past |
| --- | --- | --- | --- | --- | --- | --- |
| README | What this is, who it is for. 2 lines max | One diagram or screenshot of the thing working | Install, run, first working example | Common first run failures | Full config, API, contributing | 300 lines |
| Guide / how-to | The job the reader will finish | Flow of the job, start to done | Numbered steps, each one checkable | Where each step can fail | Why it works this way | 200 lines |
| API reference | What this endpoint or function is for, one line per entry | Request to response flow, once per API | One full request and response that works | Error codes, limits, rate caps | Every field, every option | 1 entry per screen |
| Concept page | The problem this idea solves | The mental model, drawn | A small worked example using the idea | What it is not, common wrong turns | Formal definition, history | 150 lines |
| ADR | The choice faced, and what forced it | Options side by side, short table | The choice, and the reason in plain words | What the choice costs, when to revisit | Full debate, links to issues | 100 lines |

Notes:

- API reference is the one type where layer 5 is the point. Keep layers 1 to 3 to one screen, then let the reference run.
- An ADR with no layer 4 is not finished. A choice with no cost listed was not a choice.
- A README layer 3 that needs layer 5 to work is broken. Move the missing step up.

## Skeleton

Copy this, fill it, delete what stays empty.

```markdown
# <Name>

<Why this exists. What problem. 1 to 2 lines, no jargon.>

<Picture: diagram, flow, or before/after.>

## <Do it / Use it / The entries>

<Working example first. Then steps or facts.>

## <Limits / When it breaks>        (drop if nothing real to say)

<Edges.>

## <Detail / Reference>             (drop unless someone will ask)

<Deep detail, or links to it.>
```

Heading names: name what the section holds, in sentence case. "Install", not "Getting Started With Installation". No emoji, no arrows in headings.

## Picture first aid

If you cannot draw it, that is a signal the shape is not clear yet. Three cheap pictures cover most docs:

```
Flow        A -> B -> C            how a thing moves
Parts       [ A ] [ B ]            what it is made of, one line each
Before/after   was X, now Y        what changed
```

Draw the smallest one that holds. A wrong small picture gets corrected. A missing picture gets a long paragraph instead.
