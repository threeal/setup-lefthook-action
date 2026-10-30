import { describe, expect, test } from "vitest";
import { findLefthookAsset } from "./lefthook.js";

describe("findLefthookAsset", { concurrent: true }, () => {
  const combinations = ["1.13.0", "2.1.0"].flatMap((version) =>
    ["linux", "darwin", "win32"].flatMap((platform) =>
      ["x64", "arm64"].map((arch) => ({ version, platform, arch })),
    ),
  );

  test(
    "returns a unique URL for each combination",
    { timeout: 30000 },
    async () => {
      const assets = await Promise.all(
        combinations.map(({ version, platform, arch }) =>
          findLefthookAsset(version, platform, arch),
        ),
      );
      const urls = assets.map(({ url }) => url);
      expect(new Set(urls).size).toBe(combinations.length);
    },
  );

  test.each(combinations)(
    "finds the asset for $version/$platform/$arch",
    { timeout: 30000 },
    async ({ version, platform, arch }) => {
      const { url } = await findLefthookAsset(version, platform, arch);
      expect(url).toContain(`/v${version}/`);
    },
  );

  test(
    "names the executable for the platform",
    { timeout: 30000 },
    async () => {
      const asset = await findLefthookAsset("2.1.0", "linux", "x64");
      expect(asset.fileName).toBe("lefthook");

      const winAsset = await findLefthookAsset("2.1.0", "win32", "x64");
      expect(winAsset.fileName).toBe("lefthook.exe");
    },
  );

  test("throws for an unsupported platform", async () => {
    await expect(findLefthookAsset("2.1.0", "freebsd", "x64")).rejects.toThrow(
      "Unsupported platform: freebsd",
    );
  });

  test("throws for an unsupported arch", async () => {
    await expect(findLefthookAsset("2.1.0", "linux", "ia32")).rejects.toThrow(
      "Unsupported arch: ia32",
    );
  });

  test(
    "throws for a build that isn't provided",
    { timeout: 30000 },
    async () => {
      await expect(findLefthookAsset("0.0.0", "linux", "x64")).rejects.toThrow(
        "Lefthook does not provide a build of version 0.0.0 for linux/x64",
      );
    },
  );

  test("throws for a failed request", { timeout: 30000 }, async () => {
    // GitHub rejects the malformed `%` in the release URL with 400 Bad Request.
    await expect(findLefthookAsset("%", "linux", "x64")).rejects.toThrow(
      "Failed to find Lefthook build at https://github.com/evilmartians/lefthook/releases/download/v%/lefthook_%_Linux_x86_64: Bad Request",
    );
  });
});
