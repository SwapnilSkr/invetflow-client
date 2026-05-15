import { Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
	emptyPsychometricAssessmentPayload,
	emptyPsychometricItem,
} from "#/components/assessments/assessment-defaults";
import { ButtonCardGroup } from "#/components/jobs/create/button-card-group";
import { newClientId } from "#/components/jobs/create/job-create-state";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Select } from "#/components/ui/select";
import { Textarea } from "#/components/ui/textarea";
import type {
	CreatePsychometricAssessmentPayload,
	PsychometricFramework,
	PsychometricItemKind,
} from "#/integrations/api/client";

type Props = {
	initial: CreatePsychometricAssessmentPayload | null;
	submitLabel?: string;
	onSubmit: (body: CreatePsychometricAssessmentPayload) => Promise<void>;
	onCancel?: () => void;
	disabled?: boolean;
};

const FRAMEWORKS: { id: PsychometricFramework; label: string; hint: string }[] =
	[
		{ id: "BigFive", label: "Big Five", hint: "OCEAN personality traits" },
		{
			id: "Disc",
			label: "DISC",
			hint: "Dominance, influence, steadiness, conscientiousness",
		},
		{
			id: "MyersBriggs",
			label: "Myers–Briggs",
			hint: "MBTI-style preferences",
		},
		{ id: "WorkValues", label: "Work values", hint: "Motivation and fit" },
		{ id: "CognitiveAbility", label: "Cognitive", hint: "Abstract reasoning" },
		{
			id: "EmotionalIntelligence",
			label: "Emotional IQ",
			hint: "EQ-oriented items",
		},
	];

export function PsychometricAssessmentForm({
	initial,
	submitLabel = "Save",
	onSubmit,
	onCancel,
	disabled,
}: Props) {
	const titleInputRef = useRef<HTMLInputElement>(null);
	const [value, setValue] = useState<CreatePsychometricAssessmentPayload>(
		() => initial ?? emptyPsychometricAssessmentPayload(),
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

	function setItems(
		updater: (rows: CreatePsychometricAssessmentPayload["items"]) => void,
	) {
		setValue((prev) => {
			const items = [...prev.items];
			updater(items);
			return {
				...prev,
				items: items.map((row, order) => ({ ...row, order })),
			};
		});
	}

	return (
		<div className="grid max-h-[min(70vh,640px)] gap-6 overflow-y-auto pr-1">
			<div className="grid gap-2">
				<Label htmlFor="pm-title">Title</Label>
				<Input
					ref={titleInputRef}
					id="pm-title"
					value={value.title}
					onChange={(e) => setValue((p) => ({ ...p, title: e.target.value }))}
				/>
			</div>
			<div className="grid gap-2">
				<Label htmlFor="pm-desc">Description</Label>
				<Textarea
					id="pm-desc"
					className="min-h-[72px]"
					value={value.description ?? ""}
					onChange={(e) =>
						setValue((p) => ({ ...p, description: e.target.value || null }))
					}
				/>
			</div>
			<div className="grid gap-2">
				<Label>Framework</Label>
				<ButtonCardGroup
					value={value.framework}
					ariaLabel="Psychometric framework"
					onChange={(id) =>
						setValue((p) => ({ ...p, framework: id as PsychometricFramework }))
					}
					options={FRAMEWORKS.map((f) => ({
						value: f.id,
						label: f.label,
						description: f.hint,
					}))}
				/>
			</div>
			<div className="grid gap-2">
				<Label htmlFor="pm-time">Time limit (minutes)</Label>
				<Input
					id="pm-time"
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

			<section className="space-y-3">
				<div className="flex items-center justify-between">
					<h4 className="text-sm font-semibold text-foreground">Questions</h4>
					<Button
						type="button"
						size="sm"
						variant="secondary"
						onClick={() =>
							setItems((rows) => {
								const q = emptyPsychometricItem();
								q.id = newClientId("pi");
								rows.push(q);
							})
						}
					>
						<Plus className="size-4" />
						Add question
					</Button>
				</div>
				{value.items.map((q) => (
					<div
						key={q.id}
						className="space-y-2 rounded-lg border border-border p-3"
					>
						<div className="flex flex-wrap gap-2">
							<Select
								value={q.kind}
								onChange={(e) =>
									setItems((rows) => {
										const i = rows.findIndex((x) => x.id === q.id);
										if (i >= 0)
											rows[i] = {
												...rows[i],
												kind: e.target.value as PsychometricItemKind,
											};
									})
								}
							>
								<option value="Likert5">Likert 1–5</option>
								<option value="Forced2">Two-choice (A/B)</option>
							</Select>
							<Button
								type="button"
								size="icon"
								variant="outline"
								onClick={() =>
									setItems((rows) => rows.filter((x) => x.id !== q.id))
								}
							>
								<Trash2 className="size-4" />
							</Button>
						</div>
						<Textarea
							value={q.prompt}
							className="min-h-[52px]"
							onChange={(e) =>
								setItems((rows) => {
									const i = rows.findIndex((x) => x.id === q.id);
									if (i >= 0) rows[i] = { ...rows[i], prompt: e.target.value };
								})
							}
						/>
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
