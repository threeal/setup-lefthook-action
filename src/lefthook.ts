export async function fetchLatestVersion(): Promise<{
  tag: string;
  version: string;
}> {
  const res = await fetch(
    "https://api.github.com/repos/evilmartians/lefthook/releases/latest",
  );
  if (!res.ok) {
    throw new Error(`Failed to resolve latest version: ${res.statusText}`);
  }
  const { tag_name } = (await res.json()) as { tag_name: string };
  return { tag: tag_name, version: tag_name.replace(/^v/, "") };
}

export function getDownloadUrl(tag: string, version: string): string {
  return `https://github.com/evilmartians/lefthook/releases/download/${tag}/lefthook_${version}_Linux_x86_64`;
}
