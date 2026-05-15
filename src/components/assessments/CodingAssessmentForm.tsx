import { Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { emptyCodingAssessmentPayload } from "#/components/assessments/assessment-defaults";
import { newClientId } from "#/components/jobs/create/job-create-state";
import { TagInput } from "#/components/jobs/create/tag-input";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Select } from "#/components/ui/select";
import { Textarea } from "#/components/ui/textarea";
import type { CreateCodingAssessmentPayload } from "#/integrations/api/client";

type Props = {
	initial: CreateCodingAssessmentPayload | null;
	submitLabel?: string;
	onSubmit: (body: CreateCodingAssessmentPayload) => Promise<void>;
	onCancel?: () => void;
	disabled?: boolean;
};

export function CodingAssessmentForm({
	initial,
	submitLabel = "Save",
	onSubmit,
	onCancel,
	disabled,
}: Props) {
	const titleInputRef = useRef<HTMLInputElement>(null);
	const [value, setValue] = useState<CreateCodingAssessmentPayload>(
		() => initial ?? emptyCodingAssessmentPayload(),
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

	function setProblems(
		updater: (p: CreateCodingAssessmentPayload["problems"]) => void,
	) {
		setValue((prev) => {
			const problems = [...prev.problems];
			updater(problems);
			return {
				...prev,
				problems: problems.map((row, order) => ({ ...row, order })),
			};
		});
	}

	return (
		<div className="grid max-h-[min(70vh,640px)] gap-6 overflow-y-auto pr-1">
			<div className="grid gap-4 md:grid-cols-2">
				<div className="grid gap-2 md:col-span-2">
					<Label>Title</Label>
					<Input
						ref={titleInputRef}
						value={value.title}
						onChange={(e) => setValue((p) => ({ ...p, title: e.target.value }))}
					/>
				</div>
				<div className="grid gap-2 md:col-span-2">
					<Label>Description (markdown)</Label>
					<Textarea
						className="min-h-[80px]"
						value={value.description ?? ""}
						onChange={(e) =>
							setValue((p) => ({ ...p, description: e.target.value || null }))
						}
					/>
				</div>
				<div className="grid gap-2">
					<Label>Time limit (min)</Label>
					<Input
						type="number"
						value={value.time_limit_minutes ?? ""}
						onChange={(e) =>
							setValue((p) => ({
								...p,
								time_limit_minutes: e.target.value
									? Number(e.target.value)
									: null,
							}))
						}
					/>
				</div>
				<div className="grid gap-2">
					<Label>Pass # problems</Label>
					<Input
						type="number"
						value={value.pass_completion_number}
						onChange={(e) =>
							setValue((p) => ({
								...p,
								pass_completion_number: Number(e.target.value) || 0,
							}))
						}
					/>
				</div>
				<div className="grid gap-2 md:col-span-2">
					<Label>Allowed languages</Label>
					<TagInput
						value={value.allowed_languages}
						onChange={(v) => setValue((p) => ({ ...p, allowed_languages: v }))}
						placeholder="typescript, python…"
					/>
				</div>
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
						<option value="PerQuestion">Per problem</option>
					</Select>
				</div>
			</div>

			<section className="space-y-3">
				<div className="flex items-center justify-between">
					<h4 className="text-sm font-semibold text-foreground">Problems</h4>
					<Button
						type="button"
						size="sm"
						variant="secondary"
						onClick={() =>
							setProblems((rows) =>
								rows.concat({
									id: newClientId("prob"),
									title: `Problem ${rows.length + 1}`,
									description: "",
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
									order: rows.length,
								}),
							)
						}
					>
						<Plus className="size-4" />
						Add problem
					</Button>
				</div>
				{value.problems.map((prob) => (
					<div
						key={prob.id}
						className="space-y-2 rounded-lg border border-border p-3"
					>
						<div className="flex flex-wrap gap-2">
							<Input
								className="min-w-[160px] flex-1"
								value={prob.title}
								onChange={(e) =>
									setProblems((rows) => {
										const i = rows.findIndex((x) => x.id === prob.id);
										if (i >= 0) rows[i] = { ...rows[i], title: e.target.value };
									})
								}
							/>
							<Select
								value={prob.difficulty}
								onChange={(e) =>
									setProblems((rows) => {
										const i = rows.findIndex((x) => x.id === prob.id);
										if (i >= 0)
											rows[i] = {
												...rows[i],
												difficulty: e.target.value as typeof prob.difficulty,
											};
									})
								}
							>
								<option value="Easy">Easy</option>
								<option value="Medium">Medium</option>
								<option value="Hard">Hard</option>
							</Select>
							<Button
								type="button"
								size="icon"
								variant="outline"
								onClick={() =>
									setProblems((rows) => rows.filter((x) => x.id !== prob.id))
								}
							>
								<Trash2 className="size-4" />
							</Button>
						</div>
						<Textarea
							className="min-h-[72px]"
							value={prob.description}
							onChange={(e) =>
								setProblems((rows) => {
									const i = rows.findIndex((x) => x.id === prob.id);
									if (i >= 0)
										rows[i] = { ...rows[i], description: e.target.value };
								})
							}
						/>
						<Textarea
							className="min-h-[60px] font-mono text-xs"
							placeholder="Starter code"
							value={prob.starter_code ?? ""}
							onChange={(e) =>
								setProblems((rows) => {
									const i = rows.findIndex((x) => x.id === prob.id);
									if (i >= 0)
										rows[i] = {
											...rows[i],
											starter_code: e.target.value || null,
										};
								})
							}
						/>
						<div className="text-xs font-medium text-muted-foreground">
							Test cases
						</div>
						{prob.test_cases.map((tc) => (
							<div key={tc.id} className="grid gap-2 md:grid-cols-2">
								<Input
									placeholder="Input"
									value={tc.input}
									onChange={(e) =>
										setProblems((rows) => {
											const pi = rows.findIndex((x) => x.id === prob.id);
											if (pi < 0) return;
											const tcs = [...rows[pi].test_cases];
											const ti = tcs.findIndex((x) => x.id === tc.id);
											if (ti >= 0)
												tcs[ti] = { ...tcs[ti], input: e.target.value };
											rows[pi] = { ...rows[pi], test_cases: tcs };
										})
									}
								/>
								<Input
									placeholder="Expected output"
									value={tc.expected_output}
									onChange={(e) =>
										setProblems((rows) => {
											const pi = rows.findIndex((x) => x.id === prob.id);
											if (pi < 0) return;
											const tcs = [...rows[pi].test_cases];
											const ti = tcs.findIndex((x) => x.id === tc.id);
											if (ti >= 0)
												tcs[ti] = {
													...tcs[ti],
													expected_output: e.target.value,
												};
											rows[pi] = { ...rows[pi], test_cases: tcs };
										})
									}
								/>
								<label className="flex items-center gap-2 text-xs md:col-span-2">
									<input
										type="checkbox"
										checked={tc.is_hidden}
										onChange={(e) =>
											setProblems((rows) => {
												const pi = rows.findIndex((x) => x.id === prob.id);
												if (pi < 0) return;
												const tcs = [...rows[pi].test_cases];
												const ti = tcs.findIndex((x) => x.id === tc.id);
												if (ti >= 0)
													tcs[ti] = {
														...tcs[ti],
														is_hidden: e.target.checked,
													};
												rows[pi] = { ...rows[pi], test_cases: tcs };
											})
										}
									/>
									Hidden
								</label>
							</div>
						))}
						<Button
							type="button"
							size="sm"
							variant="outline"
							onClick={() =>
								setProblems((rows) => {
									const i = rows.findIndex((x) => x.id === prob.id);
									if (i < 0) return;
									rows[i] = {
										...rows[i],
										test_cases: rows[i].test_cases.concat({
											id: newClientId("tc"),
											input: "",
											expected_output: "",
											is_hidden: false,
										}),
									};
								})
							}
						>
							Add test case
						</Button>
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
