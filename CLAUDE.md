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

This is a Node.js 24 GitHub Action that downloads and sets up the latest Lefthook binary on x64 Ubuntu runners.

The entry point is `dist/main.bundle.mjs`, produced by Rollup bundling `src/main.ts`. The `dist/` folder must be committed — CI verifies there is no git diff after building.

Source files in `src/`:

- `main.ts` — action entry point; fetches the latest version, computes the bin directory from `tmpdir()`, creates the directory, downloads the binary, chmods it, and adds it to `PATH`
- `lefthook.ts` — `fetchLatestVersion()` (GitHub API, returns `{ tag, version }`) and `getDownloadUrl(tag, version)` (pure URL builder)
- `download.ts` — `downloadFile(url, dest)` using `curl`

Tests use Vitest and must maintain 100% coverage (enforced in `vitest.config.ts`). `download.test.ts`, `lefthook.test.ts`, and `main.test.ts` use real network calls; `main.test.ts` mocks `gha-utils` and `node:os`.

The action is defined in `action.yml` with no inputs — it always installs the latest version.
