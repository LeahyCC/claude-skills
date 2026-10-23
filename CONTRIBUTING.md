# Contributing to claude-skills

We welcome contributions! This repo prioritizes **depth over breadth** — every skill must be the definitive reference for its domain.

## Our Quality Bar

Before submitting a skill, it must meet ALL of these criteria:

- [ ] **Cites an official specification or authoritative source** — not blog posts or opinions
- [ ] **Complete coverage** of the domain (no "covers the basics" — cover everything or scope explicitly)
- [ ] **Production code examples** — real React/Next.js/Tailwind/Node.js patterns, not toy snippets
- [ ] **Zero installed dependencies.** Markdown, plus optional scripts in `scripts/` that use only Node built-ins.
- [ ] **A description that triggers.** The SKILL.md `description` says what the skill does, then when to use it, in under 1024 characters. It is the only field Claude reads to decide whether to load the skill.
- [ ] **Verified numbers** — every count in the README matches actual content (we check)
- [ ] **Tested.** `npx skills add` installs it, `claude plugin validate .` passes, and its test prompts are written in `reviews/<skill>/tasks.md`.

## How to Propose a New Skill

1. **Open a GitHub Issue** using the "Skill Proposal" label
2. Include:
   - Skill name and one-line description
   - What official spec/source it would be verified against
   - Rough scope (how many criteria/rules/patterns)
   - Why existing skills in the ecosystem are insufficient
3. Wait for approval before writing code — we may suggest scope changes

## Skill Structure

```
skills/
  your-skill-name/
    SKILL.md              # Required — main skill file with frontmatter
    README.md             # Required — install instructions, coverage summary
    resources/            # Optional — deep-dive sub-topics
      topic-a.md
      topic-b.md
    scripts/              # Optional. Node built-ins only, run by Claude for exact work such as layout maths.
```

### SKILL.md Frontmatter

```yaml
---
name: your-skill-name
description: >
  Does X and Y for Z. Use when the code or request involves A, B, or C.
  Not for D (see other-skill).
---
```

Use only `name` and `description`. Claude Code and the skills CLI do not act on keys under `metadata`, so file and command trigger patterns there do not trigger anything.

### Writing Guidelines

- **Lead with a decision matrix or quick reference table** — users scan, they don't read top-to-bottom
- **Use real component code**, not pseudocode — show exact `className`, exact props, exact patterns
- **Include FAIL and PASS examples side by side** — the contrast teaches faster than explanation
- **Link to official spec** for every section — let users verify your claims
- **Keep resource files focused.** One concern per file. Give any file over 100 lines a contents list under its title.
- **Keep dates in SOURCES.md.** Resources state facts. When each fact was checked lives in the skill's SOURCES.md.

## Submitting a PR

1. Fork the repo
2. Create a feature branch: `git checkout -b skill/your-skill-name`
3. Add your skill under `skills/your-skill-name/`
4. Update the root `README.md` skills catalog table
5. Add an entry to `.claude-plugin/marketplace.json` with `"source": "./skills/your-skill-name"`, then run `claude plugin validate .`
6. Verify: `npx skills add LeahyCC/claude-skills@your-skill-name` works
7. Write the skill's test prompts in `reviews/your-skill-name/tasks.md`
8. Open a PR with:
   - Skill name and description
   - What spec/source it's verified against
   - Coverage summary (X of Y criteria/rules)
   - Confirmation that all numbers match actual content

## Code of Conduct

Be constructive. We review skills rigorously because our users trust our quality bar. A rejection isn't personal — it means the skill needs more work before it meets the standard.

## Questions?

Open a Discussion thread — we're happy to help scope and plan new skills before you invest time writing.
