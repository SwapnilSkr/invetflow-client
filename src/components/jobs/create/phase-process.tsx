import {
	ArrowDown,
	ArrowUp,
	Bot,
	GripVertical,
	Plus,
	Sparkles,
	Trash2,
} from "lucide-react";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Select } from "#/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import { Textarea } from "#/components/ui/textarea";
import type {
	JobStage,
	RubricItem,
	ScreeningQuestion,
} from "#/integrations/api/client";
import { newClientId } from "./job-create-state";
import { TagInput } from "./tag-input";
import {
	type DraftState,
	type DraftUpdate,
	STAGE_AUTOMATIONS,
	STAGE_TYPES,
} from "./types";

type PhaseProcessProps = {
	draft: DraftState;
	update: DraftUpdate;
	errors: Record<string, string>;
	onGeneratePipeline: () => Promise<void>;
	onGenerateRubric: () => Promise<void>;
	generating: boolean;
};

// --- Pipeline sub-tab ---

type PipelineTabProps = {
	draft: DraftState;
	update: DraftUpdate;
	onGeneratePipeline: () => Promise<void>;
	generating: boolean;
};

function PipelineTab({
	draft,
	update,
	onGeneratePipeline,
	generating,
}: PipelineTabProps) {
	function setStages(stages: JobStage[]) {
		update("pipeline", {
			stages: stages.map((stage, order) => ({ ...stage, order })),
		});
	}

	return (
		<div className="space-y-3">
			<div className="flex justify-end gap-2">
				<Button
					type="button"
					variant="outline"
					disabled={generating}
					onClick={onGeneratePipeline}
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
					className="grid gap-3 rounded-lg border border-border bg-card p-3 md:grid-cols-[auto_1fr_180px_160px_auto]"
				>
					<GripVertical className="mt-2 size-4 text-muted-foreground" />
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
					<Select
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
					</Select>
					<Select
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
					</Select>
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
					<div className="col-span-full flex flex-wrap gap-3 text-xs text-muted-foreground">
						<label className="flex items-center gap-1.5">
							<input
								type="checkbox"
								checked={stage.required}
								onChange={(e) =>
									setStages(
										draft.pipeline.stages.map((row) =>
											row.id === stage.id
												? { ...row, required: e.target.checked }
												: row,
										),
									)
								}
								className="size-3.5"
							/>
							Required
						</label>
						<label className="flex items-center gap-1.5">
							<input
								type="checkbox"
								checked={stage.candidate_facing}
								onChange={(e) =>
									setStages(
										draft.pipeline.stages.map((row) =>
											row.id === stage.id
												? { ...row, candidate_facing: e.target.checked }
												: row,
										),
									)
								}
								className="size-3.5"
							/>
							Candidate-facing
						</label>
						<label className="flex items-center gap-1.5">
							<input
								type="checkbox"
								checked={stage.contributes_to_score}
								onChange={(e) =>
									setStages(
										draft.pipeline.stages.map((row) =>
											row.id === stage.id
												? { ...row, contributes_to_score: e.target.checked }
												: row,
										),
									)
								}
								className="size-3.5"
							/>
							Contributes to score
						</label>
					</div>
				</div>
			))}
		</div>
	);
}

// --- Voice interview sub-tab ---

type VoiceTabProps = {
	draft: DraftState;
	update: DraftUpdate;
};

