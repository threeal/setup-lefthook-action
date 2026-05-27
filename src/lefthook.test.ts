import { afterEach, describe, expect, test, vi } from "vitest";
import {
  fetchLatestVersion,
  getBinaryName,
  getDownloadUrl,
} from "./lefthook.js";

describe("fetchLatestVersion", () => {
  afterEach(() => vi.unstubAllGlobals());

  test("fetches the latest version", async () => {
    const { tag, version } = await fetchLatestVersion();
    expect(tag).toMatch(/^v\d+\.\d+\.\d+$/);
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test("fails when the response is not a redirect", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ status: 200, statusText: "OK" }),
    );
    await expect(fetchLatestVersion()).rejects.toThrow(
      "Expected 302 redirect, but got 200 (OK)",
    );
  });

  test("fails when the location header is missing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 302,
        headers: { get: () => null },
      }),
    );
    await expect(fetchLatestVersion()).rejects.toThrow(
      "Redirect response is missing the location header",
    );
  });
});

describe("getBinaryName", () => {
  test("returns lefthook for non-Windows platforms", () => {
    expect(getBinaryName("linux")).toBe("lefthook");
    expect(getBinaryName("darwin")).toBe("lefthook");
  });

  test("returns lefthook.exe for Windows", () => {
    expect(getBinaryName("win32")).toBe("lefthook.exe");
  });
});

describe("getDownloadUrl", () => {
  const tag = "v1.10.0";
  const version = "1.10.0";

  const combinations = [
    { platform: "linux", arch: "x64" },
    { platform: "linux", arch: "arm64" },
    { platform: "darwin", arch: "x64" },
    { platform: "darwin", arch: "arm64" },
    { platform: "win32", arch: "x64" },
    { platform: "win32", arch: "arm64" },
  ] as const;

  test("returns unique URLs for each combination", () => {
    const urls = combinations.map(({ platform, arch }) =>
      getDownloadUrl({ tag, version, platform, arch }),
    );
    expect(new Set(urls).size).toBe(combinations.length);
  });

  for (const { platform, arch } of combinations) {
    test(
      `returns accessible URL for ${platform}/${arch}`,
      { timeout: 30000 },
      async () => {
        const url = getDownloadUrl({ tag, version, platform, arch });
        const res = await fetch(url, { method: "HEAD" });
        expect(res.ok).toBe(true);
      },
    );
  }

  test("throws on unsupported platform", () => {
    expect(() =>
      getDownloadUrl({ tag, version, platform: "freebsd", arch: "x64" }),
    ).toThrow("Unsupported platform: freebsd");
  });

  test("throws on unsupported arch", () => {
    expect(() =>
      getDownloadUrl({ tag, version, platform: "linux", arch: "ia32" }),
    ).toThrow("Unsupported arch: ia32");
  });
});
