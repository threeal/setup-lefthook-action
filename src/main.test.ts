import { addPath, logError, logInfo } from "gha-utils";
import { access, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  expect,
  test,
  vi,
} from "vitest";

const tmpDir = path.resolve(import.meta.dirname, ".main.test.tmp");

vi.mock("gha-utils", () => ({
  addPath: vi.fn(),
  logError: vi.fn(),
  logInfo: vi.fn(),
}));

vi.mock("node:os", async () => {
  const actual = await vi.importActual<typeof import("node:os")>("node:os");
  return { ...actual, tmpdir: vi.fn().mockImplementation(() => tmpDir) };
});

beforeAll(() => mkdir(tmpDir, { recursive: true }));

afterAll(() => rm(tmpDir, { recursive: true, force: true }));

beforeEach(() => {
  vi.resetModules();
  process.exitCode = undefined;
});

afterEach(() => vi.unstubAllGlobals());

test("sets up Lefthook", { timeout: 60000 }, async () => {
  await import("./main.js");

  expect(logInfo).toHaveBeenNthCalledWith(
    1,
    "Fetching latest Lefthook version...",
  );
  expect(logInfo).toHaveBeenNthCalledWith(
    2,
    expect.stringMatching(/^Downloading Lefthook \d+\.\d+\.\d+\.\.\.$/),
  );
  const binDir = vi.mocked(addPath).mock.calls[0][0];
  await access(path.join(binDir, "lefthook"));
  expect(process.exitCode).toBeUndefined();
});

test("fails when Lefthook setup fails", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: false, statusText: "Not Found" }),
  );

  await import("./main.js");

  expect(logError).toHaveBeenCalledWith(expect.any(Error));
  expect(process.exitCode).toBe(1);
});
