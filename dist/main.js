import { spawn } from "node:child_process";
import { access, appendFile, chmod, mkdir, rm, writeFile } from "node:fs/promises";
import { EOL } from "node:os";
import { delimiter, join } from "node:path";
// node_modules/.pnpm/ghakit@1.0.0/node_modules/ghakit/dist/exec.js
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
// node_modules/.pnpm/ghakit@1.0.0/node_modules/ghakit/dist/log.js
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
// src/lefthook.ts
const RELEASES_URL = "https://github.com/evilmartians/lefthook/releases";
function parseVersionFromRedirectResponse(res) {
	if (res.status !== 302) throw new Error(`Expected 302 redirect, but got ${res.status.toString()} (${res.statusText})`);
	const location = res.headers.get("location");
	if (!location) throw new Error("Redirect response is missing the location header");
	const match = /\/releases\/tag\/v([^/]+)$/.exec(location);
	if (match === null) throw new Error(`Unexpected redirect location: ${location}`);
	return match[1];
}
async function fetchLatestLefthookVersion() {
	return parseVersionFromRedirectResponse(await fetch(`${RELEASES_URL}/latest`, { redirect: "manual" }));
}
const OS_NAMES = {
	linux: "Linux",
	darwin: "MacOS",
	win32: "Windows"
};
const ARCH_NAMES = {
	x64: "x86_64",
	arm64: "arm64"
};
async function findLefthookAsset(version, platform, arch) {
	if (platform !== "linux" && platform !== "darwin" && platform !== "win32") throw new Error(`Unsupported platform: ${platform}`);
	if (arch !== "x64" && arch !== "arm64") throw new Error(`Unsupported arch: ${arch}`);
	const name = `lefthook_${version}_${OS_NAMES[platform]}_${ARCH_NAMES[arch]}`;
	const url = `${RELEASES_URL}/download/v${version}/${name}`;
	const asset = platform === "win32" ? {
		type: "exe",
		url: `${url}.exe`,
		fileName: "lefthook.exe"
	} : {
		type: "binary",
		url,
		fileName: "lefthook"
	};
	const res = await fetch(asset.url, { method: "HEAD" });
	if (res.status === 404) throw new Error(`Lefthook does not provide a build of version ${version} for ${platform}/${arch}`);
	if (!res.ok) throw new Error(`Failed to find Lefthook build at ${asset.url}: ${res.statusText}`);
	return asset;
}
// src/main.ts
try {
	let version = getInput("version").trim();
	if (version === "") {
		logInfo("No version specified, use latest");
		version = "latest";
	}
	if (version === "latest") {
		logInfo("Fetch latest Lefthook version from GitHub releases");
		version = await fetchLatestLefthookVersion();
		logInfo(`Found latest Lefthook version ${version}`);
	}
	const { platform, arch } = process;
	const cacheDir = join(getRunnerToolCache(), "lefthook", `${version}-${platform}-${arch}`);
	const completeMarker = join(cacheDir, ".complete");
	try {
		await access(completeMarker);
		logInfo(`Use cached Lefthook from ${cacheDir}`);
	} catch {
		logInfo(`Find Lefthook build for ${platform}/${arch} in GitHub releases`);
		const asset = await findLefthookAsset(version, platform, arch);
		logInfo(`Install Lefthook to ${cacheDir}`);
		await rm(cacheDir, {
			recursive: true,
			force: true
		});
		await mkdir(cacheDir, { recursive: true });
		const file = join(cacheDir, asset.fileName);
		const args = [
			"-fsSL",
			"--output",
			file,
			asset.url
		];
		logCommand("curl", ...args);
		await exec("curl", args);
		if (asset.type === "binary") await chmod(file, 493);
		await writeFile(completeMarker, "");
	}
	logInfo("Add Lefthook to PATH");
	await addPath(cacheDir);
	await setOutput("version", version);
} catch (err) {
	logError(err);
	process.exitCode = 1;
}
export {};
