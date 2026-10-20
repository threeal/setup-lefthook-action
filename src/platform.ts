import { arch, platform } from "node:os";

export type Platform = "linux" | "darwin" | "win32";

/**
 * Gets the platform of the current runner.
 * @returns The platform of the current runner.
 * @throws If the platform is not supported.
 */
export function getPlatform(): Platform {
  const val = platform();
  switch (val) {
    case "linux":
    case "darwin":
    case "win32":
      return val;
    default:
      throw new Error(`Unsupported platform: ${val}`);
  }
}

export type Arch = "x64" | "arm64";

/**
 * Gets the arch of the current runner.
 * @returns The arch of the current runner.
 * @throws If the arch is not supported.
 */
export function getArch(): Arch {
  const val = arch();
  switch (val) {
    case "x64":
    case "arm64":
      return val;
    default:
      throw new Error(`Unsupported arch: ${val}`);
  }
}
