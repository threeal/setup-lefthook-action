import { afterEach, describe, expect, test, vi } from "vitest";
import { fetchLatestVersion, getDownloadUrl } from "./lefthook.js";

describe("fetchLatestVersion", () => {
  afterEach(() => vi.unstubAllGlobals());

  test("fetches the latest version", async () => {
    const { tag, version } = await fetchLatestVersion();
    expect(tag).toMatch(/^v\d+\.\d+\.\d+$/);
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test("fails when version cannot be resolved", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, statusText: "Not Found" }),
    );
    await expect(fetchLatestVersion()).rejects.toThrow(
      "Failed to resolve latest version: Not Found",
    );
  });
});

describe("getDownloadUrl", () => {
  test("builds the download URL", () => {
    expect(getDownloadUrl("v1.10.0", "1.10.0")).toBe(
      "https://github.com/evilmartians/lefthook/releases/download/v1.10.0/lefthook_1.10.0_Linux_x86_64",
    );
  });

  test("returns an accessible URL", async () => {
    const url = getDownloadUrl("v1.10.0", "1.10.0");
    const res = await fetch(url, { method: "HEAD" });
    expect(res.ok).toBe(true);
  });
});
