import { exec } from "ghakit/exec";
import { addPath, getInput, setOutput } from "ghakit/io";
import { logCommand, logError, logInfo } from "ghakit/log";
import { getRunnerToolCache } from "ghakit/vars";
import { access, chmod, mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fetchLatestLefthookVersion, findLefthookAsset } from "./lefthook.js";

try {
  let version = getInput("version").trim();
  if (version === "") {
    logInfo("No version specified, use latest");
    version = "latest";
  }

  if (version === "latest") {
    logInfo("Fetch latest Lefthook version from GitHub releases");
    version = await fetchLatestLefthookVersion();
    logInfo(`Found latest Lefthook version ${version}`);
  }

  const { platform, arch } = process;
  const cacheDir = join(
    getRunnerToolCache(),
    "lefthook",
    `${version}-${platform}-${arch}`,
  );

  const completeMarker = join(cacheDir, ".complete");
  try {
    await access(completeMarker);
    logInfo(`Use cached Lefthook from ${cacheDir}`);
  } catch {
    logInfo(`Find Lefthook build for ${platform}/${arch} in GitHub releases`);
    const asset = await findLefthookAsset(version, platform, arch);

    logInfo(`Install Lefthook to ${cacheDir}`);
    // Clears anything left by a previous install that didn't complete.
    await rm(cacheDir, { recursive: true, force: true });
    await mkdir(cacheDir, { recursive: true });

    const file = join(cacheDir, asset.fileName);
    const args = ["-fsSL", "--output", file, asset.url];
    logCommand("curl", ...args);
    await exec("curl", args);

    if (asset.type === "binary") {
      await chmod(file, 0o755);
    }

    await writeFile(completeMarker, "");
  }

  logInfo("Add Lefthook to PATH");
  await addPath(cacheDir);
  await setOutput("version", version);
} catch (err: unknown) {
  logError(err);
  process.exitCode = 1;
}
