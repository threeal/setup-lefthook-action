import { addPath, getInput } from "ghakit/io";
import { logInfo } from "ghakit/log";
import { getRunnerToolCache } from "ghakit/vars";
import { execFile } from "node:child_process";
import { mkdir, rm } from "node:fs/promises";
import { basename, delimiter, join, resolve } from "node:path";
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

beforeEach(() => vi.clearAllMocks());

const tmpDir = resolve(
  import.meta.dirname,
  `.${basename(import.meta.filename)}.tmp`,
);

beforeAll(async () => {
  await rm(tmpDir, { force: true, recursive: true });
  await mkdir(tmpDir, { recursive: true });
});

afterAll(() => rm(tmpDir, { force: true, recursive: true }));

describe("setupLefthookAction", () => {
  const assertLefthookVersion = async (version: string) => {
    const { stdout, stderr } = await execFileAsync("lefthook", ["--version"], {
      env: {
        PATH: vi
          .mocked(addPath)
          .mock.calls.map(([path]) => path)
          .join(delimiter),
      },
    });
    expect(stdout.trim()).toBe(`lefthook version ${version}`);
    expect(stderr.trim()).toBe("");
  };

  beforeEach(() =>
    vi.mocked(getRunnerToolCache).mockReturnValue(join(tmpDir, "cache")),
  );

  test("downloads latest version", { timeout: 60000 }, async () => {
    vi.mocked(getInput).mockReturnValue("");
    vi.mocked(fetchLatestLefthookVersion).mockResolvedValue("2.1.8");

    await setupLefthookAction();

    expect(vi.mocked(logInfo).mock.calls).toStrictEqual([
      ["Fetching latest Lefthook version..."],
      ["Downloading Lefthook 2.1.8..."],
    ]);

    await assertLefthookVersion("2.1.8");
  });

  test(
    "downloads specified version without fetching latest",
    { timeout: 60000 },
    async () => {
      vi.mocked(getInput).mockImplementation((name) =>
        name === "version" ? " 2.1.0\n" : "",
      );

      await setupLefthookAction();

      expect(fetchLatestLefthookVersion).not.toHaveBeenCalled();
      expect(vi.mocked(logInfo).mock.calls).toStrictEqual([
        ["Downloading Lefthook 2.1.0..."],
      ]);

      await assertLefthookVersion("2.1.0");
    },
  );

  test("uses cached binary when available", async () => {
    vi.mocked(getInput).mockReturnValue("");
    vi.mocked(fetchLatestLefthookVersion).mockResolvedValue("2.1.8");

    await setupLefthookAction();

    expect(vi.mocked(logInfo).mock.calls).toStrictEqual([
      ["Fetching latest Lefthook version..."],
      ["Using cached Lefthook 2.1.8..."],
    ]);

    await assertLefthookVersion("2.1.8");
  });
});
