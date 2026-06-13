import { execFile } from "node:child_process";
import { mkdir, rm } from "node:fs/promises";
import { basename, delimiter, join, resolve } from "node:path";
import { promisify } from "node:util";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { setupLefthookAction, SetupLefthookActionDeps } from "./action.js";
import { fetchLatestLefthookVersion } from "./lefthook.js";

const execFileAsync = promisify(execFile);

const tmpDir = resolve(
  import.meta.dirname,
  `.${basename(import.meta.filename)}.tmp`,
);

beforeAll(async () => {
  await rm(tmpDir, { force: true, recursive: true });
  await mkdir(tmpDir, { recursive: true });
});

afterAll(() => rm(tmpDir, { force: true, recursive: true }));

describe("setupLefthookAction", { concurrent: true }, () => {
  interface Reference {
    logs: string[];
    paths: string[];
    outputs: Record<string, string>;
    latestVersion: string;
  }

  const mockDeps = ({
    runnerToolCache,
    versionInput,
  }: {
    runnerToolCache: string;
    versionInput: string;
  }) => {
    const ref: Reference = {
      logs: [],
      paths: [],
      outputs: {},
      latestVersion: "",
    };

    const deps: SetupLefthookActionDeps = {
      addPath: (path) => {
        ref.paths.push(path);
        return Promise.resolve();
      },
      beginLogGroup: (name) => ref.logs.push(`[begin] ${name}`),
      endLogGroup: () => ref.logs.push("[end]"),
      fetchLatestLefthookVersion: async () =>
        (ref.latestVersion = await fetchLatestLefthookVersion()),
      getInput: (name) => (name === "version" ? versionInput : ""),
      getRunnerToolCache: () => runnerToolCache,
      logCommand: (command, ...args) =>
        ref.logs.push(`[command] ${command} ${args.length.toString()}`),
      logInfo: (message) => ref.logs.push(message),
      setOutput: (name, value) => {
        ref.outputs[name] = value;
        return Promise.resolve();
      },
    };

    return { ref, deps };
  };

  const assertLefthookVersion = async (ref: Reference, version: string) => {
    const { stdout, stderr } = await execFileAsync("lefthook", ["--version"], {
      env: {
        PATH: ref.paths.join(delimiter),
      },
    });
    expect(stdout.trim()).toBe(`lefthook version ${version}`);
    expect(stderr.trim()).toBe("");
  };

  test("downloads latest version", { timeout: 60000 }, async () => {
    const { ref, deps } = mockDeps({
      runnerToolCache: join(tmpDir, "downloadsLatestVersion"),
      versionInput: "",
    });

    await setupLefthookAction(deps);

    expect(ref.logs).toStrictEqual([
      "Fetch latest Lefthook version",
      `[begin] Download Lefthook ${ref.latestVersion}`,
      "Create directory",
      "[command] curl 4",
      "Set file permissions",
      "[end]",
      "Add Lefthook to PATH",
    ]);

    expect(ref.outputs).toStrictEqual({ version: ref.latestVersion });

    await assertLefthookVersion(ref, ref.latestVersion);
  });

  test(
    "downloads specified version without fetching latest",
    { timeout: 60000 },
    async () => {
      const { ref, deps } = mockDeps({
        runnerToolCache: join(tmpDir, "downloadsSpecifiedVersion"),
        versionInput: " 2.1.0\n",
      });

      await setupLefthookAction(deps);

      expect(ref.logs).toStrictEqual([
        "[begin] Download Lefthook 2.1.0",
        "Create directory",
        "[command] curl 4",
        "Set file permissions",
        "[end]",
        "Add Lefthook to PATH",
      ]);

      expect(ref.outputs).toStrictEqual({ version: "2.1.0" });
      expect(ref.latestVersion).toBe("");

      await assertLefthookVersion(ref, "2.1.0");
    },
  );

  test("uses cached binary when available", async () => {
    const runnerToolCache = join(tmpDir, "useCachedBinary");
    await mkdir(join(runnerToolCache, "lefthook", "2.1.0"), {
      recursive: true,
    });

    const { ref, deps } = mockDeps({
      runnerToolCache: join(tmpDir, "useCachedBinary"),
      versionInput: "2.1.0",
    });

    await setupLefthookAction(deps);

    expect(ref.logs).toStrictEqual([
      "Use cached Lefthook 2.1.0",
      "Add Lefthook to PATH",
    ]);

    expect(ref.outputs).toStrictEqual({ version: "2.1.0" });
    expect(ref.latestVersion).toBe("");
  });
});
