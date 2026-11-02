# Node, type stripping, and emit

How TypeScript turns into the JavaScript that runs, and the settings that keep that step predictable. Node now runs `.ts` files directly by deleting the types, which only works for syntax that can be deleted.

Sources are in [SOURCES.md](../SOURCES.md).

## Contents

- Three ways TS becomes JS
- Node type stripping
- Erasable syntax
- Enums and const objects
- Imports that survive output
- Checklist

## Three ways TS becomes JS

```
tsc emits             bundler strips             Node strips
---------             --------------             -----------
tsc -> .js + .d.ts    esbuild/swc/Vite -> .js    node app.ts
type-checks: yes      type-checks: no            type-checks: no
any TS syntax         almost any TS syntax       erasable syntax only
```

Only `tsc` checks types. With a bundler or Node, run `tsc --noEmit` in CI as a separate step, or type errors ship.

## Node type stripping

Node replaces type annotations with whitespace and runs what is left. It does not read `tsconfig.json` and does not check types.

| Node version | Status |
| --- | --- |
| 22.6 | Added behind `--experimental-strip-types` |
| 22.18, 23.6 | On by default |
| 22.18, 24.3 | Experimental warning removed |
| 24.12, 25.2 | Stable |

Checked on Node 24.21 with the tsconfig below.

Rules that follow from "delete the types and run it":

- `enum`, `namespace` with runtime code, parameter properties, and `import x = require()` are errors. They generate code, so deleting them is not enough.
- Relative imports need the real extension: `import { db } from './db.ts'`.
- Type-only imports need `import type`, or Node tries to load a value that does not exist.
- `tsconfig` `paths` are ignored. Use `package.json` `"imports"` with `#/` subpath aliases instead (supported in TS 6.0+ under `nodenext` and `bundler` resolution, and in Node 20+).
- `.tsx` and decorators are not supported.

In `package.json`, a `#/*` subpath import maps straight to your source or output directory without needing an extra segment like `#root/*`. It replaces tsconfig `@/*` `paths` with an alias that Node resolves natively:

```json
{
  "name": "my-app",
  "type": "module",
  "imports": {
    "#/*": "./src/*"
  }
}
```

The tsconfig that makes `tsc` agree with Node:

```jsonc
{
  "compilerOptions": {
    "noEmit": true,
    "target": "esnext",
    "module": "nodenext",
    "rewriteRelativeImportExtensions": true,
    "erasableSyntaxOnly": true,
    "verbatimModuleSyntax": true
  }
}
```

`erasableSyntaxOnly` makes `tsc` report every construct Node would reject. `rewriteRelativeImportExtensions` allows `.ts` in relative imports, and rewrites them to `.js` if you later emit with `tsc`.

## Erasable syntax

Use `erasableSyntaxOnly` when: Node or a strip-only tool runs the code, or the code should stay portable to them.
Not when: an existing codebase leans on enums and decorators and is always built by `tsc` or a full transpiler. Turn it on for new packages first.

FAIL under `erasableSyntaxOnly`. Each of these generates JavaScript:

<!-- ts-check: skip, valid under the baseline, rejected only when erasableSyntaxOnly is on (TS1294) -->
```ts
enum Role {
  Admin = 'admin',
  Member = 'member',
}

class Account {
  constructor(private readonly id: string) {} // parameter property
}
```

PASS. The same meaning with only erasable syntax:

```ts
const Role = {
  Admin: 'admin',
  Member: 'member',
} as const
type Role = (typeof Role)[keyof typeof Role] // 'admin' | 'member'

class Account {
  private readonly id: string
  constructor(id: string) {
    this.id = id
  }
  describe(): string {
    return `account ${this.id}`
  }
}

function canDelete(role: Role): boolean {
  return role === Role.Admin
}

canDelete('member')
```

Node itself rejects the enum with `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX: TypeScript enum is not supported in strip-only mode`.

## Enums and const objects

