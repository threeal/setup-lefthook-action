import { describe, expect, test } from "vitest";
import { getLefthookDownloadUrl } from "./lefthook.js";

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
