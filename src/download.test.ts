import { mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { downloadFile } from "./download.js";

const tmpDir = path.resolve(import.meta.dirname, ".download.test.tmp");

beforeAll(() => mkdir(tmpDir, { recursive: true }));

afterAll(() => rm(tmpDir, { recursive: true, force: true }));

describe("downloadFile", { concurrent: true }, () => {
  test("downloads a file", async () => {
    const dest = path.join(tmpDir, "LICENSE");
    await downloadFile(
      "https://raw.githubusercontent.com/evilmartians/lefthook/refs/heads/master/LICENSE",
      dest,
    );
    const data = await readFile(dest, "utf8");
    expect(data).toContain("MIT License");
  });

  test("fails to download a file", async () => {
    await expect(
      downloadFile(
        "https://raw.githubusercontent.com/evilmartians/lefthook/refs/heads/master/LICENSEe",
        path.join(tmpDir, "LICENSEe"),
      ),
    ).rejects.toThrow();
  });
});
