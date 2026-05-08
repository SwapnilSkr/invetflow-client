import type {
	CreateJobRequest,
	JobPipeline,
	StageAutomation,
	StageType,
} from "#/integrations/api/client";
import type { DraftState, GenerateKind } from "./types";

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
				automation: stageType === "VoiceInterview" ? "SendInvitation" : "None",
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
		location: "",
		salaryMin: "",
		salaryMax: "",
		jobDescription: "",
		skills: "",
		tools: "",
		tags: "",
		experienceMin: "",
		experienceMax: "",
		requireResume: true,
		requirePhone: true,
		requireLinkedin: false,
		requireConsent: true,
		allowMultipleApplications: false,
		cooldownDays: "365",
		pipeline: defaultPipeline(),
		durationMinutes: 30,
		maxScore: 10,
		passThreshold: 6,
		allowedLanguages: "English",
		voiceGender: "Neutral",
		greeting: "",
		partingWords: "",
		rubric: [],
		screeningQuestions: [],
		publicLinkEnabled: true,
		careersPage: false,
		externalBoards: "",
		publishOnCreate: false,
	};
}

export function splitList(value: string): string[] {
	return value
		.split(",")
		.map((item) => item.trim())
		.filter(Boolean);
}

export function canContinueCreateJobStep(step: number, draft: DraftState) {
	if (step === 0) {
		return draft.title.trim().length > 0 && draft.jobTitle.trim().length > 0;
	}
	if (step === 2) return draft.pipeline.stages.length > 0;
	if (step === 3) {
		return draft.durationMinutes >= 5 && draft.passThreshold <= draft.maxScore;
	}
	return true;
}

export function buildCreateJobPayload(draft: DraftState): CreateJobRequest {
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
		publish_on_create: draft.publishOnCreate,
		department: draft.department.trim() || undefined,
		seniority: draft.seniority,
		employment_type: draft.employmentType,
		workplace_type: draft.workplaceType,
		locations: draft.location.trim() ? [{ label: draft.location.trim() }] : [],
		salary:
			draft.salaryMin || draft.salaryMax
				? {
						min: draft.salaryMin ? Number(draft.salaryMin) : null,
						max: draft.salaryMax ? Number(draft.salaryMax) : null,
						currency: "INR",
						period: "Yearly",
					}
				: undefined,
		skills: splitList(draft.skills),
		tools: splitList(draft.tools),
		tags: splitList(draft.tags),
		experience:
			draft.experienceMin || draft.experienceMax
				? {
						min_years: draft.experienceMin ? Number(draft.experienceMin) : null,
						max_years: draft.experienceMax ? Number(draft.experienceMax) : null,
					}
				: undefined,
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
			allowed_languages: splitList(draft.allowedLanguages),
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
			cooldown_days: Number(draft.cooldownDays) || 365,
		},
		visibility: {
			public_link_enabled: draft.publicLinkEnabled,
			careers_page: draft.careersPage,
			external_boards: splitList(draft.externalBoards),
		},
	};
}

export function normalizeGeneratedContent(
	kind: GenerateKind,
	content: Record<string, unknown>,
): Partial<DraftState> {
	if (kind === "job_description") {
		const jobDescription = content.job_description;
		return typeof jobDescription === "string" ? { jobDescription } : {};
	}

	if (kind === "rubric_questions" && Array.isArray(content.rubric)) {
		const rows = content.rubric as Array<Record<string, unknown>>;
		return {
			rubric: rows.map((row, index) => ({
				id: newClientId("rubric"),
				skill: String(row.skill ?? ""),
				weight: Number(row.weight ?? 1),
				scoring_guide: String(row.scoring_guide ?? ""),
				question: String(row.question ?? ""),
				follow_up_prompts: Array.isArray(row.follow_up_prompts)
					? row.follow_up_prompts.map(String)
					: [],
				order: index,
			})),
		};
	}

	if (kind === "pipeline" && Array.isArray(content.stages)) {
		const rows = content.stages as Array<Record<string, unknown>>;
		return {
			pipeline: {
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
			},
		};
	}

	return {};
}
