/**
 * Aligned with invetflow-server `error.rs`: JSON body `{ error, status }` and HTTP status codes.
 */
export type ServerErrorJson = {
	error: string;
	status: number;
};

export type HttpErrorKind =
	| "bad_request"
	| "unauthorized"
	| "forbidden"
	| "not_found"
	| "conflict"
	| "server"
	| "unknown";

export function inferErrorKind(status: number): HttpErrorKind {
	if (status === 400) return "bad_request";
	if (status === 401) return "unauthorized";
	if (status === 403) return "forbidden";
	if (status === 404) return "not_found";
	if (status === 409) return "conflict";
	if (status >= 500) return "server";
	return "unknown";
}

export type ApiErrorMeta = {
	kind: HttpErrorKind;
	server?: ServerErrorJson;
	code?: string;
};

export class ApiError extends Error {
	public readonly kind: HttpErrorKind;

	constructor(
		public readonly status: number,
		message: string,
		public readonly meta?: ApiErrorMeta,
	) {
		super(message);
		this.name = "ApiError";
		this.kind = meta?.kind ?? inferErrorKind(status);
	}
}

export function isApiError(e: unknown): e is ApiError {
	return e instanceof ApiError;
}

/**
 * Parse a non-2xx/3xx `Response` from invetflow-server (`AppError::into_response`).
 */
export async function parseHttpError(
	response: Response,
	fallback: string,
): Promise<ApiError> {
	const text = await response.text();
	const status = response.status;
	const kind = inferErrorKind(status);
	let message = fallback;
	let server: ServerErrorJson | undefined;

	if (text) {
		try {
			const d = JSON.parse(text) as Record<string, unknown>;
			if (typeof d.error === "string" && d.error.length > 0) {
				message = d.error;
			} else {
				const m = d.message;
				if (typeof m === "string" && m.length > 0) {
					message = m;
				}
			}
			if (typeof d.error === "string" && d.error.length > 0) {
				const st = d.status;
				server = {
					error: d.error,
					status: typeof st === "number" ? st : status,
				};
			}
		} catch {
			const trimmed = text.trim();
			if (trimmed) {
				message = trimmed.slice(0, 500);
			}
		}
	}

	return new ApiError(status, message, { kind, server });
}
