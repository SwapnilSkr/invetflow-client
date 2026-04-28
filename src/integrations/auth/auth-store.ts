import { create } from "zustand";
import {
	clearSessionCredentials,
	hasValidAccessToken,
	rememberAccessToken,
	setStoredToken,
} from "#/integrations/api/token-storage";
import type { AppUserRole, User } from "#/integrations/api/types";
import { fetchCurrentUserFromApi } from "#/integrations/api/user-api";

function normalizeUser(u: User): User {
	const role: AppUserRole =
		u.role === "Candidate" || u.role === "Recruiter" ? u.role : "Recruiter";
	return {
		...u,
		role,
		company_name: u.company_name ?? null,
		company_size: u.company_size ?? null,
		job_title: u.job_title ?? null,
	};
}

export type AuthStatus = "initializing" | "unauthenticated" | "authenticated";

/** JWT is in sessionStorage — on the client, reflect “pending validation” so guards/UI don’t treat a refresh as logged-out before `initialize()` runs. */
function getInitialAuthStatus(): AuthStatus {
	if (typeof sessionStorage === "undefined") return "unauthenticated";
	return hasValidAccessToken() ? "initializing" : "unauthenticated";
}

let initializeInFlight: Promise<void> | null = null;

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
	/** After PATCH profile / me refresh — keeps JWT, updates `user` in zustand. */
	applyUser: (user: User) => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
	status: getInitialAuthStatus(),
	user: null,

	initialize: async () => {
		if (initializeInFlight) return initializeInFlight;

		initializeInFlight = (async () => {
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
				const user = normalizeUser(await fetchCurrentUserFromApi());
				set({ user, status: "authenticated" });
			} catch {
				get().signOut();
			}
		})().finally(() => {
			initializeInFlight = null;
		});

		return initializeInFlight;
	},

	applyTokenResponse: (accessToken, expiresIn, user) => {
		setStoredToken(accessToken, expiresIn);
		rememberAccessToken(accessToken);
		set({ user: normalizeUser(user), status: "authenticated" });
	},

	applyUser: (user) => {
		set({ user: normalizeUser(user), status: "authenticated" });
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

/**
 * Await once per load so router guards run after persisted JWT is validated (or cleared).
 * No-op on the server — sessionStorage JWT is client-only; guards skip redirects there.
 */
export function ensureAuthResolved(): Promise<void> {
	if (typeof window === "undefined") {
		return Promise.resolve();
	}
	return useAuthStore.getState().initialize();
}
