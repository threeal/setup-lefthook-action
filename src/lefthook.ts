const RELEASES_URL = "https://github.com/evilmartians/lefthook/releases";

/**
 * Parses the Lefthook version from the redirect of GitHub's latest release URL.
 *
 * The version is taken from the `location` header, which must end in a
 * `/releases/tag/v<version>` path.
 * @param res - The unfollowed response from the latest release URL.
 * @returns The latest Lefthook version.
 * @throws If the response is not a 302 redirect, has no `location` header, or
 * redirects anywhere other than a release tag.
 */
export function parseVersionFromRedirectResponse(res: Response): string {
  if (res.status !== 302) {
    throw new Error(
      `Expected 302 redirect, but got ${res.status.toString()} (${res.statusText})`,
    );
  }
  const location = res.headers.get("location");
  if (!location) {
    throw new Error("Redirect response is missing the location header");
  }
  const match = /\/releases\/tag\/v([^/]+)$/.exec(location);
  if (match === null) {
    throw new Error(`Unexpected redirect location: ${location}`);
  }
  return match[1];
}

/**
 * Fetches the latest Lefthook version from GitHub releases.
 * @returns The latest Lefthook version.
 */
export async function fetchLatestLefthookVersion(): Promise<string> {
  const res = await fetch(`${RELEASES_URL}/latest`, { redirect: "manual" });
  return parseVersionFromRedirectResponse(res);
}

/**
 * A Lefthook release asset, which is the Lefthook executable itself.
 *
 * Only a `binary` needs to be made executable, while an `exe` is executable by
 * its file extension on Windows. The `fileName` is what the download is saved
 * as.
 */
export interface LefthookAsset {
  type: "binary" | "exe";
  url: string;
  fileName: string;
}

const OS_NAMES = { linux: "Linux", darwin: "MacOS", win32: "Windows" } as const;

const ARCH_NAMES = { x64: "x86_64", arm64: "arm64" } as const;

/**
 * Finds the release asset of a Lefthook version for a platform and
 * architecture.
 *
 * Not every version is released, and a release may not have a build for every
 * platform and architecture, so this checks that the release provides the
 * asset without downloading it.
 *
 * Throws an error if the platform or architecture isn't supported, if the
 * release doesn't provide the asset, or if it can't be checked.
 * @param version - The exact Lefthook version, without the `v` prefix.
 * @param platform - The runner's platform, as named by Node.js.
 * @param arch - The runner's architecture, as named by Node.js.
 * @returns The asset to download.
 */
export async function findLefthookAsset(
  version: string,
  platform: string,
  arch: string,
): Promise<LefthookAsset> {
  if (platform !== "linux" && platform !== "darwin" && platform !== "win32") {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  if (arch !== "x64" && arch !== "arm64") {
    throw new Error(`Unsupported arch: ${arch}`);
  }

  const name = `lefthook_${version}_${OS_NAMES[platform]}_${ARCH_NAMES[arch]}`;
  const url = `${RELEASES_URL}/download/v${version}/${name}`;
  const asset: LefthookAsset =
    platform === "win32"
      ? { type: "exe", url: `${url}.exe`, fileName: "lefthook.exe" }
      : { type: "binary", url, fileName: "lefthook" };

  const res = await fetch(asset.url, { method: "HEAD" });
  if (res.status === 404) {
    throw new Error(
      `Lefthook does not provide a build of version ${version} for ${platform}/${arch}`,
    );
  }
  if (!res.ok) {
    throw new Error(
      `Failed to find Lefthook build at ${asset.url}: ${res.statusText}`,
    );
  }
  return asset;
}
