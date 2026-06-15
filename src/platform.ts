import { arch, platform } from "node:os";

export type Platform = "linux" | "darwin" | "win32";

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
