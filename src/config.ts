import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import { normalizeCavemanLevel, type CavemanLevel } from "./contracts";

export interface CavemanConfig {
	schemaVersion: 1;
	autoEnable: boolean;
	defaultLevel: CavemanLevel;
	showStartupNotice: boolean;
}

export const DEFAULT_CAVEMAN_CONFIG: CavemanConfig = {
	schemaVersion: 1,
	autoEnable: true,
	defaultLevel: "full",
	showStartupNotice: false,
};

export function getPiCavemanDir(agentDir = process.env.PI_AGENT_DIR ?? process.env.PI_CAVEMAN_AGENT_DIR ?? join(homedir(), ".pi", "agent")): string {
	return join(agentDir, "pi-caveman");
}

export function getCavemanConfigPath(agentOrConfigDir?: string): string {
	const base = agentOrConfigDir ?? getPiCavemanDir();
	return base.endsWith("config.json") ? base : join(base, "config.json");
}

export function loadCavemanConfig(agentOrConfigDir?: string): CavemanConfig {
	const path = getCavemanConfigPath(agentOrConfigDir);
	if (!existsSync(path)) return { ...DEFAULT_CAVEMAN_CONFIG };
	try {
		const raw = JSON.parse(readFileSync(path, "utf8")) as Partial<CavemanConfig>;
		return {
			schemaVersion: 1,
			autoEnable: typeof raw.autoEnable === "boolean" ? raw.autoEnable : DEFAULT_CAVEMAN_CONFIG.autoEnable,
			defaultLevel: normalizeCavemanLevel(raw.defaultLevel) ?? DEFAULT_CAVEMAN_CONFIG.defaultLevel,
			showStartupNotice: typeof raw.showStartupNotice === "boolean" ? raw.showStartupNotice : DEFAULT_CAVEMAN_CONFIG.showStartupNotice,
		};
	} catch {
		return { ...DEFAULT_CAVEMAN_CONFIG };
	}
}

export function saveCavemanConfig(config: Partial<CavemanConfig>, agentOrConfigDir?: string): CavemanConfig {
	const current = loadCavemanConfig(agentOrConfigDir);
	const next: CavemanConfig = {
		schemaVersion: 1,
		autoEnable: typeof config.autoEnable === "boolean" ? config.autoEnable : current.autoEnable,
		defaultLevel: normalizeCavemanLevel(config.defaultLevel) ?? current.defaultLevel,
		showStartupNotice: typeof config.showStartupNotice === "boolean" ? config.showStartupNotice : current.showStartupNotice,
	};
	const path = getCavemanConfigPath(agentOrConfigDir);
	mkdirSync(dirname(path), { recursive: true });
	const tempPath = `${path}.${process.pid}.${Date.now()}.tmp`;
	writeFileSync(tempPath, `${JSON.stringify(next, null, "\t")}\n`, "utf8");
	renameSync(tempPath, path);
	return next;
}
