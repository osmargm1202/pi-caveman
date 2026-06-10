export function buildCavemanCommitGuidance(context = ""): string {
	const suffix = context.trim() ? `\nContext: ${context.trim()}` : "";
	return `Write Conventional Commit. Subject ≤50 chars. Body only when why not obvious. Prefer intent over file list.${suffix}`;
}
