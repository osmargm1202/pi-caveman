import { beforeEach, describe, expect, test } from "bun:test";
import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { loadCavemanConfig } from "../src/config";
import { createStartupState } from "../src/runtime";
import { registerCavemanCommands } from "../src/commands";

function makeHarness() {
	const commands = new Map<string, any>();
	const notes: string[] = [];
	return {
		commands,
		notes,
		pi: { registerCommand: (name: string, spec: any) => commands.set(name, spec) },
		ctx: { ui: { notify: (message: string) => notes.push(message) } },
	};
}

describe("commands", () => {
	let dir: string;
	beforeEach(() => {
		dir = mkdtempSync(join(tmpdir(), "pi-caveman-cmd-"));
	});

	test("registers upstream-style command names", () => {
		const h = makeHarness();
		let state = createStartupState(loadCavemanConfig(dir));
		registerCavemanCommands(h.pi, { getState: () => state, setState: next => { state = next; }, agentDir: dir });
		expect([...h.commands.keys()].sort()).toEqual(["caveman", "caveman-commit", "caveman-compress", "caveman-review", "caveman-stats"]);
	});

	test("/caveman without args reports status and usage", async () => {
		const h = makeHarness();
		let state = createStartupState(loadCavemanConfig(dir));
		registerCavemanCommands(h.pi, { getState: () => state, setState: next => { state = next; }, agentDir: dir });
		await h.commands.get("caveman").handler("", h.ctx);
		expect(h.notes.join("\n")).toContain("caveman:full");
		expect(h.notes.join("\n")).toContain("Usage: /caveman");
	});

	test("/caveman on/off/normal updates state and config", async () => {
		const h = makeHarness();
		let state = createStartupState(loadCavemanConfig(dir));
		registerCavemanCommands(h.pi, { getState: () => state, setState: next => { state = next; }, agentDir: dir });
		await h.commands.get("caveman").handler("off", h.ctx);
		expect(state.enabled).toBe(false);
		expect(loadCavemanConfig(dir).autoEnable).toBe(false);
		await h.commands.get("caveman").handler("on", h.ctx);
		expect(state.enabled).toBe(true);
		expect(state.level).toBe("full");
		expect(loadCavemanConfig(dir).autoEnable).toBe(true);
		await h.commands.get("caveman").handler("normal", h.ctx);
		expect(state.enabled).toBe(false);
	});

	test.each(["lite", "full", "ultra", "wenyan", "wenyan-lite", "wenyan-full", "wenyan-ultra"])("/caveman %s updates level", async (level) => {
		const h = makeHarness();
		let state = createStartupState(loadCavemanConfig(dir));
		registerCavemanCommands(h.pi, { getState: () => state, setState: next => { state = next; }, agentDir: dir });
		await h.commands.get("caveman").handler(level, h.ctx);
		expect(state.enabled).toBe(true);
		expect(state.level).toBe(level === "wenyan" ? "wenyan-full" : level);
		expect(loadCavemanConfig(dir).defaultLevel).toBe(level === "wenyan" ? "wenyan-full" : level);
	});
});
