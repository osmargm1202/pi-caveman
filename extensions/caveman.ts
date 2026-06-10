import { loadCavemanConfig, saveCavemanConfig } from "../src/config";
import { createStartupState, getPromptOverlay, publishCavemanState } from "../src/runtime";
import { registerCavemanCommands } from "../src/commands";

const ACTIVATION_RE = /^(?:please\s+)?(?:activate|enable|turn on|start|talk like|use)\b.*\bcaveman\b|^\s*caveman\s+mode\b/i;
const DEACTIVATION_RE = /^(?:please\s+)?(?:stop|disable|deactivate|turn off)\b.*\bcaveman\b|^\s*caveman\b.*\b(stop|disable|deactivate|turn off)\b|^\s*normal mode\b/i;

export default function cavemanExtension(pi: any) {
	const agentDir = pi?.cavemanAgentDir;
	let state = createStartupState(loadCavemanConfig(agentDir));

	const setState = (next: typeof state) => {
		state = next;
		publishCavemanState(pi, state);
	};

	registerCavemanCommands?.(pi, { getState: () => state, setState, agentDir });

	pi.on?.("session_start", async () => {
		state = createStartupState(loadCavemanConfig(agentDir));
		publishCavemanState(pi, state);
	});

	pi.on?.("input", async (event: { source?: string; text?: string }) => {
		if (event.source === "extension") return { action: "continue" };
		const text = (event.text ?? "").trim();
		if (!text) return { action: "continue" };
		if (DEACTIVATION_RE.test(text)) {
			setState(createStartupState(saveCavemanConfig({ autoEnable: false }, agentDir)));
			return { action: "handled" };
		}
		if (ACTIVATION_RE.test(text)) {
			const current = loadCavemanConfig(agentDir);
			setState(createStartupState(saveCavemanConfig({ autoEnable: true, defaultLevel: current.defaultLevel }, agentDir)));
			return { action: "continue" };
		}
		return { action: "continue" };
	});

	pi.on?.("before_agent_start", async (event: { systemPrompt: string }) => {
		const overlay = getPromptOverlay(state);
		if (!overlay) return;
		return { systemPrompt: `${event.systemPrompt}\n\n${overlay}` };
	});
}
