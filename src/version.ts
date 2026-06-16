import { getInput } from "ghakit/io";
import { logInfo } from "ghakit/log";

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
