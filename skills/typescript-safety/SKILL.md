---
name: typescript-safety
description: >
  Makes TypeScript catch more bugs at compile time on TS 6 and 7: tsconfig
  flags past strict, narrowing and discriminated unions, exhaustive switches,
  generics and inference (satisfies, const type parameters, NoInfer), utility,
  mapped, conditional, and template literal types, branded types, unknown at
  data edges, unknown in catch, hidden any, replacing any, as, ! and
  ts-ignore, enums and const enum, type or interface, typescript-eslint
  type-checked rules, Node type stripping and erasableSyntaxOnly, and the
  upgrade from TS 5 or 6 to 7. Use when editing tsconfig.json, fixing a type
  error, removing any or casts, designing the types for a module, or when a
  TS 6 or 7 upgrade breaks the build. Not for React rendering
  (react-performance), Next.js caching and routing (nextjs-app-router), or
  validating request bodies with Zod (api-security).
---

# TypeScript safety

## Contents

- Procedure
- Where to read
- The traps that cost the most time
- Review checklist

Getting the compiler to catch bugs before they run, on TypeScript 6 and 7. TS 7.0 is the Go compiler, installed as plain `typescript` since July 2026. `strict` has been the default since 6.0, so the remaining gains come from the flags `strict` leaves off, from narrowing instead of casting, and from parsing data at the edges.

**Types describe code, not data.** Anything that enters the process (a response body, `JSON.parse`, storage, env vars) is unchecked until code checks it. An annotation on an `any` is a cast.

**Every escape hatch turns off the check that would have caught the bug.** No `any` in new code. Reach for `unknown` and narrow. A cast needs a runtime check next to it.

Source checks and dates: [SOURCES.md](SOURCES.md).

## Procedure

1. Read the project's `tsconfig.json` and the installed `typescript` version (`npx tsc --version`). On 5.x or 6.x with deprecation errors, start with [upgrade-6-to-7.md](./resources/upgrade-6-to-7.md).
2. Compare the config with the baseline in [config.md](./resources/config.md). Turning on a flag in an old codebase can add hundreds of errors: count them with `tsc --noEmit` first, and fix by module.
3. Read the resource for the task in the table below.
4. Write the change. Prefer the first tool that works: narrowing, then a predicate, then a checked cast.
5. Run `tsc --noEmit`, and `eslint` if the project has typed linting. Report both results, and say which TS version ran.

A single error fix or a direct question gets a direct answer: the fix or the answer, and the `tsc --noEmit` result if you ran it. No formal report.

A review or audit reports findings as Must fix / Should fix / Leave, with the file, the line, and the flag or rule name. Never report a problem you did not see in the code.

- **Must fix:** a check is off and a wrong value can compile. An `any` leak, an unchecked `as`, a missing exhaustive check, an option TS 7 removed.
- **Should fix:** the code is right today but the types will not stop the next mistake. A missing brand, a `const enum`, mixed `type` and `interface`.
- **Leave:** a style the project already chose, or code the change does not touch.

```
data from outside ──> unknown ──> parse at the edge ──> precise types inside
                                  domain-types.md      narrowing.md, generics.md
                                                              |
  tsconfig flags catch the rest: config.md        types from types: type-level.md
                                                              |
  any / as / ! found? escape-hatches.md      lint what tsc cannot: linting.md
```

## Where to read

| Task | Resource |
| --- | --- |
| tsconfig defaults, `es2025` and `dom` (`dom.iterable` included), the baseline, flags past strict, `module` by runtime, the empty `types` default | [config.md](./resources/config.md) |
| Upgrading to 6.0 and 7.0, removed options and syntax, `ts5to6`, `stableTypeOrdering`, running TS 6 next to 7 | [upgrade-6-to-7.md](./resources/upgrade-6-to-7.md) |
| Discriminated unions, exhaustive switches, predicates, assertion functions, `unknown` in `catch` and `.catch()`, unsound spots | [narrowing.md](./resources/narrowing.md) |
| When a type parameter earns its place, constraints, `satisfies`, `const` type parameters, `NoInfer`, `this`-less method inference | [generics.md](./resources/generics.md) |
| Utility types, the `Omit` trap, mapped, conditional, and template literal types, `type` or `interface`, augmentation | [type-level.md](./resources/type-level.md) |
| Untyped data at the edges, branded IDs and units, `readonly` inputs | [domain-types.md](./resources/domain-types.md) |
| `any`, `any` from `Array.isArray` and computed `import()`, `as`, `!`, `@ts-expect-error`, and what to use instead (including `Map.getOrInsert`) | [escape-hatches.md](./resources/escape-hatches.md) |
| typescript-eslint configs and rules, and the TS 6 alias the linter still needs | [linting.md](./resources/linting.md) |
| Node type stripping, `erasableSyntaxOnly`, `verbatimModuleSyntax`, `#/` subpath imports, enums or `as const` objects, numeric reverse mapping, `const enum` | [node-and-emit.md](./resources/node-and-emit.md) |

