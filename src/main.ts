import { addPath, logError, logInfo } from "gha-utils";
import { tmpdir } from "node:os";
import path from "node:path";
import { downloadLefthook, fetchLatestVersion } from "./lefthook.js";

try {
  const version = await fetchLatestVersion();
  const binDir = path.join(tmpdir(), "lefthook", version);
  logInfo(`Downloading Lefthook ${version}...`);
  await downloadLefthook(binDir, version);
  await addPath(binDir);
} catch (err) {
  logError(err);
  process.exitCode = 1;
}
