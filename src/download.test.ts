import fsPromises from "node:fs/promises";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { downloadFile } from "./download.js";

const tmpDir = path.resolve(import.meta.dirname, ".download.test.tmp");

describe("download files", { concurrent: true }, () => {
  beforeAll(() => fsPromises.mkdir(tmpDir, { recursive: true }));

  afterAll(() => fsPromises.rm(tmpDir, { recursive: true, force: true }));

  it("should download a file", async () => {
    const dest = path.join(tmpDir, "LICENSE");
    await downloadFile(
      "https://raw.githubusercontent.com/evilmartians/lefthook/refs/heads/master/LICENSE",
      dest,
    );
    const data = await fsPromises.readFile(dest, "utf8");
    expect(data).toContain("MIT License");
  });

  it("should fail to download a file", async () => {
    await expect(
      downloadFile(
        "https://raw.githubusercontent.com/evilmartians/lefthook/refs/heads/master/LICENSEe",
        path.join(tmpDir, "LICENSEe"),
      ),
    ).rejects.toThrow();
  });
});
