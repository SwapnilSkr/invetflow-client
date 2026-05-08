import {
	ArrowDown,
	ArrowUp,
	Bot,
	GripVertical,
	Loader2,
	Plus,
	Sparkles,
	Trash2,
} from "lucide-react";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import type {
	JobStage,
	RubricItem,
	ScreeningQuestion,
} from "#/integrations/api/client";
import {
	CheckRow,
	Field,
	Summary,
	selectClassName,
	textareaClassName,
} from "./create-job-fields";
import { newClientId } from "./job-create-state";
import {
	type DraftState,
	type DraftUpdate,
	type GenerateContent,
	STAGE_AUTOMATIONS,
	STAGE_TYPES,
} from "./types";

type StepProps = {
	draft: DraftState;
	update: DraftUpdate;
};

type GeneratedStepProps = StepProps & {
	generateContent: GenerateContent;
	generating: boolean;
};

export function JobDescriptionStep({
	baseId,
	draft,
	update,
	generateContent,
	generating,
}: GeneratedStepProps & { baseId: string }) {
	return (
		<>
			<div className="grid gap-4 md:grid-cols-2">
				<Field label="Job title">
					<Input
						value={draft.title}
						onChange={(e) => update("title", e.target.value)}
						placeholder="Senior backend engineer"
					/>
				</Field>
				<Field label="Internal title">
					<Input
						value={draft.jobTitle}
						onChange={(e) => update("jobTitle", e.target.value)}
						placeholder="Backend Engineer - Round 1"
					/>
				</Field>
				<Field label="Department">
					<Input
						value={draft.department}
						onChange={(e) => update("department", e.target.value)}
						placeholder="Engineering"
					/>
				</Field>
				<Field label="Location">
					<Input
						value={draft.location}
						onChange={(e) => update("location", e.target.value)}
						placeholder="Bengaluru, Hybrid"
					/>
				</Field>
				<Field label="Seniority">
					<select
						className={selectClassName}
						value={draft.seniority}
						onChange={(e) => update("seniority", e.target.value)}
					>
						<option>Junior</option>
						<option>Mid</option>
						<option>Senior</option>
						<option>Lead</option>
					</select>
				</Field>
				<Field label="Workplace">
					<select
						className={selectClassName}
						value={draft.workplaceType}
						onChange={(e) => update("workplaceType", e.target.value)}
					>
						<option>Remote</option>
						<option>Hybrid</option>
						<option>Onsite</option>
					</select>
				</Field>
			</div>
			<div className="grid gap-4 md:grid-cols-3">
				<Field label="Employment type">
					<Input
						value={draft.employmentType}
						onChange={(e) => update("employmentType", e.target.value)}
					/>
				</Field>
				<Field label="Salary min">
					<Input
						type="number"
						value={draft.salaryMin}
						onChange={(e) => update("salaryMin", e.target.value)}
					/>
				</Field>
				<Field label="Salary max">
					<Input
						type="number"
						value={draft.salaryMax}
						onChange={(e) => update("salaryMax", e.target.value)}
					/>
				</Field>
			</div>
			<div className="grid gap-2">
				<div className="flex items-center justify-between gap-3">
					<label
						className="text-sm font-medium text-[#111827]"
						htmlFor={`${baseId}-jd`}
					>
						Job description
					</label>
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={generating || !draft.title.trim()}
						onClick={() => generateContent("job_description")}
					>
						{generating ? (
							<Loader2 className="size-4 animate-spin" />
						) : (
							<Sparkles className="size-4" />
						)}
						Generate JD
					</Button>
				</div>
				<textarea
					id={`${baseId}-jd`}
					className={textareaClassName}
					value={draft.jobDescription}
					onChange={(e) => update("jobDescription", e.target.value)}
					placeholder="Responsibilities, expectations, team context, and role outcomes."
				/>
			</div>
		</>
	);
}

