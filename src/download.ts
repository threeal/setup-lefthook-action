import { Arch, Platform } from "./platform.js";

/**
 * Converts a platform into the OS name used in Lefthook's release assets.
 * @param platform - The platform to convert.
 * @returns The OS name, such as `Linux`, `MacOS`, or `Windows`.
 */
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

/**
 * Converts an arch into the arch name used in Lefthook's release assets.
 * @param arch - The arch to convert.
 * @returns The arch name, such as `x86_64` or `arm64`.
 */
function toArch(arch: Arch) {
  switch (arch) {
    case "x64":
      return "x86_64";
    case "arm64":
      return "arm64";
  }
}

export type ExecutableExt = "" | ".exe";

/**
 * Builds the components of the download URL for a Lefthook binary.
 *
 * The full URL is `${baseUrl}/${stem}${ext}`. The components are returned
 * separately so that `ext` can also be used to name the downloaded file.
 * @param options - The download options.
 * @param options.version - The Lefthook version, without the `v` prefix.
 * @param options.platform - The platform to download the binary for.
 * @param options.arch - The arch to download the binary for.
 * @returns The release download URL, the asset name without its extension,
 * and the executable extension, which is `.exe` on Windows and empty
 * elsewhere.
 */
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
