# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
pnpm test                 # run all tests (Vitest)
pnpm test <file>          # run a single test file
pnpm tsc                  # type check
pnpm eslint .             # lint
pnpm prettier --check .   # check formatting
pnpm prettier --write .   # fix formatting
pnpm rollup -c            # build — outputs dist/main.bundle.mjs
```

Pre-commit hooks are managed by [Lefthook](https://lefthook.dev/), set up with `lefthook install`. Hooks automatically run formatting, linting, type checking, and building before each commit. CI also validates the pre-commit hook by running `lefthook run pre-commit --all-files`.

## Architecture

This is a JavaScript GitHub Action that downloads and sets up the latest Lefthook binary on all GitHub-hosted runner platforms (Linux x64/arm64, macOS x64/arm64, Windows x64/arm64).

The entry point is `dist/main.bundle.mjs`, produced by Rollup bundling `src/main.ts`. The `dist/` folder must be committed — CI verifies there is no git diff after building.

Source files in `src/`:

- `main.ts` — action entry point; fetches the latest version, computes the bin directory from `tmpdir()`, downloads the binary, and adds it to `PATH`
- `lefthook.ts` — `fetchLatestLefthookVersion()` (hits the GitHub releases latest URL with `redirect: "manual"`, parses the tag from the `Location` header, returns `{ tag, version }`), `getLefthookBinaryName(platform)` (returns `lefthook` or `lefthook.exe`), `getLefthookDownloadUrl({ tag, version, platform, arch })` (pure URL builder), and `downloadLefthook({ tag, version, platform, arch, outputDir })` (creates the directory, downloads the binary via `curl`, and chmods it)

Tests use Vitest and must maintain 100% coverage (enforced in `vitest.config.ts`). `lefthook.test.ts` uses real network calls to test all functions including the actual binary download. `main.test.ts` is fully mock-based — it mocks `./lefthook.js`, `ghakit/io`, `ghakit/log`, and `node:os` (`tmpdir`, `arch`, `platform`).

The action is defined in `action.yml` with no inputs — it always installs the latest version.
