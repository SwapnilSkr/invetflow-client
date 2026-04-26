/**
 * Only allow in-app relative paths (prevents open redirects after auth).
 */
export function getSafeInternalRedirect(
	redirect: string | undefined,
): string | null {
	if (redirect == null || redirect === "") {
		return null;
	}
	if (!redirect.startsWith("/") || redirect.startsWith("//")) {
		return null;
	}
	if (redirect.includes("://") || redirect.includes("\\")) {
		return null;
	}
	return redirect;
}
