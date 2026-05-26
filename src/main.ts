import { exec } from "ghakit/exec";
import { addPath } from "ghakit/io";
import { logError, logInfo } from "ghakit/log";
import { chmod, mkdir } from "node:fs/promises";
import { arch, platform, tmpdir } from "node:os";
import { join } from "node:path";
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
  const url = getDownloadUrl({
    tag,
    version,
    platform: platform(),
    arch: arch(),
  });
  await mkdir(binDir, { recursive: true });
  await exec("curl", ["-fLSs", "--output", binPath, url], {
    stdout: "silent",
    stderr: "silent",
  });
  await chmod(binPath, "755");
  await addPath(binDir);
} catch (err) {
  logError(err);
  process.exitCode = 1;
}
