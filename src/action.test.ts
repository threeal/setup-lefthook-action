import { addPath } from "ghakit/io";
import { logInfo } from "ghakit/log";
import { execFile } from "node:child_process";
import { delimiter } from "node:path";
import { promisify } from "node:util";
import { describe, expect, test, vi } from "vitest";
import { setupLefthookAction } from "./action.js";
import { fetchLatestLefthookVersion } from "./lefthook.js";

const execFileAsync = promisify(execFile);

vi.mock("ghakit/io");
vi.mock("ghakit/log");

vi.mock(import("./lefthook.js"), async (importActual) => ({
  ...(await importActual()),
  fetchLatestLefthookVersion: vi.fn(),
}));

describe("setupLefthookAction", () => {
  test("downloads binary and adds it to PATH", { timeout: 60000 }, async () => {
    vi.mocked(fetchLatestLefthookVersion).mockResolvedValue({
      tag: "v2.1.8",
      version: "2.1.8",
    });

    await setupLefthookAction();

    expect(vi.mocked(logInfo).mock.calls).toStrictEqual([
      ["Fetching latest Lefthook version..."],
      ["Downloading Lefthook 2.1.8..."],
    ]);

    const { stdout, stderr } = await execFileAsync("lefthook", ["--version"], {
      env: {
        PATH: vi
          .mocked(addPath)
          .mock.calls.map(([path]) => path)
          .join(delimiter),
      },
    });
    expect(stdout.trim()).toBe("lefthook version 2.1.8");
    expect(stderr.trim()).toBe("");
  });
});
