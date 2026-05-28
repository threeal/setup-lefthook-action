import { addPath } from "ghakit/io";
import { logError, logInfo } from "ghakit/log";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { downloadLefthook, fetchLatestLefthookVersion } from "./lefthook.js";

vi.mock("ghakit/io", () => ({
  addPath: vi.fn(),
}));

vi.mock("ghakit/log", () => ({
  logError: vi.fn(),
  logInfo: vi.fn(),
}));

vi.mock("./lefthook.js", () => ({
  downloadLefthook: vi.fn(),
  fetchLatestLefthookVersion: vi
    .fn()
    .mockResolvedValue({ tag: "v1.10.0", version: "1.10.0" }),
}));

vi.mock("node:os", async () => {
  const actual = await vi.importActual<typeof import("node:os")>("node:os");
  return {
    ...actual,
    arch: vi.fn().mockReturnValue("x64"),
    platform: vi.fn().mockReturnValue("linux"),
    tmpdir: vi.fn().mockReturnValue("/tmp"),
  };
});

beforeEach(() => {
  vi.resetModules();
  process.exitCode = undefined;
});

afterEach(() => vi.unstubAllGlobals());

test("sets up Lefthook", async () => {
  await import("./main.js");

  expect(logInfo).toHaveBeenNthCalledWith(
    1,
    "Fetching latest Lefthook version...",
  );
  expect(logInfo).toHaveBeenNthCalledWith(2, "Downloading Lefthook 1.10.0...");
  expect(downloadLefthook).toHaveBeenCalledWith({
    tag: "v1.10.0",
    version: "1.10.0",
    platform: "linux",
    arch: "x64",
    outputDir: "/tmp/lefthook",
  });
  expect(addPath).toHaveBeenCalledWith("/tmp/lefthook");
  expect(process.exitCode).toBe(undefined);
});

test("fails when Lefthook setup fails", async () => {
  vi.mocked(fetchLatestLefthookVersion).mockRejectedValueOnce(
    new Error("Failed to resolve latest version: Not Found"),
  );

  await import("./main.js");

  expect(logError).toHaveBeenCalledWith(expect.any(Error));
  expect(process.exitCode).toBe(1);
});