function VoiceTab({ draft, update }: VoiceTabProps) {
	return (
		<div className="space-y-4">
			<div className="grid gap-4 md:grid-cols-4">
				<div className="grid gap-2">
					<Label htmlFor="voice-duration">Duration (min)</Label>
					<Input
						id="voice-duration"
						type="number"
						value={draft.durationMinutes}
						onChange={(e) =>
							update("durationMinutes", Number(e.target.value) || 30)
						}
					/>
				</div>
				<div className="grid gap-2">
					<Label htmlFor="voice-max-score">Max score</Label>
					<Input
						id="voice-max-score"
						type="number"
						value={draft.maxScore}
						onChange={(e) => update("maxScore", Number(e.target.value) || 10)}
					/>
				</div>
				<div className="grid gap-2">
					<Label htmlFor="voice-threshold">Pass threshold</Label>
					<Input
						id="voice-threshold"
						type="number"
						value={draft.passThreshold}
						onChange={(e) =>
							update("passThreshold", Number(e.target.value) || 6)
						}
					/>
				</div>
				<div className="grid gap-2">
					<Label htmlFor="voice-gender">Voice gender</Label>
					<Select
						id="voice-gender"
						value={draft.voiceGender}
						onChange={(e) =>
							update("voiceGender", e.target.value as DraftState["voiceGender"])
						}
					>
						<option value="Neutral">Neutral</option>
						<option value="Female">Female</option>
						<option value="Male">Male</option>
					</Select>
				</div>
			</div>
			<div className="grid gap-2">
				<Label>Allowed languages</Label>
				<TagInput
					value={draft.allowedLanguages}
					onChange={(v) => update("allowedLanguages", v)}
					placeholder="English, Hindi…"
				/>
			</div>
			<div className="grid gap-4 md:grid-cols-2">
				<div className="grid gap-2">
					<Label htmlFor="voice-greeting">Greeting</Label>
					<Input
						id="voice-greeting"
						value={draft.greeting}
						onChange={(e) => update("greeting", e.target.value)}
						placeholder="Hi, I'm your AI interviewer for today…"
					/>
				</div>
				<div className="grid gap-2">
					<Label htmlFor="voice-parting">Parting words</Label>
					<Input
						id="voice-parting"
						value={draft.partingWords}
						onChange={(e) => update("partingWords", e.target.value)}
						placeholder="Thank you for your time…"
					/>
				</div>
			</div>
		</div>
	);
}

// --- Prescreening sub-tab ---

type PrescreeningTabProps = {
	draft: DraftState;
	update: DraftUpdate;
};

function PrescreeningTab({ draft, update }: PrescreeningTabProps) {
	function setQuestions(rows: ScreeningQuestion[]) {
		update(
			"screeningQuestions",
			rows.map((row, order) => ({ ...row, order })),
		);
	}

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
				<p className="text-sm text-muted-foreground">
					No prescreening questions added yet.
				</p>
			) : null}
			{draft.screeningQuestions.map((row) => (
				<div
					key={row.id}
					className="grid gap-3 rounded-lg border border-border p-3 md:grid-cols-[1fr_180px_auto]"
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
						placeholder="Question label"
					/>
					<Select
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
					</Select>
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

// --- Rubric sub-tab ---

type RubricTabProps = {
	draft: DraftState;
	update: DraftUpdate;
	onGenerateRubric: () => Promise<void>;
	generating: boolean;
};

function RubricTab({
	draft,
	update,
	onGenerateRubric,
	generating,
}: RubricTabProps) {
	function setRubric(rubric: RubricItem[]) {
		update(
			"rubric",
			rubric.map((row, order) => ({ ...row, order })),
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex justify-end gap-2">
				<Button
					type="button"
					variant="outline"
					disabled={generating}
					onClick={onGenerateRubric}
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
					className="grid gap-3 rounded-lg border border-border p-3"
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
					<Textarea
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
						placeholder="Scoring guide — what separates a 7 from a 9?"
						className="min-h-[80px]"
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

// --- Main export ---

export function PhaseProcess({
	draft,
	update,
	errors,
	onGeneratePipeline,
	onGenerateRubric,
	generating,
}: PhaseProcessProps) {
	return (
		<Card className="border-border">
			<CardContent className="pt-6">
				{errors["pipeline.stages"] ? (
					<p className="mb-4 text-xs text-destructive">
						{errors["pipeline.stages"]}
					</p>
				) : null}
				<Tabs defaultValue="pipeline">
					<TabsList className="mb-4">
						<TabsTrigger value="pipeline">Pipeline</TabsTrigger>
						<TabsTrigger value="voice">Voice interview</TabsTrigger>
						<TabsTrigger value="prescreening">Prescreening</TabsTrigger>
						<TabsTrigger value="rubric">Rubric</TabsTrigger>
					</TabsList>
					<TabsContent value="pipeline">
						<PipelineTab
							draft={draft}
							update={update}
							onGeneratePipeline={onGeneratePipeline}
							generating={generating}
						/>
					</TabsContent>
					<TabsContent value="voice">
						<VoiceTab draft={draft} update={update} />
					</TabsContent>
					<TabsContent value="prescreening">
						<PrescreeningTab draft={draft} update={update} />
					</TabsContent>
					<TabsContent value="rubric">
						<RubricTab
							draft={draft}
							update={update}
							onGenerateRubric={onGenerateRubric}
							generating={generating}
						/>
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
}
