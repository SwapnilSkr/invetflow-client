import { Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
	emptyVoiceAssessmentPayload,
	emptyVoiceRubric,
} from "#/components/assessments/assessment-defaults";
import { newClientId } from "#/components/jobs/create/job-create-state";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Select } from "#/components/ui/select";
import { Textarea } from "#/components/ui/textarea";
import type {
	CreateVoiceAssessmentPayload,
	VoiceRubric,
} from "#/integrations/api/client";

type VoiceAssessmentFormProps = {
	initial: CreateVoiceAssessmentPayload | null;
	submitLabel?: string;
	onSubmit: (body: CreateVoiceAssessmentPayload) => Promise<void>;
	onCancel?: () => void;
	disabled?: boolean;
};

const RUBRIC_KEYS: (keyof VoiceRubric)[] = [
	"score_0",
	"score_1",
	"score_2",
	"score_3",
	"score_4",
	"score_5",
];

export function VoiceAssessmentForm({
	initial,
	submitLabel = "Save",
	onSubmit,
	onCancel,
	disabled,
}: VoiceAssessmentFormProps) {
	const [value, setValue] = useState<CreateVoiceAssessmentPayload>(
		() => initial ?? emptyVoiceAssessmentPayload(),
	);
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		if (initial) setValue(initial);
	}, [initial]);

	async function submit() {
		setBusy(true);
		try {
			await onSubmit(value);
		} finally {
			setBusy(false);
		}
	}

	function setSkills(
		updater: (rows: CreateVoiceAssessmentPayload["skills"]) => void,
	) {
		setValue((prev) => {
			const skills = [...prev.skills];
			updater(skills);
			return {
				...prev,
				skills: skills.map((s, order) => ({ ...s, order })),
			};
		});
	}

	function setQuestions(
		updater: (rows: CreateVoiceAssessmentPayload["questions"]) => void,
	) {
		setValue((prev) => {
			const questions = [...prev.questions];
			updater(questions);
			return {
				...prev,
				questions: questions.map((q, order) => ({ ...q, order })),
			};
		});
	}

	function setIntake(
		updater: (rows: CreateVoiceAssessmentPayload["intake_questions"]) => void,
	) {
		setValue((prev) => {
			const intake_questions = [...prev.intake_questions];
			updater(intake_questions);
			return {
				...prev,
				intake_questions: intake_questions.map((q, order) => ({
					...q,
					order,
				})),
			};
		});
	}

	return (
		<div className="grid max-h-[min(70vh,640px)] gap-6 overflow-y-auto pr-1">
			<div className="grid gap-4 md:grid-cols-2">
				<div className="grid gap-2 md:col-span-2">
					<Label htmlFor="va-title">Title</Label>
					<Input
						id="va-title"
						value={value.title}
						onChange={(e) => setValue((p) => ({ ...p, title: e.target.value }))}
					/>
				</div>
				<div className="grid gap-2 md:col-span-2">
					<Label htmlFor="va-desc">Description</Label>
					<Textarea
						id="va-desc"
						className="min-h-[72px]"
						value={value.description ?? ""}
						onChange={(e) =>
							setValue((p) => ({
								...p,
								description: e.target.value || null,
							}))
						}
					/>
				</div>
				<div className="grid gap-2">
					<Label>Delivery</Label>
					<Select
						value={value.delivery_method}
						onChange={(e) =>
							setValue((p) => ({
								...p,
								delivery_method: e.target.value as "Web" | "Phone",
							}))
						}
					>
						<option value="Web">Web</option>
						<option value="Phone" disabled>
							Phone (coming soon)
						</option>
					</Select>
				</div>
				<div className="grid gap-2">
					<Label htmlFor="va-pass">Pass score</Label>
					<Input
						id="va-pass"
						type="number"
						value={value.pass_score ?? ""}
						onChange={(e) =>
							setValue((p) => ({
								...p,
								pass_score: e.target.value ? Number(e.target.value) : null,
							}))
						}
					/>
				</div>
				<div className="grid gap-2 md:col-span-2">
					<Label>Greeting</Label>
					<Input
						value={value.greeting ?? ""}
						onChange={(e) =>
							setValue((p) => ({
								...p,
								greeting: e.target.value || null,
							}))
						}
					/>
				</div>
				<div className="grid gap-2 md:col-span-2">
					<Label>Parting</Label>
					<Input
						value={value.parting ?? ""}
						onChange={(e) =>
							setValue((p) => ({
								...p,
								parting: e.target.value || null,
							}))
						}
					/>
				</div>
			</div>

			<section className="space-y-3">
				<div className="flex items-center justify-between">
					<h4 className="text-sm font-semibold text-foreground">Skills</h4>
					<Button
						type="button"
						size="sm"
						variant="secondary"
						onClick={() =>
							setSkills((rows) => {
								rows.push({
									id: newClientId("skill"),
									name: "",
									weight: 1,
									rubric: emptyVoiceRubric(),
									order: rows.length,
									is_active: true,
								});
							})
						}
					>
						<Plus className="size-4" />
						Add skill
					</Button>
				</div>
				{value.skills.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						Add at least one skill with rubric descriptors (0–5 required).
					</p>
				) : null}
				{value.skills.map((sk) => (
					<div
						key={sk.id}
						className="space-y-2 rounded-lg border border-border p-3"
					>
						<div className="flex flex-wrap gap-2">
							<Input
								className="min-w-[160px] flex-1"
								placeholder="Skill name"
								value={sk.name}
								onChange={(e) =>
									setSkills((rows) => {
										const i = rows.findIndex((x) => x.id === sk.id);
										if (i >= 0) rows[i] = { ...rows[i], name: e.target.value };
									})
								}
							/>
							<Input
								type="number"
								className="w-[100px]"
								value={sk.weight}
								onChange={(e) =>
									setSkills((rows) => {
										const i = rows.findIndex((x) => x.id === sk.id);
										if (i >= 0)
											rows[i] = {
												...rows[i],
												weight: Number(e.target.value) || 0,
											};
									})
								}
							/>
							<Button
								type="button"
								size="icon"
								variant="outline"
								onClick={() =>
									setSkills((rows) => rows.filter((x) => x.id !== sk.id))
								}
							>
								<Trash2 className="size-4" />
							</Button>
						</div>
						{RUBRIC_KEYS.map((rk) => {
							const lbl = rk.replace("score_", "");
							const rub = sk.rubric ?? emptyVoiceRubric();
							return (
								<div key={rk} className="grid gap-1 md:grid-cols-[80px_1fr]">
									<span className="text-xs text-muted-foreground">
										Score {lbl}
									</span>
									<Input
										value={(rub[rk] ?? "") as string}
										onChange={(e) =>
											setSkills((rows) => {
												const i = rows.findIndex((x) => x.id === sk.id);
												if (i < 0) return;
												const nr = {
													...(rows[i].rubric ?? emptyVoiceRubric()),
												};
												(nr as Record<string, string | null>)[rk] =
													e.target.value;
												rows[i] = { ...rows[i], rubric: nr };
											})
										}
									/>
								</div>
							);
						})}
					</div>
				))}
			</section>

			<section className="space-y-3">
				<div className="flex items-center justify-between">
					<h4 className="text-sm font-semibold text-foreground">Questions</h4>
					<Button
						type="button"
						size="sm"
						variant="secondary"
						onClick={() =>
							setQuestions((rows) =>
								rows.concat({
									id: newClientId("vq"),
									skill_id: null,
									skill_name: value.skills[0]?.name ?? "",
									primary_question: "",
									follow_up_question: null,
									ideal_response_primary: null,
									ideal_response_follow_up: null,
									weight: 1,
									order: rows.length,
									is_active: true,
								}),
							)
						}
					>
						<Plus className="size-4" />
						Add question
					</Button>
				</div>
				{value.questions.map((q) => (
					<div
						key={q.id}
						className="space-y-2 rounded-lg border border-border p-3"
					>
						<Input
							placeholder="Skill name snapshot"
							value={q.skill_name}
							onChange={(e) =>
								setQuestions((rows) => {
									const i = rows.findIndex((x) => x.id === q.id);
									if (i >= 0)
										rows[i] = { ...rows[i], skill_name: e.target.value };
								})
							}
						/>
						<Textarea
							placeholder="Primary question"
							className="min-h-[56px]"
							value={q.primary_question}
							onChange={(e) =>
								setQuestions((rows) => {
									const i = rows.findIndex((x) => x.id === q.id);
									if (i >= 0)
										rows[i] = {
											...rows[i],
											primary_question: e.target.value,
										};
								})
							}
						/>
						<Button
							type="button"
							size="sm"
							variant="outline"
							onClick={() =>
								setQuestions((rows) => rows.filter((x) => x.id !== q.id))
							}
						>
							Remove
						</Button>
					</div>
				))}
			</section>

			<section className="space-y-3">
				<div className="flex items-center justify-between">
					<h4 className="text-sm font-semibold text-foreground">
						Intake questions
					</h4>
					<Button
						type="button"
						size="sm"
						variant="secondary"
						onClick={() =>
							setIntake((rows) =>
								rows.concat({
									id: newClientId("int"),
									question: "",
									question_type: "Text",
									order: rows.length,
									is_active: true,
								}),
							)
						}
					>
						<Plus className="size-4" />
						Add intake
					</Button>
				</div>
				{value.intake_questions.map((q) => (
					<div key={q.id} className="flex flex-wrap gap-2">
						<Input
							className="min-w-[200px] flex-1"
							value={q.question}
							onChange={(e) =>
								setIntake((rows) => {
									const i = rows.findIndex((x) => x.id === q.id);
									if (i >= 0)
										rows[i] = { ...rows[i], question: e.target.value };
								})
							}
						/>
						<Select
							value={q.question_type}
							onChange={(e) =>
								setIntake((rows) => {
									const i = rows.findIndex((x) => x.id === q.id);
									if (i >= 0)
										rows[i] = {
											...rows[i],
											question_type: e.target.value as typeof q.question_type,
										};
								})
							}
						>
							<option value="Text">Text</option>
							<option value="Boolean">Boolean</option>
							<option value="Numeric">Numeric</option>
							<option value="Date">Date</option>
						</Select>
						<Button
							type="button"
							size="icon"
							variant="outline"
							onClick={() =>
								setIntake((rows) => rows.filter((x) => x.id !== q.id))
							}
						>
							<Trash2 className="size-4" />
						</Button>
					</div>
				))}
			</section>

			<div className="sticky bottom-0 flex justify-end gap-2 border-t border-border bg-background pt-4">
				{onCancel ? (
					<Button type="button" variant="ghost" onClick={onCancel}>
						Cancel
					</Button>
				) : null}
				<Button
					type="button"
					disabled={disabled ?? (busy || !value.title.trim())}
					onClick={() => void submit()}
				>
					{busy ? <Loader2 className="size-4 animate-spin" /> : null}
					{submitLabel}
				</Button>
			</div>
		</div>
	);
}
