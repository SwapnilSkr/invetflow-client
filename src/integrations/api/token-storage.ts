import { ApiError, inferErrorKind } from "./errors";

const TOKEN_KEY = "invetflow_api_token";
const TOKEN_EXPIRY_KEY = "invetflow_api_token_expiry";

function getStoredToken(): string | null {
	if (typeof sessionStorage === "undefined") return null;
	return sessionStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string, expiresIn: number): void {
	sessionStorage.setItem(TOKEN_KEY, token);
	sessionStorage.setItem(
		TOKEN_EXPIRY_KEY,
		String(Date.now() + expiresIn * 1000 - 60_000),
	);
}

export function clearStoredToken(): void {
	if (typeof sessionStorage === "undefined") return;
	sessionStorage.removeItem(TOKEN_KEY);
	sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
}

function isTokenExpired(): boolean {
	if (typeof sessionStorage === "undefined") return true;
	const expiry = sessionStorage.getItem(TOKEN_EXPIRY_KEY);
	if (!expiry) return true;
	return Date.now() >= parseInt(expiry, 10);
}

let cachedToken: string | null = null;

/** True if a non-expired JWT is in session storage (browser only). */
export function hasValidAccessToken(): boolean {
	if (typeof sessionStorage === "undefined") return false;
	if (!getStoredToken() || isTokenExpired()) return false;
	return true;
}

/** Clears persisted token and in-memory cache (used on sign-out and 401). */
export function clearSessionCredentials(): void {
	clearStoredToken();
	cachedToken = null;
}

/** Returns the stored JWT, or throws ApiError(401) if not signed in. */
export async function getApiToken(): Promise<string> {
	if (cachedToken && !isTokenExpired()) {
		return cachedToken;
	}
	const st = getStoredToken();
	if (st && !isTokenExpired()) {
		cachedToken = st;
		return st;
	}
	throw new ApiError(401, "Not signed in. Go to /auth to log in.", {
		kind: inferErrorKind(401),
	});
}

/** Called when a new access token is issued (login / register / refresh). */
export function rememberAccessToken(token: string): void {
	cachedToken = token;
}