export function RequirementsStep({ draft, update }: StepProps) {
	return (
		<>
			<div className="grid gap-4 md:grid-cols-3">
				<Field label="Skills">
					<Input
						value={draft.skills}
						onChange={(e) => update("skills", e.target.value)}
						placeholder="Rust, MongoDB, APIs"
					/>
				</Field>
				<Field label="Tools">
					<Input
						value={draft.tools}
						onChange={(e) => update("tools", e.target.value)}
						placeholder="AWS, Docker, LiveKit"
					/>
				</Field>
				<Field label="Tags">
					<Input
						value={draft.tags}
						onChange={(e) => update("tags", e.target.value)}
						placeholder="Backend, Platform"
					/>
				</Field>
				<Field label="Min experience">
					<Input
						type="number"
						value={draft.experienceMin}
						onChange={(e) => update("experienceMin", e.target.value)}
					/>
				</Field>
				<Field label="Max experience">
					<Input
						type="number"
						value={draft.experienceMax}
						onChange={(e) => update("experienceMax", e.target.value)}
					/>
				</Field>
				<Field label="Cooldown days">
					<Input
						type="number"
						value={draft.cooldownDays}
						onChange={(e) => update("cooldownDays", e.target.value)}
					/>
				</Field>
			</div>
			<div className="grid gap-3 md:grid-cols-2">
				<CheckRow
					label="Require resume"
					checked={draft.requireResume}
					onChange={(v) => update("requireResume", v)}
				/>
				<CheckRow
					label="Require phone"
					checked={draft.requirePhone}
					onChange={(v) => update("requirePhone", v)}
				/>
				<CheckRow
					label="Require LinkedIn"
					checked={draft.requireLinkedin}
					onChange={(v) => update("requireLinkedin", v)}
				/>
				<CheckRow
					label="Require consent"
					checked={draft.requireConsent}
					onChange={(v) => update("requireConsent", v)}
				/>
				<CheckRow
					label="Allow multiple applications"
					checked={draft.allowMultipleApplications}
					onChange={(v) => update("allowMultipleApplications", v)}
				/>
			</div>
		</>
	);
}

export function StagesStep({
	draft,
	update,
	generateContent,
	generating,
}: GeneratedStepProps) {
	const setStages = (stages: JobStage[]) => {
		update("pipeline", {
			stages: stages.map((stage, order) => ({ ...stage, order })),
		});
	};

	return (
		<div className="space-y-3">
			<div className="flex justify-end gap-2">
				<Button
					type="button"
					variant="outline"
					disabled={generating}
					onClick={() => generateContent("pipeline")}
				>
					<Bot className="size-4" />
					Generate stages
				</Button>
				<Button
					type="button"
					variant="secondary"
					onClick={() =>
						setStages([
							...draft.pipeline.stages,
							{
								id: newClientId("stage"),
								title: "New stage",
								stage_type: "ManualReview",
								required: false,
								candidate_facing: false,
								pass_threshold: null,
								contributes_to_score: false,
								automation: "None",
								order: draft.pipeline.stages.length,
							},
						])
					}
				>
					<Plus className="size-4" />
					Add stage
				</Button>
			</div>
			{draft.pipeline.stages.map((stage, index) => (
				<div
					key={stage.id}
					className="grid gap-3 rounded-lg border border-black/8 bg-white p-3 md:grid-cols-[auto_1fr_180px_160px_auto]"
				>
					<GripVertical className="mt-2 size-4 text-[#9ca3af]" />
					<Input
						value={stage.title}
						onChange={(e) =>
							setStages(
								draft.pipeline.stages.map((row) =>
									row.id === stage.id ? { ...row, title: e.target.value } : row,
								),
							)
						}
					/>
					<select
						className={selectClassName}
						value={stage.stage_type}
						onChange={(e) =>
							setStages(
								draft.pipeline.stages.map((row) =>
									row.id === stage.id
										? {
												...row,
												stage_type: e.target.value as JobStage["stage_type"],
											}
										: row,
								),
							)
						}
					>
						{STAGE_TYPES.map((type) => (
							<option key={type}>{type}</option>
						))}
					</select>
					<select
						className={selectClassName}
						value={stage.automation}
						onChange={(e) =>
							setStages(
								draft.pipeline.stages.map((row) =>
									row.id === stage.id
										? {
												...row,
												automation: e.target.value as JobStage["automation"],
											}
										: row,
								),
							)
						}
					>
						{STAGE_AUTOMATIONS.map((automation) => (
							<option key={automation}>{automation}</option>
						))}
					</select>
					<div className="flex gap-1">
						<Button
							type="button"
							variant="outline"
							size="icon-sm"
							disabled={index === 0}
							onClick={() => {
								const next = [...draft.pipeline.stages];
								[next[index - 1], next[index]] = [next[index], next[index - 1]];
								setStages(next);
							}}
							aria-label="Move stage up"
						>
							<ArrowUp className="size-4" />
						</Button>
						<Button
							type="button"
							variant="outline"
							size="icon-sm"
							disabled={index === draft.pipeline.stages.length - 1}
							onClick={() => {
								const next = [...draft.pipeline.stages];
								[next[index + 1], next[index]] = [next[index], next[index + 1]];
								setStages(next);
							}}
							aria-label="Move stage down"
						>
							<ArrowDown className="size-4" />
						</Button>
						<Button
							type="button"
							variant="outline"
							size="icon-sm"
							onClick={() =>
								setStages(
									draft.pipeline.stages.filter((row) => row.id !== stage.id),
								)
							}
							aria-label="Remove stage"
						>
							<Trash2 className="size-4" />
						</Button>
					</div>
					<div className="col-span-full flex flex-wrap gap-3 text-xs text-[#6b7280]">
						<CheckRow
							label="Required"
							checked={stage.required}
							onChange={(v) =>
								setStages(
									draft.pipeline.stages.map((row) =>
										row.id === stage.id ? { ...row, required: v } : row,
									),
								)
							}
						/>
						<CheckRow
							label="Candidate-facing"
							checked={stage.candidate_facing}
							onChange={(v) =>
								setStages(
									draft.pipeline.stages.map((row) =>
										row.id === stage.id ? { ...row, candidate_facing: v } : row,
									),
								)
							}
						/>
						<CheckRow
							label="Contributes to score"
							checked={stage.contributes_to_score}
							onChange={(v) =>
								setStages(
									draft.pipeline.stages.map((row) =>
										row.id === stage.id
											? { ...row, contributes_to_score: v }
											: row,
									),
								)
							}
						/>
					</div>
				</div>
			))}
		</div>
	);
}

