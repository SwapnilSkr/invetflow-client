/**
 * Lets `user-api` trigger sign-out on 401 without importing `auth-store`,
 * which would create a circular dependency (`auth-store` → `user-api` → `auth-store`).
 */
let onUnauthorized: (() => void) | null = null;

export function registerApiUnauthorizedHandler(handler: () => void) {
	onUnauthorized = handler;
}

export function notifyApiUnauthorized() {
	onUnauthorized?.();
}
