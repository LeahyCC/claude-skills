---
name: prompt-rewrite
description: >
  Rewrites a thin coding prompt into a deep one before it runs: same scope,
  plus the raw material to start from, the tools an expert would use, an
  existing file to copy, and a proof a third party can check. Covers
  refactoring, performance, UI, UX, API, frontend, debugging, testing,
  security, and accessibility. Use when the user says "rewrite my prompt",
  "improve this prompt", "make this prompt better", "deeper version of this
  task", or pastes a rough task and asks for a proper prompt.
metadata:
  filePattern:
    - "**/*.prompt.md"
    - "**/prompts/**/*.md"
    - ".claude/commands/*.md"
  bashPattern: []
  priority: 30
---

# Prompt rewrite

Turn a thin prompt into one that gets expert work. **Deeper, not bigger.** The rewrite keeps the same scope. It adds what a top practitioner would start from, what they would reach for, and what proof shows the result is right.

Every line added must name a file, a tool, a number, a check, or a reason. If a line could be pasted into any prompt ("write clean, robust, best-in-class code"), delete it.

Source checks: [SOURCES.md](SOURCES.md). Test cases for this skill: [evals.md](./resources/evals.md).

## Procedure

```
draft prompt
     |
     v
1. look first -------> open the code, data, docs it points at
     |
     v
2. size it ----------> one-sentence diff?  -> short prompt
     |                 multi-file / unclear -> full prompt + plan gate
     |                 new feature, open design -> interview prompt
     v
3. ask (maybe) ------> 1 to 4 questions, only if an answer changes the prompt
     |
     v
4. four answers -----> pros do / raw material / tools / proof
     |
     v
5. fill template ----> resources/template.md
     |
     v
6. hand back --------> four answers, the prompt, how to enforce the proof
```

1. **Look first.** Read what the draft points at: the files, `package.json` scripts, the test setup, docs that govern the area. Take the package manager from the lockfile (`pnpm-lock.yaml`, `yarn.lock`, `bun.lock`, `package-lock.json`); with no lockfile, write `npm run`. Find one existing file that already does this kind of thing well; it becomes the exemplar. Never invent a path, script, or number. When something is out of reach, write a marked placeholder (`<path to the slow page>`).
2. **Size it.** Pick one shape from [template.md](./resources/template.md):
   - **Short:** the diff fits in one sentence. Return 3 to 6 lines: the change, the exemplar, the proof.
   - **Full:** multi-file, unfamiliar code, or the approach is unclear. Use the full template and add "plan first and wait for approval".
   - **Interview:** a new feature with open design questions. Return Claude Code's interview prompt seeded with what you found, ending in a SPEC.md and a fresh session to build it.
3. **Ask, maybe.** If an answer would change the prompt (the target number, what must not change, who the users are), ask 1 to 4 grounded questions with AskUserQuestion. Skip anything the repo already answers. If nothing would change, don't ask.
4. **Answer the four questions**, one or two lines each, grounded in step 1. Use the row in [lenses.md](./resources/lenses.md) as a starting point:
   - **What would top professionals do here that the draft does not ask for?**
   - **What is the rawest material they would start from**, instead of what has already been digested (a summary, a score, "users say")?
   - **What specific method and tools would they use?** Name them.
   - **What, other than the model or the user, would show the result is right?** That is the proof.
5. **Fill the template.** Raw material goes above the task. The method is a toolbox, not a recipe: name the tools and evidence, let the model choose the order. Use ordered steps only when order is the point (a migration, a database change, a repro before a fix).
6. **Hand back**, in this order, then stop:
   - the four answers, short
   - the rewritten prompt in one code block, ready to paste
   - how to enforce the proof if the run will be long or unattended: put it in the prompt, set it as a `/goal` condition, or make it a Stop hook
   - a suggested effort level only if it is not the default (`high` for multi-file or unclear work)

Offer to run it. Do not run the task unless asked.

Worked rewrites: [examples.md](./resources/examples.md).

## Rules for the rewrite

| Do | Do not |
| --- | --- |
| Name the proof as a command, number, or pass/fail, and ask for its output as evidence | "Double-check your work" (adds cost on models that already self-check, and proves nothing) |
| Make sure the proof can fail: new tests fail before the change, numbers beat run-to-run noise, the check hits the real thing | A proof a stub, mock, or lucky run would pass anyway |
| Give the reason behind a constraint | Bare "NEVER" rules; absolute words are for true invariants only |
| Name the tools and the evidence available | A fixed step list the model must follow (current models plan better than a prescribed order) |
| Point at one exemplar file to follow | Describe a pattern the repo already shows |
| Say "change the code" when edits are wanted | "Suggest improvements" when you want edits |
| Keep scope; list non-goals; bugs found along the way go in a follow-up list | Quietly widen the task |
| If the request looks mistaken, say so in a sentence and carry on as asked | Stop and wait over a disagreement the user can see in the summary |
| Stop and report when a test itself looks wrong | Bend code, or the test, until it passes |
| Ask for a general fix, not one tuned to the test inputs | Accept hard-coded values that pass the suite |
| New tests only where the repo keeps them for this kind of change | Add test files the task did not ask for; scratch checks need not be kept |
| For audits and reviews: report every finding, filter in a second pass | Ask it to report only the important ones (it filters too early and drops real findings) |
| Wrap each pasted log, ticket, or trace in its own open and close tag | Paste raw blocks inline with instructions |

For long unattended runs, add one line: a fresh subagent reviews the diff against the proof and reports gaps that affect correctness only.

## Review checklist

- [ ] Same scope as the draft; anything wider is a non-goal or a follow-up
- [ ] Shape matches size: short prompt for a one-sentence diff, plan gate for multi-file work
- [ ] Every path, script, and tool was seen in the repo or is a marked placeholder
- [ ] Raw material is raw (trace, log, code, data, recording), not a summary, and an exemplar file is named
- [ ] The proof is something a third party could run, with a number or a pass/fail
- [ ] The proof can fail: if a stub, mock, or missing tool would let it pass regardless, the prompt says so
- [ ] No constraint fights the task, and no two instructions contradict each other
- [ ] No filler adjectives without a check behind them
- [ ] Length follows the material: a short draft rarely needs more than 35 lines, but a full spec can run longer
