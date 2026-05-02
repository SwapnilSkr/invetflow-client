import { type ParsedLocation, redirect } from "@tanstack/react-router";
import type { AppUserRole } from "#/integrations/api/types";
import {
	ensureAuthResolved,
	useAuthStore,
} from "#/integrations/auth/auth-store";

function isBrowser(): boolean {
	return typeof window !== "undefined";
}

/**
 * Router `beforeLoad` guard: must have a valid session (any role).
 * See `requireRecruiter` / `requireCandidate` for job-specific areas.
 *
 * Async so we await client JWT hydration (sessionStorage + GET /api/auth/me). Skips redirect
 * during SSR — the token is not available on the server.
 */
export async function requireSession(): Promise<void> {
	if (!isBrowser()) return;
	await ensureAuthResolved();
	if (useAuthStore.getState().status === "unauthenticated") {
		throw redirect({ to: "/sign-in" });
	}
}

/**
 * Like `requireSession`, but after sign-in the user is sent back to this in-app path.
 * Uses `pathname` + `search` + `hash` so the `redirect` search param is a stable app-relative string.
 */
export async function requireSessionWithReturnTo(
	location: Pick<ParsedLocation, "pathname" | "searchStr" | "hash">,
): Promise<void> {
	if (!isBrowser()) return;
	await ensureAuthResolved();
	if (useAuthStore.getState().status === "unauthenticated") {
		const hash = location.hash ? `#${location.hash}` : "";
		const next = `${location.pathname}${location.searchStr ?? ""}${hash}`;
		throw redirect({ to: "/sign-in", search: { redirect: next } });
	}
}

/**
 * Hiring-side routes: list/create interviews, assign candidates, review.
 */
export async function requireRecruiter(): Promise<void> {
	if (!isBrowser()) return;
	await ensureAuthResolved();
	const { status, user } = useAuthStore.getState();
	if (status === "unauthenticated") {
		throw redirect({ to: "/sign-in" });
	}
	if (status === "authenticated" && isCandidateRole(user?.role)) {
		throw redirect({ to: "/candidate" });
	}
}

/**
 * Candidate home: only users who registered as job seekers.
 */
export async function requireCandidate(): Promise<void> {
	if (!isBrowser()) return;
	await ensureAuthResolved();
	const { status, user } = useAuthStore.getState();
	if (status === "unauthenticated") {
		throw redirect({ to: "/sign-in" });
	}
	if (status === "authenticated" && !isCandidateRole(user?.role)) {
		throw redirect({ to: "/dashboard" });
	}
}

function isCandidateRole(role: AppUserRole | undefined): boolean {
	return role === "Candidate";
}
