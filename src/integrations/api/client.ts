import { getAuthStoreState } from "#/integrations/auth/auth-store";
import { parseHttpError } from "./errors";
import { getApiToken } from "./token-storage";
import type {
	AuthResponse,
	RecruiterOnboardingResponse,
	UpdateRecruiterOnboardingBody,
} from "./types";

export {
	ApiError,
	type HttpErrorKind,
	isApiError,
	parseHttpError,
	type ServerErrorJson,
} from "./errors";
export { hasValidAccessToken } from "./token-storage";
export type {
	AuthResponse,
	RecruiterOnboardingResponse,
	UpdateRecruiterOnboardingBody,
	User,
} from "./types";
export { fetchCurrentUserFromApi as fetchCurrentUser } from "./user-api";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

// --- Jobs and candidate interviews (align with invetflow-server JSON) ---

export interface Job {
	id: string;
	organization_id: string | null;
	created_by_user_id: string;
	assigned_recruiter_ids: string[];
	title: string;
	job_title: string;
	job_description: string | null;
	slug: string | null;
	questions: Question[];
	status:
		| "Draft"
		| "Scheduled"
		| "Active"
		| "Paused"
		| "Completed"
		| "Cancelled"
		| "Closed"
		| "Archived";
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
	department: string | null;
	seniority: string | null;
	employment_type: string | null;
	workplace_type: string | null;
	locations: JobLocation[];
	salary: SalaryRange | null;
	skills: string[];
	tools: string[];
	tags: string[];
	experience: ExperienceRange | null;
	pipeline: JobPipeline;
	screening_questions: ScreeningQuestion[];
	rubric: RubricItem[];
	interview_settings: InterviewSettings;
	application_settings: ApplicationSettings;
	visibility: JobVisibility;
}

export interface Organization {
	id: string;
	name: string;
	slug: string;
	size: string | null;
	website: string | null;
	created_by_user_id: string;
	current_user_role: "Owner" | "Admin" | "Recruiter" | "Member" | null;
}

export interface JobLocation {
	city?: string | null;
	region?: string | null;
	country?: string | null;
	label: string;
}

export interface SalaryRange {
	min?: number | null;
	max?: number | null;
	currency: string;
	period: string;
}

export interface ExperienceRange {
	min_years?: number | null;
	max_years?: number | null;
}

export interface JobPipeline {
	stages: JobStage[];
}

export type StageType =
	| "Applied"
	| "Prescreening"
	| "VoiceInterview"
	| "CodingAssessment"
	| "GenericAssessment"
	| "PsychometricAssessment"
	| "ManualReview"
	| "Consent"
	| "HumanInterview"
	| "Offer"
	| "Hired"
	| "Rejected";

export type StageAutomation =
	| "None"
	| "SendInvitation"
	| "ScheduleMeeting"
	| "SendRejection"
	| "SendHiredNotification";

export interface JobStage {
	id: string;
	title: string;
	stage_type: StageType;
	required: boolean;
	candidate_facing: boolean;
	pass_threshold?: number | null;
	contributes_to_score: boolean;
	automation: StageAutomation;
	order: number;
}

export type ScreeningQuestionType =
	| "Text"
	| "Number"
	| "Boolean"
	| "Select"
	| "MultiSelect"
	| "Date";

export interface ScreeningQuestion {
	id: string;
	label: string;
	question_type: ScreeningQuestionType;
	required: boolean;
	options: string[];
	knockout?: { operator: string; value: unknown } | null;
	order: number;
}

export interface RubricItem {
	id: string;
	skill: string;
	weight: number;
	scoring_guide: string;
	question: string;
	follow_up_prompts: string[];
	order: number;
}

export interface InterviewSettings {
	duration_minutes: number;
	max_score: number;
	pass_threshold: number;
	allowed_languages: string[];
	voice_provider: string;
	voice_gender: string;
	greeting?: string | null;
	parting_words?: string | null;
}

export interface ApplicationSettings {
	require_resume: boolean;
	require_phone: boolean;
	require_linkedin: boolean;
	require_consent: boolean;
	allow_multiple_applications: boolean;
	cooldown_days: number;
}

