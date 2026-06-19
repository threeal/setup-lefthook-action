import { logError, logInfo } from "ghakit/log";
import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vitest";
import { verifyCache } from "./cache.js";

vi.mock(import("ghakit/log"));

beforeEach(() => vi.clearAllMocks());

const tmpDir = resolve(
  import.meta.dirname,
  `.${basename(import.meta.filename)}.tmp`,
);

beforeAll(async () => {
  await rm(tmpDir, { force: true, recursive: true });
  await mkdir(tmpDir, { recursive: true });
});

afterAll(() => rm(tmpDir, { force: true, recursive: true }));

describe("verifyCache", () => {
  let logs: string[] = [];

  beforeEach(() => {
    logs = [];
    vi.mocked(logInfo).mockImplementation((message) => logs.push(message));
    vi.mocked(logError).mockImplementation((err) =>
      logs.push(`[error] ${String(err)}`),
    );
  });

  test("returns false when cache does not exist", async () => {
    const result = await verifyCache(join(tmpDir, "nonexistent"));

    expect(result).toBe(false);
    expect(logs).toStrictEqual([]);
  });

  test("returns false and removes cache when path is not a directory", async () => {
    const cacheDir = join(tmpDir, "not-a-dir");
    await writeFile(cacheDir, "");

    const result = await verifyCache(cacheDir);

    expect(result).toBe(false);
    expect(logs).toStrictEqual([
      "Verify Lefthook cache",
      "[error] Error: cache path is not a directory",
      "Remove Lefthook cache",
    ]);
    expect(await stat(cacheDir, { throwIfNoEntry: false })).toBeUndefined();
  });

  test("returns true when cache is a valid directory", async () => {
    const cacheDir = join(tmpDir, "valid-dir");
    await mkdir(cacheDir, { recursive: true });

    const result = await verifyCache(cacheDir);

    expect(result).toBe(true);
    expect(logs).toStrictEqual(["Verify Lefthook cache"]);
  });
});
