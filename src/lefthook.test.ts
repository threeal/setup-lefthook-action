import { access, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  test,
  vi,
} from "vitest";
import { downloadLefthook, fetchLatestVersion } from "./lefthook.js";

const tmpDir = path.resolve(import.meta.dirname, ".lefthook.test.tmp");

beforeAll(() => mkdir(tmpDir, { recursive: true }));

afterAll(() => rm(tmpDir, { recursive: true, force: true }));

describe("fetchLatestVersion", () => {
  afterEach(() => vi.unstubAllGlobals());

  test("fetches the latest version", async () => {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const version = await fetchLatestVersion();
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test("fails when version cannot be resolved", async () => {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, statusText: "Not Found" }),
    );
    await expect(fetchLatestVersion()).rejects.toThrow(
      "Failed to resolve latest version: Not Found",
    );
  });
});

describe("downloadLefthook", () => {
  test("downloads Lefthook", async () => {
    const version = await fetchLatestVersion();
    const binDir = path.join(tmpDir, "lefthook");
    await downloadLefthook(binDir, version);
    await access(path.join(binDir, "lefthook"));
  });
});
