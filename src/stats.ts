import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { getPiCavemanDir } from "./config";

export interface CavemanStats {
	schemaVersion: 1;
	commandCount: number;
	commands: Record<string, number>;
	enabledSessions: number;
	disabledSessions: number;
	levelSwitches: number;
	compressFileSavingsBytes: number;
	estimatedOutputTokensSaved: number;
	updatedAt: number;
}

export const DEFAULT_STATS: CavemanStats = {
	schemaVersion: 1,
	commandCount: 0,
	commands: {},
	enabledSessions: 0,
	disabledSessions: 0,
	levelSwitches: 0,
	compressFileSavingsBytes: 0,
	estimatedOutputTokensSaved: 0,
	updatedAt: 0,
};

export function getStatsPath(agentOrStatsDir?: string): string {
	const base = agentOrStatsDir ?? getPiCavemanDir();
	return base.endsWith("stats.json") ? base : join(base, "stats.json");
}

export function loadCavemanStats(agentOrStatsDir?: string): CavemanStats {
	const path = getStatsPath(agentOrStatsDir);
	if (!existsSync(path)) return { ...DEFAULT_STATS, commands: {} };
	try {
		const raw = JSON.parse(readFileSync(path, "utf8")) as Partial<CavemanStats>;
		return {
			schemaVersion: 1,
			commandCount: Number.isFinite(raw.commandCount) ? Number(raw.commandCount) : 0,
			commands: raw.commands && typeof raw.commands === "object" ? { ...raw.commands } as Record<string, number> : {},
			enabledSessions: Number.isFinite(raw.enabledSessions) ? Number(raw.enabledSessions) : 0,
			disabledSessions: Number.isFinite(raw.disabledSessions) ? Number(raw.disabledSessions) : 0,
			levelSwitches: Number.isFinite(raw.levelSwitches) ? Number(raw.levelSwitches) : 0,
			compressFileSavingsBytes: Number.isFinite(raw.compressFileSavingsBytes) ? Number(raw.compressFileSavingsBytes) : 0,
			estimatedOutputTokensSaved: Number.isFinite(raw.estimatedOutputTokensSaved) ? Number(raw.estimatedOutputTokensSaved) : 0,
			updatedAt: Number.isFinite(raw.updatedAt) ? Number(raw.updatedAt) : 0,
		};
	} catch {
		return { ...DEFAULT_STATS, commands: {} };
	}
}

export function saveCavemanStats(stats: CavemanStats, agentOrStatsDir?: string): CavemanStats {
	const path = getStatsPath(agentOrStatsDir);
	mkdirSync(dirname(path), { recursive: true });
	const next = { ...stats, schemaVersion: 1 as const, updatedAt: Date.now() };
	const tempPath = `${path}.${process.pid}.${Date.now()}.tmp`;
	writeFileSync(tempPath, `${JSON.stringify(next, null, "\t")}\n`, "utf8");
	renameSync(tempPath, path);
	return next;
}

export function recordCommand(command: string, agentOrStatsDir?: string): CavemanStats {
	const stats = loadCavemanStats(agentOrStatsDir);
	stats.commandCount += 1;
	stats.commands[command] = (stats.commands[command] ?? 0) + 1;
	return saveCavemanStats(stats, agentOrStatsDir);
}

export function resetCavemanStats(agentOrStatsDir?: string): CavemanStats {
	return saveCavemanStats({ ...DEFAULT_STATS, commands: {} }, agentOrStatsDir);
}

export function formatStatsReport(stats: CavemanStats): string {
	return [
		"Caveman stats (best-effort estimates)",
		`Commands: ${stats.commandCount}`,
		`Enabled sessions: ${stats.enabledSessions}`,
		`Disabled sessions: ${stats.disabledSessions}`,
		`Level switches: ${stats.levelSwitches}`,
		`Compress savings: ${stats.compressFileSavingsBytes} bytes`,
		`Estimated output tokens saved: ${stats.estimatedOutputTokensSaved}`,
	].join("\n");
}
