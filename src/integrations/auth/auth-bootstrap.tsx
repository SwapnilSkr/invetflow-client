import { useRouter } from "@tanstack/react-router";
import { useLayoutEffect } from "react";
import { useAuthStore } from "#/integrations/auth/auth-store";

let clientAuthBootstrapped = false;

/**
 * One client-only `useLayoutEffect` to call GET /api/auth/me when a JWT exists
 * (invetflow-server). Prefer layout effect over `useEffect` so validation runs
 * before paint; see react.dev "You Might Not Need an Effect" for other cases.
 * Module flag avoids duplicate runs under React StrictMode double-mount.
 *
 * After bootstrap, `router.invalidate()` re-runs active route `beforeLoad` guards
 * so session state matches URL without effect-driven redirects in leaf routes.
 */
export function AuthBootstrap() {
	const router = useRouter();
	useLayoutEffect(() => {
		if (clientAuthBootstrapped) return;
		clientAuthBootstrapped = true;
		void useAuthStore
			.getState()
			.initialize()
			.then(() => {
				void router.invalidate();
			});
	}, [router]);

	return null;
}
