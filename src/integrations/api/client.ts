import type {
	AssessmentEntity,
	CodingAssessment,
	GenericAssessment,
	PrescreeningForm,
	PsychometricAssessment,
	VoiceAssessment,
} from "#/integrations/api/assessment-types";
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
	title: string | null;
	order: number;
	stage_type: StageType;
	is_mandatory: boolean;
	candidate_facing: boolean;
	contributes_to_score: boolean;
	automation: StageAutomation;
	pass_score: number | null;
	is_system_stage: boolean;
	voice_assessment_id: string | null;
	generic_assessment_id: string | null;
	coding_assessment_id: string | null;
	psychometric_assessment_id: string | null;
	prescreening_form_id: string | null;
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

/** Hiring pipeline stage merged with linked assessment payload (candidate runner / dashboards). */
export type ResolvedStage = {
	stage: JobStage;
	assessment: AssessmentEntity | null;
};

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

export interface StageAttempt {
	stage_id: string;
	stage_type: string;
	status: "Pending" | "InProgress" | "Completed" | "Skipped" | "Failed";
	score: number | null;
	started_at: string | null;
	completed_at: string | null;
	responses: unknown | null;
}

export interface Application {
	id: string;
	job_id: string;
	candidate_id: string | null;
	candidate_name: string | null;
	candidate_email: string;
	status: "Active" | "Withdrawn" | "Rejected" | "Hired";
	board_status:
		| "Prospect"
		| "Invited"
		| "Applied"
		| "Screening"
		| "Interview"
		| "Offer"
		| "GoodFit"
		| "PoorFit"
		| "Hired"
		| "Rejected";
	current_stage_id: string | null;
	source: string;
	invitation_expires_at: string | null;
	is_invitation_expired: boolean;
	last_invited_at: string | null;
	comms_summary: {
		invitation_count: number;
		last_created_at: string | null;
	} | null;
	stage_attempts?: StageAttempt[];
	created_at: string;
}

export interface ApplicationWithJob extends Application {
	job_title: string;
}

export interface OrgApplicationsResponse {
	applications: ApplicationWithJob[];
	total: number;
	page: number;
	limit: number;
}

export interface AssignCandidateRequest {
	candidate_name: string;
	candidate_email: string;
}

export interface AddProspectRequest {
	name?: string;
	email: string;
}

export interface BulkAssignCandidateRequest {
	candidates: AssignCandidateRequest[];
}

export interface BulkAssignResponse {
	sent: number;
	skipped: number;
	errors: string[];
}

export interface Communication {
	id: string;
	application_id: string;
	job_id: string;
	comm_type: "Invitation" | "Reminder";
	outcome: "Success" | "Failure" | "Pending";
	created_at: string;
	actor_id: string | null;
}

