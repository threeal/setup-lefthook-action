import { describe, expect, test } from "vitest";
import { getDownloadComponents } from "./download.js";

describe("getDownloadComponents", { concurrent: true }, () => {
  const combinations = ["1.13.0", "2.1.0"].flatMap((version) =>
    (["linux", "darwin", "win32"] as const).flatMap((platform) =>
      (["x64", "arm64"] as const).map((arch) => ({
        version,
        platform,
        arch,
      })),
    ),
  );

  test("returns unique URLs for each combination", () => {
    const urls = combinations.map(({ version, platform, arch }) => {
      const { baseUrl, stem, ext } = getDownloadComponents({
        version,
        platform,
        arch,
      });
      return `${baseUrl}/${stem}${ext}`;
    });
    expect(new Set(urls).size).toBe(combinations.length);
  });

  test.each(combinations)(
    "returns accessible URL for $version/$platform/$arch",
    { timeout: 30000 },
    async ({ version, platform, arch }) => {
      const { baseUrl, stem, ext } = getDownloadComponents({
        version,
        platform,
        arch,
      });
      const res = await fetch(`${baseUrl}/${stem}${ext}`, { method: "HEAD" });
      expect(res.ok).toBe(true);
    },
  );
});
