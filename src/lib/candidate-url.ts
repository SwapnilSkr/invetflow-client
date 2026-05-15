const FALLBACK = "http://localhost:3002";

function getCandidateOrigin(): string {
	const fromEnv = import.meta.env.VITE_CANDIDATE_APP_URL as string | undefined;
	if (!fromEnv || fromEnv.trim() === "") {
		if (import.meta.env.DEV) {
			console.warn(
				"[candidate-url] VITE_CANDIDATE_APP_URL is not set; falling back to %s",
				FALLBACK,
			);
		}
		return FALLBACK;
	}
	return fromEnv.replace(/\/$/, "");
}

export function buildCandidateUrl(
	path: string | null | undefined,
): string | null {
	if (!path) return null;
	if (/^https?:\/\//i.test(path)) return path;
	const origin = getCandidateOrigin();
	const suffix = path.startsWith("/") ? path : `/${path}`;
	return `${origin}${suffix}`;
}

export function candidateOrigin(): string {
	return getCandidateOrigin();
}
