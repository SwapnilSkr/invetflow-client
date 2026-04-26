/** invetflow-server: `UserResponse` in `api/dto/auth_dto.rs` (GET /api/auth/me, login, register). */
export interface User {
	id: string;
	email: string;
	name: string | null;
	email_verified: boolean;
}

/** invetflow-server: `AuthResponse` (flattened `TokenResponse` + `user`) from `api/dto/auth_dto.rs`. */
export interface AuthResponse {
	access_token: string;
	token_type: string;
	expires_in: number;
	user: User;
}
