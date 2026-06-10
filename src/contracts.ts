export const PI_CAVEMAN_STATE_KEY = "pi-caveman:state";
export const PI_CAVEMAN_STATE_EVENT = "pi-caveman:state";

export const CAVEMAN_LEVELS = [
	"lite",
	"full",
	"ultra",
	"wenyan-lite",
	"wenyan-full",
	"wenyan-ultra",
] as const;

export type CavemanLevel = (typeof CAVEMAN_LEVELS)[number];

export type PiCavemanStateSource = "startup" | "command" | "input" | "config";

export interface PiCavemanStateV1 {
	schemaVersion: 1;
	packageName: "pi-caveman";
	enabled: boolean;
	level: CavemanLevel | null;
	defaultLevel: CavemanLevel;
	autoEnable: boolean;
	source: PiCavemanStateSource;
	updatedAt: number;
}

export function isCavemanLevel(value: unknown): value is CavemanLevel {
	return typeof value === "string" && (CAVEMAN_LEVELS as readonly string[]).includes(value.trim().toLowerCase());
}

export function normalizeCavemanLevel(value: unknown): CavemanLevel | undefined {
	if (typeof value !== "string") return undefined;
	const normalized = value.trim().toLowerCase().replace(/\s+/g, "-");
	if (normalized === "wenyan") return "wenyan-full";
	return isCavemanLevel(normalized) ? normalized : undefined;
}

export function normalizeObservedCavemanState(value: unknown): PiCavemanStateV1 | null {
	if (!value || typeof value !== "object") return null;
	const candidate = value as Partial<PiCavemanStateV1>;
	if (candidate.schemaVersion !== 1) return null;
	if (candidate.packageName !== "pi-caveman") return null;
	if (typeof candidate.enabled !== "boolean") return null;
	if (candidate.level !== null && !isCavemanLevel(candidate.level)) return null;
	if (!isCavemanLevel(candidate.defaultLevel)) return null;
	if (typeof candidate.autoEnable !== "boolean") return null;
	if (!["startup", "command", "input", "config"].includes(String(candidate.source))) return null;
	if (typeof candidate.updatedAt !== "number" || !Number.isFinite(candidate.updatedAt)) return null;
	return candidate as PiCavemanStateV1;
}
