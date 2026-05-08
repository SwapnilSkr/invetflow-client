import { z } from "zod";
import type {
	CreateJobRequest,
	Job,
	JobPipeline,
	StageAutomation,
	StageType,
	UpdateJobRequest,
} from "#/integrations/api/client";
import type { DraftState, Phase } from "./types";

export function newClientId(prefix: string) {
	return `${prefix}-${crypto.randomUUID()}`;
}

export function defaultPipeline(): JobPipeline {
	const rows: Array<[string, StageType, boolean, boolean]> = [
		["Applied", "Applied", true, false],
		["Prescreening", "Prescreening", false, true],
		["Voice Interview", "VoiceInterview", true, true],
		["Manual Review", "ManualReview", true, false],
		["Human Interview", "HumanInterview", false, true],
		["Offer", "Offer", false, true],
		["Hired", "Hired", true, true],
		["Rejected", "Rejected", true, true],
	];

	return {
		stages: rows.map(
			([title, stageType, required, candidateFacing], index) => ({
				id: title.toLowerCase().replaceAll(" ", "-"),
				title,
				stage_type: stageType,
				required,
				candidate_facing: candidateFacing,
				pass_threshold: stageType === "VoiceInterview" ? 6 : null,
				contributes_to_score: stageType === "VoiceInterview",
				automation:
					stageType === "VoiceInterview"
						? ("SendInvitation" as StageAutomation)
						: ("None" as StageAutomation),
				order: index,
			}),
		),
	};
}

export function defaultDraft(): DraftState {
	return {
		title: "",
		jobTitle: "",
		department: "",
		seniority: "Mid",
		employmentType: "Full-time",
		workplaceType: "Hybrid",
		locations: [],
		salary: null,
		skills: [],
		tools: [],
		tags: [],
		experience: null,
		jobDescription: "",
		pipeline: defaultPipeline(),
		durationMinutes: 30,
		maxScore: 10,
		passThreshold: 6,
		allowedLanguages: ["English"],
		voiceGender: "Neutral",
		greeting: "",
		partingWords: "",
		rubric: [],
		screeningQuestions: [],
		publicLinkEnabled: true,
		careersPage: false,
		externalBoards: [],
		requireResume: true,
		requirePhone: true,
		requireLinkedin: false,
		requireConsent: true,
		allowMultipleApplications: false,
		cooldownDays: 365,
	};
}

export function draftFromJob(job: Job): DraftState {
	return {
		title: job.title,
		jobTitle: job.job_title,
		department: job.department ?? "",
		seniority: (job.seniority as DraftState["seniority"]) ?? "Mid",
		employmentType:
			(job.employment_type as DraftState["employmentType"]) ?? "Full-time",
		workplaceType:
			(job.workplace_type as DraftState["workplaceType"]) ?? "Hybrid",
		locations: job.locations ?? [],
		salary: job.salary ?? null,
		skills: job.skills ?? [],
		tools: job.tools ?? [],
		tags: job.tags ?? [],
		experience: job.experience ?? null,
		jobDescription: job.job_description ?? "",
		pipeline: job.pipeline ?? defaultPipeline(),
		durationMinutes: job.interview_settings?.duration_minutes ?? 30,
		maxScore: job.interview_settings?.max_score ?? 10,
		passThreshold: job.interview_settings?.pass_threshold ?? 6,
		allowedLanguages: job.interview_settings?.allowed_languages ?? ["English"],
		voiceGender:
			(job.interview_settings?.voice_gender as DraftState["voiceGender"]) ??
			"Neutral",
		greeting: job.interview_settings?.greeting ?? "",
		partingWords: job.interview_settings?.parting_words ?? "",
		rubric: job.rubric ?? [],
		screeningQuestions: job.screening_questions ?? [],
		publicLinkEnabled: job.visibility?.public_link_enabled ?? true,
		careersPage: job.visibility?.careers_page ?? false,
		externalBoards: job.visibility?.external_boards ?? [],
		requireResume: job.application_settings?.require_resume ?? true,
		requirePhone: job.application_settings?.require_phone ?? true,
		requireLinkedin: job.application_settings?.require_linkedin ?? false,
		requireConsent: job.application_settings?.require_consent ?? true,
		allowMultipleApplications:
			job.application_settings?.allow_multiple_applications ?? false,
		cooldownDays: job.application_settings?.cooldown_days ?? 365,
	};
}

export function buildCreatePayload(
	draft: DraftState,
	opts: { publishOnCreate: boolean },
): CreateJobRequest {
	const rubric = draft.rubric.map((row, index) => ({ ...row, order: index }));

	return {
		title: draft.title.trim(),
		job_title: draft.jobTitle.trim(),
		job_description: draft.jobDescription.trim() || undefined,
		questions: rubric
			.filter((row) => row.question.trim())
			.map((row) => ({
				question: row.question.trim(),
				category: "Technical",
				follow_up_prompts: row.follow_up_prompts,
			})),
		duration_minutes: draft.durationMinutes,
		publish_on_create: opts.publishOnCreate,
		department: draft.department.trim() || undefined,
		seniority: draft.seniority || undefined,
		employment_type: draft.employmentType || undefined,
		workplace_type: draft.workplaceType || undefined,
		locations: draft.locations,
		salary: draft.salary ?? undefined,
		skills: draft.skills,
		tools: draft.tools,
		tags: draft.tags,
		experience: draft.experience ?? undefined,
		pipeline: {
			stages: draft.pipeline.stages.map((stage, index) => ({
				...stage,
				order: index,
			})),
		},
		screening_questions: draft.screeningQuestions.map((row, index) => ({
			...row,
			order: index,
		})),
		rubric,
		interview_settings: {
			duration_minutes: draft.durationMinutes,
			max_score: draft.maxScore,
			pass_threshold: draft.passThreshold,
			allowed_languages: draft.allowedLanguages,
			voice_provider: "LiveKit",
			voice_gender: draft.voiceGender,
			greeting: draft.greeting.trim() || null,
			parting_words: draft.partingWords.trim() || null,
		},
		application_settings: {
			require_resume: draft.requireResume,
			require_phone: draft.requirePhone,
			require_linkedin: draft.requireLinkedin,
			require_consent: draft.requireConsent,
			allow_multiple_applications: draft.allowMultipleApplications,
			cooldown_days: draft.cooldownDays,
		},
		visibility: {
			public_link_enabled: draft.publicLinkEnabled,
			careers_page: draft.careersPage,
			external_boards: draft.externalBoards,
		},
	};
}

