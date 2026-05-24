export async function fetchLatestVersion(): Promise<{
  tag: string;
  version: string;
}> {
  const res = await fetch(
    "https://api.github.com/repos/evilmartians/lefthook/releases/latest",
  );
  if (!res.ok) {
    throw new Error(`Failed to resolve latest version: ${res.statusText}`);
  }
  const { tag_name } = (await res.json()) as { tag_name: string };
  return { tag: tag_name, version: tag_name.replace(/^v/, "") };
}

export function getBinaryName(platform: string): string {
  return platform === "win32" ? "lefthook.exe" : "lefthook";
}

export function getDownloadUrl({
  tag,
  version,
  platform,
  arch,
}: {
  tag: string;
  version: string;
  platform: string;
  arch: string;
}): string {
  let os: string;
  switch (platform) {
    case "linux":
      os = "Linux";
      break;
    case "darwin":
      os = "MacOS";
      break;
    case "win32":
      os = "Windows";
      break;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }

  let archStr: string;
  switch (arch) {
    case "x64":
      archStr = "x86_64";
      break;
    case "arm64":
      archStr = "arm64";
      break;
    default:
      throw new Error(`Unsupported arch: ${arch}`);
  }

  const ext = platform === "win32" ? ".exe" : "";
  return `https://github.com/evilmartians/lefthook/releases/download/${tag}/lefthook_${version}_${os}_${archStr}${ext}`;
}
