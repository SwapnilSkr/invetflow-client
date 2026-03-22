// API Client for Invetflow Backend
// Handles authentication token exchange and HTTP requests to the Rust backend

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

export class ApiError extends Error {
	constructor(
		public status: number,
		message: string,
		public code?: string,
	) {
		super(message);
		this.name = "ApiError";
	}
}

// Types
export interface User {
	id: string;
	email: string;
	name: string | null;
	email_verified: boolean;
}

export interface AuthResponse {
	access_token: string;
	token_type: string;
	expires_in: number;
	user: User;
}

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

// Token Management
const TOKEN_KEY = "invetflow_api_token";
const TOKEN_EXPIRY_KEY = "invetflow_api_token_expiry";

function getStoredToken(): string | null {
	return sessionStorage.getItem(TOKEN_KEY);
}

function setStoredToken(token: string, expiresIn: number): void {
	sessionStorage.setItem(TOKEN_KEY, token);
	sessionStorage.setItem(
		TOKEN_EXPIRY_KEY,
		(Date.now() + expiresIn * 1000 - 60000).toString(),
	);
}

function clearStoredToken(): void {
	sessionStorage.removeItem(TOKEN_KEY);
	sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
}

function isTokenExpired(): boolean {
	const expiry = sessionStorage.getItem(TOKEN_EXPIRY_KEY);
	if (!expiry) return true;
	return Date.now() >= parseInt(expiry);
}

// API Client
let cachedToken: string | null = null;

export async function getApiToken(): Promise<string> {
	// Check memory cache first
	if (cachedToken && !isTokenExpired()) {
		return cachedToken;
	}

	// Check session storage
	const storedToken = getStoredToken();
	if (storedToken && !isTokenExpired()) {
		cachedToken = storedToken;
		return storedToken;
	}

	// Get session from better-auth
	const { authClient } = await import("#/lib/auth-client");
	const session = await authClient.getSession();

	if (!session?.data?.session?.id) {
		throw new ApiError(401, "Not authenticated. Please log in.");
	}

	// Exchange session for API token
	const response = await fetch(`${API_BASE}/api/auth/exchange`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		credentials: "include",
		body: JSON.stringify({ session_id: session.data.session.id }),
	});

	if (!response.ok) {
		const error = await response
			.json()
			.catch(() => ({ message: "Failed to get API token" }));
		throw new ApiError(
			response.status,
			error.message || "Failed to get API token",
		);
	}

	const data: AuthResponse = await response.json();

	// Cache token
	setStoredToken(data.access_token, data.expires_in);
	cachedToken = data.access_token;

	return data.access_token;
}

export async function apiClient<T>(
	endpoint: string,
	options: RequestInit = {},
	_retry = false,
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

	if (response.status === 401 && !_retry) {
		// Token expired, clear and retry once
		clearStoredToken();
		cachedToken = null;
		return apiClient<T>(endpoint, options, true);
	}

	if (!response.ok) {
		const error = await response
			.json()
			.catch(() => ({ message: "Request failed" }));
		throw new ApiError(
			response.status,
			error.error || error.message || "Request failed",
			error.code,
		);
	}

	if (response.status === 204) {
		return null as T;
	}

	return response.json();
}

// Demo login (for testing without better-auth)
export async function demoLogin(
	email: string,
	name?: string,
	role?: string,
): Promise<AuthResponse> {
	const response = await fetch(`${API_BASE}/api/auth/demo-login`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email, name, role }),
	});

	if (!response.ok) {
		const error = await response
			.json()
			.catch(() => ({ message: "Demo login failed" }));
		throw new ApiError(response.status, error.message || "Demo login failed");
	}

	const data: AuthResponse = await response.json();
	setStoredToken(data.access_token, data.expires_in);
	cachedToken = data.access_token;

	return data;
}

// Logout - clears both API token and better-auth session
export async function logout(): Promise<void> {
	clearStoredToken();
	cachedToken = null;
	try {
		const { authClient } = await import("#/lib/auth-client");
		await authClient.signOut();
	} catch {
		// Ignore errors during sign out
	}
}

// Health check
export async function healthCheck(): Promise<{
	status: string;
	version: string;
}> {
	const response = await fetch(`${API_BASE}/health`);
	return response.json();
}
