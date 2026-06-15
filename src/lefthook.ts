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

export type ExecutableExt = "" | ".exe";

export function getLefthookDownloadUrl({
  version,
  platform,
  arch,
}: {
  version: string;
  platform: Platform;
  arch: Arch;
}): { baseUrl: string; stem: string; ext: ExecutableExt } {
  return {
    baseUrl: `https://github.com/evilmartians/lefthook/releases/download/v${version}`,
    stem: `lefthook_${version}_${getLefthookOs(platform)}_${getLefthookArch(arch)}`,
    ext: platform === "win32" ? ".exe" : "",
  };
}
