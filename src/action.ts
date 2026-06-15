import { exec } from "ghakit/exec";
import { addPath, getInput, setOutput } from "ghakit/io";
import { beginLogGroup, endLogGroup, logCommand, logInfo } from "ghakit/log";
import { getRunnerToolCache } from "ghakit/vars";
import { access, chmod, mkdir } from "node:fs/promises";
import { join } from "node:path";
import {
  fetchLatestLefthookVersion,
  getLefthookBinaryName,
  getLefthookDownloadUrl,
} from "./lefthook.js";
import { getArch, getPlatform } from "./platform.js";

export async function setupLefthookAction() {
  const platform = getPlatform();
  const arch = getArch();

  let version = getInput("version").trim();
  if (!version) {
    logInfo("Fetch latest Lefthook version");
    version = await fetchLatestLefthookVersion();
  }

  const binDir = join(getRunnerToolCache(), "lefthook", version);
  try {
    await access(binDir);
    logInfo(`Use cached Lefthook ${version}`);
  } catch {
    beginLogGroup(`Download Lefthook ${version}`);
    try {
      logInfo("Create directory");
      await mkdir(binDir, { recursive: true });

      const binPath = join(binDir, getLefthookBinaryName(platform));
      const url = getLefthookDownloadUrl({ version, platform, arch });

      const args = ["-fL", "--output", binPath, url];

      logCommand("curl", ...args);
      await exec("curl", args);

      logInfo("Set file permissions");
      await chmod(binPath, "755");
    } finally {
      endLogGroup();
    }
  }

  logInfo("Add Lefthook to PATH");
  await addPath(binDir);

  await setOutput("version", version);
}