export interface JobVisibility {
	public_link_enabled: boolean;
	careers_page: boolean;
	external_boards: string[];
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

export interface CreateJobRequest {
	title: string;
	job_title: string;
	job_description?: string;
	slug?: string;
	questions: CreateQuestionRequest[];
	duration_minutes?: number;
	publish_on_create?: boolean;
	department?: string;
	seniority?: string;
	employment_type?: string;
	workplace_type?: string;
	locations?: JobLocation[];
	salary?: SalaryRange;
	skills?: string[];
	tools?: string[];
	tags?: string[];
	experience?: ExperienceRange;
	pipeline?: JobPipeline;
	screening_questions?: ScreeningQuestion[];
	rubric?: RubricItem[];
	interview_settings?: InterviewSettings;
	application_settings?: ApplicationSettings;
	visibility?: JobVisibility;
}

export interface CreateQuestionRequest {
	question: string;
	category: string;
	time_limit_seconds?: number;
	follow_up_prompts: string[];
}

export interface UpdateJobRequest {
	title?: string;
	job_title?: string;
	job_description?: string;
	duration_minutes?: number;
	is_public?: boolean;
	/** Close the role in the app when you are done hiring. Ending a call only ends that answer session, not the job. */
	status?:
		| "Active"
		| "Paused"
		| "Closed"
		| "Archived"
		| "Completed"
		| "Cancelled";
	// Extended fields for incremental save (aligned with CreateJobRequest superset)
	department?: string;
	seniority?: string;
	employment_type?: string;
	workplace_type?: string;
	locations?: JobLocation[];
	salary?: SalaryRange;
	skills?: string[];
	tools?: string[];
	tags?: string[];
	experience?: ExperienceRange;
	pipeline?: JobPipeline;
	screening_questions?: ScreeningQuestion[];
	rubric?: RubricItem[];
	interview_settings?: InterviewSettings;
	application_settings?: ApplicationSettings;
	visibility?: JobVisibility;
}

export interface GenerateJobContentRequest {
	kind: "job_description" | "rubric_questions" | "pipeline" | "blueprint";
	context: unknown;
}

export interface GenerateJobContentResponse {
	kind: GenerateJobContentRequest["kind"];
	content: unknown;
}

export interface JobInterviewsListResponse {
	interviews: CandidateInterview[];
}

export interface AssignCandidateRequest {
	candidate_name: string;
	candidate_email: string;
}

export interface JoinJobResponse {
	job_id: string;
	interview_id: string;
	livekit_token: string;
	livekit_url: string;
	job: Job;
}

export interface CandidateInterview {
	id: string;
	job_id: string;
	candidate_id: string;
	livekit_room: string;
	status: "Waiting" | "Active" | "Paused" | "Completed" | "Cancelled";
	current_question_index: number;
	started_at: string;
	ended_at: string | null;
	duration_seconds: number;
	video_url: string | null;
	video_recording_status: string | null;
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
	/** Optional; defaults to Password on the server. */
	auth_provider?: "Password" | "Google";
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

export async function checkEmailRegistered(email: string): Promise<boolean> {
	const q = new URLSearchParams({ email: email.trim().toLowerCase() });
	const response = await fetch(`${API_BASE}/api/auth/email-exists?${q}`, {
		method: "GET",
		headers: { Accept: "application/json" },
	});
	if (!response.ok) {
		throw await parseHttpError(response, "Could not check email");
	}
	const data = (await response.json()) as { exists: boolean };
	return Boolean(data.exists);
}

export interface RegisterRecruiterRequestBody {
	email: string;
	password: string;
	name?: string;
	auth_provider?: "Password" | "Google";
}

/** Hiring onboarding: always creates a Recruiter (server-enforced). */
export async function registerRecruiterWithPassword(
	body: RegisterRecruiterRequestBody,
): Promise<AuthResponse> {
	const response = await fetch(`${API_BASE}/api/auth/register/recruiter`, {
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

export async function updateRecruiterOnboarding(
	body: UpdateRecruiterOnboardingBody,
): Promise<RecruiterOnboardingResponse> {
	const data = await apiClient<RecruiterOnboardingResponse>(
		"/api/auth/onboarding",
		{
			method: "PATCH",
			body: JSON.stringify(body),
		},
	);
	getAuthStoreState().applyUser(data.user);
	getAuthStoreState().applyOrganization(data.organization);
	return data;
}

export interface ResendVerificationResponse {
	sent: boolean;
	message: string;
	organization_name: string | null;
}

export async function resendVerificationEmail(): Promise<ResendVerificationResponse> {
	return apiClient<ResendVerificationResponse>(
		"/api/auth/resend-verification",
		{
			method: "POST",
			body: "{}",
		},
	);
}

export async function fetchCurrentOrganization(): Promise<Organization | null> {
	return apiClient<Organization | null>("/api/organizations/current");
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
