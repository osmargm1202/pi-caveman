import { describe, expect, test } from "bun:test";
import manifest from "../package.json";
import {
	CAVEMAN_LEVELS,
	PI_CAVEMAN_STATE_EVENT,
	PI_CAVEMAN_STATE_KEY,
	normalizeObservedCavemanState,
} from "../src/contracts";

describe("pi-caveman contract", () => {
	test("uses stable shared state key and event", () => {
		expect(PI_CAVEMAN_STATE_KEY).toBe("pi-caveman:state");
		expect(PI_CAVEMAN_STATE_EVENT).toBe("pi-caveman:state");
		expect(CAVEMAN_LEVELS).toContain("full");
	});

	test("validates state payload shape", () => {
		const state = normalizeObservedCavemanState({
			schemaVersion: 1,
			packageName: "pi-caveman",
			enabled: true,
			level: "full",
			defaultLevel: "full",
			autoEnable: true,
			source: "startup",
			updatedAt: 123,
		});

		expect(state?.level).toBe("full");
		expect(state?.enabled).toBe(true);
	});

	test("rejects invalid payloads", () => {
		expect(normalizeObservedCavemanState(null)).toBeNull();
		expect(normalizeObservedCavemanState({ schemaVersion: 2, packageName: "pi-caveman" })).toBeNull();
		expect(normalizeObservedCavemanState({ schemaVersion: 1, packageName: "other", enabled: true })).toBeNull();
		expect(normalizeObservedCavemanState({ schemaVersion: 1, packageName: "pi-caveman", enabled: true, level: "bad" })).toBeNull();
	});
});

describe("Pi package manifest", () => {
	test("is installable as Pi extension package without skills", () => {
		expect(manifest.name).toBe("pi-caveman");
		expect(manifest.pi?.extensions).toEqual(["./extensions/caveman.ts"]);
		expect(manifest.pi?.skills).toBeUndefined();
		expect(manifest.files).toEqual(expect.arrayContaining(["extensions", "src", "README.md", "LICENSE"]));
	});
});
