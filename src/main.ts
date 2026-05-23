import { addPath, logError, logInfo } from "gha-utils";
import { chmod, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { downloadFile } from "./download.js";
import { fetchLatestVersion, getDownloadUrl } from "./lefthook.js";

try {
  const binDir = path.join(tmpdir(), "lefthook");
  const binPath = path.join(binDir, "lefthook");

  logInfo("Fetching latest Lefthook version...");
  const { tag, version } = await fetchLatestVersion();

  logInfo(`Downloading Lefthook ${version}...`);
  await mkdir(binDir, { recursive: true });
  await downloadFile(getDownloadUrl(tag, version), binPath);
  await chmod(binPath, "755");
  await addPath(binDir);
} catch (err) {
  logError(err);
  process.exitCode = 1;
}
