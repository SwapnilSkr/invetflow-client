// API client for the Invetflow Rust backend (Bearer JWT, invetflow-server /api/*)

import { getAuthStoreState } from "#/integrations/auth/auth-store";
import { parseHttpError } from "./errors";
import { getApiToken } from "./token-storage";
import type { AuthResponse } from "./types";

export {
	ApiError,
	type HttpErrorKind,
	isApiError,
	parseHttpError,
	type ServerErrorJson,
} from "./errors";
export { hasValidAccessToken } from "./token-storage";
export type { AuthResponse, User } from "./types";
export { fetchCurrentUserFromApi as fetchCurrentUser } from "./user-api";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

// --- Interview and domain DTOs (align with invetflow-server JSON) ---

export interface Interview {
	id: string;
	title: string;
	job_title: string;
	job_description: string | null;
	questions: Question[];
	status: "Draft" | "Scheduled" | "Active" | "Completed" | "Cancelled";
	recruiter_id: string;
	candidate_id: string | null;
	candidate_name: string | null;
	candidate_email: string | null;
	livekit_room: string | null;
	duration_minutes: number;
	created_at: string;
	updated_at: string;
	invite_token: string | null;
	invite_link: string | null;
	/** Any signed-in user (except admins) may join when scheduled, not only the assignee. */
	is_public: boolean;
}

export interface Question {
	id: string;
	question: string;
	category:
		| "Technical"
		| "Behavioral"
		| "Situational"
		| "Coding"
		| "SystemDesign"
		| "SoftSkills";
	time_limit_seconds: number | null;
	follow_up_prompts: string[];
	order: number;
}

export interface CreateInterviewRequest {
	title: string;
	job_title: string;
	job_description?: string;
	questions: CreateQuestionRequest[];
	duration_minutes?: number;
}

export interface CreateQuestionRequest {
	question: string;
	category: string;
	time_limit_seconds?: number;
	follow_up_prompts: string[];
}

export interface UpdateInterviewRequest {
	title?: string;
	job_title?: string;
	job_description?: string;
	duration_minutes?: number;
	is_public?: boolean;
	/** Close the role in the app when you are done hiring. Ending a call only ends that answer session, not the job. */
	status?: "Completed" | "Cancelled";
}

export interface InterviewSessionListResponse {
	sessions: Session[];
}

export interface AssignCandidateRequest {
	candidate_name: string;
	candidate_email: string;
}

export interface JoinInterviewResponse {
	interview_id: string;
	session_id: string;
	livekit_token: string;
	livekit_url: string;
	interview: Interview;
}

export interface Session {
	id: string;
	interview_id: string;
	candidate_id: string;
	livekit_room: string;
	status: "Waiting" | "Active" | "Paused" | "Completed" | "Cancelled";
	current_question_index: number;
	started_at: string;
	ended_at: string | null;
	duration_seconds: number;
}

export interface TranscriptEntry {
	id: string;
	speaker: "Candidate" | "AI" | "System";
	content: string;
	timestamp: string;
	question_id: string | null;
	confidence: number | null;
}

export interface InterviewScores {
	technical_accuracy: number;
	communication: number;
	problem_solving: number;
	confidence: number;
	overall: number;
	reasoning: string;
	strengths: string[];
	areas_for_improvement: string[];
	evaluated_at: string;
}

export interface LoginRequestBody {
	email: string;
	password: string;
}

export interface RegisterRequestBody {
	email: string;
	password: string;
	name?: string;
	/** Must match invetflow-server `UserAccountRole` JSON ("Recruiter" | "Candidate"). */
	role: "Recruiter" | "Candidate";
}

function applyAuthResponse(data: AuthResponse) {
	getAuthStoreState().applyTokenResponse(
		data.access_token,
		data.expires_in,
		data.user,
	);
}

export async function loginWithPassword(
	body: LoginRequestBody,
): Promise<AuthResponse> {
	const response = await fetch(`${API_BASE}/api/auth/login`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
	if (!response.ok) {
		throw await parseHttpError(response, "Sign in failed");
	}
	const data: AuthResponse = await response.json();
	applyAuthResponse(data);
	return data;
}

export async function registerWithPassword(
	body: RegisterRequestBody,
): Promise<AuthResponse> {
	const response = await fetch(`${API_BASE}/api/auth/register`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
	if (!response.ok) {
		throw await parseHttpError(response, "Registration failed");
	}
	const data: AuthResponse = await response.json();
	applyAuthResponse(data);
	return data;
}

export async function apiClientPublic<T>(
	endpoint: string,
	options: RequestInit = {},
): Promise<T> {
	const response = await fetch(`${API_BASE}${endpoint}`, {
		...options,
		headers: {
			"Content-Type": "application/json",
			...options.headers,
		},
	});
	if (!response.ok) {
		throw await parseHttpError(response, "Request failed");
	}
	if (response.status === 204) {
		return null as T;
	}
	return response.json();
}

export async function apiClient<T>(
	endpoint: string,
	options: RequestInit = {},
): Promise<T> {
	const token = await getApiToken();

	const response = await fetch(`${API_BASE}${endpoint}`, {
		...options,
		headers: {
			...options.headers,
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		},
	});

	if (response.status === 401) {
		getAuthStoreState().signOut();
	}

	if (!response.ok) {
		throw await parseHttpError(response, "Request failed");
	}

	if (response.status === 204) {
		return null as T;
	}

	return response.json();
}

/** Clears local session and zustand (JWT has no server revoke on invetflow-server). */
export function logout() {
	getAuthStoreState().signOut();
}

export async function healthCheck(): Promise<{
	status: string;
	version: string;
}> {
	const response = await fetch(`${API_BASE}/health`);
	if (!response.ok) {
		throw await parseHttpError(response, "Health check failed");
	}
	return response.json();
}
