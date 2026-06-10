import { loadCavemanConfig, saveCavemanConfig, type CavemanConfig } from "./config";
import { normalizeCavemanLevel, type PiCavemanStateV1 } from "./contracts";
import { createCavemanState } from "./runtime";
import { buildCavemanCommitGuidance } from "./commit";
import { buildCavemanReviewGuidance } from "./review";
import { buildCompressGuidance } from "./compress";
import { formatStatsReport, loadCavemanStats, recordCommand, resetCavemanStats } from "./stats";

const OFF_ALIASES = new Set(["off", "stop", "disable", "normal", "normal-mode", "turn-off", "deactivate"]);
const ON_ALIASES = new Set(["on", "start", "enable", "activate", "caveman"]);

export interface CommandRegistrationContext {
	getState: () => PiCavemanStateV1;
	setState: (state: PiCavemanStateV1) => void;
	agentDir?: string;
}

function notify(ctx: any, message: string, color = "info") {
	ctx?.ui?.notify?.(message, color);
}

function usage(): string {
	return "Usage: /caveman [status|on|off|normal|lite|full|ultra|wenyan|wenyan-lite|wenyan-full|wenyan-ultra]";
}

function stateFromConfig(config: CavemanConfig): PiCavemanStateV1 {
	return createCavemanState(config, "command");
}

export function registerCavemanCommands(pi: any, runtime: CommandRegistrationContext): void {
	pi.registerCommand?.("caveman", {
		description: "Set caveman response mode.",
		handler: async (args = "", ctx?: any) => {
			recordCommand("caveman", runtime.agentDir);
			const value = String(args).trim().toLowerCase().replace(/\s+/g, "-");
			if (!value || value === "status") {
				const state = runtime.getState();
				notify(ctx, state.enabled && state.level ? `caveman:${state.level}` : "caveman:off");
				notify(ctx, usage());
				return;
			}

			if (OFF_ALIASES.has(value)) {
				const config = saveCavemanConfig({ autoEnable: false }, runtime.agentDir);
				runtime.setState(stateFromConfig(config));
				notify(ctx, "Caveman disabled. autoEnable=false persisted.", "warning");
				return;
			}

			if (ON_ALIASES.has(value)) {
				const current = loadCavemanConfig(runtime.agentDir);
				const config = saveCavemanConfig({ autoEnable: true, defaultLevel: current.defaultLevel }, runtime.agentDir);
				runtime.setState(stateFromConfig(config));
				notify(ctx, `Caveman set to ${config.defaultLevel}.`, "success");
				return;
			}

			const level = normalizeCavemanLevel(value);
			if (!level) {
				notify(ctx, `Unknown caveman level: ${args}`, "error");
				notify(ctx, usage(), "warning");
				return;
			}
			const config = saveCavemanConfig({ autoEnable: true, defaultLevel: level }, runtime.agentDir);
			runtime.setState(stateFromConfig(config));
			notify(ctx, `Caveman set to ${level}.`, "success");
		},
	});

	pi.registerCommand?.("caveman-commit", {
		description: "Generate terse Conventional Commit guidance.",
		handler: async (args = "", ctx?: any) => {
			recordCommand("caveman-commit", runtime.agentDir);
			notify(ctx, buildCavemanCommitGuidance(String(args)));
		},
	});

	pi.registerCommand?.("caveman-review", {
		description: "Generate terse review guidance.",
		handler: async (args = "", ctx?: any) => {
			recordCommand("caveman-review", runtime.agentDir);
			notify(ctx, buildCavemanReviewGuidance(String(args)));
		},
	});

	pi.registerCommand?.("caveman-compress", {
		description: "Preview safe caveman compression for a file.",
		handler: async (args = "", ctx?: any) => {
			recordCommand("caveman-compress", runtime.agentDir);
			notify(ctx, buildCompressGuidance(String(args)));
		},
	});

	pi.registerCommand?.("caveman-stats", {
		description: "Show best-effort caveman stats.",
		handler: async (args = "", ctx?: any) => {
			recordCommand("caveman-stats", runtime.agentDir);
			if (String(args).trim() === "--reset") {
				resetCavemanStats(runtime.agentDir);
				notify(ctx, "Caveman stats reset.");
				return;
			}
			notify(ctx, formatStatsReport(loadCavemanStats(runtime.agentDir)));
		},
	});
}
