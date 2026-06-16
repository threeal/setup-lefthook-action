import { Arch, Platform } from "./platform.js";

function toOs(platform: Platform) {
  switch (platform) {
    case "linux":
      return "Linux";
    case "darwin":
      return "MacOS";
    case "win32":
      return "Windows";
  }
}

function toArch(arch: Arch) {
  switch (arch) {
    case "x64":
      return "x86_64";
    case "arm64":
      return "arm64";
  }
}

export type ExecutableExt = "" | ".exe";

export function getDownloadComponents({
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
    stem: `lefthook_${version}_${toOs(platform)}_${toArch(arch)}`,
    ext: platform === "win32" ? ".exe" : "",
  };
}
