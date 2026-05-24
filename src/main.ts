import { addPath, logError, logInfo } from "gha-utils";
import { chmod, mkdir } from "node:fs/promises";
import { arch, platform, tmpdir } from "node:os";
import { join } from "node:path";
import { downloadFile } from "./download.js";
import {
  fetchLatestVersion,
  getBinaryName,
  getDownloadUrl,
} from "./lefthook.js";

try {
  const binDir = join(tmpdir(), "lefthook");
  const binPath = join(binDir, getBinaryName(platform()));

  logInfo("Fetching latest Lefthook version...");
  const { tag, version } = await fetchLatestVersion();

  logInfo(`Downloading Lefthook ${version}...`);
  await mkdir(binDir, { recursive: true });
  await downloadFile(
    getDownloadUrl({ tag, version, platform: platform(), arch: arch() }),
    binPath,
  );
  await chmod(binPath, "755");
  await addPath(binDir);
} catch (err) {
  logError(err);
  process.exitCode = 1;
}
