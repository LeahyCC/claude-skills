# Linting with types

The compiler checks that types line up. It does not report unsafe use of `any`, promises nobody awaits, or conditions that can never be false. typescript-eslint's type-aware rules do.

Sources are in [SOURCES.md](../SOURCES.md).

## Contents

- TS 7 and typescript-eslint
- Which config
- Rules worth turning on by hand
- Setup
- Checklist

## TS 7 and typescript-eslint

typescript-eslint 8.x supports TypeScript `>=4.8.4 <6.1.0`. It needs the compiler's API, and TS 7.0 ships without one (the new API is planned for 7.1). Until typescript-eslint supports 7.x, install both: TS 7 for `tsc`, and TS 6 under the `typescript` name for the linter.

```json
{
  "devDependencies": {
    "typescript": "npm:@typescript/typescript6@^6.0.2",
    "@typescript/native": "npm:typescript@^7.0.2"
  }
}
```

With these two aliases, `tsc` runs 7.0, `tsc6` runs 6.0, and `import 'typescript'` loads the 6.0 API that typescript-eslint uses. Code that compiles cleanly on 6.0 with `stableTypeOrdering` on and no `ignoreDeprecations` type-checks the same on 7.0, so the linter and `tsc` agree. The linter runs 6.0 without that flag, so a rare result that depends on union order can differ between the two. Editor plugins that embed TypeScript (Vue, Svelte, Astro, MDX, Angular templates) also still need 6.0.

Check the typescript-eslint dependency versions page before relying on this. Support for 7.1 was in progress in October 2026.

## Which config

| Config | Adds | Pick it when |
| --- | --- | --- |
| `recommendedTypeChecked` | The `no-unsafe-*` family, `no-floating-promises`, `no-misused-promises`, `no-explicit-any`, `ban-ts-comment`, `restrict-template-expressions`, `only-throw-error` | Every project. typescript-eslint's own advice is to start here. |
| `strictTypeChecked` | The above, plus `no-unnecessary-condition`, `no-non-null-assertion`, `use-unknown-in-catch-callback-variable`, and more | Most of the team is confident with TypeScript. It is not semver-stable, so a minor release can add errors. |
| `stylisticTypeChecked` | `consistent-type-assertions`, `prefer-nullish-coalescing`, and other consistency rules | Alongside either of the above |

`ban-ts-comment` in `recommended` allows `@ts-expect-error` only with a description of at least 3 characters (10 in `strict`), and reports `@ts-ignore` and `@ts-nocheck`.

## Rules worth turning on by hand

These are in none of the recommended, strict, or stylistic configs (only in `all`):

| Rule | Catches |
| --- | --- |
| `switch-exhaustiveness-check` | A switch over a union that misses a member. Same job as `satisfies never`, without the default branch. |
| `no-unsafe-type-assertion` | `as T` that narrows to a type the value is not known to be |
| `consistent-type-imports` | Type-only imports without `import type`. Leave it off when `verbatimModuleSyntax` is on: the compiler reports the same thing (TS1484), and typescript-eslint warns the two can give conflicting reports. |
| `strict-boolean-expressions` | `if (count)` where `0` is a valid count, `if (name)` where `''` is valid. Noisy on old code. |

## Setup

Typed linting needs `parserOptions.projectService`, which reads the nearest tsconfig for each file. Use ESLint's `defineConfig`: typescript-eslint's own `tseslint.config()` helper is deprecated in its favour.

Tested with ESLint 10.13, typescript-eslint 8.72, and the TS 6/7 aliases above.

```js
// eslint.config.mjs
import eslint from '@eslint/js'
import { defineConfig } from 'eslint/config'
import tseslint from 'typescript-eslint'

export default defineConfig(
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/no-unsafe-type-assertion': 'error',
    },
  },
  {
    files: ['**/*.js', '**/*.mjs'],
    extends: [tseslint.configs.disableTypeChecked],
  },
)
```

Type-aware rules are slower than syntax rules because they build the program. Run them in CI and in the editor, not in a pre-commit hook on every file.

## Checklist

- [ ] typescript-eslint is on a `*TypeChecked` config with `projectService`
- [ ] On TS 7, the linter gets TS 6 through the alias, and `tsc` runs 7
- [ ] `switch-exhaustiveness-check` and `no-unsafe-type-assertion` are turned on
- [ ] `ban-ts-comment` is not turned off
- [ ] CI runs `tsc --noEmit` and `eslint`, and fails on either
