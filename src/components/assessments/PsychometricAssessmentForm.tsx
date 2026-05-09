import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { emptyPsychometricAssessmentPayload } from "#/components/assessments/assessment-defaults";
import { ButtonCardGroup } from "#/components/jobs/create/button-card-group";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Textarea } from "#/components/ui/textarea";
import type {
	CreatePsychometricAssessmentPayload,
	PsychometricFramework,
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
	const [value, setValue] = useState<CreatePsychometricAssessmentPayload>(
		() => initial ?? emptyPsychometricAssessmentPayload(),
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

	return (
		<div className="grid max-h-[min(70vh,520px)] gap-6 overflow-y-auto pr-1">
			<div className="grid gap-2">
				<Label htmlFor="pm-title">Title</Label>
				<Input
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
			<p className="text-sm text-muted-foreground">
				Questions are determined by the framework and shown to candidates
				automatically at runtime.
			</p>
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
