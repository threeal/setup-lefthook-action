import { EOL, tmpdir, platform, arch } from 'node:os';
import { spawn } from 'node:child_process';
import 'node:fs';
import { appendFile, mkdir, chmod } from 'node:fs/promises';
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

function exec(command, args, opts) {
    return new Promise((resolve, reject) => {
        const proc = spawn(command, args, {
            stdio: [
                "inherit",
                "ignore",
                "ignore",
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

async function fetchLatestLefthookVersion() {
    const res = await fetch("https://github.com/evilmartians/lefthook/releases/latest", { redirect: "manual" });
    if (res.status !== 302) {
        throw new Error(`Expected 302 redirect, but got ${res.status.toString()} (${res.statusText})`);
    }
    const location = res.headers.get("location");
    if (!location) {
        throw new Error("Redirect response is missing the location header");
    }
    const tag = location.slice(location.lastIndexOf("/") + 1);
    const version = tag.replace(/^v/, "");
    return { tag, version };
}
function getLefthookBinaryName(platform) {
    return platform === "win32" ? "lefthook.exe" : "lefthook";
}
function getLefthookDownloadUrl({ tag, version, platform, arch, }) {
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
    return `https://github.com/evilmartians/lefthook/releases/download/${tag}/lefthook_${version}_${os}_${archStr}${ext}`;
}

async function setupLefthookAction() {
    const binDir = join(tmpdir(), "lefthook");
    logInfo("Fetching latest Lefthook version...");
    const { tag, version } = await fetchLatestLefthookVersion();
    logInfo(`Downloading Lefthook ${version}...`);
    const binPath = join(binDir, getLefthookBinaryName(platform()));
    await mkdir(binDir, { recursive: true });
    const url = getLefthookDownloadUrl({
        tag,
        version,
        platform: platform(),
        arch: arch(),
    });
    await exec("curl", ["-fLSs", "--output", binPath, url]);
    await chmod(binPath, "755");
    await addPath(binDir);
}

await setupLefthookAction().catch((err) => {
    logError(err);
    process.exitCode = 1;
});
