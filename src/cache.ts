import { logError, logInfo } from "ghakit/log";
import { rm, stat } from "node:fs/promises";

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
