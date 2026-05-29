export async function fetchLatestLefthookVersion(): Promise<string> {
  const res = await fetch(
    "https://github.com/evilmartians/lefthook/releases/latest",
    { redirect: "manual" },
  );
  if (res.status !== 302) {
    throw new Error(
      `Expected 302 redirect, but got ${res.status.toString()} (${res.statusText})`,
    );
  }
  const location = res.headers.get("location");
  if (!location) {
    throw new Error("Redirect response is missing the location header");
  }
  const tag = location.slice(location.lastIndexOf("/") + 1);
  return tag.replace(/^v/, "");
}

export function getLefthookBinaryName(platform: string): string {
  return platform === "win32" ? "lefthook.exe" : "lefthook";
}

export function getLefthookDownloadUrl({
  version,
  platform,
  arch,
}: {
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
  return `https://github.com/evilmartians/lefthook/releases/download/v${version}/lefthook_${version}_${os}_${archStr}${ext}`;
}
