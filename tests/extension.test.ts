import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import cavemanExtension from "../extensions/caveman";

describe("extension input handling", () => {
	test("natural language off publishes disabled state without command executor", async () => {
		const dir = mkdtempSync(join(tmpdir(), "pi-caveman-extension-"));
		try {
			const handlers = new Map<string, any>();
			const emitted: any[] = [];
			const appended: any[] = [];
			const commands = new Map<string, any>();
			cavemanExtension({
				cavemanAgentDir: dir,
				on: (name: string, handler: any) => handlers.set(name, handler),
				registerCommand: (name: string, spec: any) => commands.set(name, spec),
				appendEntry: (key: string, value: unknown) => appended.push({ key, value }),
				events: { emit: (key: string, value: unknown) => emitted.push({ key, value }) },
			});
			const result = await handlers.get("input")({ text: "normal mode" });
			expect(result.action).toBe("handled");
			expect(appended.at(-1).value.enabled).toBe(false);
			expect(emitted.at(-1).value.enabled).toBe(false);
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});
});
