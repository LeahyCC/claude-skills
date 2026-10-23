# prompt-rewrite

Turns a thin prompt into a deep one. Same scope, but it names the raw material to start from, the tools a top practitioner would use, an existing file to copy, and a proof a third party can check.

## Install

```bash
npx skills add LeahyCC/claude-skills@prompt-rewrite
```

## What it does

Ask "rewrite this prompt" and paste the draft. It reads the code the prompt points at, sizes the task (short prompt, full prompt with a plan step, or an interview for a new feature), asks a few questions only if the answers would change the prompt, then answers four questions:

1. What would top professionals do here that the draft does not ask for?
2. What is the rawest material they would start from?
3. What method and tools would they use?
4. What, other than the model or you, would show the result is right?

It hands back those answers, the rewritten prompt ready to paste, and how to enforce the proof (in the prompt, as a `/goal`, or as a Stop hook). It does not run the task unless asked.

Version 0.1.0.

## Coverage

| Resource | Topics |
| --- | --- |
| [lenses.md](./resources/lenses.md) | The four answers for 10 kinds of task: refactoring, performance, UI, UX, API, frontend, debugging, testing, security, accessibility |
| [template.md](./resources/template.md) | Short, full, and interview shapes; how to enforce the proof; why each section is there |
| [examples.md](./resources/examples.md) | Four rewrites: a short one, performance, refactoring, UX |
| [evals.md](./resources/evals.md) | Three test cases for changing this skill, with pass checks |

4 resource files.

## What's different

| Typical prompt improver | This skill |
| --- | --- |
| Makes the prompt longer | Keeps the scope; every added line names a file, tool, number, check, or reason |
| "You are a world-class engineer" | Names the method and tools instead |
| "Double-check your work" | A proof with a command, a pass/fail, and the output as evidence |
| Same long template for every task | Short prompt for a one-line change, plan gate for big ones |
| Spells out every step | Names the tools and lets the model plan |
| Invents paths and numbers | Reads the repo first, marks anything unknown as a placeholder |

Checked sources are in [SOURCES.md](./SOURCES.md).

## License

[MIT](../../LICENSE)
