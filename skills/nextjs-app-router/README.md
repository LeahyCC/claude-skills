# nextjs-app-router

Version-aware guidance for building, reviewing and migrating App Router applications: component boundaries, data/mutations, caching, routing, proxy, error recovery, metadata and assets. Primarily Next.js 16, with explicit Next.js 15 migration paths and feature/version prerequisites.

## Install and use

```bash
npx skills add LeahyCC/claude-skills@nextjs-app-router
```

This existing repository install command is retained; this pilot does not install into your agent directories. In Claude Code, ask for an App Router task or invoke `/nextjs-app-router` after installation (plugin distributions may namespace the command).

Claude uses the description to decide relevance. Editing `app/**` or running `next build` does not itself guarantee activation. Existing `metadata.filePattern`, `metadata.bashPattern` and `metadata.priority` are retained as custom data for external tooling; Claude Code does not act on that metadata. No executable consumer of those patterns was found in this repo. Claude Code's top-level `paths` is a separate, optional host extension, not the same field.

The skill keeps standard name/description and existing metadata for portability. It adds no Claude-only invocation control, hooks or dynamic shell execution. Other Agent Skills hosts choose their own loading/invocation rules.

## Coverage and decisions

[SKILL.md](SKILL.md) routes to the ten focused resources in `resources/`. It starts by identifying installed versions, router, cache mode and runtime. It preserves valid browser polling, existing cache modes and incremental migration, and distinguishes correctness from optional optimization.

Private/remote caching requires supported Cache Components configuration; these are not universal personal-data defaults. Error recovery props vary by minor. Newest docs are not proof that an older project supports an API. Examples explicitly identify application-owned DB/auth/signature dependencies.

See [SOURCES.md](SOURCES.md) for scoped references, software/configuration applicability, upstream update dates, actual review dates and freshness policy. Checked sections were reviewed on **2026-10-21**, not blanket-certified. Technical examples and behavioral evaluation evidence are documented in the repository's [pilot records](../../reviews/nextjs-app-router-pilot/).

## License

[MIT](../../LICENSE)
