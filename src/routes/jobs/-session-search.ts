export interface SessionSearch {
	sessionId: string;
	token?: string;
	url?: string;
	startRoom?: string;
}

export function parseSessionSearch(
	search: Record<string, unknown>,
): SessionSearch {
	const token = typeof search.token === "string" ? search.token.trim() : "";
	const url = typeof search.url === "string" ? search.url.trim() : "";
	return {
		sessionId: String(search.sessionId ?? ""),
		token: token || undefined,
		url: url || undefined,
		startRoom:
			typeof search.startRoom === "string" ? search.startRoom : undefined,
	};
}
