# Contributing to claude-skills

We welcome contributions! This repo prioritizes **depth over breadth** — every skill must be the definitive reference for its domain.

## Our Quality Bar

Before submitting a skill, it must meet ALL of these criteria:

- [ ] **Cites an official specification or authoritative source** — not blog posts or opinions
- [ ] **Complete coverage** of the domain (no "covers the basics" — cover everything or scope explicitly)
- [ ] **Production code examples** — real React/Next.js/Tailwind/Node.js patterns, not toy snippets
- [ ] **Zero runtime dependencies** — pure markdown, works in any Claude Code environment
- [ ] **Auto-trigger patterns** in SKILL.md frontmatter (`filePattern` and/or `bashPattern`)
- [ ] **Verified numbers** — every count in the README matches actual content (we check)
- [ ] **Tested** — install path verified with `npx skills add`

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
```

### SKILL.md Frontmatter

```yaml
---
name: your-skill-name
description: One-line description used for search and auto-activation matching
metadata:
  filePattern:
    - "src/components/**/*.tsx"    # Glob patterns that auto-trigger this skill
  bashPattern:
    - "some-cli-tool"              # Bash commands that auto-trigger this skill
  priority: 50                     # 0-100, higher = injected first when multiple match
---
```

### Writing Guidelines

- **Lead with a decision matrix or quick reference table** — users scan, they don't read top-to-bottom
- **Use real component code**, not pseudocode — show exact `className`, exact props, exact patterns
- **Include FAIL and PASS examples side by side** — the contrast teaches faster than explanation
- **Link to official spec** for every section — let users verify your claims
- **Keep resource files focused** — one concern per file, 200-400 lines each

## Submitting a PR

1. Fork the repo
2. Create a feature branch: `git checkout -b skill/your-skill-name`
3. Add your skill under `skills/your-skill-name/`
4. Update the root `README.md` skills catalog table
5. Update `.claude-plugin/plugin.json` and `marketplace.json`
6. Verify: `npx skills add LeahyCC/claude-skills@your-skill-name` works
7. Open a PR with:
   - Skill name and description
   - What spec/source it's verified against
   - Coverage summary (X of Y criteria/rules)
   - Confirmation that all numbers match actual content

## Code of Conduct

Be constructive. We review skills rigorously because our users trust our quality bar. A rejection isn't personal — it means the skill needs more work before it meets the standard.

## Questions?

Open a Discussion thread — we're happy to help scope and plan new skills before you invest time writing.
