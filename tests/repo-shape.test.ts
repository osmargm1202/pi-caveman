import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const repoRoot = join(import.meta.dir, "..");

function walkFiles(dir: string): string[] {
	if (!existsSync(dir)) return [];
	return readdirSync(dir).flatMap((entry) => {
		const fullPath = join(dir, entry);
		const relativePath = fullPath.slice(repoRoot.length + 1);
		if (entry === ".git" || entry === "node_modules") return [];
		if (statSync(fullPath).isDirectory()) return walkFiles(fullPath);
		return [relativePath];
	});
}

describe("Pi-native repository shape", () => {
	test("does not ship stale upstream skill, agent, plugin, hook, installer, or docs assets", () => {
		const forbiddenPaths = [
			"skills",
			"agents",
			"plugins",
			"commands",
			"bin",
			"docs",
			"benchmarks",
			"evals",
			"dist",
			".agents",
			".claude-plugin",
			".codex",
			".junie",
			".kiro",
			".roo",
			"src/hooks",
			"src/plugins",
			"src/mcp-servers",
			"src/rules",
			"src/tools",
			"AGENTS.md",
			"CLAUDE.md",
			"CONTRIBUTING.md",
			"GEMINI.md",
			"INSTALL.md",
			"gemini-extension.json",
			"install.ps1",
			"install.sh",
			"skills-lock.json",
		];

		for (const relativePath of forbiddenPaths) {
			expect(existsSync(join(repoRoot, relativePath)), relativePath).toBe(false);
		}
	});

	test("contains no stale skill bootstraps or upstream SKILL.md files", () => {
		const files = walkFiles(repoRoot);
		const staleSkillPath = ["skills", "caveman", "SKILL.md"].join("/");
		expect(files).not.toContain(staleSkillPath);
		expect(files.filter((file) => file.endsWith("SKILL.md"))).toEqual([]);

		const staleBootstrap = `@./${staleSkillPath}`;
		const textFiles = files.filter((file) => /\.(md|json|toml|ts|js|mjs|py|sh|ps1|skill|txt|yaml|yml)$/.test(file));
		for (const file of textFiles) {
			const contents = readFileSync(join(repoRoot, file), "utf8");
			expect(contents, file).not.toContain(staleBootstrap);
			expect(contents, file).not.toContain(staleSkillPath);
		}
	});
});