The handbook's "Objects vs Enums" section says modern TypeScript may not need an enum. An `as const` object with a derived union, as in the PASS above, does the same job and is plain JavaScript. If JavaScript ever gets enums, code in that form can move to them.

Use an `as const` object when: you write new code, or the code may ever run through Node or a strip-only tool.
Keep an existing enum when: the codebase is built by `tsc` or a full transpiler and does not have `erasableSyntaxOnly` on. Rewriting working enums buys little.

### Numeric enums map both ways

A numeric enum compiles to an object that maps names to numbers and numbers back to names. String members get no reverse entry. So the object holds more keys than you wrote, and indexing it by any number compiles:

```ts
enum Level {
  Low,
  High,
}

const name = Level[Level.High] // 'High', from the reverse mapping
const missing = Level[7] // compiles. undefined at runtime.
console.log(name, missing, Object.keys(Level)) // keys are '0', '1', 'Low', 'High'
```

Code that loops over `Object.keys` or `Object.values` of a numeric enum sees every value twice, once as a name and once as a number. An `as const` object has only the keys you wrote.

### Avoid const enum

A `const enum` has no runtime object. `tsc` replaces each use with the literal value. That breaks in three ways:

- Tools that compile one file at a time cannot see a value declared in another file, so they cannot inline it. Under `isolatedModules` or `verbatimModuleSyntax`, reading an ambient `const enum` (from a `.d.ts` file or a `declare const enum`) is an error.
- A library's `const enum` is copied into your build at compile time. If the installed version at runtime has other values, your code uses the old ones, and tests built against the same version will not catch it.
- Strip-only tools reject it like any other enum.

FAIL under the baseline, which has `isolatedModules` and `verbatimModuleSyntax` on:

```ts
declare const enum Color {
  Red,
  Green,
}

// @ts-expect-error cannot access ambient const enums (TS2748)
const red = Color.Red
```

Ban it in one of two ways:

| Setting | Rejects | Pick it when |
| --- | --- | --- |
| `erasableSyntaxOnly` | Every `enum`, `const enum` included (TS1294), plus the other syntax in [Erasable syntax](#erasable-syntax) | You can drop enums entirely |
| ESLint `no-restricted-syntax` with the selector `TSEnumDeclaration[const=true]` | `const enum` only | Plain enums stay for now |

```js
// eslint.config.mjs, inside a config object
rules: {
  'no-restricted-syntax': [
    'error',
    { selector: 'TSEnumDeclaration[const=true]', message: 'Use an as const object instead of a const enum.' },
  ],
},
```

A library that must keep its own `const enum` can set `preserveConstEnums` and publish plain `enum` declarations, as the handbook describes. Most code should not need that.

## Imports that survive output

`verbatimModuleSyntax` keeps every import without `type` and deletes every import with it. What you write is what runs.

FAIL. `User` is only a type. Node keeps the import and crashes: `SyntaxError: The requested module './types.ts' does not provide an export named 'User'`. `tsc` reports TS1484 first:

<!-- ts-check: skip, needs a second file -->
```ts
import { User } from './types.ts'

export function greet(u: User): string {
  return `hi ${u.name}`
}
```

PASS:

<!-- ts-check: skip, needs a second file -->
```ts
import type { User } from './types.ts'

export function greet(u: User): string {
  return `hi ${u.name}`
}
```

## Checklist

- [ ] CI runs `tsc --noEmit` when a bundler or Node does the stripping
- [ ] Code run by Node directly has `erasableSyntaxOnly` and `rewriteRelativeImportExtensions` on
- [ ] No `enum`, parameter properties, or runtime `namespace` in that code. Const objects with a derived union instead.
- [ ] No `const enum`, banned by `erasableSyntaxOnly` or a lint rule
- [ ] No loop over the keys or values of a numeric enum
- [ ] `verbatimModuleSyntax` is on and type-only imports say `import type`
- [ ] Import aliases use `package.json` `"imports"` (such as `"#/*": "./src/*"`), not `paths`, when Node resolves them
