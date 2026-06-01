# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
pnpm vitest run           # run all tests (Vitest)
pnpm vitest run <file>    # run a single test file
pnpm tsc                  # type check
pnpm eslint .             # lint
pnpm prettier --check .   # check formatting
pnpm prettier --write .   # fix formatting
pnpm rollup -c            # build — outputs dist/main.bundle.mjs
```

Pre-commit hooks are managed by [Lefthook](https://lefthook.dev/), set up with `lefthook install`. Hooks automatically run formatting, linting, type checking, and building before each commit. CI also validates the pre-commit hook by running `lefthook run pre-commit --all-files`.

## Architecture

This is a JavaScript GitHub Action that downloads and sets up a Lefthook binary on all GitHub-hosted runner platforms (Linux x64/arm64, macOS x64/arm64, Windows x64/arm64).

The entry point is `dist/main.bundle.mjs`, produced by Rollup bundling `src/main.ts`. The `dist/` folder must be committed — CI verifies there is no git diff after building.

Source files in `src/`:

- `main.ts` — action entry point; calls `setupLefthookAction()` and handles top-level errors by logging and setting `process.exitCode = 1`
- `action.ts` — `setupLefthookAction()` — reads the `version` input via `getInput("version")` from `ghakit/io`; if set, uses it directly; otherwise logs and fetches the latest version. Checks if `RUNNER_TOOL_CACHE/lefthook/<version>/` (via `getRunnerToolCache()` from `ghakit/vars`) already exists; if so, logs and adds the cached directory to `PATH`; otherwise opens a log group, creates the cache directory, logs and runs `curl` to download the binary, chmods it, closes the log group, then adds the directory to `PATH`
- `lefthook.ts` — `fetchLatestLefthookVersion()` (hits the GitHub releases latest URL with `redirect: "manual"`, parses the tag from the `Location` header, returns `version` as a string), `getLefthookBinaryName(platform)` (returns `lefthook` or `lefthook.exe`), and `getLefthookDownloadUrl({ version, platform, arch })` (pure URL builder; derives tag as `v${version}` internally)

Tests use Vitest and must maintain 100% coverage (enforced in `vitest.config.ts`). `lefthook.test.ts` tests pure functions with no network calls. `action.test.ts` mocks `fetchLatestLefthookVersion`, `ghakit/vars` (to control the cache dir), and `ghakit/io`/`ghakit/log`; it collects all log calls (`logInfo`, `logCommand`, `beginLogGroup`, `endLogGroup`) into a unified `logs` array for ordered assertions; it performs a real binary download, verifies the cached path is reused, and confirms `fetchLatestLefthookVersion` is skipped when `getInput("version")` returns a value.

The action is defined in `action.yml` with one optional input: `version` (defaults to empty, which installs the latest version).
