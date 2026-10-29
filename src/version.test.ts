import { describe, expect, test } from "vitest";
import {
  fetchLatestLefthookVersion,
  parseVersionFromRedirectResponse,
} from "./version.js";

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
