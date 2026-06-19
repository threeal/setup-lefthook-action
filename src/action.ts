import { exec } from "ghakit/exec";
import { addPath, setOutput } from "ghakit/io";
import { beginLogGroup, endLogGroup, logCommand, logInfo } from "ghakit/log";
import { getRunnerToolCache } from "ghakit/vars";
import { chmod, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { verifyCache } from "./cache.js";
import { getDownloadComponents } from "./download.js";
import { getArch, getPlatform } from "./platform.js";
import { resolveVersion } from "./version.js";

export async function setupLefthookAction() {
  const platform = getPlatform();
  const arch = getArch();
  const version = await resolveVersion();

  const cacheDir = join(getRunnerToolCache(), "lefthook", version);
  if (await verifyCache(cacheDir)) {
    logInfo(`Use cached Lefthook ${version}`);
  } else {
    beginLogGroup(`Download Lefthook ${version}`);
    try {
      logInfo("Create directory");
      await mkdir(cacheDir, { recursive: true });

      const { baseUrl, stem, ext } = getDownloadComponents({
        version,
        platform,
        arch,
      });

      const binPath = join(cacheDir, `lefthook${ext}`);
      const args = ["-fL", "--output", binPath, `${baseUrl}/${stem}${ext}`];

      logCommand("curl", ...args);
      await exec("curl", args);

      logInfo("Set file permissions");
      await chmod(binPath, "755");
    } finally {
      endLogGroup();
    }
  }

  logInfo("Add Lefthook to PATH");
  await addPath(cacheDir);

  await setOutput("version", version);
}
