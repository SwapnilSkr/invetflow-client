import { Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
	emptyGenericAssessmentPayload,
	emptyGenericQuestion,
} from "#/components/assessments/assessment-defaults";
import { newClientId } from "#/components/jobs/create/job-create-state";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Select } from "#/components/ui/select";
import { Textarea } from "#/components/ui/textarea";
import type {
	CreateGenericAssessmentPayload,
	GenericQuestionOption,
} from "#/integrations/api/client";

type Props = {
	initial: CreateGenericAssessmentPayload | null;
	submitLabel?: string;
	onSubmit: (body: CreateGenericAssessmentPayload) => Promise<void>;
	onCancel?: () => void;
	disabled?: boolean;
};

export function GenericAssessmentForm({
	initial,
	submitLabel = "Save",
	onSubmit,
	onCancel,
	disabled,
}: Props) {
	const titleInputRef = useRef<HTMLInputElement>(null);
	const [value, setValue] = useState<CreateGenericAssessmentPayload>(
		() => initial ?? emptyGenericAssessmentPayload(),
	);
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		if (initial) setValue(initial);
	}, [initial]);

	useEffect(() => {
		titleInputRef.current?.focus();
	}, []);

	async function submit() {
		setBusy(true);
		try {
			await onSubmit(value);
		} finally {
			setBusy(false);
		}
	}

	function setQuestions(
		updater: (q: CreateGenericAssessmentPayload["questions"]) => void,
	) {
		setValue((prev) => {
			const questions = [...prev.questions];
			updater(questions);
			return {
				...prev,
				questions: questions.map((row, order) => ({ ...row, order })),
			};
		});
	}

	return (
		<div className="grid max-h-[min(70vh,640px)] gap-6 overflow-y-auto pr-1">
			<div className="grid gap-4 md:grid-cols-2">
				<div className="grid gap-2 md:col-span-2">
					<Label htmlFor="ga-title">Title</Label>
					<Input
						ref={titleInputRef}
						id="ga-title"
						value={value.title}
						onChange={(e) => setValue((p) => ({ ...p, title: e.target.value }))}
					/>
				</div>
				<div className="grid gap-2 md:col-span-2">
					<Label htmlFor="ga-desc">Description</Label>
					<Textarea
						id="ga-desc"
						value={value.description ?? ""}
						className="min-h-[72px]"
						onChange={(e) =>
							setValue((p) => ({ ...p, description: e.target.value || null }))
						}
					/>
				</div>
				<div className="grid gap-2">
					<Label htmlFor="ga-min">Time limit (min)</Label>
					<Input
						id="ga-min"
						type="number"
						value={value.time_limit_minutes}
						onChange={(e) =>
							setValue((p) => ({
								...p,
								time_limit_minutes: Number(e.target.value) || 0,
							}))
						}
					/>
				</div>
				<div className="grid gap-2">
					<Label htmlFor="ga-pass">Pass score</Label>
					<Input
						id="ga-pass"
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
				<label className="flex items-center gap-2 text-sm">
					<input
						type="checkbox"
						checked={value.shuffle_questions}
						onChange={(e) =>
							setValue((p) => ({ ...p, shuffle_questions: e.target.checked }))
						}
					/>
					Shuffle questions
				</label>
				<div className="grid gap-2">
					<Label>Timing mode</Label>
					<Select
						value={value.timing_mode}
						onChange={(e) =>
							setValue((p) => ({
								...p,
								timing_mode: e.target.value as typeof p.timing_mode,
							}))
						}
					>
						<option value="Assessment">Whole assessment</option>
						<option value="PerQuestion">Per question</option>
					</Select>
				</div>
			</div>

			<section className="space-y-3">
				<div className="flex items-center justify-between">
					<h4 className="text-sm font-semibold text-foreground">Questions</h4>
					<Button
						type="button"
						size="sm"
						variant="secondary"
						onClick={() =>
							setQuestions((rows) => {
								const q = emptyGenericQuestion();
								q.id = newClientId("gq");
								rows.push(q);
							})
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
						<div className="flex flex-wrap gap-2">
							<Select
								value={q.question_type}
								onChange={(e) =>
									setQuestions((rows) => {
										const i = rows.findIndex((x) => x.id === q.id);
										if (i >= 0)
											rows[i] = {
												...rows[i],
												question_type: e.target.value as typeof q.question_type,
											};
									})
								}
							>
								<option value="Mcq">Multiple choice</option>
								<option value="WeightedMcq">Weighted MCQ</option>
								<option value="OpenEnded">Open-ended</option>
								<option value="Boolean">Boolean</option>
								<option value="Numeric">Numeric</option>
								<option value="Date">Date</option>
							</Select>
							<Input
								type="number"
								className="w-[100px]"
								placeholder="Weight"
								value={q.score_weight}
								onChange={(e) =>
									setQuestions((rows) => {
										const i = rows.findIndex((x) => x.id === q.id);
										if (i >= 0)
											rows[i] = {
												...rows[i],
												score_weight: Number(e.target.value) || 0,
											};
									})
								}
							/>
							<Input
								type="number"
								className="w-[120px]"
								placeholder="Sec limit"
								value={q.time_limit_seconds ?? ""}
								onChange={(e) =>
									setQuestions((rows) => {
										const i = rows.findIndex((x) => x.id === q.id);
										if (i >= 0)
											rows[i] = {
												...rows[i],
												time_limit_seconds: e.target.value
													? Number(e.target.value)
													: null,
											};
									})
								}
							/>
							<Button
								type="button"
								size="icon"
								variant="outline"
								onClick={() =>
									setQuestions((rows) => rows.filter((x) => x.id !== q.id))
								}
							>
								<Trash2 className="size-4" />
							</Button>
						</div>
						<Textarea
							value={q.question}
							className="min-h-[52px]"
							onChange={(e) =>
								setQuestions((rows) => {
									const i = rows.findIndex((x) => x.id === q.id);
									if (i >= 0)
										rows[i] = { ...rows[i], question: e.target.value };
								})
							}
						/>
						{(q.question_type === "Mcq" ||
							q.question_type === "WeightedMcq") && (
							<div className="space-y-2">
								{q.options.map((opt) => (
									<div key={opt.id} className="flex gap-2">
										<Input
											value={opt.label}
											onChange={(e) =>
												setQuestions((rows) => {
													const iq = rows.findIndex((x) => x.id === q.id);
													if (iq < 0) return;
													const opts = [...rows[iq].options];
													const oi = opts.findIndex((x) => x.id === opt.id);
													if (oi >= 0)
														opts[oi] = { ...opts[oi], label: e.target.value };
													rows[iq] = { ...rows[iq], options: opts };
												})
											}
										/>
										{q.question_type === "WeightedMcq" ? (
											<Input
												type="number"
												className="w-[90px]"
												placeholder="Score"
												value={opt.score ?? ""}
												onChange={(e) =>
													setQuestions((rows) => {
														const iq = rows.findIndex((x) => x.id === q.id);
														if (iq < 0) return;
														const opts: GenericQuestionOption[] = [
															...rows[iq].options,
														];
														const oi = opts.findIndex((x) => x.id === opt.id);
														if (oi >= 0)
															opts[oi] = {
																...opts[oi],
																score: e.target.value
																	? Number(e.target.value)
																	: null,
															};
														rows[iq] = { ...rows[iq], options: opts };
													})
												}
											/>
										) : null}
									</div>
								))}
								<Button
									type="button"
									size="sm"
									variant="outline"
									onClick={() =>
										setQuestions((rows) => {
											const i = rows.findIndex((x) => x.id === q.id);
											if (i < 0) return;
											rows[i] = {
												...rows[i],
												options: rows[i].options.concat({
													id: newClientId("opt"),
													label: "",
													score: null,
												}),
											};
										})
									}
								>
									Add option
								</Button>
							</div>
						)}
					</div>
				))}
			</section>

			<div className="sticky bottom-0 space-y-2 border-t border-border bg-background pt-4">
				<div className="flex justify-end gap-2">
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
				{!value.title.trim() ? (
					<p className="text-right text-xs text-muted-foreground">
						Add a title to enable {submitLabel}.
					</p>
				) : null}
			</div>
		</div>
	);
}
