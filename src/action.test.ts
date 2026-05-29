import { addPath } from "ghakit/io";
import { logInfo } from "ghakit/log";
import { getRunnerToolCache } from "ghakit/vars";
import { execFile } from "node:child_process";
import { mkdir, rm } from "node:fs/promises";
import { delimiter, join, resolve } from "node:path";
import { promisify } from "node:util";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vitest";
import { setupLefthookAction } from "./action.js";
import { fetchLatestLefthookVersion } from "./lefthook.js";

const execFileAsync = promisify(execFile);

vi.mock(import("ghakit/io"));
vi.mock(import("ghakit/log"));
vi.mock(import("ghakit/vars"));

vi.mock(import("./lefthook.js"), async (importActual) => ({
  ...(await importActual()),
  fetchLatestLefthookVersion: vi.fn(),
}));

const tmpDir = resolve(import.meta.dirname, ".action.test.tmp");

beforeAll(async () => {
  await rm(tmpDir, { force: true, recursive: true });
  await mkdir(tmpDir, { recursive: true });
});

afterAll(() => rm(tmpDir, { force: true, recursive: true }));

describe("setupLefthookAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(fetchLatestLefthookVersion).mockResolvedValue({
      tag: "v2.1.8",
      version: "2.1.8",
    });

    vi.mocked(getRunnerToolCache).mockReturnValue(join(tmpDir, "cache"));
  });

  test("downloads binary and adds it to PATH", { timeout: 60000 }, async () => {
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

  test("uses cached binary when available", { timeout: 10000 }, async () => {
    await setupLefthookAction();

    expect(vi.mocked(logInfo).mock.calls).toStrictEqual([
      ["Fetching latest Lefthook version..."],
      ["Using cached Lefthook 2.1.8..."],
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
