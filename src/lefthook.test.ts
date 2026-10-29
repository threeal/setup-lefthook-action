import { describe, expect, test } from "vitest";
import { getLefthookAsset } from "./lefthook.js";

describe("getLefthookAsset", { concurrent: true }, () => {
  const combinations = ["1.13.0", "2.1.0"].flatMap((version) =>
    ["linux", "darwin", "win32"].flatMap((platform) =>
      ["x64", "arm64"].map((arch) => ({ version, platform, arch })),
    ),
  );

  test("returns a unique URL for each combination", () => {
    const urls = combinations.map(
      ({ version, platform, arch }) =>
        getLefthookAsset(version, platform, arch).url,
    );
    expect(new Set(urls).size).toBe(combinations.length);
  });

  test.each(combinations)(
    "returns an accessible URL for $version/$platform/$arch",
    { timeout: 30000 },
    async ({ version, platform, arch }) => {
      const { url } = getLefthookAsset(version, platform, arch);
      const res = await fetch(url, { method: "HEAD" });
      expect(res.ok).toBe(true);
    },
  );

  test("names the executable for the platform", () => {
    expect(getLefthookAsset("2.1.0", "linux", "x64").fileName).toBe("lefthook");
    expect(getLefthookAsset("2.1.0", "win32", "x64").fileName).toBe(
      "lefthook.exe",
    );
  });

  test("throws for an unsupported platform", () => {
    expect(() => getLefthookAsset("2.1.0", "freebsd", "x64")).toThrow(
      "Unsupported platform: freebsd",
    );
  });

  test("throws for an unsupported arch", () => {
    expect(() => getLefthookAsset("2.1.0", "linux", "ia32")).toThrow(
      "Unsupported arch: ia32",
    );
  });
});
