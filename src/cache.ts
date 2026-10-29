import { stat } from "node:fs/promises";

/**
 * Checks whether a Lefthook cache directory exists.
 *
 * Throws an error if the path exists but isn't a directory.
 * @param cacheDir - The path of the cache directory.
 * @returns Whether the cache directory exists.
 */
export async function verifyCache(cacheDir: string): Promise<boolean> {
  const stats = await stat(cacheDir, { throwIfNoEntry: false });
  if (stats === undefined) return false;

  if (!stats.isDirectory()) {
    throw new Error(`Lefthook cache path is not a directory: ${cacheDir}`);
  }
  return true;
}
