import { redirect } from "@tanstack/react-router";
import { useAuthStore } from "#/integrations/auth/auth-store";

/**
 * TanStack Router `beforeLoad` guard: recruiters must have a session (Zustand +
 * invetflow-server JWT in sessionStorage). `initializing` is allowed so bootstrap
 * can finish; only explicit guests are redirected to `/auth`.
 */
export function requireSession(): void {
	if (useAuthStore.getState().status === "unauthenticated") {
		throw redirect({ to: "/auth" });
	}
}
