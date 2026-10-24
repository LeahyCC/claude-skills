# Sources

Checked 2026-10-23. When a file changes, update its row here. Check dates live in this file only. Do not copy rules back into [SKILL.md](./SKILL.md).

## Versions

| Package | Version checked | How |
| --- | --- | --- |
| `typescript` | 7.0.2 (`latest`), 7.1.0-beta (`beta`), 6.0.3 | npm dist-tags and publish times, 2026-10-23 |
| `@typescript/typescript6` | 6.0.2 | npm |
| `typescript-eslint` | 8.72.0, supports TypeScript `>=4.8.4 <6.1.0` | npm, typescript-eslint.io dependency versions page |
| `eslint` | 10.13.0 | npm, used for the linting test |
| Node.js | 24.21.0 | Used for the type stripping test |

## By file

| Claim home | Checked against |
| --- | --- |
| [config.md](./resources/config.md) | Announcing TypeScript 6.0 (devblogs, 23 March 2026): new defaults for `strict`, `module`, `target`, `types`, `noUncheckedSideEffectImports`, `libReplacement`, `rootDir`, and `moduleResolution bundler` with `module commonjs`. `tsc --help` on 6.0.3, 7.0.2, and 7.1.0-beta: `module` default printed unset, `target` default `es2025` on 6.0.3 and 7.0.2 and `es2026` on 7.1.0-beta. TS5011 with `outDir` and sources under `src/` on 6.0.3 and 7.0.2. `using` and `Set.intersection` under `module: nodenext` and `module: node20` on 7.0.2. Compiler source for the eight `strict` flags: TypeScript 6.0.3 `commandLineParser.ts`, typescript-go 7.0.2 `declscompiler.go`. TSConfig `strict` page (updated 2026-10-05) does not list `alwaysStrict`. `tsc --init` from 7.0.2, run locally. |
| [upgrade-6-to-7.md](./resources/upgrade-6-to-7.md) | Announcing TypeScript 6.0: deprecation list, `ignoreDeprecations`, `--stableTypeOrdering` and its cost, `moduleResolution bundler` with `module commonjs`. Announcing TypeScript 7.0 (devblogs, 8 July 2026): compatibility statement and its JavaScript exceptions, `typescript/unstable` not in that post, no language service plugins, `@typescript/typescript6` and `tsc6`, code-point template inference, `no-default-lib` ignored under `skipDefaultLibCheck`. Announcing TypeScript 7.1 Beta (20 October 2026): distributive parameter error text, `typescript/sync` (and `async`, `fs`, `ast`), content mappers, `@vue/content-mapper` not on npm. npm pack of `typescript@7.0.2`: `dist/api/sync`, `async`, `fs`, `ast`. Error codes TS5102, TS5107, TS5108, TS6046, TS1540, TS2880, TS5112 on 6.0.3 or 7.0.2. |
| [narrowing.md](./resources/narrowing.md) | Handbook: Narrowing (type predicates, discriminated unions, exhaustiveness checking). TypeScript 3.7 release notes: assertion functions and the explicit-annotation rule (TS2775 confirmed by the checker). 5.4 release notes: narrowing in closures after the last assignment. 5.5 release notes: inferred type predicates. 5.6 release notes: always-truthy and nullish checks. |
| [generics.md](./resources/generics.md) | Handbook: Generics (constraints), More on Functions ("Guidelines for Writing Good Generic Functions": a function type parameter should appear twice, and an inferred return counts). 4.9 release notes: `satisfies`. 5.0 release notes: `const` type parameters and the mutable-constraint caveat. 5.4 release notes: `NoInfer`. |
| [type-level.md](./resources/type-level.md) | Handbook: Utility Types (`Omit` does not constrain its keys), Mapped Types, Conditional Types, Template Literal Types, Declaration Merging (interfaces, and namespaces with classes, functions, and enums). `StrictOmit` on a union collapses to the shared keys, local run. 7.0 announcement: code-point inference. 7.1 beta: the distributive error names the non-distributed form. TS2590 at 100,000 members and the TS 6 vs 7 emoji split, local runs on 6.0.3 and 7.0.2. |
| [domain-types.md](./resources/domain-types.md) | `lib.dom.d.ts`: `Body.json()` returns `Promise<any>`. Handbook: Everyday Types (`any`), Object Types (`readonly`). Branded types are a community pattern. On 7.0.2, `JSON.parse`, an object literal, object spread, and `Object.assign` can forge a `unique symbol` brand when the symbol is in scope. A plain string cannot. |
| [escape-hatches.md](./resources/escape-hatches.md) | TypeScript 3.9 release notes: `@ts-expect-error` and the unused-directive error (TS2578). Handbook: non-null assertion operator. typescript-eslint `ban-ts-comment` rule page: defaults in `recommended` (`allow-with-description`, minimum 3) and `strict` (minimum 10). The find command avoids GNU-only `grep --include` and `\b`, which macOS grep rejects. |
| [linting.md](./resources/linting.md) | typescript-eslint.io: dependency versions, shared configs (`recommended-type-checked` is the documented starting point, together with `stylistic-type-checked`; `strict-type-checked` is not semver-stable), typed linting and `projectService`, rule pages for preset membership (`no-unsafe-enum-assignment` is strict-only, `no-unsafe-type-assertion` is only in `all`). typescript-eslint issues #10940 and #12518. `tseslint.config()` deprecation note in typescript-eslint 8.72.0's type declarations. Announcing TypeScript 7.0: the npm alias. The flat config shape and the two-alias setup were run locally with `strictTypeChecked`. The sample in this file now starts at `recommendedTypeChecked`. |
| [node-and-emit.md](./resources/node-and-emit.md) | Node.js docs, Modules: TypeScript (nodejs.org/api/typescript.html, v26.12.1): version history (experimental warning removed in 22.18 and 24.3), unsupported syntax, `paths` ignored, extensions required, recommended tsconfig. TypeScript 5.8 release notes: `erasableSyntaxOnly`. 5.7 release notes: `rewriteRelativeImportExtensions`. 5.0 release notes: `verbatimModuleSyntax`. The enum and type-import errors were run on Node 24.21.0. |

## How the samples were checked

`node reviews/typescript-safety/checks/check-ts-snippets.mjs` compiles every `ts` block in this skill as its own module, under the baseline tsconfig block in config.md, with TS 7.0.2 and 6.0.3. FAIL samples mark the failing line with `@ts-expect-error`, so a FAIL sample that compiles is reported as TS2578.

| Check | Result |
| --- | --- |
| 54 blocks on TS 7.0.2, 53 on 6.0.3 (one block is 7-only) | Pass |
| 4 blocks skipped, each with its reason in the marker | Two need a second file, one needs `express`, one shows syntax only rejected under `erasableSyntaxOnly` |
| The checker fails on a broken PASS sample and on a FAIL sample that compiles | Confirmed on 2026-10-23, see reviews/typescript-safety/validation.md |
