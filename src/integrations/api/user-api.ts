import { parseHttpError } from "./errors";
import { getApiToken } from "./token-storage";
import type { User } from "./types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

/** GET /api/auth/me — used for bootstrap; avoids importing the full `apiClient` to prevent cycles. */
export async function fetchCurrentUserFromApi(): Promise<User> {
	const token = await getApiToken();

	const response = await fetch(`${API_BASE}/api/auth/me`, {
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		},
	});

	if (!response.ok) {
		if (response.status === 401) {
			const { useAuthStore } = await import("#/integrations/auth/auth-store");
			useAuthStore.getState().signOut();
		}
		throw await parseHttpError(
			response,
			response.status === 401 ? "Not authenticated" : "Request failed",
		);
	}

	return response.json() as Promise<User>;
}
