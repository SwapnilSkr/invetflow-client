import type { JobStage, StageType } from "#/integrations/api/client";

/** All configurable stage kinds (excluding system-managed entries). */
export const ADDABLE_STAGE_TYPES: StageType[] = [
	"Prescreening",
	"VoiceInterview",
	"GenericAssessment",
	"CodingAssessment",
	"PsychometricAssessment",
	"ManualReview",
	"Consent",
	"HumanInterview",
	"Offer",
];

/** Stages where a reusable assessment entity must be linked before publish. */
export const ENTITY_STAGE_TYPES: StageType[] = [
	"Prescreening",
	"VoiceInterview",
	"CodingAssessment",
	"GenericAssessment",
	"PsychometricAssessment",
];

const SYSTEM_UNIQUE: StageType[] = ["Applied", "Hired", "Rejected"];

export function stageRequiresAssessmentLink(stage_type: StageType): boolean {
	return ENTITY_STAGE_TYPES.includes(stage_type);
}

export type AssessmentLinkField =
	| "voice_assessment_id"
	| "generic_assessment_id"
	| "coding_assessment_id"
	| "psychometric_assessment_id"
	| "prescreening_form_id";

export function assessmentLinkFieldForStageType(
	stage_type: StageType,
): AssessmentLinkField | null {
	switch (stage_type) {
		case "VoiceInterview":
			return "voice_assessment_id";
		case "GenericAssessment":
			return "generic_assessment_id";
		case "CodingAssessment":
			return "coding_assessment_id";
		case "PsychometricAssessment":
			return "psychometric_assessment_id";
		case "Prescreening":
			return "prescreening_form_id";
		default:
			return null;
	}
}

export function getLinkedAssessmentId(stage: JobStage): string | null {
	const field = assessmentLinkFieldForStageType(stage.stage_type);
	return field ? (stage[field] as string | null) : null;
}

export function setLinkedAssessmentId(
	stage: JobStage,
	id: string | null,
): JobStage {
	const field = assessmentLinkFieldForStageType(stage.stage_type);
	if (!field) return stage;
	return {
		...stage,
		[field]: id,
	} as JobStage;
}

export function clearAllAssessmentLinks(stage: JobStage): JobStage {
	return {
		...stage,
		voice_assessment_id: null,
		generic_assessment_id: null,
		coding_assessment_id: null,
		psychometric_assessment_id: null,
		prescreening_form_id: null,
	};
}

export function isSystemStageType(t: StageType): boolean {
	return SYSTEM_UNIQUE.includes(t);
}

/** One entity-backed stage type per pipeline (mirror goodfit duplication rules). */
export function entityStageAlreadyPresent(
	stages: JobStage[],
	candidateType: StageType,
): boolean {
	return stages.some((s) => s.stage_type === candidateType);
}

export function unlinkStage(stage: JobStage): JobStage {
	const field = assessmentLinkFieldForStageType(stage.stage_type);
	if (!field) return stage;
	return {
		...stage,
		[field]: null,
	} as JobStage;
}

export function unlinkedEntityStages(stages: JobStage[]): JobStage[] {
	return stages.filter(
		(s) =>
			stageRequiresAssessmentLink(s.stage_type) && !getLinkedAssessmentId(s),
	);
}
