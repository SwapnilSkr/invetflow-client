/**
 * Assessment + pipeline entity types aligned with invetflow-server ts-rs bindings.
 * Keep in sync with `invetflow-server/bindings/*.ts` when models change.
 */

export type VoiceDeliveryMethod = "Web" | "Phone";

export type IntakeQuestionType = "Text" | "Boolean" | "Numeric" | "Date";

export type GenericQuestionType =
	| "Mcq"
	| "WeightedMcq"
	| "OpenEnded"
	| "Boolean"
	| "Numeric"
	| "Date";

export type AssessmentTimingMode = "Assessment" | "PerQuestion";

export type Difficulty = "Easy" | "Medium" | "Hard";

export type PsychometricFramework =
	| "BigFive"
	| "Disc"
	| "MyersBriggs"
	| "WorkValues"
	| "CognitiveAbility"
	| "EmotionalIntelligence";

export type PrescreeningQuestionType =
	| "Text"
	| "FileUpload"
	| "Boolean"
	| "Numeric"
	| "Date"
	| "Dropdown"
	| "MultiSelect"
	| "WeightedMcq";

export interface VoiceRubric {
	score_0: string;
	score_1: string;
	score_2: string;
	score_3: string;
	score_4: string;
	score_5: string;
	score_6: string | null;
	score_7: string | null;
	score_8: string | null;
	score_9: string | null;
	score_10: string | null;
}

export interface VoiceSkill {
	id: string;
	name: string;
	weight: number;
	rubric: VoiceRubric | null;
	order: number;
	is_active: boolean;
}

export interface VoiceQuestion {
	id: string;
	skill_id: string | null;
	skill_name: string;
	primary_question: string;
	follow_up_question: string | null;
	ideal_response_primary: string | null;
	ideal_response_follow_up: string | null;
	weight: number;
	order: number;
	is_active: boolean;
}

export interface VoiceIntakeQuestion {
	id: string;
	question: string;
	question_type: IntakeQuestionType;
	order: number;
	is_active: boolean;
}

export interface VoicePhoneSettings {
	timezone: string;
	call_window_start_minute: number;
	call_window_end_minute: number;
	allowed_weekdays: string[];
	max_retries_no_answer: number;
	retry_delay_minutes: number;
}

export interface VoiceAssessment {
	id: string | null;
	organization_id: string;
	creator_id: string;
	title: string;
	description: string | null;
	slug: string;
	delivery_method: VoiceDeliveryMethod;
	is_multilingual: boolean;
	languages: string[];
	greeting: string | null;
	parting: string | null;
	pass_score: number | null;
	skills: VoiceSkill[];
	questions: VoiceQuestion[];
	intake_questions: VoiceIntakeQuestion[];
	phone_settings: VoicePhoneSettings | null;
	is_deleted: boolean;
	created_at: string;
	updated_at: string;
}

export interface GenericQuestionOption {
	id: string;
	label: string;
	score: number | null;
}

export interface GenericQuestion {
	id: string;
	question: string;
	question_type: GenericQuestionType;
	options: GenericQuestionOption[];
	correct_answer: unknown;
	score_weight: number;
	time_limit_seconds: number | null;
	order: number;
	is_active: boolean;
}

export interface GenericAssessment {
	id: string | null;
	organization_id: string;
	title: string;
	description: string | null;
	slug: string;
	time_limit_minutes: number;
	shuffle_questions: boolean;
	pass_score: number | null;
	timing_mode: AssessmentTimingMode;
	questions: GenericQuestion[];
	is_deleted: boolean;
	created_at: string;
	updated_at: string;
}

export interface TestCase {
	id: string;
	input: string;
	expected_output: string;
	is_hidden: boolean;
}

export interface CodingProblem {
	id: string;
	title: string;
	description: string;
	starter_code: string | null;
	test_cases: TestCase[];
	difficulty: Difficulty;
	score_weight: number;
	order: number;
}

export interface CodingAssessment {
	id: string | null;
	organization_id: string;
	title: string;
	description: string | null;
	slug: string;
	time_limit_minutes: number | null;
	pass_completion_number: number;
	timing_mode: AssessmentTimingMode;
	allowed_languages: string[];
	problems: CodingProblem[];
	is_deleted: boolean;
	created_at: string;
	updated_at: string;
}

export interface PsychometricAssessment {
	id: string | null;
	organization_id: string;
	title: string;
	description: string | null;
	slug: string;
	framework: PsychometricFramework;
	time_limit_minutes: number | null;
	is_deleted: boolean;
	created_at: string;
	updated_at: string;
}

export interface PrescreeningKnockoutRule {
	operator: string;
	value: unknown;
}

export interface PrescreeningQuestion {
	id: string;
	question: string;
	question_type: PrescreeningQuestionType;
	is_required: boolean;
	is_knockout: boolean;
	order: number;
	placeholder: string | null;
	options: GenericQuestionOption[];
	knockout_rule: PrescreeningKnockoutRule | null;
}

export interface PrescreeningForm {
	id: string | null;
	organization_id: string;
	name: string;
	collect_resume: boolean;
	collect_linkedin: boolean;
	collect_phone: boolean;
	is_resume_mandatory: boolean;
	is_linkedin_mandatory: boolean;
	is_phone_mandatory: boolean;
	auto_reject: boolean;
	auto_continue: boolean;
	min_total_score: number | null;
	confirmation_message: string | null;
	knockout_message: string | null;
	delivery_method: VoiceDeliveryMethod;
	questions: PrescreeningQuestion[];
	is_deleted: boolean;
	created_at: string;
	updated_at: string;
}

export type AssessmentEntity =
	| VoiceAssessment
	| GenericAssessment
	| CodingAssessment
	| PsychometricAssessment
	| PrescreeningForm;
