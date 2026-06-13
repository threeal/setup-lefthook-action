import 'fs';
import { access, mkdir, chmod, appendFile } from 'fs/promises';
import { platform, arch, EOL } from 'os';
import { join, delimiter } from 'path';
import { spawn } from 'child_process';

// node_modules/.pnpm/ghakit@1.0.0/node_modules/ghakit/dist/io.js

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
function getLefthookDownloadUrl({
  version,
  platform: platform2,
  arch: arch2
}) {
  let os;
  switch (platform2) {
    case "linux":
      os = "Linux";
      break;
    case "darwin":
      os = "MacOS";
      break;
    case "win32":
      os = "Windows";
      break;
    default:
      throw new Error(`Unsupported platform: ${platform2}`);
  }
  let archStr;
  switch (arch2) {
    case "x64":
      archStr = "x86_64";
      break;
    case "arm64":
      archStr = "arm64";
      break;
    default:
      throw new Error(`Unsupported arch: ${arch2}`);
  }
  const ext = platform2 === "win32" ? ".exe" : "";
  return `https://github.com/evilmartians/lefthook/releases/download/v${version}/lefthook_${version}_${os}_${archStr}${ext}`;
}

// src/action.ts
async function setupLefthookAction(deps) {
  let version = deps.getInput("version").trim();
  if (!version) {
    deps.logInfo("Fetch latest Lefthook version");
    version = await deps.fetchLatestLefthookVersion();
  }
  const binDir = join(deps.getRunnerToolCache(), "lefthook", version);
  try {
    await access(binDir);
    deps.logInfo(`Use cached Lefthook ${version}`);
  } catch {
    deps.beginLogGroup(`Download Lefthook ${version}`);
    try {
      deps.logInfo("Create directory");
      await mkdir(binDir, { recursive: true });
      const binPath = join(binDir, getLefthookBinaryName(platform()));
      const url = getLefthookDownloadUrl({
        version,
        platform: platform(),
        arch: arch()
      });
      const args = ["-fL", "--output", binPath, url];
      deps.logCommand("curl", ...args);
      await exec("curl", args);
      deps.logInfo("Set file permissions");
      await chmod(binPath, "755");
    } finally {
      deps.endLogGroup();
    }
  }
  deps.logInfo("Add Lefthook to PATH");
  await deps.addPath(binDir);
  await deps.setOutput("version", version);
}

// src/main.ts
await setupLefthookAction({
  addPath,
  beginLogGroup,
  endLogGroup,
  fetchLatestLefthookVersion,
  getRunnerToolCache,
  getInput,
  logCommand,
  logInfo,
  setOutput
}).catch((err) => {
  logError(err);
  process.exitCode = 1;
});
