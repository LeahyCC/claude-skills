# Fresh clone and environment

Bugs that never appear on the machine where the code was written, because that machine already has generated files on disk, `.git` present, cached packages hoisted, a case-insensitive file system, or a single Node version. They break the moment a reviewer, CI runner, or Docker container unpacks the repo.

## Contents

- [Gitignored files that the UI assumes exist](#gitignored-files-that-the-ui-assumes-exist)
- [`prepare` and `postinstall` hooks that assume `.git` exists](#prepare-and-postinstall-hooks-that-assume-git-exists)
- [Case-only file renames on macOS and Windows](#case-only-file-renames-on-macos-and-windows)
- [Phantom imports that only resolve under hoisted `node_modules`](#phantom-imports-that-only-resolve-under-hoisted-node_modules)
- [Over-tight `engines` pins that block supported Node LTS lines](#over-tight-engines-pins-that-block-supported-node-lts-lines)

## Gitignored files that the UI assumes exist

When a script generates fixtures, stress-test PDFs, SQLite databases, or compiled WASM into a folder listed in `.gitignore` (`public/stress/`, `data/seed.db`), those files sit on the author's disk for the rest of the project. Every local test sees them. Anyone who clones the repo or opens a zip gets an empty folder.

If the app has controls that use generated assets:

1. Probe whether the asset actually exists (checking `Content-Type`, not just `response.ok`; see [web-and-runtime.md](./web-and-runtime.md)).
2. Disable the controls when the asset is missing, and show the exact command that generates it (`Run pnpm stress to generate this set`).
3. Name the setup command in `README.md` right next to `pnpm dev`.

```ts
export interface DatasetOption {
  size: number
  disabled: boolean
  title: string
}

// BAD: enables 50, 200, and 500 before checking whether `pnpm stress` ran
export function buildDatasetOptionsBad(sizes: readonly number[]): DatasetOption[] {
  return sizes.map((size) => ({
    size,
    disabled: false,
    title: `The ${size} page set`,
  }))
}

// GOOD: disables the sets until the probe succeeds, and names the command in the hint
export function buildDatasetOptions(
  sizes: readonly number[],
  ready: boolean | null,
): DatasetOption[] {
  return sizes.map((size) => ({
    size,
    disabled: ready !== true,
    title: ready === false ? 'Run pnpm stress to generate this set' : `The ${size} page set`,
  }))
}
```

## `prepare` and `postinstall` hooks that assume `.git` exists

A `"prepare": "husky"` or `"prepare": "lefthook install"` script in `package.json` runs on every `npm install` and `pnpm install`. When a reviewer downloads a GitHub release archive, unpacks a submission zip, or runs `npm ci` in a Docker stage that copied only source files, there is no `.git` directory. If the hook tool exits non-zero when `.git` is missing, the entire `install` fails before the app can build.

Either let the package's own postinstall handle missing `.git`, or guard the script so a missing `.git` exits `0`.

```json
{
  "scripts": {
    "prepare": "node -e \"if (require('node:fs').existsSync('.git')) require('node:child_process').execSync('lefthook install', { stdio: 'inherit' })\""
  }
}
```

## Case-only file renames on macOS and Windows

APFS (macOS default) and NTFS (Windows default) are case-insensitive. Linux (`ext4`, `xfs`, every standard GitHub Actions and Docker runner) is case-sensitive.

If you rename `src/components/Button.tsx` to `src/components/button.tsx` in your editor without `git mv`, Git on macOS/Windows frequently keeps the old casing in the tree index while your updated import `from './button'` resolves fine locally. On Linux CI, `import './button'` fails with `Cannot find module './button'`.

Check tracked file casing with `git ls-files`, and use `git mv -f OldName.tsx temp.tsx && git mv -f temp.tsx newName.tsx` when fixing a case mismatch.

## Phantom imports that only resolve under hoisted `node_modules`

If your code imports a package (`zod`, `clsx`, `@radix-ui/react-slot`) that is a transitive dependency of one of your dependencies, npm and Yarn Berry's `node-modules` linker hoist it to the root `node_modules/`. The import works until the transitive parent drops or upgrades it, or until someone installs with strict isolation (`pnpm`).

Every package imported by files under `src/` must appear in `dependencies` in `package.json` (or `devDependencies` for test-only and build-only files).

## Over-tight `engines` pins that block supported Node LTS lines

Setting `"engines": { "node": "^24.0.0" }` with `engine-strict=true` refuses `pnpm install` on Node 22 LTS and Node 26 LTS even when every dependency and script runs cleanly on all three. Unless the codebase uses an API exclusive to one major line, allow every active and maintenance LTS line that passes `check` and `build`, and set the floor to the first minor that supports the features you use (for example, `^22.18.0 || ^24.0.0 || >=26.0.0` for native TypeScript script execution without flags).
