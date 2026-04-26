/**
 * Only allow in-app relative paths, or the same origin as `window` (strips path from full URLs).
 * Prevents open redirects after auth.
 */
export function getSafeInternalRedirect(
	redirect: string | undefined,
): string | null {
	if (redirect == null || redirect === "") {
		return null;
	}

	try {
		if (redirect.startsWith("http://") || redirect.startsWith("https://")) {
			if (typeof window === "undefined") {
				return null;
			}
			const u = new URL(redirect, window.location.origin);
			if (u.origin !== window.location.origin) {
				return null;
			}
			return `${u.pathname}${u.search}${u.hash}`;
		}
	} catch {
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
