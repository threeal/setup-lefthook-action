import { exec } from "ghakit/exec";
import { addPath } from "ghakit/io";
import { logInfo } from "ghakit/log";
import { chmod, mkdir } from "node:fs/promises";
import { arch, platform, tmpdir } from "node:os";
import { join } from "node:path";
import {
  fetchLatestLefthookVersion,
  getLefthookBinaryName,
  getLefthookDownloadUrl,
} from "./lefthook.js";

export async function setupLefthookAction() {
  const binDir = join(tmpdir(), "lefthook");

  logInfo("Fetching latest Lefthook version...");
  const { tag, version } = await fetchLatestLefthookVersion();

  logInfo(`Downloading Lefthook ${version}...`);
  const binPath = join(binDir, getLefthookBinaryName(platform()));
  await mkdir(binDir, { recursive: true });
  const url = getLefthookDownloadUrl({
    tag,
    version,
    platform: platform(),
    arch: arch(),
  });
  await exec("curl", ["-fLSs", "--output", binPath, url], {
    stdout: "silent",
    stderr: "silent",
  });
  await chmod(binPath, "755");

  await addPath(binDir);
}
