# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## About This Repository

This is a JavaScript GitHub Action that downloads and sets up a Lefthook binary on all GitHub-hosted runner platforms (Linux x64/arm64, macOS x64/arm64, Windows x64/arm64).

## Architecture

### Source Files

- **`src/main.ts`** — Entry point that calls the action function and handles error logging and exit codes.
- **`src/action.ts`** — The action implementation; downloads the binary into the runner tool cache if not already cached, and adds it to `PATH`.
- **`src/action.test.ts`** — Integration tests for the action with a mocked GitHub Actions environment and a real binary download.
- **`src/version.ts`** — Version resolution: reads the `version` input or fetches the latest from GitHub releases by following the redirect on the releases/latest URL.
- **`src/version.test.ts`** — Tests for `parseVersionFromRedirectResponse` and `resolveVersion`, including a live network call to fetch the latest version.
- **`src/download.ts`** — Download utilities: `getDownloadComponents` builds the URL components (`baseUrl`, `stem`, `ext`) for a given version, platform, and arch; `downloadBinary` downloads the binary to a directory and sets file permissions.
- **`src/download.test.ts`** — Tests for `getDownloadComponents` and `downloadBinary`, including live network calls.
- **`src/platform.ts`** — Platform and arch type definitions (`Platform`, `Arch`) and validated accessors (`getPlatform`, `getArch`) that throw on unsupported values.
- **`src/platform.test.ts`** — Tests for `getPlatform` and `getArch`, using mocked `node:os` to cover all supported values and unsupported error paths.

### TypeScript Configuration

- **`tsconfig.json`** — Type-check config with `noEmit: true`; used by `pnpm tsc`. Extends `@tsconfig/node24`, which sets `module: nodenext` and `moduleResolution: node16`. This requires import paths to use `.js` extensions even when importing `.ts` source files.

### Build Configuration

- **`tsup.config.ts`** — Configures tsup to bundle `src/main.ts` as ESM with tree-shaking enabled.

### Build Output

- **`dist/main.js`** — Single bundled ESM file. Must be committed — CI verifies there is no git diff after building.

### Action Definition

- **`action.yml`** — Declares one optional input (`version`), one output (`version` — the installed version), branding, and the Node.js runtime pointing to `dist/main.js`.

## Tooling

- **pnpm** is the package manager. It uses `use-node-version` in `.npmrc` to select the Node.js version; `packageManager` in `package.json` pins the pnpm version; `engines.node` asserts Node >=24.
- **tsup** is the bundler. All packages — including runtime dependencies like `ghakit` — belong in `devDependencies`; tsup bundles everything so there are no runtime `dependencies` needed.
- **ghakit** handles all GitHub Actions-specific concerns: reading inputs, writing outputs, logging, and spawning processes.
- **ESLint** uses flat config (`eslint.config.ts`) with `@eslint/js` recommended rules and `typescript-eslint` strict + stylistic type-checked rules.
- **Prettier** uses `prettier-plugin-organize-imports` — import order is auto-managed.
- **Lefthook** manages Git hooks via `lefthook.yaml`. It is a standalone binary, not a pnpm package.
- **Vitest** uses `vitest.config.ts` with coverage always enabled, text reporter, and 100% thresholds across all metrics.
- **Dependabot** keeps GitHub Actions and npm dependencies up to date automatically via `.github/dependabot.yaml`.

## Testing

```sh
pnpm vitest run             # Run all tests
pnpm vitest run <file>      # Run a single test file
```

Coverage is always enabled and computed for all files imported during the test run. Running a single test file may fail the 100% threshold if it imports a source file that another test is responsible for fully covering — use the full suite for accurate results.

## Checking and Fixing

Use Lefthook to run the same steps as the pre-commit hook:

```sh
lefthook run pre-commit              # staged files only (default)
lefthook run pre-commit --all-files  # all files — matches what CI runs
```

This installs dependencies, fixes formatting, fixes lint, type-checks, and builds the action — in that order, stopping on the first failure. If any file changes during the run, it also fails and shows a diff of what changed — re-stage the changed files and retry.

Individual commands (manual fallback if needed): `pnpm prettier --write .`, `pnpm eslint --fix`, `pnpm tsc`, `pnpm tsup`.

## CI

CI has two jobs:

- **Check** — runs `lefthook run pre-commit --all-files` (install, format, lint, type-check, build), then runs the full test suite with `pnpm vitest run`.
- **Test** — checks out the action itself and runs it on `ubuntu-24.04`, `ubuntu-24.04-arm`, `windows-2025`, `windows-11-arm`, `macos-15`, and `macos-15-intel` to verify the actual action behavior end-to-end.

See `.github/workflows/ci.yaml` for full details.
