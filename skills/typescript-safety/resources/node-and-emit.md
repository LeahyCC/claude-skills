# Node, type stripping, and emit

How TypeScript turns into the JavaScript that runs, and the settings that keep that step predictable. Node now runs `.ts` files directly by deleting the types, which only works for syntax that can be deleted.

Sources are in [SOURCES.md](../SOURCES.md).

## Contents

- Three ways TS becomes JS
- Node type stripping
- Erasable syntax
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
- `tsconfig` `paths` are ignored. Use `package.json` `"imports"` with `#` names instead.
- `.tsx` and decorators are not supported.

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
- [ ] `verbatimModuleSyntax` is on and type-only imports say `import type`
- [ ] Import aliases use `package.json` `"imports"`, not `paths`, when Node resolves them
