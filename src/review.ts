export function buildCavemanReviewGuidance(context = ""): string {
	const suffix = context.trim() ? `\nContext: ${context.trim()}` : "";
	return `Review terse. Format: L42: 🔴 bug: user null. Add guard. Separate must-fix from nit.${suffix}`;
}