## The traps that cost the most time

| Symptom | Usual cause | Read |
| --- | --- | --- |
| `Cannot find name 'process'` after upgrading | `types` defaults to `[]` since 6.0 | [config.md](./resources/config.md) |
| TS5011, common source directory | `outDir` is set, sources sit under `src/`, and `rootDir` is unset | [config.md](./resources/config.md) |
| TS5102 or TS5108, "has been removed" | An option TS 7 dropped: `baseUrl`, `moduleResolution: node`, `target: es5`, `outFile` | [upgrade-6-to-7.md](./resources/upgrade-6-to-7.md) |
| typescript-eslint breaks after installing TS 7 | `import 'typescript'` on 7 is only the version. Alias TS 6 for the linter. | [linting.md](./resources/linting.md) |
| A typed value is wrong at runtime | `any` from `.json()` or `JSON.parse` assigned to a typed variable | [domain-types.md](./resources/domain-types.md) |
| `arr[0].x` crashes on an empty array | `noUncheckedIndexedAccess` is off | [config.md](./resources/config.md) |
| `map.has(k)` then `map.get(k)!` used for defaults | `has` does not narrow `get`. Read once with `??` or use `getOrInsert` / `getOrInsertComputed`. | [escape-hatches.md](./resources/escape-hatches.md) |
| A new union member is silently ignored | The switch has no exhaustive check | [narrowing.md](./resources/narrowing.md) |
| Renamed field still listed in an `Omit`, no error | `Omit` does not check its keys | [type-level.md](./resources/type-level.md) |
| A literal list types as `string[]` | No `as const` or `const` type parameter | [generics.md](./resources/generics.md) |
| A wrong value is accepted by a generic function | Another argument widens `T`. Wrap it in `NoInfer`. | [generics.md](./resources/generics.md) |
| `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX` from Node | An enum, parameter property, or runtime namespace | [node-and-emit.md](./resources/node-and-emit.md) |
| `does not provide an export named` from Node | A type imported without `import type` | [node-and-emit.md](./resources/node-and-emit.md) |
| `@/*` tsconfig `paths` fail when Node runs `.ts` | Node ignores `tsconfig.json`. Map `#/*` in `package.json` `"imports"` instead. | [node-and-emit.md](./resources/node-and-emit.md) |
| A narrowed property is wrong after a call | Narrowing is not reset by function calls | [narrowing.md](./resources/narrowing.md) |
| TS2775 on an assertion function call | The function is a `const` with no type annotation | [narrowing.md](./resources/narrowing.md) |
| TS18046, `'e' is of type 'unknown'` in a `catch` | `strict` makes `catch` variables `unknown`. Narrow with `instanceof Error`. | [narrowing.md](./resources/narrowing.md) |
| A typo on `e` in `.catch((e) => ...)` compiles | Rejection callbacks are `any`. Write `(e: unknown)`. | [narrowing.md](./resources/narrowing.md) |
| No error on any element after `Array.isArray(x)` | `x` narrows to `any[]` | [escape-hatches.md](./resources/escape-hatches.md) |
| TS2748, cannot access ambient const enums | A `const enum` from a `.d.ts` under `isolatedModules` | [node-and-emit.md](./resources/node-and-emit.md) |
| A property is `never` with no error where it was declared | An intersection hid a clash that `extends` would report | [type-level.md](./resources/type-level.md) |

## Review checklist

- [ ] `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, and `verbatimModuleSyntax` are on, and `target`, `module`, and `types` are explicit
- [ ] No option or syntax removed in TS 7 remains
- [ ] Data from outside is `unknown` until parsed, once, at the edge
- [ ] No `any` in new code, including from `Array.isArray`, computed `import()`, and `.catch()` callbacks. Every `as` sits behind a runtime check. No `@ts-ignore`.
- [ ] `catch` variables are narrowed, and only `Error` values are thrown
- [ ] No `const enum`. New code uses `as const` objects over enums.
- [ ] States with different fields are discriminated unions, and switches over them are exhaustive
- [ ] A function type parameter appears at least twice. An inferred return counts. A type alias may use its parameter once.
- [ ] IDs and units that can be mixed up are branded
- [ ] typescript-eslint runs a type-checked config
- [ ] The report names the TS version and shows the `tsc --noEmit` result
