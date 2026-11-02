# TypeScript safety validation

Run on 2026-10-23 with Node 24.21.0. The checker was run again on 2026-11-01 with Node 26.12.1 on Windows, after the catch, hidden `any`, enum, and `type` or `interface` additions.

## Snippet checker

`node reviews/typescript-safety/checks/check-ts-snippets.mjs`

```
ts 7.0.2: 67 blocks compiled
ts 6.0.3: 66 blocks compiled
4 blocks skipped by marker
All TypeScript samples pass.
```

## The checker can fail

Two edits to generics.md, each made on its own and then reverted.

| Edit | Result |
| --- | --- |
| A PASS sample reads `a.lenght` | `generics.md:67 (block line 2): error TS2551: Property 'lenght' does not exist on type 'T'`, exit 1 |
| The FAIL sample gets the constraint that fixes it, so its `@ts-expect-error` has nothing to cover | `generics.md:58 (block line 2): error TS2578: Unused '@ts-expect-error' directive.`, exit 1 |

On 2026-11-01, two edits made on a copy each failed the check as expected: a `.catch((e: unknown) => ...)` PASS sample reading `e.message` gave TS18046, and reading `items[0].x` on the `unknown[]` PASS sample gave TS2571.

The 2026-11-01 run used a copy of the skill with LF line endings and `shell: true` added to the `npx` call. On Windows the checker as committed cannot run: the baseline regex expects a bare LF and finds no block in a CRLF checkout, and `execFileSync('npx', ...)` fails without a shell. CI on Linux is not affected.

## Claims checked by running them

| Claim | Run |
| --- | --- |
| `tsc --init` output on 7.0.2 matches the 5.9 output | Ran `tsc --init` with 7.0.2 |
| TS 7 still emits `.js` and `.d.ts` | `tsc` 7.0.2, `module: nodenext`, `declaration: true` |
| Removed options give TS5102 or TS5108; `ignoreDeprecations: "6.0"` is accepted and inert | One tsconfig per option on 7.0.2 |
| `module Foo {}` gives TS1540, `assert {}` gives TS2880, `tsc file.ts` with a tsconfig gives TS5112 | 7.0.2 and 6.0.3 |
| Template literal `infer` splits emoji differently on 6 and 7; 100,000-member unions give TS2590 | 6.0.3 and 7.0.2 |
| Two npm aliases give `tsc` 7.0.2, `tsc6` 6.0.3, and the 6.0.3 API | npm install, `--version`, `require('typescript').version` |
| The flat config shape in linting.md works and reports the four sample problems; `tseslint.config()` is deprecated. That run used `strictTypeChecked`. The file now starts at `recommendedTypeChecked`. | ESLint 10.13.0, typescript-eslint 8.72.0 |
| Node rejects enums and untyped type imports with the quoted errors; the recommended tsconfig reports TS1294 and TS1484 | Node 24.21.0, `tsc` 7.0.2 |
| Unset `rootDir` with `outDir` and sources under `src/` is TS5011 on 6.0.3 and 7.0.2. `noEmit` does not report it. | `tsc` 6.0.3 and 7.0.2 |
| `module: nodenext` does not imply `target: esnext`, and `module: node20` does not imply `es2023` | `using` and `Set.intersection` on `tsc` 7.0.2 |
| `StrictOmit` on a union of objects collapses to `{}` when the only shared key is omitted | `tsc` 7.0.2 |
| `JSON.parse`, an object literal, spread, and `Object.assign` can forge a `unique symbol` brand | `tsc` 7.0.2 |
| `Array.isArray` on `unknown` gives `any[]`; `import()` of a non-literal specifier gives `any`; `.catch` callback parameters are `any` | `tsc` 7.0.2 and 6.0.3, 2026-11-01 |
| An ambient `const enum` read gives TS2748 under `verbatimModuleSyntax`; `const enum` gives TS1294 under `erasableSyntaxOnly`; a conflicting `extends` gives TS2430 while the intersection gives `never` | `tsc` 7.0.2 and 6.0.3 (TS1294 on 7.0.2 only), 2026-11-01 |
| `use-unknown-in-catch-callback-variable`, `only-throw-error` (and that `throw e` on `unknown` passes), `consistent-type-definitions`, and `no-restricted-syntax` with `TSEnumDeclaration[const=true]` each report the sample problem | ESLint 10.13.0, typescript-eslint 8.72.0, 2026-11-01 |

## Not run

The model tasks in [tasks.md](./tasks.md). They need approval before running.
