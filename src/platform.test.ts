import { arch, platform } from "node:os";
import { describe, expect, test, vi } from "vitest";
import { getArch, getPlatform } from "./platform.js";

vi.mock(import("node:os"));

describe("getPlatform", () => {
  test.each([{ val: "linux" }, { val: "darwin" }, { val: "win32" }] as const)(
    "returns $val",
    ({ val }) => {
      vi.mocked(platform).mockReturnValue(val);
      expect(getPlatform()).toBe(val);
    },
  );

  test("throws for unsupported platform", () => {
    vi.mocked(platform).mockReturnValue("freebsd");
    expect(() => getPlatform()).toThrow("Unsupported platform: freebsd");
  });
});

describe("getArch", () => {
  test.each([{ val: "x64" }, { val: "arm64" }] as const)(
    "returns $val",
    ({ val }) => {
      vi.mocked(arch).mockReturnValue(val);
      expect(getArch()).toBe(val);
    },
  );

  test("throws for unsupported arch", () => {
    vi.mocked(arch).mockReturnValue("ia32");
    expect(() => getArch()).toThrow("Unsupported arch: ia32");
  });
});
