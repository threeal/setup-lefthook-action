import { chmod, mkdir } from "node:fs/promises";
import path from "node:path";
import { downloadFile } from "./download.js";

export async function fetchLatestVersion(): Promise<string> {
  const res = await fetch(
    "https://api.github.com/repos/evilmartians/lefthook/releases/latest",
  );
  if (!res.ok) {
    throw new Error(`Failed to resolve latest version: ${res.statusText}`);
  }
  const data = (await res.json()) as { tag_name: string };
  return data.tag_name.replace(/^v/, "");
}

export async function downloadLefthook(
  binDir: string,
  version: string,
): Promise<void> {
  const binPath = path.join(binDir, "lefthook");
  await mkdir(binDir, { recursive: true });
  await downloadFile(
    `https://github.com/evilmartians/lefthook/releases/download/v${version}/lefthook_${version}_Linux_x86_64`,
    binPath,
  );
  await chmod(binPath, "755");
}
