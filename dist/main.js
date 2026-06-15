import { EOL, platform, arch } from 'os';
import { spawn } from 'child_process';
import 'fs';
import { access, mkdir, chmod, appendFile } from 'fs/promises';
import { join, delimiter } from 'path';

// node_modules/.pnpm/ghakit@1.0.0/node_modules/ghakit/dist/log.js
function logInfo(message) {
  process.stdout.write(`${message}${EOL}`);
}
function logError(err, options) {
  const message = err instanceof Error ? err.message : String(err);
  const params = "";
  process.stdout.write(`::error${params}::${message}${EOL}`);
}
function logCommand(command, ...args) {
  const message = [command, ...args].join(" ");
  process.stdout.write(`[command]${message}${EOL}`);
}
function beginLogGroup(name) {
  process.stdout.write(`::group::${name}${EOL}`);
}
function endLogGroup() {
  process.stdout.write(`::endgroup::${EOL}`);
}
function exec(command, args, opts) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: [
        "inherit",
        "inherit" ,
        "inherit" 
      ]
    });
    const stdoutChunks = [];
    if (proc.stdout !== null) {
      proc.stdout.on("data", (chunk) => stdoutChunks.push(chunk));
    }
    const stderrChunks = [];
    if (proc.stderr !== null) {
      proc.stderr.on("data", (chunk) => stderrChunks.push(chunk));
    }
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) {
        {
          resolve();
        }
      } else {
        reject(new Error(code !== null ? `Process "${command}" exited with code ${code.toString()}` : `Process "${command}" was terminated by a signal`));
      }
    });
  });
}

// node_modules/.pnpm/ghakit@1.0.0/node_modules/ghakit/dist/vars.js
function getGitHubOutput() {
  return process.env.GITHUB_OUTPUT ?? "";
}
function getGitHubPath() {
  return process.env.GITHUB_PATH ?? "";
}
function getRunnerToolCache() {
  return process.env.RUNNER_TOOL_CACHE ?? "";
}

// node_modules/.pnpm/ghakit@1.0.0/node_modules/ghakit/dist/io.js
function getInput(name) {
  return process.env[`INPUT_${name.toUpperCase()}`] ?? "";
}
async function setOutput(name, value) {
  await appendFile(getGitHubOutput(), `${name}=${value}${EOL}`);
}
async function addPath(sysPath) {
  process.env.PATH = process.env.PATH !== void 0 ? `${sysPath}${delimiter}${process.env.PATH}` : sysPath;
  await appendFile(getGitHubPath(), `${sysPath}${EOL}`);
}

// src/lefthook.ts
function parseLatestLefthookVersion(res) {
  if (res.status !== 302) {
    throw new Error(
      `Expected 302 redirect, but got ${res.status.toString()} (${res.statusText})`
    );
  }
  const location = res.headers.get("location");
  if (!location) {
    throw new Error("Redirect response is missing the location header");
  }
  const tag = location.slice(location.lastIndexOf("/") + 1);
  return tag.replace(/^v/, "");
}
async function fetchLatestLefthookVersion() {
  const res = await fetch(
    "https://github.com/evilmartians/lefthook/releases/latest",
    { redirect: "manual" }
  );
  return parseLatestLefthookVersion(res);
}
function getLefthookBinaryName(platform2) {
  return platform2 === "win32" ? "lefthook.exe" : "lefthook";
}
function getLefthookOs(platform2) {
  switch (platform2) {
    case "linux":
      return "Linux";
    case "darwin":
      return "MacOS";
    case "win32":
      return "Windows";
  }
}
function getLefthookArch(arch2) {
  switch (arch2) {
    case "x64":
      return "x86_64";
    case "arm64":
      return "arm64";
  }
}
function getLefthookDownloadUrl({
  version,
  platform: platform2,
  arch: arch2
}) {
  const url = `https://github.com/evilmartians/lefthook/releases/download/v${version}`;
  const filename = `lefthook_${version}_${getLefthookOs(platform2)}_${getLefthookArch(arch2)}`;
  const ext = platform2 === "win32" ? ".exe" : "";
  return `${url}/${filename}${ext}`;
}
function getPlatform() {
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
function getArch() {
  const val = arch();
  switch (val) {
    case "x64":
    case "arm64":
      return val;
    default:
      throw new Error(`Unsupported arch: ${val}`);
  }
}

// src/action.ts
async function setupLefthookAction() {
  const platform2 = getPlatform();
  const arch2 = getArch();
  let version = getInput("version").trim();
  if (!version) {
    logInfo("Fetch latest Lefthook version");
    version = await fetchLatestLefthookVersion();
  }
  const binDir = join(getRunnerToolCache(), "lefthook", version);
  try {
    await access(binDir);
    logInfo(`Use cached Lefthook ${version}`);
  } catch {
    beginLogGroup(`Download Lefthook ${version}`);
    try {
      logInfo("Create directory");
      await mkdir(binDir, { recursive: true });
      const binPath = join(binDir, getLefthookBinaryName(platform2));
      const url = getLefthookDownloadUrl({ version, platform: platform2, arch: arch2 });
      const args = ["-fL", "--output", binPath, url];
      logCommand("curl", ...args);
      await exec("curl", args);
      logInfo("Set file permissions");
      await chmod(binPath, "755");
    } finally {
      endLogGroup();
    }
  }
  logInfo("Add Lefthook to PATH");
  await addPath(binDir);
  await setOutput("version", version);
}

// src/main.ts
await setupLefthookAction().catch((err) => {
  logError(err);
  process.exitCode = 1;
});
