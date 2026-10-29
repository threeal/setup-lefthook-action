import { exec } from "ghakit/exec";
import { addPath, getInput, setOutput } from "ghakit/io";
import { logCommand, logError, logInfo } from "ghakit/log";
import { getRunnerToolCache } from "ghakit/vars";
import { chmod, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { verifyCache } from "./cache.js";
import { getLefthookAsset } from "./lefthook.js";
import { fetchLatestLefthookVersion } from "./version.js";

try {
  let version = getInput("version").trim();
  if (version === "") {
    throw new Error("Version input must not be empty");
  }

  if (version === "latest") {
    logInfo("Fetch latest Lefthook version from GitHub releases");
    version = await fetchLatestLefthookVersion();
    logInfo(`Found latest Lefthook version ${version}`);
  }

  const { platform, arch } = process;
  const asset = getLefthookAsset(version, platform, arch);

  const cacheDir = join(
    getRunnerToolCache(),
    "lefthook",
    `${version}-${platform}-${arch}`,
  );
  let isCached = false;
  try {
    isCached = await verifyCache(cacheDir);
  } catch (err) {
    logError(err);
    logInfo(`Remove invalid Lefthook cache at ${cacheDir}`);
    await rm(cacheDir, { recursive: true, force: true });
  }

  if (isCached) {
    logInfo(`Use cached Lefthook from ${cacheDir}`);
  } else {
    logInfo(`Install Lefthook to ${cacheDir}`);
    await mkdir(cacheDir, { recursive: true });

    const file = join(cacheDir, asset.fileName);
    const args = ["-fsSL", "--output", file, asset.url];
    logCommand("curl", ...args);
    await exec("curl", args);

    await chmod(file, 0o755);
  }

  logInfo("Add Lefthook to PATH");
  await addPath(cacheDir);
  await setOutput("version", version);
} catch (err: unknown) {
  logError(err);
  process.exitCode = 1;
}
