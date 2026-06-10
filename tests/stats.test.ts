import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { formatStatsReport, loadCavemanStats, recordCommand, resetCavemanStats } from "../src/stats";

describe("stats", () => {
	test("reads defaults, writes commands, reports estimates clearly, and resets", () => {
		const dir = mkdtempSync(join(tmpdir(), "pi-caveman-stats-"));
		try {
			expect(loadCavemanStats(dir).commandCount).toBe(0);
			recordCommand("caveman", dir);
			recordCommand("caveman-stats", dir);
			const stats = loadCavemanStats(dir);
			expect(stats.commandCount).toBe(2);
			expect(stats.commands.caveman).toBe(1);
			const report = formatStatsReport(stats);
			expect(report).toContain("estimates");
			expect(report).toContain("Commands: 2");
			resetCavemanStats(dir);
			expect(loadCavemanStats(dir).commandCount).toBe(0);
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});
});
