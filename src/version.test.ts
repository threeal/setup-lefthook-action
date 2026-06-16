import { getInput } from "ghakit/io";
import { logInfo } from "ghakit/log";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { parseVersionFromRedirectResponse, resolveVersion } from "./version.js";

vi.mock(import("ghakit/io"));
vi.mock(import("ghakit/log"));

beforeEach(() => vi.clearAllMocks());

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

describe("resolveVersion", () => {
  test("throws when version input is empty", async () => {
    vi.mocked(getInput).mockReturnValue("");

    await expect(resolveVersion()).rejects.toThrow(
      "version input must not be empty",
    );

    expect(vi.mocked(logInfo).mock.calls).toStrictEqual([]);
  });

  test("fetches and returns latest version when input is 'latest'", async () => {
    vi.mocked(getInput).mockReturnValue("latest");

    const version = await resolveVersion();

    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(vi.mocked(logInfo).mock.calls).toStrictEqual([
      ["Fetch latest Lefthook version"],
    ]);
  });

  test("returns version as-is when input is a version number", async () => {
    vi.mocked(getInput).mockReturnValue("2.1.0");

    const version = await resolveVersion();

    expect(version).toBe("2.1.0");
    expect(vi.mocked(logInfo).mock.calls).toStrictEqual([]);
  });
});
