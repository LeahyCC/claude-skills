# TypeScript safety validation

Run on 2026-10-23 with Node 24.21.0.

## Snippet checker

`node reviews/typescript-safety/checks/check-ts-snippets.mjs`

```
ts 7.0.2: 52 blocks compiled
ts 6.0.3: 51 blocks compiled
4 blocks skipped by marker
All TypeScript samples pass.
```

## The checker can fail

Two edits to generics.md, each made on its own and then reverted.

| Edit | Result |
| --- | --- |
| A PASS sample reads `a.lenght` | `generics.md:67 (block line 2): error TS2551: Property 'lenght' does not exist on type 'T'`, exit 1 |
| The FAIL sample gets the constraint that fixes it, so its `@ts-expect-error` has nothing to cover | `generics.md:58 (block line 2): error TS2578: Unused '@ts-expect-error' directive.`, exit 1 |

## Claims checked by running them

| Claim | Run |
| --- | --- |
| `tsc --init` output on 7.0.2 matches the 5.9 output | Ran `tsc --init` with 7.0.2 |
| TS 7 still emits `.js` and `.d.ts` | `tsc` 7.0.2, `module: nodenext`, `declaration: true` |
| Removed options give TS5102 or TS5108; `ignoreDeprecations: "6.0"` is accepted and inert | One tsconfig per option on 7.0.2 |
| `module Foo {}` gives TS1540, `assert {}` gives TS2880, `tsc file.ts` with a tsconfig gives TS5112 | 7.0.2 and 6.0.3 |
| Template literal `infer` splits emoji differently on 6 and 7; 100,000-member unions give TS2590 | 6.0.3 and 7.0.2 |
| Two npm aliases give `tsc` 7.0.2, `tsc6` 6.0.3, and the 6.0.3 API | npm install, `--version`, `require('typescript').version` |
| The flat config in linting.md works and reports the four sample problems; `tseslint.config()` is deprecated | ESLint 10.13.0, typescript-eslint 8.72.0 |
| Node rejects enums and untyped type imports with the quoted errors; the recommended tsconfig reports TS1294 and TS1484 | Node 24.21.0, `tsc` 7.0.2 |

## Not run

The model tasks in [tasks.md](./tasks.md). They need approval before running.