export function VoiceStep({
	draft,
	update,
	generateContent,
	generating,
}: GeneratedStepProps) {
	const setRubric = (rubric: RubricItem[]) => {
		update(
			"rubric",
			rubric.map((row, order) => ({ ...row, order })),
		);
	};

	return (
		<div className="space-y-4">
			<div className="grid gap-4 md:grid-cols-4">
				<Field label="Duration">
					<Input
						type="number"
						value={draft.durationMinutes}
						onChange={(e) =>
							update("durationMinutes", Number(e.target.value) || 30)
						}
					/>
				</Field>
				<Field label="Max score">
					<Input
						type="number"
						value={draft.maxScore}
						onChange={(e) => update("maxScore", Number(e.target.value) || 10)}
					/>
				</Field>
				<Field label="Pass threshold">
					<Input
						type="number"
						value={draft.passThreshold}
						onChange={(e) =>
							update("passThreshold", Number(e.target.value) || 6)
						}
					/>
				</Field>
				<Field label="Voice gender">
					<select
						className={selectClassName}
						value={draft.voiceGender}
						onChange={(e) => update("voiceGender", e.target.value)}
					>
						<option>Neutral</option>
						<option>Female</option>
						<option>Male</option>
					</select>
				</Field>
			</div>
			<Field label="Allowed languages">
				<Input
					value={draft.allowedLanguages}
					onChange={(e) => update("allowedLanguages", e.target.value)}
					placeholder="English, Hindi"
				/>
			</Field>
			<div className="grid gap-4 md:grid-cols-2">
				<Field label="Greeting">
					<Input
						value={draft.greeting}
						onChange={(e) => update("greeting", e.target.value)}
					/>
				</Field>
				<Field label="Parting words">
					<Input
						value={draft.partingWords}
						onChange={(e) => update("partingWords", e.target.value)}
					/>
				</Field>
			</div>
			<div className="flex justify-end gap-2">
				<Button
					type="button"
					variant="outline"
					disabled={generating}
					onClick={() => generateContent("rubric_questions")}
				>
					<Sparkles className="size-4" />
					Generate rubric
				</Button>
				<Button
					type="button"
					variant="secondary"
					onClick={() =>
						setRubric([
							...draft.rubric,
							{
								id: newClientId("rubric"),
								skill: "",
								weight: 1,
								scoring_guide: "",
								question: "",
								follow_up_prompts: [],
								order: draft.rubric.length,
							},
						])
					}
				>
					<Plus className="size-4" />
					Add rubric row
				</Button>
			</div>
			{draft.rubric.map((row) => (
				<div
					key={row.id}
					className="grid gap-3 rounded-lg border border-black/8 p-3"
				>
					<div className="grid gap-3 md:grid-cols-[1fr_100px]">
						<Input
							value={row.skill}
							onChange={(e) =>
								setRubric(
									draft.rubric.map((item) =>
										item.id === row.id
											? { ...item, skill: e.target.value }
											: item,
									),
								)
							}
							placeholder="Skill"
						/>
						<Input
							type="number"
							value={row.weight}
							onChange={(e) =>
								setRubric(
									draft.rubric.map((item) =>
										item.id === row.id
											? { ...item, weight: Number(e.target.value) || 1 }
											: item,
									),
								)
							}
						/>
					</div>
					<Input
						value={row.question}
						onChange={(e) =>
							setRubric(
								draft.rubric.map((item) =>
									item.id === row.id
										? { ...item, question: e.target.value }
										: item,
								),
							)
						}
						placeholder="Main interview question"
					/>
					<textarea
						className={textareaClassName}
						value={row.scoring_guide}
						onChange={(e) =>
							setRubric(
								draft.rubric.map((item) =>
									item.id === row.id
										? { ...item, scoring_guide: e.target.value }
										: item,
								),
							)
						}
						placeholder="Scoring guide"
					/>
					<div className="flex justify-end">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() =>
								setRubric(draft.rubric.filter((item) => item.id !== row.id))
							}
						>
							<Trash2 className="size-4" />
							Remove
						</Button>
					</div>
				</div>
			))}
		</div>
	);
}

