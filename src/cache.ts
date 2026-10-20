import { logError, logInfo } from "ghakit/log";
import { rm, stat } from "node:fs/promises";

/**
 * Checks whether a Lefthook cache directory can be used.
 *
 * If the path exists but is not a directory, it is logged as an error and
 * removed so that a fresh copy can be downloaded in its place.
 * @param cacheDir - The path of the cache directory.
 * @returns `true` if the path is an existing directory, `false` otherwise.
 */
export async function verifyCache(cacheDir: string): Promise<boolean> {
  const stats = await stat(cacheDir, { throwIfNoEntry: false });
  if (stats === undefined) return false;

  logInfo("Verify Lefthook cache");
  try {
    if (!stats.isDirectory()) {
      throw new Error("cache path is not a directory");
    }
    return true;
  } catch (err) {
    logError(err);
    logInfo("Remove Lefthook cache");
    await rm(cacheDir, { force: true, recursive: true });
    return false;
  }
}
