import { PI_CAVEMAN_STATE_EVENT, PI_CAVEMAN_STATE_KEY, type PiCavemanStateSource, type PiCavemanStateV1 } from "./contracts";
import type { CavemanConfig } from "./config";
import { buildPromptOverlay } from "./prompt-rules";

export interface StatePublisher {
	appendEntry?: (customType: string, data: unknown) => unknown;
	events?: { emit?: (eventName: string, payload: unknown) => unknown };
}

export function createCavemanState(config: CavemanConfig, source: PiCavemanStateSource): PiCavemanStateV1 {
	return {
		schemaVersion: 1,
		packageName: "pi-caveman",
		enabled: config.autoEnable,
		level: config.autoEnable ? config.defaultLevel : null,
		defaultLevel: config.defaultLevel,
		autoEnable: config.autoEnable,
		source,
		updatedAt: Date.now(),
	};
}

export function createStartupState(config: CavemanConfig): PiCavemanStateV1 {
	return createCavemanState(config, "startup");
}

export function shouldInjectPromptOverlay(state: PiCavemanStateV1): boolean {
	return state.enabled && state.level !== null;
}

export function getPromptOverlay(state: PiCavemanStateV1): string | undefined {
	return shouldInjectPromptOverlay(state) ? buildPromptOverlay(state) : undefined;
}

export function publishCavemanState(pi: StatePublisher, state: PiCavemanStateV1): void {
	pi.appendEntry?.(PI_CAVEMAN_STATE_KEY, state);
	pi.events?.emit?.(PI_CAVEMAN_STATE_EVENT, state);
}