export interface AuditLog {
	id: string;
	application_id: string;
	job_id: string;
	actor_id: string;
	action_type: "ManualDragAndDrop" | "InvitationRenewed" | "Revoked";
	from_board_status: string | null;
	to_board_status: string | null;
	from_stage_id: string | null;
	to_stage_id: string | null;
	created_at: string;
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

export type {
	AssessmentEntity,
	AssessmentTimingMode,
	CodingAssessment,
	CodingProblem,
	Difficulty,
	GenericAssessment,
	GenericQuestion,
	GenericQuestionOption,
	GenericQuestionType,
	IntakeQuestionType,
	PrescreeningForm,
	PrescreeningKnockoutRule,
	PrescreeningQuestion,
	PrescreeningQuestionType,
	PsychometricAssessment,
	PsychometricFramework,
	TestCase,
	VoiceAssessment,
	VoiceDeliveryMethod,
	VoiceIntakeQuestion,
	VoicePhoneSettings,
	VoiceQuestion,
	VoiceRubric,
	VoiceSkill,
} from "./assessment-types";

export type AssessmentListParams = {
	limit?: number;
	offset?: number;
	/** Search substring (server-defined; optional). */
	q?: string;
};

export type AssessmentListResult<T> = {
	assessments: T[];
	total: number;
	limit: number;
	offset: number;
};

function assessmentListQuery(params: AssessmentListParams) {
	const sp = new URLSearchParams();
	if (params.limit != null) sp.set("limit", String(params.limit));
	if (params.offset != null) sp.set("offset", String(params.offset));
	if (params.q?.trim()) sp.set("q", params.q.trim());
	const q = sp.toString();
	return q ? `?${q}` : "";
}

function normalizeAssessmentList<T>(raw: unknown): AssessmentListResult<T> {
	if (Array.isArray(raw)) {
		return {
			assessments: raw as T[],
			total: raw.length,
			limit: raw.length,
			offset: 0,
		};
	}
	if (raw && typeof raw === "object") {
		const o = raw as Record<string, unknown>;
		const nested = o.result;
		const base =
			nested && typeof nested === "object"
				? (nested as Record<string, unknown>)
				: o;
		const arr = [
			base.assessments,
			base.items,
			base.data,
			o.assessments,
			o.items,
			o.data,
		].find(Array.isArray) as unknown[] | undefined;
		const list = (arr ?? []) as T[];
		const total =
			typeof base.total === "number"
				? base.total
				: typeof o.total === "number"
					? o.total
					: list.length;
		const limit =
			typeof base.limit === "number"
				? base.limit
				: typeof o.limit === "number"
					? o.limit
					: list.length;
		const offset =
			typeof base.offset === "number"
				? base.offset
				: typeof o.offset === "number"
					? o.offset
					: 0;
		return { assessments: list, total, limit, offset };
	}
	return { assessments: [], total: 0, limit: 0, offset: 0 };
}

export type CreateVoiceAssessmentPayload = Omit<
	VoiceAssessment,
	| "id"
	| "organization_id"
	| "creator_id"
	| "created_at"
	| "updated_at"
	| "is_deleted"
>;

export async function listVoiceAssessments(params: AssessmentListParams = {}) {
	const raw = await apiClient<unknown>(
		`/api/assessments/voice${assessmentListQuery(params)}`,
	);
	return normalizeAssessmentList<VoiceAssessment>(raw);
}

export async function getVoiceAssessment(id: string) {
	return apiClient<VoiceAssessment>(`/api/assessments/voice/${id}`);
}

export async function createVoiceAssessment(
	body: CreateVoiceAssessmentPayload,
) {
	return apiClient<VoiceAssessment>("/api/assessments/voice", {
		method: "POST",
		body: JSON.stringify(body),
	});
}

export async function updateVoiceAssessment(
	id: string,
	body: Partial<CreateVoiceAssessmentPayload>,
) {
	return apiClient<VoiceAssessment>(`/api/assessments/voice/${id}`, {
		method: "PUT",
		body: JSON.stringify(body),
	});
}

export async function deleteVoiceAssessment(id: string) {
	return apiClient<void>(`/api/assessments/voice/${id}`, { method: "DELETE" });
}

export type CreateGenericAssessmentPayload = Omit<
	GenericAssessment,
	"id" | "organization_id" | "created_at" | "updated_at" | "is_deleted"
>;

export async function listGenericAssessments(
	params: AssessmentListParams = {},
) {
	const raw = await apiClient<unknown>(
		`/api/assessments/generic${assessmentListQuery(params)}`,
	);
	return normalizeAssessmentList<GenericAssessment>(raw);
}

export async function getGenericAssessment(id: string) {
	return apiClient<GenericAssessment>(`/api/assessments/generic/${id}`);
}

export async function createGenericAssessment(
	body: CreateGenericAssessmentPayload,
) {
	return apiClient<GenericAssessment>("/api/assessments/generic", {
		method: "POST",
		body: JSON.stringify(body),
	});
}

export async function updateGenericAssessment(
	id: string,
	body: Partial<CreateGenericAssessmentPayload>,
) {
	return apiClient<GenericAssessment>(`/api/assessments/generic/${id}`, {
		method: "PUT",
		body: JSON.stringify(body),
	});
}

export async function deleteGenericAssessment(id: string) {
	return apiClient<void>(`/api/assessments/generic/${id}`, {
		method: "DELETE",
	});
}

export type CreateCodingAssessmentPayload = Omit<
	CodingAssessment,
	"id" | "organization_id" | "created_at" | "updated_at" | "is_deleted"
>;

export async function listCodingAssessments(params: AssessmentListParams = {}) {
	const raw = await apiClient<unknown>(
		`/api/assessments/coding${assessmentListQuery(params)}`,
	);
	return normalizeAssessmentList<CodingAssessment>(raw);
}

export async function getCodingAssessment(id: string) {
	return apiClient<CodingAssessment>(`/api/assessments/coding/${id}`);
}

export async function createCodingAssessment(
	body: CreateCodingAssessmentPayload,
) {
	return apiClient<CodingAssessment>("/api/assessments/coding", {
		method: "POST",
		body: JSON.stringify(body),
	});
}

export async function updateCodingAssessment(
	id: string,
	body: Partial<CreateCodingAssessmentPayload>,
) {
	return apiClient<CodingAssessment>(`/api/assessments/coding/${id}`, {
		method: "PUT",
		body: JSON.stringify(body),
	});
}

export async function deleteCodingAssessment(id: string) {
	return apiClient<void>(`/api/assessments/coding/${id}`, { method: "DELETE" });
}

export type CreatePsychometricAssessmentPayload = Omit<
	PsychometricAssessment,
	"id" | "organization_id" | "created_at" | "updated_at" | "is_deleted"
>;

export async function listPsychometricAssessments(
	params: AssessmentListParams = {},
) {
	const raw = await apiClient<unknown>(
		`/api/assessments/psychometric${assessmentListQuery(params)}`,
	);
	return normalizeAssessmentList<PsychometricAssessment>(raw);
}

export async function getPsychometricAssessment(id: string) {
	return apiClient<PsychometricAssessment>(
		`/api/assessments/psychometric/${id}`,
	);
}

export async function createPsychometricAssessment(
	body: CreatePsychometricAssessmentPayload,
) {
	return apiClient<PsychometricAssessment>("/api/assessments/psychometric", {
		method: "POST",
		body: JSON.stringify(body),
	});
}

export async function updatePsychometricAssessment(
	id: string,
	body: Partial<CreatePsychometricAssessmentPayload>,
) {
	return apiClient<PsychometricAssessment>(
		`/api/assessments/psychometric/${id}`,
		{
			method: "PUT",
			body: JSON.stringify(body),
		},
	);
}

export async function deletePsychometricAssessment(id: string) {
	return apiClient<void>(`/api/assessments/psychometric/${id}`, {
		method: "DELETE",
	});
}

export type CreatePrescreeningFormPayload = Omit<
	PrescreeningForm,
	"id" | "organization_id" | "created_at" | "updated_at" | "is_deleted"
>;

export async function listPrescreeningForms(params: AssessmentListParams = {}) {
	const raw = await apiClient<unknown>(
		`/api/assessments/prescreening${assessmentListQuery(params)}`,
	);
	return normalizeAssessmentList<PrescreeningForm>(raw);
}

export async function getPrescreeningForm(id: string) {
	return apiClient<PrescreeningForm>(`/api/assessments/prescreening/${id}`);
}

export async function createPrescreeningForm(
	body: CreatePrescreeningFormPayload,
) {
	return apiClient<PrescreeningForm>("/api/assessments/prescreening", {
		method: "POST",
		body: JSON.stringify(body),
	});
}

export async function updatePrescreeningForm(
	id: string,
	body: Partial<CreatePrescreeningFormPayload>,
) {
	return apiClient<PrescreeningForm>(`/api/assessments/prescreening/${id}`, {
		method: "PUT",
		body: JSON.stringify(body),
	});
}

export async function deletePrescreeningForm(id: string) {
	return apiClient<void>(`/api/assessments/prescreening/${id}`, {
		method: "DELETE",
	});
}

/** Clears local session and zustand (JWT has no server revoke on invetflow-server). */
export function logout() {
	getAuthStoreState().signOut();
}

export async function getApplicationDetail(
	jobId: string,
	applicationId: string,
): Promise<{ application: Application; resolved_stages: unknown[] }> {
	return apiClient(`/api/jobs/${jobId}/applications/${applicationId}`);
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
