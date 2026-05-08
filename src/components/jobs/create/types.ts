import type {
	ExperienceRange,
	JobLocation,
	JobPipeline,
	RubricItem,
	SalaryRange,
	ScreeningQuestion,
	StageAutomation,
	StageType,
} from "#/integrations/api/client";

export type {
	ExperienceRange,
	JobLocation,
	JobPipeline,
	RubricItem,
	SalaryRange,
	ScreeningQuestion,
};

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

export type DraftState = {
	// Phase 1: Details
	title: string;
	jobTitle: string;
	department: string;
	seniority: "Junior" | "Mid" | "Senior" | "Lead" | "Principal" | "";
	employmentType: "Full-time" | "Part-time" | "Contract" | "Internship" | "";
	workplaceType: "Remote" | "Hybrid" | "Onsite" | "";
	locations: JobLocation[];
	salary: SalaryRange | null;
	skills: string[];
	tools: string[];
	tags: string[];
	experience: ExperienceRange | null;
	jobDescription: string; // HTML from Tiptap
	// Phase 2: Hiring process
	pipeline: JobPipeline;
	durationMinutes: number;
	maxScore: number;
	passThreshold: number;
	allowedLanguages: string[];
	voiceGender: "Neutral" | "Female" | "Male";
	greeting: string;
	partingWords: string;
	rubric: RubricItem[];
	screeningQuestions: ScreeningQuestion[];
	// Phase 3: Publish
	publicLinkEnabled: boolean;
	careersPage: boolean;
	externalBoards: string[];
	requireResume: boolean;
	requirePhone: boolean;
	requireLinkedin: boolean;
	requireConsent: boolean;
	allowMultipleApplications: boolean;
	cooldownDays: number;
};

export type DraftUpdate = <K extends keyof DraftState>(
	key: K,
	value: DraftState[K],
) => void;

export const PHASES = ["Details", "Hiring process", "Publish"] as const;
export type Phase = (typeof PHASES)[number];
