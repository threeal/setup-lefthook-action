import { EOL, platform, arch } from 'node:os';
import { spawn } from 'node:child_process';
import 'node:fs';
import { appendFile, access, mkdir, chmod } from 'node:fs/promises';
import { delimiter, join } from 'node:path';

/**
 * Logs an information message in GitHub Actions.
 *
 * @param message - The information message to log.
 */
function logInfo(message) {
    process.stdout.write(`${message}${EOL}`);
}
/**
 * Logs an error message in GitHub Actions.
 *
 * @param err - The error, which can be of any type.
 * @param options - Optional annotation parameters to pin the message to a file location.
 */
function logError(err, options) {
    const message = err instanceof Error ? err.message : String(err);
    const params = "";
    process.stdout.write(`::error${params}::${message}${EOL}`);
}
/**
 * Logs a command along with its arguments in GitHub Actions.
 *
 * @param command - The command to log.
 * @param args - The arguments of the command.
 */
function logCommand(command, ...args) {
    const message = [command, ...args].join(" ");
    process.stdout.write(`[command]${message}${EOL}`);
}
/**
 * Begins a log group in GitHub Actions. Close it with {@link endLogGroup}.
 *
 * @param name - The name of the log group.
 */
function beginLogGroup(name) {
    process.stdout.write(`::group::${name}${EOL}`);
}
/**
 * Ends the log group opened by {@link beginLogGroup}.
 */
function endLogGroup() {
    process.stdout.write(`::endgroup::${EOL}`);
}

function exec(command, args, opts) {
    return new Promise((resolve, reject) => {
        const proc = spawn(command, args, {
            stdio: [
                "inherit",
                "inherit"
                    ,
                "inherit"
                    ,
            ],
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
            }
            else {
                reject(new Error(code !== null
                    ? `Process "${command}" exited with code ${code.toString()}`
                    : `Process "${command}" was terminated by a signal`));
            }
        });
    });
}

/**
 * Returns whether the workflow is running in a CI environment.
 *
 * @returns `true` if running in a CI environment, `false` otherwise.
 */
/**
 * Returns the path to the file used to prepend entries to the system `PATH`
 * from workflow commands.
 *
 * @returns The path to the GitHub path file, or an empty string if not set.
 */
function getGitHubPath() {
    return process.env.GITHUB_PATH ?? "";
}
/**
 * Returns the path to the directory containing preinstalled tools for
 * GitHub-hosted runners.
 *
 * @returns The runner tool cache path, or an empty string if not set.
 */
function getRunnerToolCache() {
    return process.env.RUNNER_TOOL_CACHE ?? "";
}

/**
 * Retrieves the value of a GitHub Actions input.
 *
 * Input names are matched case-insensitively — `getInput("token")` and
 * `getInput("TOKEN")` both read the same `INPUT_TOKEN` env var.
 *
 * @param name - The name of the GitHub Actions input.
 * @returns The value of the GitHub Actions input, or an empty string if not set.
 */
function getInput(name) {
    return process.env[`INPUT_${name.toUpperCase()}`] ?? "";
}
/**
 * Adds a system path to the environment in GitHub Actions.
 *
 * Prepends the path to `process.env.PATH` immediately so it is available in
 * the current process, and appends it to the path file for subsequent steps.
 *
 * @param sysPath - The system path to add to the environment.
 * @returns A promise that resolves when the system path is successfully added.
 */
async function addPath(sysPath) {
    process.env.PATH =
        process.env.PATH !== undefined
            ? `${sysPath}${delimiter}${process.env.PATH}`
            : sysPath;
    await appendFile(getGitHubPath(), `${sysPath}${EOL}`);
}

function parseLatestLefthookVersion(res) {
    if (res.status !== 302) {
        throw new Error(`Expected 302 redirect, but got ${res.status.toString()} (${res.statusText})`);
    }
    const location = res.headers.get("location");
    if (!location) {
        throw new Error("Redirect response is missing the location header");
    }
    const tag = location.slice(location.lastIndexOf("/") + 1);
    return tag.replace(/^v/, "");
}
async function fetchLatestLefthookVersion() {
    const res = await fetch("https://github.com/evilmartians/lefthook/releases/latest", { redirect: "manual" });
    return parseLatestLefthookVersion(res);
}
function getLefthookBinaryName(platform) {
    return platform === "win32" ? "lefthook.exe" : "lefthook";
}
function getLefthookDownloadUrl({ version, platform, arch, }) {
    let os;
    switch (platform) {
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
            throw new Error(`Unsupported platform: ${platform}`);
    }
    let archStr;
    switch (arch) {
        case "x64":
            archStr = "x86_64";
            break;
        case "arm64":
            archStr = "arm64";
            break;
        default:
            throw new Error(`Unsupported arch: ${arch}`);
    }
    const ext = platform === "win32" ? ".exe" : "";
    return `https://github.com/evilmartians/lefthook/releases/download/v${version}/lefthook_${version}_${os}_${archStr}${ext}`;
}

async function setupLefthookAction() {
    let version = getInput("version").trim();
    if (!version) {
        logInfo("Fetch latest Lefthook version");
        version = await fetchLatestLefthookVersion();
    }
    const binDir = join(getRunnerToolCache(), "lefthook", version);
    try {
        await access(binDir);
        logInfo(`Use cached Lefthook ${version}`);
    }
    catch {
        beginLogGroup(`Download Lefthook ${version}`);
        try {
            logInfo("Create directory");
            await mkdir(binDir, { recursive: true });
            const binPath = join(binDir, getLefthookBinaryName(platform()));
            const url = getLefthookDownloadUrl({
                version,
                platform: platform(),
                arch: arch(),
            });
            const args = ["-fL", "--output", binPath, url];
            logCommand("curl", ...args);
            await exec("curl", args);
            logInfo("Set file permissions");
            await chmod(binPath, "755");
        }
        finally {
            endLogGroup();
        }
    }
    logInfo("Add Lefthook to PATH");
    await addPath(binDir);
}

await setupLefthookAction().catch((err) => {
    logError(err);
    process.exitCode = 1;
});
