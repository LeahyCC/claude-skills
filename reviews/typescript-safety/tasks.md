# TypeScript safety skill tasks and acceptance criteria

Written 2026-10-23, before any model run. Run each prompt against Claude with the skill and without it, as in the Next.js pilot. Score each criterion 0 or 1. One run per task is exploratory, not a statistical estimate.

Status: **not run.** Model runs need Colin's approval first.

## Behaviour

| ID | Prompt | Acceptance criteria |
| --- | --- | --- |
| T1 | "I upgraded to TypeScript 7 and the build fails." Fixture: a tsconfig with `baseUrl: "."`, `moduleResolution: "node"`, `paths: { "@/*": ["src/*"] }`, and no `types`. Code uses `process.env`. | Names TS 7 removals. Replaces `moduleResolution` with `bundler` or `nodenext` to match the project. Removes `baseUrl` and makes `paths` targets start with `./`. Adds `"types": ["node"]` and says why (6.0 default is `[]`). Does not suggest `ignoreDeprecations` as the fix. Runs or asks for `tsc --noEmit`. |
| T2 | "ESLint crashes since I installed TypeScript 7." Fixture: package.json with `typescript@^7.0.2` and `typescript-eslint@^8.72.0`. | Explains TS 7.0 has no compiler API and typescript-eslint supports `<6.1.0`. Gives the npm alias setup with `@typescript/typescript6` and TS 7 under another name. Says `tsc` stays on 7. |
| T3 | "Clean up the types in this file." Fixture: `const user: User = await res.json()`, a `parse<T>(s: string): T` helper, `cache.get(k)!` after `cache.has(k)`, and one `// @ts-ignore`. | Changes `.json()` result to `unknown` and parses it. Replaces `parse<T>` with an `unknown` return. Replaces `has`/`get!` with one `get` and a check. Replaces `@ts-ignore` with a fix, or with `@ts-expect-error` and a reason. Adds no `any`. |
| T4 | "Add a 'refunded' status to this order flow." Fixture: `interface Order { status: 'paid' \| 'shipped'; trackingId?: string; refundId?: string }` and a switch over `status` with a `default` that returns `''`. | Suggests or makes a discriminated union so `trackingId` exists only on `shipped`. Adds an exhaustive check (`satisfies never` or `assertNever`) so the new member is enforced. Flags the silent `default`. |
| T5 | "Run this script with `node script.ts`, it errors." Fixture: a `.ts` file with `enum Level`, a class with `constructor(private db: Db)`, and `import { Config } from './config'` where `Config` is an interface. | Names Node type stripping. Replaces the enum with a const object and derived union, and the parameter property with a field. Adds `import type` and the `.ts` extension. Recommends `erasableSyntaxOnly` and `rewriteRelativeImportExtensions`. Says Node does not type-check, so run `tsc --noEmit`. |
| T6 | "Make these IDs safer, we keep passing the wrong one." Fixture: `function refund(orderId: string, customerId: string, amount: number)` called with arguments in the wrong order in one place. | Introduces branded types with one checking constructor each. Shows the wrong call failing to compile. Keeps the cast inside the constructor only. Mentions that JSON drops the brand. |

## Selection

The skill should load for the first ten and not for the last ten. TypeScript is in almost every repo, so the last ten are TypeScript files on other topics.

| ID | Prompt | Should load |
| --- | --- | --- |
| S1 | Turn on noUncheckedIndexedAccess and fix what breaks | yes |
| S2 | What does exactOptionalPropertyTypes do and should I enable it? | yes |
| S3 | Get rid of all the `any` types in src/api | yes |
| S4 | Why doesn't TypeScript narrow this union in my switch? | yes |
| S5 | We're upgrading from TypeScript 5.8 to 7, what breaks? | yes |
| S6 | Write a type that turns every property into a getter function | yes |
| S7 | My tsconfig has baseUrl and TS says it's been removed | yes |
| S8 | How do I make UserId and OrderId incompatible types? | yes |
| S9 | Set up typescript-eslint with type-aware rules | yes |
| S10 | Can I run my .ts file directly with Node without a build step? | yes |
| S11 | This React component re-renders on every keystroke, fix it (a .tsx file) | no (react-performance) |
| S12 | My Next.js page shows stale data after a server action (a .ts file) | no (nextjs-app-router) |
| S13 | Add Zod validation to this POST route handler | no (api-security) |
| S14 | Write a WebGPU compute shader in this TypeScript project | no (webgpu) |
| S15 | Improve the error message text in this form component | no (ux-copy) |
| S16 | Add a sitemap.ts to my Next.js app | no (seo) |
| S17 | This TypeScript function is slow on 100k rows, speed it up | no (spa-performance) |
| S18 | Write a unit test for formatPrice in utils.ts | no |
| S19 | Rename the `user` variable to `account` across this file | no |
| S20 | Add rate limiting to this Express route written in TypeScript | no (api-security) |
