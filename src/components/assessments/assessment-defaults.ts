import { newClientId } from "#/components/jobs/create/job-create-state";
import type {
	CreateCodingAssessmentPayload,
	CreateGenericAssessmentPayload,
	CreatePrescreeningFormPayload,
	CreatePsychometricAssessmentPayload,
	CreateVoiceAssessmentPayload,
	GenericQuestion,
	PsychometricItem,
	VoiceRubric,
} from "#/integrations/api/client";

export function emptyVoiceRubric(): VoiceRubric {
	return {
		score_0: "",
		score_1: "",
		score_2: "",
		score_3: "",
		score_4: "",
		score_5: "",
		score_6: null,
		score_7: null,
		score_8: null,
		score_9: null,
		score_10: null,
	};
}

export function emptyVoiceAssessmentPayload(): CreateVoiceAssessmentPayload {
	return {
		title: "Untitled voice assessment",
		description: null,
		slug: `voice-${newClientId("slug").slice(-8)}`,
		delivery_method: "Web",
		is_multilingual: false,
		languages: ["English"],
		greeting: null,
		parting: null,
		pass_score: 6,
		skills: [],
		questions: [],
		intake_questions: [],
		phone_settings: null,
	};
}

export function emptyGenericQuestion(): GenericQuestion {
	return {
		id: newClientId("gq"),
		question: "",
		question_type: "Mcq",
		options: [],
		correct_answer: null,
		score_weight: 1,
		time_limit_seconds: null,
		order: 0,
		is_active: true,
	};
}

export function emptyGenericAssessmentPayload(): CreateGenericAssessmentPayload {
	return {
		title: "Untitled assessment",
		description: null,
		slug: `generic-${newClientId("slug").slice(-8)}`,
		time_limit_minutes: 30,
		shuffle_questions: false,
		pass_score: 6,
		timing_mode: "Assessment",
		questions: [emptyGenericQuestion()],
	};
}

export function emptyCodingAssessmentPayload(): CreateCodingAssessmentPayload {
	return {
		title: "Untitled coding assessment",
		description: null,
		slug: `code-${newClientId("slug").slice(-8)}`,
		time_limit_minutes: 60,
		pass_completion_number: 1,
		timing_mode: "Assessment",
		allowed_languages: ["typescript", "python"],
		problems: [
			{
				id: newClientId("prob"),
				title: "Problem 1",
				description: "Describe the task in markdown.",
				starter_code: null,
				test_cases: [
					{
						id: newClientId("tc"),
						input: "",
						expected_output: "",
						is_hidden: false,
					},
				],
				difficulty: "Medium",
				score_weight: 1,
				order: 0,
			},
		],
	};
}

export function emptyPsychometricItem(): PsychometricItem {
	return {
		id: newClientId("pi"),
		prompt: "",
		kind: "Likert5",
		order: 0,
	};
}

export function emptyPsychometricAssessmentPayload(): CreatePsychometricAssessmentPayload {
	const row = emptyPsychometricItem();
	return {
		title: "Untitled psychometric",
		description: null,
		slug: `psych-${newClientId("slug").slice(-8)}`,
		framework: "BigFive",
		time_limit_minutes: 30,
		items: [row],
	};
}

export function emptyPrescreeningPayload(): CreatePrescreeningFormPayload {
	return {
		name: "Prescreening",
		collect_resume: true,
		collect_linkedin: false,
		collect_phone: true,
		is_resume_mandatory: false,
		is_linkedin_mandatory: false,
		is_phone_mandatory: false,
		auto_reject: false,
		auto_continue: true,
		min_total_score: null,
		confirmation_message: null,
		knockout_message: null,
		delivery_method: "Web",
		questions: [],
	};
}
