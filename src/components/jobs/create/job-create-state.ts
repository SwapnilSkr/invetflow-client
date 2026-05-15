import { z } from "zod";
import type {
	CreateJobRequest,
	Job,
	JobPipeline,
	JobStage,
	StageAutomation,
	StageType,
	UpdateJobRequest,
} from "#/integrations/api/client";
import type { DraftState, Phase } from "./types";

export function newClientId(prefix: string) {
	return `${prefix}-${crypto.randomUUID()}`;
}

/** Accept old draft/API rows that used `required` / `pass_threshold`. */
export function normalizeJobStage(
	row: Partial<JobStage> & {
		required?: boolean;
		title?: string | null;
		pass_threshold?: number | null;
	},
	order: number,
): JobStage {
	const base = row as Partial<JobStage>;
	return {
		id: typeof base.id === "string" ? base.id : newClientId("stage"),
		title:
			base.title !== undefined
				? base.title
				: row.title !== undefined
					? row.title
					: null,
		order: typeof base.order === "number" ? base.order : order,
		stage_type: base.stage_type ?? "ManualReview",
		is_mandatory: Boolean(
			base.is_mandatory ??
				row.required ??
				stageRequiresDefaultMandatory(base.stage_type ?? "ManualReview"),
		),
		candidate_facing: Boolean(base.candidate_facing ?? false),
		contributes_to_score: Boolean(
			base.contributes_to_score ?? base.stage_type === "VoiceInterview",
		),
		automation: (base.automation ?? "None") as StageAutomation,
		pass_score:
			base.pass_score !== undefined && base.pass_score !== null
				? base.pass_score
				: (row.pass_threshold ?? null),
		is_system_stage: Boolean(
			base.is_system_stage ??
				isCanonicalSystemStage(base.stage_type ?? undefined),
		),
		voice_assessment_id: base.voice_assessment_id ?? null,
		generic_assessment_id: base.generic_assessment_id ?? null,
		coding_assessment_id: base.coding_assessment_id ?? null,
		psychometric_assessment_id: base.psychometric_assessment_id ?? null,
		prescreening_form_id: base.prescreening_form_id ?? null,
	};
}

function isCanonicalSystemStage(t: StageType | undefined): boolean {
	if (!t) return false;
	return t === "Applied" || t === "Hired" || t === "Rejected";
}

function stageRequiresDefaultMandatory(t: StageType): boolean {
	return (
		t === "Applied" ||
		t === "VoiceInterview" ||
		t === "ManualReview" ||
		t === "Hired" ||
		t === "Rejected"
	);
}

