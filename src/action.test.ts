import { addPath, getInput, setOutput } from "ghakit/io";
import { beginLogGroup, endLogGroup, logCommand, logInfo } from "ghakit/log";
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
import { resolveVersion } from "./version.js";

const execFileAsync = promisify(execFile);

vi.mock(import("ghakit/io"));
vi.mock(import("ghakit/log"));
vi.mock(import("ghakit/vars"));
vi.mock(import("./version.js"));

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
  let logs: string[] = [];

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

  beforeEach(() => {
    logs = [];

    vi.mocked(logInfo).mockImplementation((message) => logs.push(message));
    vi.mocked(logCommand).mockImplementation((command, ...args) =>
      logs.push(`[command] ${command} ${args.length.toString()}`),
    );

    vi.mocked(beginLogGroup).mockImplementation((name) =>
      logs.push(`[begin] ${name}`),
    );

    vi.mocked(endLogGroup).mockImplementation(() => logs.push("[end]"));

    vi.mocked(getRunnerToolCache).mockReturnValue(join(tmpDir, "cache"));
  });

  test("downloads binary when not cached", { timeout: 60000 }, async () => {
    vi.mocked(resolveVersion).mockResolvedValue("2.1.0");

    await setupLefthookAction();

    expect(setOutput).toHaveBeenCalledWith("version", "2.1.0");
    expect(logs).toStrictEqual([
      "[begin] Download Lefthook 2.1.0",
      "Create directory",
      "[command] curl 4",
      "Set file permissions",
      "[end]",
      "Add Lefthook to PATH",
    ]);

    await assertLefthookVersion("2.1.0");
  });

  test("uses cached binary when available", async () => {
    vi.mocked(getInput).mockReturnValue("");
    vi.mocked(resolveVersion).mockResolvedValue("2.1.0");

    await setupLefthookAction();

    expect(setOutput).toHaveBeenCalledWith("version", "2.1.0");
    expect(logs).toStrictEqual([
      "Use cached Lefthook 2.1.0",
      "Add Lefthook to PATH",
    ]);

    await assertLefthookVersion("2.1.0");
  });
});