export function PrescreeningStep({ draft, update }: StepProps) {
	const setQuestions = (rows: ScreeningQuestion[]) => {
		update(
			"screeningQuestions",
			rows.map((row, order) => ({ ...row, order })),
		);
	};

	return (
		<div className="space-y-3">
			<div className="flex justify-end">
				<Button
					type="button"
					variant="secondary"
					onClick={() =>
						setQuestions([
							...draft.screeningQuestions,
							{
								id: newClientId("screen"),
								label: "",
								question_type: "Text",
								required: false,
								options: [],
								knockout: null,
								order: draft.screeningQuestions.length,
							},
						])
					}
				>
					<Plus className="size-4" />
					Add question
				</Button>
			</div>
			{draft.screeningQuestions.length === 0 ? (
				<p className="text-sm text-[#6b7280]">No prescreening questions.</p>
			) : null}
			{draft.screeningQuestions.map((row) => (
				<div
					key={row.id}
					className="grid gap-3 rounded-lg border border-black/8 p-3 md:grid-cols-[1fr_180px_auto]"
				>
					<Input
						value={row.label}
						onChange={(e) =>
							setQuestions(
								draft.screeningQuestions.map((item) =>
									item.id === row.id
										? { ...item, label: e.target.value }
										: item,
								),
							)
						}
						placeholder="Question"
					/>
					<select
						className={selectClassName}
						value={row.question_type}
						onChange={(e) =>
							setQuestions(
								draft.screeningQuestions.map((item) =>
									item.id === row.id
										? {
												...item,
												question_type: e.target
													.value as ScreeningQuestion["question_type"],
											}
										: item,
								),
							)
						}
					>
						{["Text", "Number", "Boolean", "Select", "MultiSelect", "Date"].map(
							(type) => (
								<option key={type}>{type}</option>
							),
						)}
					</select>
					<Button
						type="button"
						variant="outline"
						size="icon"
						onClick={() =>
							setQuestions(
								draft.screeningQuestions.filter((item) => item.id !== row.id),
							)
						}
						aria-label="Remove screening question"
					>
						<Trash2 className="size-4" />
					</Button>
				</div>
			))}
		</div>
	);
}

export function PublishingStep({ draft, update }: StepProps) {
	return (
		<div className="grid gap-3">
			<CheckRow
				label="Enable public invite link"
				checked={draft.publicLinkEnabled}
				onChange={(v) => update("publicLinkEnabled", v)}
			/>
			<CheckRow
				label="Show on careers page"
				checked={draft.careersPage}
				onChange={(v) => update("careersPage", v)}
			/>
			<CheckRow
				label="Publish immediately"
				checked={draft.publishOnCreate}
				onChange={(v) => update("publishOnCreate", v)}
			/>
			<Field label="External board toggles">
				<Input
					value={draft.externalBoards}
					onChange={(e) => update("externalBoards", e.target.value)}
					placeholder="LinkedIn, Indeed, Google Jobs"
				/>
			</Field>
		</div>
	);
}

export function ReviewStep({ draft }: { draft: DraftState }) {
	return (
		<div className="grid gap-4 md:grid-cols-2">
			<Summary
				title="Posting"
				rows={[draft.title, draft.jobTitle, draft.location]}
			/>
			<Summary
				title="Requirements"
				rows={[draft.skills, draft.tools, `${draft.experienceMin || 0}+ years`]}
			/>
			<Summary
				title="Pipeline"
				rows={draft.pipeline.stages.map((stage) => stage.title)}
			/>
			<Summary
				title="Voice interview"
				rows={[
					`${draft.durationMinutes} minutes`,
					`${draft.passThreshold}/${draft.maxScore} pass threshold`,
					`${draft.rubric.length} rubric rows`,
				]}
			/>
			<Summary
				title="Publishing"
				rows={[
					draft.publicLinkEnabled ? "Public link enabled" : "Private",
					draft.publishOnCreate ? "Publish now" : "Create as draft",
				]}
			/>
		</div>
	);
}
