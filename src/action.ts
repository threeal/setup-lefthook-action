import { exec } from "ghakit/exec";
import type { addPath, getInput, setOutput } from "ghakit/io";
import type {
  beginLogGroup,
  endLogGroup,
  logCommand,
  logInfo,
} from "ghakit/log";
import type { getRunnerToolCache } from "ghakit/vars";
import { access, chmod, mkdir } from "node:fs/promises";
import { arch, platform } from "node:os";
import { join } from "node:path";
import {
  type fetchLatestLefthookVersion,
  getLefthookBinaryName,
  getLefthookDownloadUrl,
} from "./lefthook.js";

export interface SetupLefthookActionDeps {
  addPath: typeof addPath;
  beginLogGroup: typeof beginLogGroup;
  endLogGroup: typeof endLogGroup;
  fetchLatestLefthookVersion: typeof fetchLatestLefthookVersion;
  getInput: typeof getInput;
  getRunnerToolCache: typeof getRunnerToolCache;
  logCommand: typeof logCommand;
  logInfo: typeof logInfo;
  setOutput: typeof setOutput;
}

export async function setupLefthookAction(deps: SetupLefthookActionDeps) {
  let version = deps.getInput("version").trim();
  if (!version) {
    deps.logInfo("Fetch latest Lefthook version");
    version = await deps.fetchLatestLefthookVersion();
  }

  const binDir = join(deps.getRunnerToolCache(), "lefthook", version);
  try {
    await access(binDir);
    deps.logInfo(`Use cached Lefthook ${version}`);
  } catch {
    deps.beginLogGroup(`Download Lefthook ${version}`);
    try {
      deps.logInfo("Create directory");
      await mkdir(binDir, { recursive: true });

      const binPath = join(binDir, getLefthookBinaryName(platform()));
      const url = getLefthookDownloadUrl({
        version,
        platform: platform(),
        arch: arch(),
      });

      const args = ["-fL", "--output", binPath, url];

      deps.logCommand("curl", ...args);
      await exec("curl", args);

      deps.logInfo("Set file permissions");
      await chmod(binPath, "755");
    } finally {
      deps.endLogGroup();
    }
  }

  deps.logInfo("Add Lefthook to PATH");
  await deps.addPath(binDir);

  await deps.setOutput("version", version);
}
