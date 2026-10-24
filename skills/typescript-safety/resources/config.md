# tsconfig

The compiler settings that decide how much TypeScript catches. Since TS 6.0, `strict` is on by default. The flags that catch the most bugs now are the ones `strict` does not include.

Sources are in [SOURCES.md](../SOURCES.md).

## Contents

- What changed in 6.0 and 7.0
- lib and target in 6.0
- The baseline
- Flags past strict
- noUncheckedIndexedAccess
- exactOptionalPropertyTypes
- Pick module settings by where the code runs
- The empty types default
- Checklist

## What changed in 6.0 and 7.0

TS 6.0 changed defaults and deprecated old options. TS 7.0 is the Go compiler, and it turns every 6.0 deprecation into a hard error. Upgrade steps are in [upgrade-6-to-7.md](./upgrade-6-to-7.md).

| Setting | Default before 6.0 | Default in 6.0 and 7.0 |
| --- | --- | --- |
| `strict` | `false` | `true` |
| `module` | depends on `target` | `esnext`, per the 6.0 release notes. `tsc --help` prints it unset. |
| `target` | `es5` | the current supported year: `es2025` on 6.0.3 and 7.0.2 |
| `types` | every `@types/*` package | `[]` |
| `noUncheckedSideEffectImports` | `false` | `true` |
| `libReplacement` | `true` | `false` |
| `rootDir` | inferred from the input files | the folder holding `tsconfig.json` |

A tsconfig that sets nothing behaves differently on 6.0 than on 5.x. Set `target`, `module`, and `types` yourself so an upgrade does not move them.

`tsc --help` on 6.0.3, 7.0.2, and 7.1.0-beta prints the `module` default as unset. The 6.0 release notes say the new default is `esnext`. On 7.1.0-beta, `tsc --help` prints the `target` default as `es2026`.

`libReplacement: false` means an `@typescript/lib-*` package does not replace the built-in libraries. Turn it back on only when that package's docs say to.

`rootDir` is inferred only when `tsc` is run on files with no tsconfig. With a tsconfig, the default is the folder that holds the tsconfig. If `outDir` is set, the files live deeper than that folder (only under `src/`, for example), and `rootDir` is unset, tsc 6.0.3 and 7.0.2 stop with TS5011. The error names the common source directory (`./src`) and says `rootDir` must be set. `noEmit` does not hit this. Set `"rootDir": "./src"`.

## lib and target in 6.0

In TS 6.0, `dom` includes the full contents of `dom.iterable` and `dom.asynciterable`. `lib.dom.iterable.d.ts` and `lib.dom.asynciterable.d.ts` are now empty stubs, so `"lib": ["dom", "dom.iterable"]` simplifies to `"lib": ["dom"]`.

The `es2025` target and lib add `RegExp.escape` and move `Promise.try`, `Iterator` helper methods, and `Set` methods (`intersection`, `union`, `difference`) out of `esnext`. The `esnext` lib adds stage 4 `Temporal` (`esnext.temporal`) and `Map`/`WeakMap` upsert methods (`getOrInsert` and `getOrInsertComputed`).

```ts
for (const el of document.querySelectorAll('div')) {
  console.log(el.textContent)
}

const pattern = new RegExp(`\\b${RegExp.escape('price ($)')}\\b`, 'g')
const today = Temporal.Now.plainDateISO()
const counts = new Map<string, number>()
const next = counts.getOrInsertComputed('visits', () => 0) + 1
console.log(pattern.test('price ($)'), today.toString(), next)
```

## The baseline

This is the `tsc --init` output from TS 7.0.2 (unchanged since 5.9), with comments trimmed and two of its commented-out style options turned on. Every TypeScript sample in this skill is type-checked under it.

<!-- ts-config: baseline -->
```jsonc
{
  "compilerOptions": {
    "module": "nodenext",
    "target": "esnext",
    "types": [],
    "sourceMap": true,
    "declaration": true,
    "declarationMap": true,

    // Stricter than strict. Both are in tsc --init.
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,

    // Commented out in tsc --init. Turned on here.
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,

    "strict": true,
    "jsx": "react-jsx",
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "noUncheckedSideEffectImports": true,
    "moduleDetection": "force",
    "skipLibCheck": true
  }
}
```

Change `module`, `types`, and the output options to fit the project (see the module table below). Keep the checking options.

## Flags past strict

`strict` turns on eight flags: `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization`, `strictBuiltinIteratorReturn`, `noImplicitThis`, and `useUnknownInCatchVariables`. `alwaysStrict` is not one of them. It defaults to `true` on its own, so `strict: false` still emits `"use strict"`. `alwaysStrict: false` is deprecated in 6.0 (TS5107) and removed in 7.0 (TS5108). These are not part of `strict`:

