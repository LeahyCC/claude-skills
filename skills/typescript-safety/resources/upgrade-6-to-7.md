# Upgrading to TS 6 and 7

TS 6.0 (March 2026) is the last compiler written in TypeScript. TS 7.0 (July 2026) is the Go compiler, installed as plain `typescript`. Code that compiles cleanly on 6.0, with no `ignoreDeprecations` and with `stableTypeOrdering` on, should type-check the same on 7.0. The 7.0 announcement lists the exceptions: template literal inference (below), and in `.js` files a value is not a type, `@enum` and `@class` are dropped, a bare `?` is dropped, postfix `!` is dropped, and Closure `function()` types are dropped. So the upgrade is two steps, and the work is all in the first.

Sources are in [SOURCES.md](../SOURCES.md).

## Contents

- The path
- Removed options
- Removed syntax
- Type changes
- What 7.0 does not do yet
- Checklist

## The path

Order matters here. Each step relies on the one before.

```
5.x ──> 6.0 with deprecation errors ──> 6.0 clean ──> 6.0 + stableTypeOrdering clean ──> 7.0
         fix each, do not silence         no ignoreDeprecations                           tsc
```

1. Install `typescript@6`. Set `target`, `module`, and `types` explicitly, because 6.0 changed all three defaults (see [config.md](./config.md)).
2. Run `tsc`. Fix every deprecation error with the table below. The experimental `@andrewbranch/ts5to6` codemod (`npx @andrewbranch/ts5to6 --fixBaseUrl .` and `--fixRootDir .`) can adjust `baseUrl` and `rootDir` across a codebase. `"ignoreDeprecations": "6.0"` silences deprecations on 6.0, but it is a way to ship 6.0 today, not a fix: TS 7 accepts the setting and brings none of the removed options back.
3. Run once with `--stableTypeOrdering`. It makes 6.0 order union members and properties the way 7.0's deterministic parallel checker does, so errors or `.d.ts` diffs that depend on declaration order show up now. If `--stableTypeOrdering` surfaces an inference error, add an explicit type argument (`someFunc<ExplicitType>(...)`) or variable type annotation. It can slow checking by up to 25%, so do not leave it on.
4. Install `typescript@7` and run `tsc`. Keep TS 6 for tools that need the compiler API, such as typescript-eslint (see [linting.md](./linting.md)).

## Removed options

Each of these is an error on TS 7, with TS5102 (option removed) or TS5108 (value removed). `module: none` gives TS6046 instead.

| Option | Use instead |
| --- | --- |
| `target: es5` | `es2015` or later. On 7.0, `es5` is TS5108 and `es3` is TS6046 (not a known value). Transpile further with another tool if you must. |
| `downlevelIteration` | Delete. It only affected ES5 output. |
| `moduleResolution: node` (or `node10`) | `bundler`, and keep `module: commonjs` if that is what you emit. `nodenext` when the code runs on Node. See [config.md](./config.md). |
| `moduleResolution: classic` | Same as above |
| `baseUrl` | `paths` with relative targets, e.g. `"paths": { "@/*": ["./src/*"] }` |
| `module: amd`, `umd`, `systemjs`, `none` | `esnext` or `preserve`, with a bundler for those formats |
| `outFile` | A bundler |
| `esModuleInterop: false`, `allowSyntheticDefaultImports: false` | Delete. Both are always on. |
| `alwaysStrict: false` | Delete. Output is always strict mode. |

`baseUrl` was also how many projects made `paths` resolve. When removing it, make every `paths` target start with `./`.

## Removed syntax

| Old | New | Error |
| --- | --- | --- |
| `module Foo { }` for a namespace | `namespace Foo { }`. Quoted `declare module 'pkg'` is unchanged. | TS1540 |
| `import x from './x.json' assert { type: 'json' }` | `with { type: 'json' }` | TS2880 |
| `import('./x.json', { assert: { type: 'json' } })` | `{ with: { type: 'json' } }` | |
| `/// <reference no-default-lib="true" />` | Delete it, or use `--noLib` or `--libReplacement` instead. Ignored in 6.0 and 7.0. | |
| `/// <amd-module name="..." />` | Delete it. AMD output is gone. | |
| `tsc file.ts` with a `tsconfig.json` in the folder | `tsc -p .`, or `tsc --ignoreConfig file.ts` | TS5112 |

The `module` keyword fix can be done by search and replace on unquoted names: `module Foo {` becomes `namespace Foo {`.

## Type changes

| Version | Change | Who it hits |
| --- | --- | --- |
| 6.0 | Union member order follows 7.0 rules when `stableTypeOrdering` is on | Code whose errors or overloads depended on order. Fix with an explicit type argument (`fn<T>()`) or variable annotation. |
| 6.0 | Functions and object-literal methods that never read `this` are no longer contextually sensitive | Generic calls with method syntax now infer type parameters regardless of property order (see [generics.md](./generics.md)) |
| 6.0 | Stricter checks on function expressions passed to generic calls | Callback-heavy generic APIs |
| 7.0 | Template literal `infer` splits by Unicode code point, not by UTF-16 unit | Type-level string helpers. Example in [type-level.md](./type-level.md). |
| 7.1 (beta) | A type that matches only the original type parameter is rejected once that parameter has been distributed. The error says it is only assignable to the non-distributed form. | Libraries with many conditional types |

## What 7.0 does not do yet

| Gap | Workaround |
| --- | --- |
| `import 'typescript'` is only the version file. 7.0.2 ships `typescript/unstable/sync`, `async`, `fs`, and `ast`. The 7.1 beta moves those to `typescript/sync` and the same siblings. | Tools that still `import 'typescript'` (typescript-eslint 8.72) need TS 6 through `@typescript/typescript6` |
| No language service plugins. The 7.1 beta adds content mappers (`contentMappers` in tsconfig, and `tsc --runExternalCode`) for Vue, Svelte, Astro, and MDX. The beta post's sample `@vue/content-mapper` was not on npm. Angular is not in that list. | Keep TS 6 in the editor until the framework package you use ships a mapper |

`tsc` on 7.0 still writes `.js`, `.d.ts`, and source maps. Checked on 7.0.2 with `module: nodenext` and `declaration: true`.

## Checklist

- [ ] `target`, `module`, and `types` are set, not left to defaults
- [ ] TS 6.0 builds with no `ignoreDeprecations`
- [ ] One run with `--stableTypeOrdering` is clean
- [ ] No removed option or syntax remains
- [ ] Tools that need the API (linters, framework checkers) run on TS 6, and `tsc` runs 7
