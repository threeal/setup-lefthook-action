import { addPath, logError, logInfo } from "gha-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { downloadLefthook, fetchLatestVersion } from "./lefthook.js";

vi.mock("gha-utils", () => ({
  addPath: vi.fn(),
  logError: vi.fn(),
  logInfo: vi.fn(),
}));

vi.mock("node:os", () => ({
  tmpdir: vi.fn().mockReturnValue("/tmp"),
}));

vi.mock("./lefthook.js", () => ({
  downloadLefthook: vi.fn(),
  fetchLatestVersion: vi.fn(),
}));

describe("main", () => {
  beforeEach(() => {
    vi.mocked(fetchLatestVersion).mockResolvedValue("1.10.0");
    vi.mocked(downloadLefthook).mockResolvedValue(undefined);
    vi.mocked(addPath).mockResolvedValue(undefined);
    vi.resetModules();
    process.exitCode = undefined;
  });

  it("should set up Lefthook", async () => {
    await import("./main.js");

    expect(logInfo).toHaveBeenCalledWith("Downloading Lefthook 1.10.0...");
    expect(downloadLefthook).toHaveBeenCalledWith(
      "/tmp/lefthook/1.10.0",
      "1.10.0",
    );
    expect(addPath).toHaveBeenCalledWith("/tmp/lefthook/1.10.0");
    expect(process.exitCode).toBeUndefined();
  });

  it("should fail when Lefthook setup fails", async () => {
    const err = new Error("something went wrong");
    vi.mocked(fetchLatestVersion).mockRejectedValue(err);

    await import("./main.js");

    expect(logError).toHaveBeenCalledWith(err);
    expect(process.exitCode).toBe(1);
  });
});
