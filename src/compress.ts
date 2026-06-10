import { existsSync, readFileSync } from "node:fs";

export function buildCompressGuidance(target: string): string {
	const file = target.trim();
	if (!file) return "Usage: /caveman-compress <file>. Destructive rewrite needs explicit confirmation; no change made.";
	if (!existsSync(file)) return `File not found: ${file}`;
	const before = readFileSync(file, "utf8").length;
	return `Compression preview only for ${file} (${before} bytes). Preserve code fences, URLs, paths, frontmatter. Confirm before write; no change made.`;
}
