import fsPromises, { access } from "node:fs/promises";
import path from "node:path";
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { downloadLefthook, fetchLatestVersion } from "./lefthook.js";

const tmpDir = path.resolve(import.meta.dirname, ".lefthook.test.tmp");

describe("lefthook utilities", () => {
  beforeEach(async () => {
    await fsPromises.rm(tmpDir, { recursive: true, force: true });
    await fsPromises.mkdir(tmpDir);
  });

  afterAll(() => fsPromises.rm(tmpDir, { recursive: true, force: true }));

  afterEach(() => vi.unstubAllGlobals());

  it("should fetch the latest version", async () => {
    const version = await fetchLatestVersion();
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("should fail when version cannot be resolved", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, statusText: "Not Found" }),
    );
    await expect(fetchLatestVersion()).rejects.toThrow(
      "Failed to resolve latest version: Not Found",
    );
  });

  it("should download Lefthook", async () => {
    const version = await fetchLatestVersion();
    const binDir = path.join(tmpDir, "lefthook");
    await downloadLefthook(binDir, version);
    await access(path.join(binDir, "lefthook"));
  });
});