| Flag | Catches | Cost | Turn on |
| --- | --- | --- | --- |
| `noUncheckedIndexedAccess` | `arr[i]` and `record[key]` read as defined when they may be `undefined` | A check or `!` at every index read | Always on new code. On old code, expect many errors; fix by module. |
| `exactOptionalPropertyTypes` | Writing `undefined` into `x?: T`, which `'x' in obj` and spread treat differently from a missing key | Optional props that really accept `undefined` must say `x?: T \| undefined` | New code. Libraries that publish types. |
| `noImplicitOverride` | A subclass method that silently stops overriding when the base renames it | Write `override` | Any code with classes |
| `noFallthroughCasesInSwitch` | A non-empty `case` that runs into the next | `break` or `return` | Always |
| `noPropertyAccessFromIndexSignature` | `obj.key` on an index signature, which hides that the key may be missing | Write `obj['key']` | Style choice. Weak with `noUncheckedIndexedAccess` already on. |
| `noImplicitReturns` | A path that falls off the end of a function that returns a value | An explicit return | Style choice |
| `verbatimModuleSyntax` | Imports used only as types that would be kept or dropped by guesswork | Write `import type` | Always. Required for clear output with bundlers and Node type stripping. |
| `isolatedDeclarations` | Exports whose types need inference to write a `.d.ts` | Annotate exported functions and constants | Libraries whose `.d.ts` should build in parallel or by other tools |
| `erasableSyntaxOnly` | `enum`, runtime `namespace`, parameter properties, `import =` | Use the erasable forms | Code run by Node type stripping, or that should be portable to it. See [node-and-emit.md](./node-and-emit.md). |

## noUncheckedIndexedAccess

Use when: always, on any code that indexes arrays or records.
Not when: a hot loop where the bound is proved by the loop. A `for...of` or `.entries()` avoids the index read instead of turning the flag off.

FAIL. The type says `string`, but the array may be empty:

```ts
function firstName(names: string[]): string {
  const first = names[0]
  // @ts-expect-error first is string | undefined under noUncheckedIndexedAccess
  return first.toUpperCase()
}
```

PASS. Handle the empty case where it happens:

```ts
function firstName(names: string[]): string {
  const first = names[0]
  if (first === undefined) throw new Error('names is empty')
  return first.toUpperCase()
}

const prices: Record<string, number> = { apple: 1 }
for (const [item, price] of Object.entries(prices)) {
  console.log(item, price.toFixed(2)) // price is number: entries never yields a missing key
}
```

## exactOptionalPropertyTypes

Use when: new code, and types a library publishes.
Not when: the type comes from a JSON or form layer that writes `undefined` for missing fields. Declare those `x?: T | undefined` instead of turning the flag off.

FAIL. `?` means "may be missing", not "may hold `undefined`":

```ts
interface Settings {
  theme?: 'light' | 'dark'
}

// @ts-expect-error undefined is not assignable to 'light' | 'dark' under exactOptionalPropertyTypes
const s: Settings = { theme: undefined }
```

PASS. Leave the key out, or say the property accepts `undefined`:

```ts
interface Settings {
  theme?: 'light' | 'dark'
  locale?: string | undefined // a form layer writes undefined here
}

const a: Settings = {}
const b: Settings = { locale: undefined }
```

## Pick module settings by where the code runs

| The code runs in | `module` | Also set |
| --- | --- | --- |
| A bundler (Vite, Next.js, webpack, esbuild) | `preserve` | `noEmit: true`. `preserve` implies `moduleResolution: bundler`. |
| Node, built by `tsc` | `nodenext`, or `node20` to pin resolution | `outDir` and `rootDir`. Relative imports end in `.js`. |
| Node, run straight from `.ts` | `nodenext` | `noEmit`, `erasableSyntaxOnly`, `rewriteRelativeImportExtensions`. Relative imports end in `.ts`. |
| A published library | `nodenext` | `declaration`, `isolatedDeclarations` |
| Bun | `preserve` | `noEmit: true` |

`nodenext` follows current Node resolution. It does not set `target`. On tsc 7.0.2, `module: nodenext` still uses the default target: `using` is rewritten, and the compile reports TS2318 (`Disposable` is missing) and TS2550 (`Symbol.dispose`) until `lib` includes `esnext`. `node20` freezes resolution, and `moduleResolution` becomes `node16`. It does not freeze `target` at `es2023`: `Set.intersection` typechecks under `module: node20` on 7.0.2. The handbook still says `nodenext` implies `target: esnext` and `node20` implies `es2023`. Set `target` yourself. Pick `node20` when the resolver must stay put across a TypeScript upgrade.

A project that emits CommonJS for a bundler should keep `module: commonjs` and set `moduleResolution: bundler`. TS 6 allows that pair, and the 6.0 release notes call it the usual upgrade from `moduleResolution: node`. `preserve` is the other bundler setting. It keeps the source module syntax, so the emit changes.

`moduleResolution: node` (also called `node10`), `classic`, `baseUrl`, and `module: amd | umd | systemjs | none` are gone in TS 7. See [upgrade-6-to-7.md](./upgrade-6-to-7.md).

## The empty types default

Since 6.0, `types` defaults to `[]`. Ambient globals from `@types/node`, `@types/jest`, or similar are no longer loaded just because they are installed.

| Symptom after upgrading | Fix |
| --- | --- |
| `Cannot find name 'process'` or `'Buffer'` | `"types": ["node"]` |
| `Cannot find name 'describe'` or `'expect'` | Add the test runner, e.g. `"types": ["node", "vitest/globals"]`, or import from the runner |

`"types": ["*"]` restores the 5.9 behavior of enumerating every package in `node_modules/@types`, at the cost of slower builds (often 20 to 50 percent slower in workspaces). List only what the code uses. A test globals package in the app tsconfig makes `describe` type-check in production files.

## Checklist

- [ ] `target`, `module`, and `types` are set explicitly
- [ ] `rootDir` is set when `outDir` is set and the sources are not next to `tsconfig.json`
- [ ] `strict`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes` are on
- [ ] `verbatimModuleSyntax` is on, and type-only imports use `import type`
- [ ] `module` matches where the code runs
- [ ] No option removed in TS 7 is set
- [ ] Libraries emit declarations and consider `isolatedDeclarations`
