import {
	Brain,
	ClipboardList,
	Code2,
	Eye,
	FileCheck2,
	FileSignature,
	Inbox,
	type LucideIcon,
	Mic,
	PartyPopper,
	ShieldCheck,
	Video,
	XCircle,
} from "lucide-react";
import type {
	JobStage,
	StageAutomation,
	StageType,
} from "#/integrations/api/client";

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

// ─── Stage icons & labels ────────────────────────────────────────────────────

export const STAGE_TYPE_ICON: Record<StageType, LucideIcon> = {
	Applied: Inbox,
	Prescreening: ClipboardList,
	VoiceInterview: Mic,
	GenericAssessment: FileCheck2,
	CodingAssessment: Code2,
	PsychometricAssessment: Brain,
	ManualReview: Eye,
	Consent: ShieldCheck,
	HumanInterview: Video,
	Offer: FileSignature,
	Hired: PartyPopper,
	Rejected: XCircle,
};

export function stageIcon(type: StageType): LucideIcon {
	return STAGE_TYPE_ICON[type] ?? ClipboardList;
}

export const STAGE_TYPE_LABEL: Record<StageType, string> = {
	Applied: "Applied",
	Prescreening: "Prescreening",
	VoiceInterview: "Voice interview",
	GenericAssessment: "Generic assessment",
	CodingAssessment: "Coding assessment",
	PsychometricAssessment: "Psychometric",
	ManualReview: "Manual review",
	Consent: "Consent",
	HumanInterview: "Human interview",
	Offer: "Offer",
	Hired: "Hired",
	Rejected: "Rejected",
};

export function stageTypeLabel(t: StageType): string {
	return STAGE_TYPE_LABEL[t] ?? t;
}

export type AutomationBadge = {
	label: string;
	/** Tailwind utility classes using semantic tokens only — NO HEX */
	className: string;
};

export const AUTOMATION_BADGE: Record<StageAutomation, AutomationBadge> = {
	None: { label: "Manual", className: "bg-muted text-muted-foreground" },
	SendInvitation: {
		label: "Auto invite",
		className: "bg-primary/10 text-primary",
	},
	ScheduleMeeting: {
		label: "Auto schedule",
		className: "bg-primary/10 text-primary",
	},
	SendRejection: {
		label: "Auto reject",
		className: "bg-destructive/10 text-destructive",
	},
	SendHiredNotification: {
		label: "Auto notify",
		className: "bg-primary/10 text-primary",
	},
};
