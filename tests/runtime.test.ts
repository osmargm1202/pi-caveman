import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { buildPromptOverlay } from "../src/prompt-rules";
import { loadCavemanConfig, saveCavemanConfig } from "../src/config";
import { createStartupState, publishCavemanState, shouldInjectPromptOverlay } from "../src/runtime";

let dir: string;

beforeEach(() => {
	dir = mkdtempSync(join(tmpdir(), "pi-caveman-test-"));
});

afterEach(() => {
	rmSync(dir, { recursive: true, force: true });
});

describe("config", () => {
	test("missing config returns auto-on full defaults", () => {
		expect(loadCavemanConfig(dir)).toEqual({
			schemaVersion: 1,
			autoEnable: true,
			defaultLevel: "full",
			showStartupNotice: false,
		});
	});

	test("invalid config falls back tolerantly", () => {
		writeFileSync(join(dir, "config.json"), JSON.stringify({ autoEnable: "nope", defaultLevel: "bad", showStartupNotice: true }));
		expect(loadCavemanConfig(dir)).toEqual({
			schemaVersion: 1,
			autoEnable: true,
			defaultLevel: "full",
			showStartupNotice: true,
		});
	});

	test("save writes normalized config atomically", () => {
		saveCavemanConfig({ autoEnable: false, defaultLevel: "lite", showStartupNotice: true }, dir);
		expect(loadCavemanConfig(dir)).toEqual({
			schemaVersion: 1,
			autoEnable: false,
			defaultLevel: "lite",
			showStartupNotice: true,
		});
	});
});

describe("runtime", () => {
	test("default config creates enabled full startup state", () => {
		const state = createStartupState(loadCavemanConfig(dir));
		expect(state.enabled).toBe(true);
		expect(state.level).toBe("full");
		expect(state.autoEnable).toBe(true);
	});

	test("autoEnable false creates disabled state and no overlay", () => {
		saveCavemanConfig({ autoEnable: false }, dir);
		const state = createStartupState(loadCavemanConfig(dir));
		expect(state.enabled).toBe(false);
		expect(state.level).toBeNull();
		expect(shouldInjectPromptOverlay(state)).toBe(false);
	});

	test("defaultLevel lite starts enabled lite", () => {
		saveCavemanConfig({ defaultLevel: "lite" }, dir);
		const state = createStartupState(loadCavemanConfig(dir));
		expect(state.enabled).toBe(true);
		expect(state.level).toBe("lite");
	});

	test("prompt overlay references package rules, not SKILL.md", () => {
		const state = createStartupState(loadCavemanConfig(dir));
		const overlay = buildPromptOverlay(state);
		expect(overlay).toContain("Caveman Runtime Mode");
		expect(overlay).toContain("Behavior source: pi-caveman package rules");
		expect(overlay).not.toContain("SKILL.md");
	});

	test("publishes shared entry and event", () => {
		const appended: unknown[] = [];
		const emitted: unknown[] = [];
		const state = createStartupState(loadCavemanConfig(dir));
		publishCavemanState({
			appendEntry: (key: string, value: unknown) => appended.push({ key, value }),
			events: { emit: (key: string, value: unknown) => emitted.push({ key, value }) },
		}, state);
		expect(appended).toEqual([{ key: "pi-caveman:state", value: state }]);
		expect(emitted).toEqual([{ key: "pi-caveman:state", value: state }]);
	});
});
