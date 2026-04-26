import { create } from "zustand";
import {
	clearSessionCredentials,
	hasValidAccessToken,
	rememberAccessToken,
	setStoredToken,
} from "#/integrations/api/token-storage";
import type { User } from "#/integrations/api/types";
import { fetchCurrentUserFromApi } from "#/integrations/api/user-api";

export type AuthStatus = "initializing" | "unauthenticated" | "authenticated";

type AuthState = {
	status: AuthStatus;
	user: User | null;
	/** One-shot bootstrap: validate persisted JWT with GET /api/auth/me. */
	initialize: () => Promise<void>;
	/**
	 * Persist new tokens (sessionStorage) and user. Matches server AuthResponse
	 * after successful login or register.
	 */
	applyTokenResponse: (
		accessToken: string,
		expiresIn: number,
		user: User,
	) => void;
	/** Local sign-out: clears session storage and zustand (invetflow-server is JWT-only, no server revoke). */
	signOut: () => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
	status: "unauthenticated",
	user: null,

	initialize: async () => {
		if (!hasValidAccessToken()) {
			set({ status: "unauthenticated", user: null });
			return;
		}

		const { status, user: existing } = get();
		if (status === "authenticated" && existing) {
			return;
		}

		set({ status: "initializing" });

		try {
			const user = await fetchCurrentUserFromApi();
			set({ user, status: "authenticated" });
		} catch {
			get().signOut();
		}
	},

	applyTokenResponse: (accessToken, expiresIn, user) => {
		setStoredToken(accessToken, expiresIn);
		rememberAccessToken(accessToken);
		set({ user, status: "authenticated" });
	},

	signOut: () => {
		clearSessionCredentials();
		set({ user: null, status: "unauthenticated" });
	},
}));

/** Non-hook access (api client, interceptors) — use sparingly. */
export function getAuthStoreState() {
	return useAuthStore.getState();
}
