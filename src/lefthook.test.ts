import { describe, expect, test } from "vitest";
import {
  fetchLatestLefthookVersion,
  getLefthookBinaryName,
  getLefthookDownloadUrl,
  parseLatestLefthookVersion,
} from "./lefthook.js";

describe("parseLatestLefthookVersion", () => {
  test("parses version from redirect location", () => {
    const res = new Response(null, {
      status: 302,
      headers: {
        location:
          "https://github.com/evilmartians/lefthook/releases/tag/v1.2.3",
      },
    });
    expect(parseLatestLefthookVersion(res)).toBe("1.2.3");
  });

  test("throws when response is not a redirect", () => {
    const res = new Response(null, { status: 200, statusText: "OK" });
    expect(() => parseLatestLefthookVersion(res)).toThrow(
      "Expected 302 redirect, but got 200 (OK)",
    );
  });

  test("throws when location header is missing", () => {
    const res = new Response(null, { status: 302 });
    expect(() => parseLatestLefthookVersion(res)).toThrow(
      "Redirect response is missing the location header",
    );
  });
});

describe("fetchLatestLefthookVersion", () => {
  test("fetches the latest version", async () => {
    const version = await fetchLatestLefthookVersion();
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

describe("getLefthookBinaryName", () => {
  test("returns lefthook for non-Windows platforms", () => {
    expect(getLefthookBinaryName("linux")).toBe("lefthook");
    expect(getLefthookBinaryName("darwin")).toBe("lefthook");
  });

  test("returns lefthook.exe for Windows", () => {
    expect(getLefthookBinaryName("win32")).toBe("lefthook.exe");
  });
});

describe("getLefthookDownloadUrl", { concurrent: true }, () => {
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
      getLefthookDownloadUrl({ version, platform, arch }),
    );
    expect(new Set(urls).size).toBe(combinations.length);
  });

  test.each(combinations)(
    "returns accessible URL for $platform/$arch",
    { timeout: 30000 },
    async ({ platform, arch }) => {
      const url = getLefthookDownloadUrl({ version, platform, arch });
      const res = await fetch(url, { method: "HEAD" });
      expect(res.ok).toBe(true);
    },
  );

  test("throws when platform is unsupported", () => {
    expect(() =>
      getLefthookDownloadUrl({ version, platform: "freebsd", arch: "x64" }),
    ).toThrow("Unsupported platform: freebsd");
  });

  test("throws when arch is unsupported", () => {
    expect(() =>
      getLefthookDownloadUrl({ version, platform: "linux", arch: "ia32" }),
    ).toThrow("Unsupported arch: ia32");
  });
});
