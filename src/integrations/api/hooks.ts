// Auth-related React hooks (Zustand + invetflow-server JWT contract)
// Interview/session query hooks and mutations live in ./queries.ts

import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useShallow } from "zustand/shallow";
import { useAuthStore } from "#/integrations/auth/auth-store";
import { logout } from "./client";

/** Routes that use `beforeLoad: requireSession` — sign-out must `navigate` or user stays on the page. */
function isSessionGuardedPath(pathname: string): boolean {
	return (
		pathname.startsWith("/dashboard") ||
		pathname.startsWith("/interviews") ||
		pathname.startsWith("/interview/") ||
		pathname.startsWith("/candidate")
	);
}

export function useAuth() {
	return useAuthStore(
		useShallow((state) => {
			const { status, user } = state;
			return {
				user: status === "authenticated" ? user : null,
				isAuthenticated: status === "authenticated",
				/** True only while validating a stored JWT (GET /api/auth/me) on load. */
				isLoading: status === "initializing",
			};
		}),
	);
}

export function useLogout() {
	const queryClient = useQueryClient();
	const router = useRouter();
	const navigate = useNavigate();

	/** Logout in the click handler: clear session, then navigate off guarded routes (no `useEffect`). */
	return () => {
		const path = router.state.location.pathname;
		logout();
		queryClient.clear();
		if (isSessionGuardedPath(path)) {
			void navigate({ to: "/sign-in" });
		}
	};
}