export function defaultPipeline(): JobPipeline {
	const rows: Array<{
		id: string;
		title: string;
		type: StageType;
		is_mandatory: boolean;
		candidate_facing: boolean;
		system: boolean;
		contributes: boolean;
	}> = [
		{
			id: "applied",
			title: "Applied",
			type: "Applied",
			is_mandatory: true,
			candidate_facing: false,
			system: true,
			contributes: false,
		},
		{
			id: "prescreening",
			title: "Prescreening",
			type: "Prescreening",
			is_mandatory: false,
			candidate_facing: true,
			system: false,
			contributes: false,
		},
		{
			id: "voice-interview",
			title: "Voice Interview",
			type: "VoiceInterview",
			is_mandatory: true,
			candidate_facing: true,
			system: false,
			contributes: true,
		},
		{
			id: "manual-review",
			title: "Manual Review",
			type: "ManualReview",
			is_mandatory: true,
			candidate_facing: false,
			system: false,
			contributes: false,
		},
		{
			id: "human-interview",
			title: "Human Interview",
			type: "HumanInterview",
			is_mandatory: false,
			candidate_facing: true,
			system: false,
			contributes: false,
		},
		{
			id: "offer",
			title: "Offer",
			type: "Offer",
			is_mandatory: false,
			candidate_facing: true,
			system: false,
			contributes: false,
		},
		{
			id: "hired",
			title: "Hired",
			type: "Hired",
			is_mandatory: true,
			candidate_facing: true,
			system: true,
			contributes: false,
		},
		{
			id: "rejected",
			title: "Rejected",
			type: "Rejected",
			is_mandatory: true,
			candidate_facing: true,
			system: true,
			contributes: false,
		},
	];

	return {
		stages: rows.map((r, idx) =>
			normalizeJobStage(
				{
					id: r.id,
					title: r.title,
					order: idx,
					stage_type: r.type,
					is_mandatory: r.is_mandatory,
					candidate_facing: r.candidate_facing,
					contributes_to_score: r.contributes,
					automation:
						r.type === "VoiceInterview"
							? ("SendInvitation" as StageAutomation)
							: ("None" as StageAutomation),
					pass_score: null,
					is_system_stage: r.system,
					voice_assessment_id: null,
					generic_assessment_id: null,
					coding_assessment_id: null,
					psychometric_assessment_id: null,
					prescreening_form_id: null,
				},
				idx,
			),
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
		publicLinkEnabled: true,
		careersPage: true,
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
	const rawStages = job.pipeline?.stages ?? [];
	const stages = rawStages.map((stage, idx) =>
		normalizeJobStage(stage as ImportJobStageLike, idx),
	);

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
		pipeline: { stages },
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

/** Narrow type for hydrated jobs that might still omit new fields server-side. */
type ImportJobStageLike = Partial<JobStage> & {
	required?: boolean;
	pass_threshold?: number | null;
};

export function buildCreatePayload(
	draft: DraftState,
	opts: { publishOnCreate: boolean },
): CreateJobRequest {
	const pipeline: JobPipeline = {
		stages: draft.pipeline.stages.map((stage, index) => ({
			...stage,
			order: index,
		})),
	};
	return {
		title: draft.title.trim(),
		job_title: draft.jobTitle.trim(),
		job_description: draft.jobDescription.trim() || undefined,
		questions: [],
		duration_minutes: 30,
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
		pipeline,
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

/** First POST only: omit pipeline so the API applies server default stages (draft-first flow). */
export function buildMinimalCreatePayload(
	draft: DraftState,
	opts: { publishOnCreate: boolean },
): CreateJobRequest {
	const { pipeline: _pipeline, ...rest } = buildCreatePayload(draft, opts);
	return rest;
}

export function buildUpdatePayload(draft: DraftState): UpdateJobRequest {
	const pipeline: JobPipeline = {
		stages: draft.pipeline.stages.map((stage, index) => ({
			...stage,
			order: index,
		})),
	};
	return {
		title: draft.title.trim(),
		job_title: draft.jobTitle.trim(),
		job_description: draft.jobDescription.trim() || undefined,
		duration_minutes: 30,
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
		pipeline,
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

function entityStagesLinked(pipeline: JobPipeline): boolean {
	for (const s of pipeline.stages) {
		const needs =
			s.stage_type === "Prescreening" ||
			s.stage_type === "VoiceInterview" ||
			s.stage_type === "CodingAssessment" ||
			s.stage_type === "GenericAssessment" ||
			s.stage_type === "PsychometricAssessment";
		if (!needs) continue;
		const linked =
			s.voice_assessment_id ||
			s.generic_assessment_id ||
			s.coding_assessment_id ||
			s.psychometric_assessment_id ||
			s.prescreening_form_id;
		if (!linked) return false;
	}
	return true;
}

const detailsSchema = z.object({
	title: z.string().min(1, "Job title is required"),
	jobTitle: z.string().min(1, "Internal title is required"),
});

const processSchema = z.object({
	pipeline: z.object({
		stages: z
			.array(z.object({ stage_type: z.string() }))
			.min(1, "At least one pipeline stage is required"),
	}),
});

const publishSchema = z.object({
	publicLinkEnabled: z.boolean(),
	pipeline: z.object({
		stages: z.array(z.record(z.string(), z.unknown())),
	}),
});

export function validatePhase(
	phase: Phase,
	draft: DraftState,
): { ok: boolean; errors: Record<string, string> } {
	if (phase === "Details") {
		const result = detailsSchema.safeParse({
			title: draft.title,
			jobTitle: draft.jobTitle,
		});
		if (!result.success) {
			const errors: Record<string, string> = {};
			for (const issue of result.error.issues) {
				errors[issue.path.join(".")] = issue.message;
			}
			return { ok: false, errors };
		}
		return { ok: true, errors: {} };
	}

	if (phase === "Hiring process") {
		const result = processSchema.safeParse(draft);
		if (!result.success) {
			const errors: Record<string, string> = {};
			for (const issue of result.error.issues) {
				errors[issue.path.join(".")] = issue.message;
			}
			return { ok: false, errors };
		}
		if (!entityStagesLinked(draft.pipeline)) {
			return {
				ok: false,
				errors: {
					"pipeline.stages":
						"Link an assessment to every Prescreening, Voice, Generic, Coding, and Psychometric stage.",
				},
			};
		}
		return { ok: true, errors: {} };
	}

	if (phase === "Preview") {
		// Preview requires the same validations as Publish for blockers,
		// but warnings/recommendations never block.
		const pub = publishSchema.safeParse(draft);
		if (!pub.success) {
			const errors: Record<string, string> = {};
			for (const issue of pub.error.issues) {
				errors[issue.path.join(".")] = issue.message;
			}
			return { ok: false, errors };
		}
		if (!entityStagesLinked(draft.pipeline)) {
			return {
				ok: false,
				errors: {
					"pipeline.stages":
						"Every assessment stage must be linked before you publish.",
				},
			};
		}
		return { ok: true, errors: {} };
	}

	const pub = publishSchema.safeParse(draft);
	if (!pub.success) {
		const errors: Record<string, string> = {};
		for (const issue of pub.error.issues) {
			errors[issue.path.join(".")] = issue.message;
		}
		return { ok: false, errors };
	}
	if (!entityStagesLinked(draft.pipeline)) {
		return {
			ok: false,
			errors: {
				"pipeline.stages":
					"Every assessment stage must be linked before you publish.",
			},
		};
	}
	return { ok: true, errors: {} };
}

/**
 * Gating used by the primary "Save & continue" CTA.
 * Hiring process → Preview only needs pipeline structure (not linked assessments).
 * Preview → Publish requires full Hiring process validation.
 */
export function canAdvanceFromPhase(
	phase: Phase,
	draft: DraftState,
): { ok: boolean; errors: Record<string, string> } {
	if (phase === "Details") {
		return validatePhase("Details", draft);
	}
	if (phase === "Hiring process") {
		// Allow progression to Preview with just a non-empty pipeline.
		if (!hasPipelineStructure(draft.pipeline)) {
			return {
				ok: false,
				errors: {
					"pipeline.stages": "Add at least one stage before continuing.",
				},
			};
		}
		return { ok: true, errors: {} };
	}
	if (phase === "Preview") {
		// Blocker: unlinked assessments must be fixed before Publish.
		return validatePhase("Hiring process", draft);
	}
	return validatePhase("Publish", draft);
}

function hasPipelineStructure(pipeline: JobPipeline): boolean {
	return pipeline.stages.length > 0;
}

export function isPhaseIndexUnlocked(
	index: number,
	draft: DraftState,
	hasPersistedJobId: boolean,
): boolean {
	if (index <= 0) return true;
	if (!hasPersistedJobId) return false;
	if (!validatePhase("Details", draft).ok) return false;
	if (index <= 1) return true;
	// Preview only needs a non-empty pipeline structure so users can
	// see diagnostics (linking blockers, warnings, recommendations).
	if (!hasPipelineStructure(draft.pipeline)) return false;
	if (index <= 2) return true;
	// Publish still requires full Hiring process validation.
	return validatePhase("Hiring process", draft).ok;
}

/** Initial / resume focus: first phase that still fails validation (with id) or Details when unsaved. */
export function firstIncompleteWizardPhase(
	draft: DraftState,
	hasPersistedJobId: boolean,
): Phase {
	if (!hasPersistedJobId) return "Details";
	if (!validatePhase("Details", draft).ok) return "Details";
	if (!hasPipelineStructure(draft.pipeline)) return "Hiring process";
	if (!validatePhase("Hiring process", draft).ok) return "Preview";
	if (!validatePhase("Preview", draft).ok) return "Preview";
	return "Publish";
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
			stages: rows.map((row, index) =>
				normalizeJobStage(
					{
						id: newClientId("stage"),
						title: String(row.title ?? `Stage ${index + 1}`),
						stage_type: (row.stage_type as StageType) || "ManualReview",
						required: Boolean(row.required),
						candidate_facing: Boolean(row.candidate_facing),
						pass_threshold:
							typeof row.pass_threshold === "number"
								? row.pass_threshold
								: null,
						pass_score:
							typeof row.pass_score === "number" ? row.pass_score : undefined,
						contributes_to_score: Boolean(row.contributes_to_score),
						automation: (row.automation as StageAutomation) || "None",
						is_system_stage: Boolean(row.is_system_stage),
						voice_assessment_id:
							typeof row.voice_assessment_id === "string"
								? row.voice_assessment_id
								: null,
						generic_assessment_id:
							typeof row.generic_assessment_id === "string"
								? row.generic_assessment_id
								: null,
						coding_assessment_id:
							typeof row.coding_assessment_id === "string"
								? row.coding_assessment_id
								: null,
						psychometric_assessment_id:
							typeof row.psychometric_assessment_id === "string"
								? row.psychometric_assessment_id
								: null,
						prescreening_form_id:
							typeof row.prescreening_form_id === "string"
								? row.prescreening_form_id
								: null,
					},
					index,
				),
			),
		};
	}

	return next;
}
