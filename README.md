<h1 align="center">claude-skills</h1>

<p align="center">
  Claude Code skills checked against the spec for each domain.
</p>

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" /></a>
  <a href="https://github.com/LeahyCC/claude-skills/stargazers"><img src="https://img.shields.io/github/stars/LeahyCC/claude-skills?style=flat" alt="Stars" /></a>
  <a href="https://github.com/LeahyCC/claude-skills/network/members"><img src="https://img.shields.io/github/forks/LeahyCC/claude-skills?style=flat" alt="Forks" /></a>
  <a href="https://github.com/LeahyCC/claude-skills/commits/main"><img src="https://img.shields.io/github/last-commit/LeahyCC/claude-skills" alt="Last Commit" /></a>
</p>

---

## Install

```bash
npx skills add LeahyCC/claude-skills@<skill>
```

`<skill>` is a name from the table. For example:

```bash
npx skills add LeahyCC/claude-skills@wcag-accessibility
```

### Slash commands

Copy the file into the project's `.claude/commands/` directory:

```bash
mkdir -p .claude/commands
curl -sL https://raw.githubusercontent.com/LeahyCC/claude-skills/main/.claude/commands/code-review.md \
  -o .claude/commands/code-review.md
```

Then `/code-review` works in that project.

## Skills

Each skill has its own page: install, what it covers, and the source it was checked against.

| Skill | What it does |
| --- | --- |
| [wcag-accessibility](./skills/wcag-accessibility/) | WCAG 2.2 Level AA, with React, Next.js, and Tailwind examples |
| [react-performance](./skills/react-performance/) | Measure before you optimize. Profiling, rendering, bundles, Web Vitals, React Compiler |
| [seo](./skills/seo/) | Search and AI-search setup for Next.js: metadata, sitemaps, JSON-LD, llms.txt |
| [ux-copy](./skills/ux-copy/) | UI text: buttons, errors, empty states, confirmations, tone |
| [api-security](./skills/api-security/) | OWASP API Top 10 (2023) and Web Top 10 (2021) for Next.js APIs |
| [product-marketing](./skills/product-marketing/) | Positioning, discovery, go-to-market, prioritization, metrics, and copy |
| [nextjs-app-router](./skills/nextjs-app-router/) | Next.js 16 App Router: Server Components, caching, routing, proxy, migration |
| typescript-strict | Planned. TypeScript handbook |

## Commands

| Command | What it does |
| --- | --- |
| [/code-review](./.claude/commands/code-review.md) | Review the diff against OWASP, rate the risk, and suggest a fix |

## What's different

- Claims point at a file or a spec, so you can check them.
- Skills are markdown. No Python runtime, no packages, no install scripts.
- Examples are React, Next.js, and Tailwind you can paste. Failing code sits next to the fix.

## Contributing

The bar is in [CONTRIBUTING.md](./CONTRIBUTING.md): cite the spec, cover the domain, include production examples.

1. Open an issue with the proposal.
2. Agree the scope.
3. Add `skills/<name>/` with `SKILL.md`, `README.md`, and any `resources/`.
4. Open a PR. Add a row to the table above.

[Open a discussion](https://github.com/LeahyCC/claude-skills/discussions) or [create an issue](https://github.com/LeahyCC/claude-skills/issues/new).

## License

[MIT](./LICENSE)
