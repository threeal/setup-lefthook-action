import { describe, expect, test } from "vitest";
import {
  fetchLatestLefthookVersion,
  findLefthookAsset,
  parseVersionFromRedirectResponse,
} from "./lefthook.js";

describe("parseVersionFromRedirectResponse", () => {
  test("parses version from redirect location", () => {
    const res = new Response(null, {
      status: 302,
      headers: {
        location:
          "https://github.com/evilmartians/lefthook/releases/tag/v1.2.3",
      },
    });
    expect(parseVersionFromRedirectResponse(res)).toBe("1.2.3");
  });

  test("throws when response is not a redirect", () => {
    const res = new Response(null, { status: 200, statusText: "OK" });
    expect(() => parseVersionFromRedirectResponse(res)).toThrow(
      "Expected 302 redirect, but got 200 (OK)",
    );
  });

  test("throws when location header is missing", () => {
    const res = new Response(null, { status: 302 });
    expect(() => parseVersionFromRedirectResponse(res)).toThrow(
      "Redirect response is missing the location header",
    );
  });
});

describe("fetchLatestLefthookVersion", { concurrent: true }, () => {
  test("returns the latest version", async () => {
    const version = await fetchLatestLefthookVersion();
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

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
    "returns the executable type and name for the platform",
    { timeout: 30000 },
    async () => {
      const asset = await findLefthookAsset("2.1.0", "linux", "x64");
      expect(asset).toMatchObject({ type: "binary", fileName: "lefthook" });

      const winAsset = await findLefthookAsset("2.1.0", "win32", "x64");
      expect(winAsset).toMatchObject({ type: "exe", fileName: "lefthook.exe" });
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
