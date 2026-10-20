import { getInput } from "ghakit/io";
import { logInfo } from "ghakit/log";

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
 * Resolves the Lefthook version to install from the `version` input.
 *
 * The input is trimmed first. If it is `latest`, the latest version is fetched
 * from GitHub releases; otherwise it is returned as is.
 * @returns The resolved Lefthook version.
 * @throws If the input is empty.
 */
export async function resolveVersion(): Promise<string> {
  const version = getInput("version").trim();
  switch (version) {
    case "":
      throw new Error("version input must not be empty");

    case "latest": {
      logInfo("Fetch latest Lefthook version");
      const res = await fetch(
        "https://github.com/evilmartians/lefthook/releases/latest",
        { redirect: "manual" },
      );
      return parseVersionFromRedirectResponse(res);
    }

    default:
      return version;
  }
}
