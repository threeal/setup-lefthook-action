import { describe, expect, test } from "vitest";
import {
  fetchLatestLefthookVersion,
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
    const urls = combinations.map(({ platform, arch }) => {
      const { baseUrl, stem, ext } = getLefthookDownloadUrl({
        version,
        platform,
        arch,
      });
      return `${baseUrl}/${stem}${ext}`;
    });
    expect(new Set(urls).size).toBe(combinations.length);
  });

  test.each(combinations)(
    "returns accessible URL for $platform/$arch",
    { timeout: 30000 },
    async ({ platform, arch }) => {
      const { baseUrl, stem, ext } = getLefthookDownloadUrl({
        version,
        platform,
        arch,
      });
      const res = await fetch(`${baseUrl}/${stem}${ext}`, { method: "HEAD" });
      expect(res.ok).toBe(true);
    },
  );
});
