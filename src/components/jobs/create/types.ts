import type {
	JobPipeline,
	RubricItem,
	ScreeningQuestion,
	StageAutomation,
	StageType,
} from "#/integrations/api/client";

export const CREATE_JOB_STEPS = [
	"Job description",
	"Requirements",
	"Hiring stages",
	"Voice interview",
	"Prescreening",
	"Publishing",
	"Review",
] as const;

export const STAGE_TYPES: StageType[] = [
	"Prescreening",
	"VoiceInterview",
	"CodingAssessment",
	"GenericAssessment",
	"PsychometricAssessment",
	"ManualReview",
	"Consent",
	"HumanInterview",
	"Offer",
	"Hired",
	"Rejected",
];

export const STAGE_AUTOMATIONS: StageAutomation[] = [
	"None",
	"SendInvitation",
	"ScheduleMeeting",
	"SendRejection",
	"SendHiredNotification",
];

export type GenerateKind = "job_description" | "rubric_questions" | "pipeline";

export type DraftState = {
	title: string;
	jobTitle: string;
	department: string;
	seniority: string;
	employmentType: string;
	workplaceType: string;
	location: string;
	salaryMin: string;
	salaryMax: string;
	jobDescription: string;
	skills: string;
	tools: string;
	tags: string;
	experienceMin: string;
	experienceMax: string;
	requireResume: boolean;
	requirePhone: boolean;
	requireLinkedin: boolean;
	requireConsent: boolean;
	allowMultipleApplications: boolean;
	cooldownDays: string;
	pipeline: JobPipeline;
	durationMinutes: number;
	maxScore: number;
	passThreshold: number;
	allowedLanguages: string;
	voiceGender: string;
	greeting: string;
	partingWords: string;
	rubric: RubricItem[];
	screeningQuestions: ScreeningQuestion[];
	publicLinkEnabled: boolean;
	careersPage: boolean;
	externalBoards: string;
	publishOnCreate: boolean;
};

export type DraftUpdate = <K extends keyof DraftState>(
	key: K,
	value: DraftState[K],
) => void;

export type GenerateContent = (kind: GenerateKind) => Promise<void>;
