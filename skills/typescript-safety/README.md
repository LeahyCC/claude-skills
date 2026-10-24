# typescript-safety

Getting TypeScript 6 and 7 to catch bugs at compile time. tsconfig past `strict`, narrowing, generics, types from types, branded types, data at the edges, escape hatches, typed linting, Node type stripping, and the upgrade to TS 7.

React rendering is in [react-performance](../react-performance/). Validating request bodies with Zod is in [api-security](../api-security/).

## Install

```bash
npx skills add LeahyCC/claude-skills@typescript-safety
```

Or inside Claude Code:

```text
/plugin install typescript-safety --marketplace LeahyCC/claude-skills
```

## What it does

Use it when you edit a tsconfig, fix a type error, remove `any` or casts, design the types for a module, or upgrade to TS 7. The entry file is a procedure and a symptom table. Each resource owns one topic, with FAIL and PASS samples and a "use when / not when" for each pattern.

Every TypeScript sample, except four marked skips, is type-checked in CI with TS 7.0.2 and 6.0.3, under the baseline tsconfig the skill recommends. FAIL samples must fail where they say they do.

Version 0.1.0. Nine resources.

## Coverage

| File | Topics |
| --- | --- |
| [config.md](./resources/config.md) | 6.0 default changes, the baseline tsconfig, flags past strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `module` by runtime, the empty `types` default |
| [upgrade-6-to-7.md](./resources/upgrade-6-to-7.md) | The upgrade path, `ignoreDeprecations`, `stableTypeOrdering`, removed options and syntax with error codes, type changes in 6.0 to 7.1, what 7.0 does not do yet |
| [narrowing.md](./resources/narrowing.md) | Which narrowing tool to use, discriminated unions, exhaustive switches, inferred and hand-written predicates, assertion functions, narrowing in callbacks, unsound spots |
| [generics.md](./resources/generics.md) | When a type parameter earns its place, constraints, `keyof`, `satisfies`, `const` type parameters, `NoInfer` |
| [type-level.md](./resources/type-level.md) | Utility types, the `Omit` trap, mapped types and key remapping, conditional types and distribution, template literal types and the union limit, augmentation |
| [domain-types.md](./resources/domain-types.md) | Where types stop being true, untyped data at the edges, branded IDs and units, `readonly` inputs |
| [escape-hatches.md](./resources/escape-hatches.md) | A ranking of `any`, `as`, `!`, and comment directives, with what to use instead, and a grep to find them |
| [linting.md](./resources/linting.md) | Running typescript-eslint on TS 7 via the TS 6 alias, which config, rules no config turns on, a tested flat config |
| [node-and-emit.md](./resources/node-and-emit.md) | Three ways TS becomes JS, Node type stripping by version, erasable syntax, `verbatimModuleSyntax` |

9 resource files.

## What's different

| Typical TypeScript skill | This skill |
| --- | --- |
| "Turn on strict" | `strict` is the default since 6.0. Covers the flags it leaves off. |
| `moduleResolution: "node"`, `baseUrl` | Both are removed in TS 7. The upgrade table gives the replacement and the error code. |
| No mention of TS 7 | The Go compiler, what it does not do yet, and how to keep typescript-eslint working |
| `any` in examples | No `any` in PASS samples. `unknown` and narrowing. |
| Samples nobody compiled | Samples type-checked on 7.0.2 and 6.0.3 (four marked skips). FAIL samples must fail. |
| Patterns without limits | Each pattern says when not to use it |

Checked sources and how the samples were tested are in [SOURCES.md](./SOURCES.md).

## License

[MIT](../../LICENSE)
