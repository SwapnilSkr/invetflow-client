/** Stored sign-up / auth role: hiring vs job seeker (matches server `UserResponse.role`). */
export type AppUserRole = "Recruiter" | "Candidate";

/** invetflow-server: `UserResponse` in `api/dto/auth_dto.rs` (GET /api/auth/me, login, register). */
export interface User {
	id: string;
	email: string;
	name: string | null;
	company_name: string | null;
	company_size: string | null;
	job_title: string | null;
	email_verified: boolean;
	role: AppUserRole;
	/** `"Password"` | `"Google"` — matches invetflow-server `UserResponse`. */
	auth_provider?: string;
	onboarding_completed_at?: string | null;
}

/** PATCH /api/auth/onboarding — recruiter profile after sign-up. */
export interface UpdateRecruiterOnboardingBody {
	name?: string;
	company_name?: string;
	company_size?: string;
	job_title?: string;
}

/** invetflow-server: `AuthResponse` (flattened `TokenResponse` + `user`) from `api/dto/auth_dto.rs`. */
export interface AuthResponse {
	access_token: string;
	token_type: string;
	expires_in: number;
	user: User;
}
