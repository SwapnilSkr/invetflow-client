import { type ParsedLocation, redirect } from "@tanstack/react-router";
import type { AppUserRole } from "#/integrations/api/types";
import { useAuthStore } from "#/integrations/auth/auth-store";

/**
 * Router `beforeLoad` guard: must have a valid session (any role).
 * See `requireRecruiter` / `requireCandidate` for job-specific areas.
 */
export function requireSession(): void {
	if (useAuthStore.getState().status === "unauthenticated") {
		throw redirect({ to: "/auth" });
	}
}

/**
 * Like `requireSession`, but after sign-in the user is sent back to this in-app path (`location.href` without origin).
 */
export function requireSessionWithReturnTo(
	location: Pick<ParsedLocation, "href">,
): void {
	if (useAuthStore.getState().status === "unauthenticated") {
		throw redirect({ to: "/auth", search: { redirect: location.href } });
	}
}

/**
 * Hiring-side routes: list/create interviews, assign candidates, review.
 */
export function requireRecruiter(): void {
	const { status, user } = useAuthStore.getState();
	if (status === "unauthenticated") {
		throw redirect({ to: "/auth" });
	}
	if (status === "authenticated" && isCandidateRole(user?.role)) {
		throw redirect({ to: "/candidate" });
	}
}

/**
 * Candidate home: only users who registered as job seekers.
 */
export function requireCandidate(): void {
	const { status, user } = useAuthStore.getState();
	if (status === "unauthenticated") {
		throw redirect({ to: "/auth" });
	}
	if (status === "authenticated" && !isCandidateRole(user?.role)) {
		throw redirect({ to: "/dashboard" });
	}
}

function isCandidateRole(role: AppUserRole | undefined): boolean {
	return role === "Candidate";
}
