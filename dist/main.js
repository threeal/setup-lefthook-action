import { EOL, arch, platform } from "node:os";
import { spawn } from "node:child_process";
import { appendFile, chmod, mkdir, rm, stat } from "node:fs/promises";
import { delimiter, join } from "node:path";
//#region node_modules/.pnpm/ghakit@1.0.0/node_modules/ghakit/dist/log.js
function logInfo(message) {
	process.stdout.write(`${message}${EOL}`);
}
function formatAnnotationParams(options) {
	const params = Object.entries(options).filter(([, v]) => v !== void 0).map(([k, v]) => `${k}=${String(v)}`).join(",");
	return params ? ` ${params}` : "";
}
function logError(err, options) {
	const message = err instanceof Error ? err.message : String(err);
	const params = options ? formatAnnotationParams(options) : "";
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
//#endregion
//#region node_modules/.pnpm/ghakit@1.0.0/node_modules/ghakit/dist/exec.js
function exec(command, args, opts) {
	return new Promise((resolve, reject) => {
		const stdoutMode = opts?.stdout ?? "inherit";
		const stderrMode = opts?.stderr ?? "inherit";
		const proc = spawn(command, args, { stdio: [
			"inherit",
			stdoutMode === "inherit" ? "inherit" : stdoutMode === "capture" ? "pipe" : "ignore",
			stderrMode === "inherit" ? "inherit" : stderrMode === "capture" ? "pipe" : "ignore"
		] });
		const stdoutChunks = [];
		if (proc.stdout !== null) proc.stdout.on("data", (chunk) => stdoutChunks.push(chunk));
		const stderrChunks = [];
		if (proc.stderr !== null) proc.stderr.on("data", (chunk) => stderrChunks.push(chunk));
		proc.on("error", reject);
		proc.on("close", (code) => {
			if (code === 0) {
				if (stdoutMode === "capture" || stderrMode === "capture") {
					const result = {};
					if (stdoutMode === "capture") result.stdout = Buffer.concat(stdoutChunks).toString();
					if (stderrMode === "capture") result.stderr = Buffer.concat(stderrChunks).toString();
					resolve(result);
				} else resolve();
			} else reject(new Error(code !== null ? `Process "${command}" exited with code ${code.toString()}` : `Process "${command}" was terminated by a signal`));
		});
	});
}
//#endregion
//#region node_modules/.pnpm/ghakit@1.0.0/node_modules/ghakit/dist/vars.js
function getGitHubOutput() {
	return process.env.GITHUB_OUTPUT ?? "";
}
function getGitHubPath() {
	return process.env.GITHUB_PATH ?? "";
}
function getRunnerToolCache() {
	return process.env.RUNNER_TOOL_CACHE ?? "";
}
//#endregion
//#region node_modules/.pnpm/ghakit@1.0.0/node_modules/ghakit/dist/io.js
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
//#endregion
//#region src/cache.ts
async function verifyCache(cacheDir) {
	const stats = await stat(cacheDir, { throwIfNoEntry: false });
	if (stats === void 0) return false;
	logInfo("Verify Lefthook cache");
	try {
		if (!stats.isDirectory()) throw new Error("cache path is not a directory");
		return true;
	} catch (err) {
		logError(err);
		logInfo("Remove Lefthook cache");
		await rm(cacheDir, {
			force: true,
			recursive: true
		});
		return false;
	}
}
//#endregion
//#region src/download.ts
function toOs(platform) {
	switch (platform) {
		case "linux": return "Linux";
		case "darwin": return "MacOS";
		case "win32": return "Windows";
	}
}
function toArch(arch) {
	switch (arch) {
		case "x64": return "x86_64";
		case "arm64": return "arm64";
	}
}
function getDownloadComponents({ version, platform, arch }) {
	return {
		baseUrl: `https://github.com/evilmartians/lefthook/releases/download/v${version}`,
		stem: `lefthook_${version}_${toOs(platform)}_${toArch(arch)}`,
		ext: platform === "win32" ? ".exe" : ""
	};
}
//#endregion
//#region src/platform.ts
function getPlatform() {
	const val = platform();
	switch (val) {
		case "linux":
		case "darwin":
		case "win32": return val;
		default: throw new Error(`Unsupported platform: ${val}`);
	}
}
function getArch() {
	const val = arch();
	switch (val) {
		case "x64":
		case "arm64": return val;
		default: throw new Error(`Unsupported arch: ${val}`);
	}
}
//#endregion
//#region src/version.ts
function parseVersionFromRedirectResponse(res) {
	if (res.status !== 302) throw new Error(`Expected 302 redirect, but got ${res.status.toString()} (${res.statusText})`);
	const location = res.headers.get("location");
	if (!location) throw new Error("Redirect response is missing the location header");
	return location.slice(location.lastIndexOf("/") + 1).replace(/^v/, "");
}
async function resolveVersion() {
	const version = getInput("version").trim();
	switch (version) {
		case "": throw new Error("version input must not be empty");
		case "latest":
			logInfo("Fetch latest Lefthook version");
			return parseVersionFromRedirectResponse(await fetch("https://github.com/evilmartians/lefthook/releases/latest", { redirect: "manual" }));
		default: return version;
	}
}
//#endregion
//#region src/action.ts
async function setupLefthookAction() {
	const platform = getPlatform();
	const arch = getArch();
	const version = await resolveVersion();
	const cacheDir = join(getRunnerToolCache(), "lefthook", version);
	if (await verifyCache(cacheDir)) logInfo(`Use cached Lefthook ${version}`);
	else {
		beginLogGroup(`Download Lefthook ${version}`);
		try {
			logInfo("Create directory");
			await mkdir(cacheDir, { recursive: true });
			const { baseUrl, stem, ext } = getDownloadComponents({
				version,
				platform,
				arch
			});
			const binPath = join(cacheDir, `lefthook${ext}`);
			const args = [
				"-fL",
				"--output",
				binPath,
				`${baseUrl}/${stem}${ext}`
			];
			logCommand("curl", ...args);
			await exec("curl", args);
			logInfo("Set file permissions");
			await chmod(binPath, "755");
		} finally {
			endLogGroup();
		}
	}
	logInfo("Add Lefthook to PATH");
	await addPath(cacheDir);
	await setOutput("version", version);
}
//#endregion
//#region src/main.ts
await setupLefthookAction().catch((err) => {
	logError(err);
	process.exitCode = 1;
});
//#endregion
export {};
