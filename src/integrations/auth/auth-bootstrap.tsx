import { useLayoutEffect } from "react";
import { useAuthStore } from "#/integrations/auth/auth-store";

let clientAuthBootstrapped = false;

/**
 * One client-only `useLayoutEffect` to call GET /api/auth/me when a JWT exists
 * (invetflow-server). Prefer layout effect over `useEffect` so validation runs
 * before paint; see react.dev "You Might Not Need an Effect" for other cases.
 * Module flag avoids duplicate runs under React StrictMode double-mount.
 */
export function AuthBootstrap() {
	useLayoutEffect(() => {
		if (clientAuthBootstrapped) return;
		clientAuthBootstrapped = true;
		void useAuthStore.getState().initialize();
	}, []);

	return null;
}