export function buildUpdatePayload(draft: DraftState): UpdateJobRequest {
	return {
		title: draft.title.trim(),
		job_title: draft.jobTitle.trim(),
		job_description: draft.jobDescription.trim() || undefined,
		department: draft.department.trim() || undefined,
		seniority: draft.seniority || undefined,
		employment_type: draft.employmentType || undefined,
		workplace_type: draft.workplaceType || undefined,
		locations: draft.locations,
		salary: draft.salary ?? undefined,
		skills: draft.skills,
		tools: draft.tools,
		tags: draft.tags,
		experience: draft.experience ?? undefined,
		pipeline: {
			stages: draft.pipeline.stages.map((stage, index) => ({
				...stage,
				order: index,
			})),
		},
		screening_questions: draft.screeningQuestions.map((row, index) => ({
			...row,
			order: index,
		})),
		rubric: draft.rubric.map((row, index) => ({ ...row, order: index })),
		interview_settings: {
			duration_minutes: draft.durationMinutes,
			max_score: draft.maxScore,
			pass_threshold: draft.passThreshold,
			allowed_languages: draft.allowedLanguages,
			voice_provider: "LiveKit",
			voice_gender: draft.voiceGender,
			greeting: draft.greeting.trim() || null,
			parting_words: draft.partingWords.trim() || null,
		},
		application_settings: {
			require_resume: draft.requireResume,
			require_phone: draft.requirePhone,
			require_linkedin: draft.requireLinkedin,
			require_consent: draft.requireConsent,
			allow_multiple_applications: draft.allowMultipleApplications,
			cooldown_days: draft.cooldownDays,
		},
		visibility: {
			public_link_enabled: draft.publicLinkEnabled,
			careers_page: draft.careersPage,
			external_boards: draft.externalBoards,
		},
	};
}

// Zod schemas for per-phase validation

const detailsSchema = z.object({
	title: z.string().min(1, "Job title is required"),
	jobTitle: z.string().min(1, "Internal title is required"),
});

const processSchema = z
	.object({
		pipeline: z.object({
			stages: z
				.array(z.unknown())
				.min(1, "At least one pipeline stage is required"),
		}),
		durationMinutes: z.number().min(5, "Duration must be at least 5 minutes"),
		passThreshold: z.number(),
		maxScore: z.number(),
	})
	.refine((d) => d.passThreshold <= d.maxScore, {
		path: ["passThreshold"],
		message: "Pass threshold cannot exceed max score",
	});

const publishSchema = z.object({
	publicLinkEnabled: z.boolean(),
});

export function validatePhase(
	phase: Phase,
	draft: DraftState,
): { ok: boolean; errors: Record<string, string> } {
	const schema =
		phase === "Details"
			? detailsSchema
			: phase === "Hiring process"
				? processSchema
				: publishSchema;

	const result = schema.safeParse(draft);
	if (result.success) return { ok: true, errors: {} };

	const errors: Record<string, string> = {};
	for (const issue of result.error.issues) {
		const key = issue.path.join(".");
		errors[key] = issue.message;
	}
	return { ok: false, errors };
}

type BlueprintContent = {
	job_description?: string;
	skills?: string[];
	tools?: string[];
	pipeline?: { stages: unknown[] };
};

export function mergeBlueprint(
	draft: DraftState,
	blueprint: BlueprintContent,
): DraftState {
	const next = { ...draft };

	if (blueprint.job_description) {
		next.jobDescription = blueprint.job_description;
	}

	if (Array.isArray(blueprint.skills) && blueprint.skills.length > 0) {
		const merged = [...new Set([...draft.skills, ...blueprint.skills])];
		next.skills = merged;
	}

	if (Array.isArray(blueprint.tools) && blueprint.tools.length > 0) {
		const merged = [...new Set([...draft.tools, ...blueprint.tools])];
		next.tools = merged;
	}

	if (blueprint.pipeline?.stages && blueprint.pipeline.stages.length > 0) {
		const rows = blueprint.pipeline.stages as Array<Record<string, unknown>>;
		next.pipeline = {
			stages: rows.map((row, index) => ({
				id: newClientId("stage"),
				title: String(row.title ?? `Stage ${index + 1}`),
				stage_type: (row.stage_type as StageType) || "ManualReview",
				required: Boolean(row.required),
				candidate_facing: Boolean(row.candidate_facing),
				pass_threshold:
					typeof row.pass_threshold === "number" ? row.pass_threshold : null,
				contributes_to_score: Boolean(row.contributes_to_score),
				automation: (row.automation as StageAutomation) || "None",
				order: index,
			})),
		};
	}

	return next;
}
