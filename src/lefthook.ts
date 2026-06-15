import { Arch, Platform } from "./platform.js";

export function parseLatestLefthookVersion(res: Response): string {
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

export async function fetchLatestLefthookVersion(): Promise<string> {
  const res = await fetch(
    "https://github.com/evilmartians/lefthook/releases/latest",
    { redirect: "manual" },
  );
  return parseLatestLefthookVersion(res);
}

export function getLefthookBinaryName(platform: Platform): string {
  return platform === "win32" ? "lefthook.exe" : "lefthook";
}

function getLefthookOs(platform: Platform) {
  switch (platform) {
    case "linux":
      return "Linux";
    case "darwin":
      return "MacOS";
    case "win32":
      return "Windows";
  }
}

function getLefthookArch(arch: Arch) {
  switch (arch) {
    case "x64":
      return "x86_64";
    case "arm64":
      return "arm64";
  }
}

export function getLefthookDownloadUrl({
  version,
  platform,
  arch,
}: {
  version: string;
  platform: Platform;
  arch: Arch;
}): string {
  const url = `https://github.com/evilmartians/lefthook/releases/download/v${version}`;
  const filename = `lefthook_${version}_${getLefthookOs(platform)}_${getLefthookArch(arch)}`;
  const ext = platform === "win32" ? ".exe" : "";
  return `${url}/${filename}${ext}`;
}
