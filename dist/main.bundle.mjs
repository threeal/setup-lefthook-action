import 'node:fs';
import fsPromises, { mkdir, chmod } from 'node:fs/promises';
import os, { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

/**
 * @internal
 * Retrieves the value of an environment variable.
 *
 * @param name - The name of the environment variable.
 * @returns The value of the environment variable.
 * @throws Error if the environment variable is not defined.
 */
function mustGetEnvironment(name) {
    const value = process.env[name];
    if (value === undefined) {
        throw new Error(`the ${name} environment variable must be defined`);
    }
    return value;
}
/**
 * Adds a system path to the environment in GitHub Actions.
 *
 * @param sysPath - The system path to add to the environment.
 * @returns A promise that resolves when the system path is successfully added.
 */
async function addPath(sysPath) {
    process.env.PATH =
        process.env.PATH !== undefined
            ? `${sysPath}${path.delimiter}${process.env.PATH}`
            : sysPath;
    const filePath = mustGetEnvironment("GITHUB_PATH");
    await fsPromises.appendFile(filePath, `${sysPath}${os.EOL}`);
}

/**
 * Logs an information message in GitHub Actions.
 *
 * @param message - The information message to log.
 */
function logInfo(message) {
    process.stdout.write(`${message}${os.EOL}`);
}
/**
 * Logs an error message in GitHub Actions.
 *
 * @param err - The error, which can be of any type.
 */
function logError(err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stdout.write(`::error::${message}${os.EOL}`);
}

async function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const curl = spawn("curl", ["-fLSs", "--output", dest, url]);
        const chunks = [];
        curl.stderr.on("data", (chunk) => chunks.push(chunk));
        curl.on("error", reject);
        curl.on("close", (code) => {
            if (code === 0) {
                resolve(undefined);
            }
            else {
                reject(new Error(Buffer.concat(chunks).toString().trim()));
            }
        });
    });
}

async function fetchLatestVersion() {
    const res = await fetch("https://api.github.com/repos/evilmartians/lefthook/releases/latest");
    if (!res.ok) {
        throw new Error(`Failed to resolve latest version: ${res.statusText}`);
    }
    const { tag_name } = (await res.json());
    return { tag: tag_name, version: tag_name.replace(/^v/, "") };
}
function getDownloadUrl(tag, version) {
    return `https://github.com/evilmartians/lefthook/releases/download/${tag}/lefthook_${version}_Linux_x86_64`;
}

try {
    const binDir = path.join(tmpdir(), "lefthook");
    const binPath = path.join(binDir, "lefthook");
    logInfo("Fetching latest Lefthook version...");
    const { tag, version } = await fetchLatestVersion();
    logInfo(`Downloading Lefthook ${version}...`);
    await mkdir(binDir, { recursive: true });
    await downloadFile(getDownloadUrl(tag, version), binPath);
    await chmod(binPath, "755");
    await addPath(binDir);
}
catch (err) {
    logError(err);
    process.exitCode = 1;
}
