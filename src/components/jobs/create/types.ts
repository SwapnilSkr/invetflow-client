import type {
	ExperienceRange,
	JobLocation,
	JobPipeline,
	SalaryRange,
	StageAutomation,
	StageType,
} from "#/integrations/api/client";

export type { ExperienceRange, JobLocation, JobPipeline, SalaryRange };

/** Stage types selectable from the legacy inline dropdown (excluding system staples). */
export const STAGE_TYPES: StageType[] = [
	"Prescreening",
	"VoiceInterview",
	"GenericAssessment",
	"CodingAssessment",
	"PsychometricAssessment",
	"ManualReview",
	"Consent",
	"HumanInterview",
	"Offer",
	"Hired",
	"Rejected",
];

/** Full palette for «Add stage». */
export const ALL_STAGE_TYPES: StageType[] = ["Applied", ...STAGE_TYPES];

export const STAGE_AUTOMATIONS: StageAutomation[] = [
	"None",
	"SendInvitation",
	"ScheduleMeeting",
	"SendRejection",
	"SendHiredNotification",
];

export type DraftState = {
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
	jobDescription: string;
	pipeline: JobPipeline;
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

export const PHASES = ["Details", "Pipeline", "Publish"] as const;
export type Phase = (typeof PHASES)[number];
