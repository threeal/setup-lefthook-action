import { addPath } from "ghakit/io";
import { logError, logInfo } from "ghakit/log";
import { arch, platform, tmpdir } from "node:os";
import { join } from "node:path";
import { downloadLefthook, fetchLatestLefthookVersion } from "./lefthook.js";

try {
  const binDir = join(tmpdir(), "lefthook");

  logInfo("Fetching latest Lefthook version...");
  const { tag, version } = await fetchLatestLefthookVersion();

  logInfo(`Downloading Lefthook ${version}...`);
  await downloadLefthook({
    tag,
    version,
    platform: platform(),
    arch: arch(),
    outputDir: binDir,
  });

  await addPath(binDir);
} catch (err) {
  logError(err);
  process.exitCode = 1;
}
