# Template

Three shapes. Pick by size, not by how important the task feels.

| Shape | Use when | Length |
| --- | --- | --- |
| [Short](#short) | The diff fits in one sentence | 3 to 6 lines |
| [Full](#full) | Multi-file, unfamiliar code, or the approach is unclear | 15 to 35 lines, more if the raw material is long |
| [Interview](#interview) | A new feature with open design questions | The interview prompt plus what you found |

## Short

```text
<the change, in one sentence, naming the file>
Follow <exemplar file> for the pattern.
Proof: run <command> and show the output.
```

## Full

XML tags keep context, inputs, and instructions apart. Long inputs go at the top, the ask comes after them.

```xml
<context>
What this is, who uses it, and why the task matters now. One to three lines.
</context>

<raw_material>
Read these before planning:
- <files, with paths>
- Exemplar to follow: <an existing file that already does this well>
- <command that produces fresh evidence: a trace, a test run, a request log>
<pasted_log>
<each pasted block in its own tag>
</pasted_log>
Quote the parts that matter before acting on them.
</raw_material>

<task>
The one outcome. Same scope as the original ask.
Plan first and wait for my approval before editing.   <- multi-file or unclear only
</task>

<tools>
Available and useful here: <named tools, scripts, devtools, skills>.
Evidence to gather before changing code: <what to look at first>.
Choose the order yourself. <Ordered steps only when order is the point.>
</tools>

<proof>
- <command> passes, unchanged from before
- <metric> goes from <baseline> to <target>, measured the same way both times
- <third-party check: axe, contract test, screenshot diff, user task>
Show the command output as evidence, not a statement that it passed.
</proof>

<constraints>
- Do not change: <public API, file, behaviour>, because <reason>
- Non-goals: <out of scope>. Note bugs you find along the way as follow-ups; do not fix them here.
- Write a general fix, not one tuned to the test inputs. If a test looks wrong, stop and say so.
- If the request itself looks mistaken, say so in a sentence and continue as asked.
</constraints>

<output>
<what to hand back: diff, before and after table, follow-ups, open questions>
</output>
```

## Interview

From Claude Code's best practices. Seed it with what step 1 found so the questions start from the real code.

```text
I want to build <one-line feature>. Relevant code: <paths found>. Exemplar: <file>.
Interview me in detail using the AskUserQuestion tool.
Ask about technical implementation, UI/UX, edge cases, concerns, and tradeoffs.
Don't ask obvious questions, dig into the hard parts I might not have considered.
Keep interviewing until we've covered everything, then write a complete spec to SPEC.md.
The spec must name the files and interfaces, state what is out of scope, and end with an end-to-end proof.
```

Then run SPEC.md in a fresh session.

## Enforcing the proof

| How long the run is | Put the proof here |
| --- | --- |
| One prompt, you are watching | In the `<proof>` block, as above |
| A whole session | A `/goal` condition: an evaluator re-checks it after every turn |
| Unattended, must not finish failing | A Stop hook that runs the check and blocks the turn from ending |
| Long run, high stakes | Also a fresh subagent reviewing the diff for correctness gaps only |

## Why each section

| Section | Why it is there |
| --- | --- |
| `context` | The model generalises from a reason. "Read aloud by TTS, so no ellipses" works better than "no ellipses". |
| `raw_material` | Expert work starts from primary evidence. Long inputs above the ask improve results. Quoting first keeps it on the relevant parts. An exemplar file beats a description of a pattern. |
| `task` | One outcome stops scope creep. The plan gate is for work where a wrong approach is expensive. |
| `tools` | Naming tools gets them used. A toolbox, not a recipe: current models plan better than a fixed order. |
| `proof` | A check that does not depend on the model or the user saying "looks good". Evidence is faster to review than re-running it. |
| `constraints` | Non-goals, follow-ups, and "general fix" guard against overbuilding and test gaming. |
| `output` | Says what finished looks like. |
