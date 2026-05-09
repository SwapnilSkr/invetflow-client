import { Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { emptyPrescreeningPayload } from "#/components/assessments/assessment-defaults";
import { newClientId } from "#/components/jobs/create/job-create-state";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Select } from "#/components/ui/select";
import { Textarea } from "#/components/ui/textarea";
import type {
	CreatePrescreeningFormPayload,
	PrescreeningKnockoutRule,
} from "#/integrations/api/client";

type Props = {
	initial: CreatePrescreeningFormPayload | null;
	submitLabel?: string;
	onSubmit: (body: CreatePrescreeningFormPayload) => Promise<void>;
	onCancel?: () => void;
	disabled?: boolean;
};

const KNOCKOUT_OPS = ["equals", "not_equals", "gt", "gte", "lt", "lte"];

export function PrescreeningFormComponent({
	initial,
	submitLabel = "Save",
	onSubmit,
	onCancel,
	disabled,
}: Props) {
	const [value, setValue] = useState<CreatePrescreeningFormPayload>(
		() => initial ?? emptyPrescreeningPayload(),
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

	function setQuestions(
		updater: (rows: CreatePrescreeningFormPayload["questions"]) => void,
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

	return (
		<div className="grid max-h-[min(70vh,640px)] gap-6 overflow-y-auto pr-1">
			<div className="grid gap-2">
				<Label htmlFor="pf-name">Name</Label>
				<Input
					id="pf-name"
					value={value.name}
					onChange={(e) => setValue((p) => ({ ...p, name: e.target.value }))}
				/>
			</div>

			<div className="grid gap-3 rounded-lg border border-border p-3">
				<p className="text-sm font-medium text-foreground">Collect</p>
				<div className="grid gap-2 sm:grid-cols-2">
					{(
						[
							["collect_resume", "is_resume_mandatory", "Resume"],
							["collect_phone", "is_phone_mandatory", "Phone"],
							["collect_linkedin", "is_linkedin_mandatory", "LinkedIn"],
						] as const
					).map(([c, m, label]) => (
						<div key={c} className="flex flex-col gap-1">
							<label className="flex items-center gap-2 text-sm">
								<input
									type="checkbox"
									checked={value[c]}
									onChange={(e) =>
										setValue((p) => ({ ...p, [c]: e.target.checked }))
									}
								/>
								{label}
							</label>
							<label className="ml-6 flex items-center gap-2 text-xs text-muted-foreground">
								<input
									type="checkbox"
									checked={value[m]}
									onChange={(e) =>
										setValue((p) => ({ ...p, [m]: e.target.checked }))
									}
								/>
								Required
							</label>
						</div>
					))}
				</div>
			</div>

			<div className="grid gap-3 rounded-lg border border-border p-3">
				<label className="flex items-center gap-2 text-sm font-medium">
					<input
						type="checkbox"
						checked={value.auto_reject}
						onChange={(e) =>
							setValue((p) => ({ ...p, auto_reject: e.target.checked }))
						}
					/>
					Auto-reject below threshold
				</label>
				<Input
					type="number"
					placeholder="Min total score"
					value={value.min_total_score ?? ""}
					disabled={!value.auto_reject}
					onChange={(e) =>
						setValue((p) => ({
							...p,
							min_total_score: e.target.value ? Number(e.target.value) : null,
						}))
					}
				/>
				<Textarea
					placeholder="Confirmation message"
					value={value.confirmation_message ?? ""}
					onChange={(e) =>
						setValue((p) => ({
							...p,
							confirmation_message: e.target.value || null,
						}))
					}
				/>
				<Textarea
					placeholder="Knockout message"
					value={value.knockout_message ?? ""}
					onChange={(e) =>
						setValue((p) => ({
							...p,
							knockout_message: e.target.value || null,
						}))
					}
				/>
			</div>

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
									id: newClientId("pq"),
									question: "",
									question_type: "Text",
									is_required: false,
									is_knockout: false,
									order: rows.length,
									placeholder: null,
									options: [],
									knockout_rule: null,
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
						<div className="flex flex-wrap gap-2">
							<Input
								className="min-w-[140px] flex-1"
								placeholder="Question"
								value={q.question}
								onChange={(e) =>
									setQuestions((rows) => {
										const i = rows.findIndex((x) => x.id === q.id);
										if (i >= 0)
											rows[i] = { ...rows[i], question: e.target.value };
									})
								}
							/>
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
								<option value="Text">Text</option>
								<option value="Boolean">Boolean</option>
								<option value="Numeric">Numeric</option>
								<option value="Date">Date</option>
								<option value="Dropdown">Dropdown</option>
								<option value="MultiSelect">Multi select</option>
								<option value="WeightedMcq">Weighted MCQ</option>
								<option value="FileUpload">File upload</option>
							</Select>
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
						<label className="flex items-center gap-2 text-xs">
							<input
								type="checkbox"
								checked={q.is_required}
								onChange={(e) =>
									setQuestions((rows) => {
										const i = rows.findIndex((x) => x.id === q.id);
										if (i >= 0)
											rows[i] = { ...rows[i], is_required: e.target.checked };
									})
								}
							/>
							Required
						</label>
						<label className="flex items-center gap-2 text-xs">
							<input
								type="checkbox"
								checked={q.is_knockout}
								onChange={(e) =>
									setQuestions((rows) => {
										const i = rows.findIndex((x) => x.id === q.id);
										if (i >= 0)
											rows[i] = { ...rows[i], is_knockout: e.target.checked };
									})
								}
							/>
							Knockout
						</label>
						{q.is_knockout ? (
							<KnockoutRuleEditor
								rule={q.knockout_rule}
								onChange={(rule) =>
									setQuestions((rows) => {
										const i = rows.findIndex((x) => x.id === q.id);
										if (i >= 0) rows[i] = { ...rows[i], knockout_rule: rule };
									})
								}
							/>
						) : null}
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
					disabled={disabled ?? (busy || !value.name.trim())}
					onClick={() => void submit()}
				>
					{busy ? <Loader2 className="size-4 animate-spin" /> : null}
					{submitLabel}
				</Button>
			</div>
		</div>
	);
}

function KnockoutRuleEditor({
	rule,
	onChange,
}: {
	rule: PrescreeningKnockoutRule | null;
	onChange: (r: PrescreeningKnockoutRule | null) => void;
}) {
	const operator = rule?.operator ?? "equals";
	const valRaw =
		rule?.value === undefined || rule?.value === null
			? ""
			: typeof rule.value === "string"
				? rule.value
				: JSON.stringify(rule.value);

	return (
		<div className="grid gap-2 rounded-md bg-muted/40 p-2">
			<Label className="text-xs">Knockout rule</Label>
			<div className="flex flex-wrap gap-2">
				<Select
					value={operator}
					onChange={(e) =>
						onChange({
							operator: e.target.value,
							value: coerceValue(operator, valRaw),
						})
					}
				>
					{KNOCKOUT_OPS.map((op) => (
						<option key={op} value={op}>
							{op}
						</option>
					))}
				</Select>
				<Input
					className="min-w-[120px]"
					placeholder='Value ("true", number, ISO date)'
					value={valRaw}
					onChange={(e) =>
						onChange({
							operator,
							value: coerceValue(operator, e.target.value),
						})
					}
				/>
				<Button
					type="button"
					size="sm"
					variant="ghost"
					onClick={() => onChange(null)}
				>
					Clear
				</Button>
			</div>
		</div>
	);
}

function coerceValue(operator: string, raw: string): unknown {
	const t = raw.trim();
	if (t === "true") return true;
	if (t === "false") return false;
	const n = Number(t);
	if (t !== "" && !Number.isNaN(n)) return n;
	if (
		operator.includes("lte") ||
		operator.includes("gte") ||
		raw.includes("-")
	) {
		const d = Date.parse(raw);
		if (!Number.isNaN(d)) return raw;
	}
	return raw || null;
}
