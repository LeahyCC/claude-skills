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
| [config.md](./resources/config.md) | Announcing TypeScript 6.0 (devblogs, 23 March 2026) and the 6.0 release notes: new defaults for `strict`, `module`, `target`, `types`, `noUncheckedSideEffectImports`, `libReplacement`, `rootDir`. TSConfig reference: what `strict` enables, each flag's meaning. Announcing TypeScript 5.9: the stricter `tsc --init`. `tsc --init` output from 7.0.2, run locally. Modules reference (handbook/modules/reference): `nodenext`, `node20`, `preserve`, `bundler`. |
| [upgrade-6-to-7.md](./resources/upgrade-6-to-7.md) | Announcing TypeScript 6.0: deprecation list, `ignoreDeprecations`, `--stableTypeOrdering` and its cost. Announcing TypeScript 7.0 (devblogs, 8 July 2026): compatibility statement, no API, no language service plugins, frameworks that need 6.0, `@typescript/typescript6` and `tsc6`, code-point template inference. Announcing TypeScript 7.1 Beta (20 October 2026): stricter distributive type parameters, API in beta. Error codes TS5102, TS5108, TS1540, TS2880, TS5112 and `ignoreDeprecations` being accepted but inert on 7.0.2, all from local runs. JS and `.d.ts` output on 7.0.2, local run. |
| [narrowing.md](./resources/narrowing.md) | Handbook: Narrowing (type predicates, discriminated unions, exhaustiveness checking). TypeScript 3.7 release notes: assertion functions and the explicit-annotation rule (TS2775 confirmed by the checker). 5.4 release notes: narrowing in closures after the last assignment. 5.5 release notes: inferred type predicates. 5.6 release notes: always-truthy and nullish checks. |
| [generics.md](./resources/generics.md) | Handbook: Generics (constraints), More on Functions ("Guidelines for Writing Good Generic Functions", type parameters should appear twice). 4.9 release notes: `satisfies`. 5.0 release notes: `const` type parameters and the mutable-constraint caveat. 5.4 release notes: `NoInfer`. |
| [type-level.md](./resources/type-level.md) | Handbook: Utility Types, Mapped Types (key remapping via `as`), Conditional Types (distributive conditional types), Template Literal Types, Declaration Merging (module augmentation, global augmentation). 7.0 announcement: code-point inference. 7.1 beta: distributive type parameters. TS2590 at 100,000 members and the TS 6 vs 7 emoji split, local runs on 6.0.3 and 7.0.2. |
| [domain-types.md](./resources/domain-types.md) | `lib.dom.d.ts`: `Body.json()` returns `Promise<any>`. Handbook: Everyday Types (`any`), Object Types (`readonly`). Branded types are a community pattern, not an official feature; the `unique symbol` form uses the 2.7 `unique symbol` type. |
| [escape-hatches.md](./resources/escape-hatches.md) | TypeScript 3.9 release notes: `@ts-expect-error` and the unused-directive error (TS2578). Handbook: non-null assertion operator. typescript-eslint `ban-ts-comment` rule page: defaults in `recommended` (`allow-with-description`, minimum 3) and `strict` (minimum 10). |
| [linting.md](./resources/linting.md) | typescript-eslint.io: dependency versions, shared configs (`recommended-type-checked`, `strict-type-checked` not semver-stable, `stylistic-type-checked`), typed linting and `projectService`, rule pages for preset membership. typescript-eslint issues #10940 (TS 7 tracking) and #12518. `tseslint.config()` deprecation note in typescript-eslint 8.72.0's type declarations. Announcing TypeScript 7.0: the npm alias for typescript-eslint. The full flat config and the two-alias setup were run locally. |
| [node-and-emit.md](./resources/node-and-emit.md) | Node.js docs, Modules: TypeScript (nodejs.org/api/typescript.html): version history, unsupported syntax, `paths` ignored, extensions required, recommended tsconfig. TypeScript 5.8 release notes: `erasableSyntaxOnly`. 5.7 release notes: `rewriteRelativeImportExtensions`. 5.0 release notes: `verbatimModuleSyntax`. The enum and type-import errors were run on Node 24.21.0. |

## How the samples were checked

`node reviews/typescript-safety/checks/check-ts-snippets.mjs` compiles every `ts` block in this skill as its own module, under the baseline tsconfig block in config.md, with TS 7.0.2 and 6.0.3. FAIL samples mark the failing line with `@ts-expect-error`, so a FAIL sample that compiles is reported as TS2578.

| Check | Result |
| --- | --- |
| 52 blocks on TS 7.0.2, 51 on 6.0.3 (one block is 7-only) | Pass |
| 4 blocks skipped, each with its reason in the marker | Two need a second file, one needs `express`, one shows syntax only rejected under `erasableSyntaxOnly` |
| The checker fails on a broken PASS sample and on a FAIL sample that compiles | Confirmed on 2026-10-23, see reviews/typescript-safety/validation.md |
