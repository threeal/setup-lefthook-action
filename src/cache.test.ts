import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { verifyCache } from "./cache.js";

describe("verifyCache", { concurrent: true }, () => {
  let tmpDir: string;

  beforeAll(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "setup-lefthook-action-"));
  });

  afterAll(() => rm(tmpDir, { force: true, recursive: true }));

  test("returns false for a missing cache", async () => {
    await expect(verifyCache(join(tmpDir, "missing"))).resolves.toBe(false);
  });

  test("returns true for a cache directory", async () => {
    const cacheDir = join(tmpDir, "directory");
    await mkdir(cacheDir);
    await expect(verifyCache(cacheDir)).resolves.toBe(true);
  });

  test("throws for a cache path that isn't a directory", async () => {
    const cacheDir = join(tmpDir, "file");
    await writeFile(cacheDir, "");
    await expect(verifyCache(cacheDir)).rejects.toThrow(
      `Lefthook cache path is not a directory: ${cacheDir}`,
    );
  });
});
