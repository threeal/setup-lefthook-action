/**
 * A Lefthook release asset, which is the Lefthook executable itself.
 *
 * The `fileName` is what the download is saved as.
 */
export interface LefthookAsset {
  url: string;
  fileName: string;
}

const OS_NAMES = { linux: "Linux", darwin: "MacOS", win32: "Windows" } as const;

const ARCH_NAMES = { x64: "x86_64", arm64: "arm64" } as const;

/**
 * Gets the release asset of a Lefthook version for a platform and
 * architecture.
 *
 * Throws an error if the platform or architecture isn't supported.
 * @param version - The exact Lefthook version, without the `v` prefix.
 * @param platform - The runner's platform, as named by Node.js.
 * @param arch - The runner's architecture, as named by Node.js.
 * @returns The asset to download.
 */
export function getLefthookAsset(
  version: string,
  platform: string,
  arch: string,
): LefthookAsset {
  if (platform !== "linux" && platform !== "darwin" && platform !== "win32") {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  if (arch !== "x64" && arch !== "arm64") {
    throw new Error(`Unsupported arch: ${arch}`);
  }

  const name = `lefthook_${version}_${OS_NAMES[platform]}_${ARCH_NAMES[arch]}`;
  const url = `https://github.com/evilmartians/lefthook/releases/download/v${version}/${name}`;
  return platform === "win32"
    ? { url: `${url}.exe`, fileName: "lefthook.exe" }
    : { url, fileName: "lefthook" };
}
