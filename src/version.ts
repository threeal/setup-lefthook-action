/**
 * Parses the Lefthook version from the redirect of GitHub's latest release URL.
 *
 * The version is taken from the last segment of the `location` header, with
 * its `v` prefix removed.
 * @param res - The unfollowed response from the latest release URL.
 * @returns The latest Lefthook version.
 * @throws If the response is not a 302 redirect or has no `location` header.
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
  const tag = location.slice(location.lastIndexOf("/") + 1);
  return tag.replace(/^v/, "");
}

/**
 * Fetches the latest Lefthook version from GitHub releases.
 * @returns The latest Lefthook version.
 */
export async function fetchLatestLefthookVersion(): Promise<string> {
  const res = await fetch(
    "https://github.com/evilmartians/lefthook/releases/latest",
    { redirect: "manual" },
  );
  return parseVersionFromRedirectResponse(res);
}
