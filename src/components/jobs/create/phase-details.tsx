import { ArrowRight, Building2, Globe2, Loader2, Merge } from "lucide-react";
import { lazy, Suspense } from "react";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Textarea } from "#/components/ui/textarea";
import { BlueprintAiButton } from "./blueprint-ai-button";
import { ButtonCardGroup } from "./button-card-group";
import { DescriptionAiButton } from "./description-ai-button";
import { ExperienceRangeField } from "./experience-range-field";
import { FusedSalaryInput } from "./fused-salary-input";
import { mergeBlueprint } from "./job-create-state";
import { LocationsField } from "./locations-field";
import { TagInput } from "./tag-input";
import type { DraftState, DraftUpdate } from "./types";

const RichTextEditorLazy = lazy(() =>
	import("./rich-text-editor").then((m) => ({ default: m.RichTextEditor })),
);

type PhaseDetailsProps = {
	draft: DraftState;
	update: DraftUpdate;
	errors: Record<string, string>;
	setDraft: (fn: (prev: DraftState) => DraftState) => void;
	onSaveAndContinue: () => Promise<void>;
	isSaving: boolean;
};

function RichTextFallback({ value }: { value: string }) {
	return (
		<Textarea
			value={value}
			readOnly
			placeholder="Loading editor…"
			className="min-h-[160px]"
		/>
	);
}

const SENIORITY_OPTIONS: Array<{
	value: DraftState["seniority"];
	label: string;
}> = [
	{ value: "Junior", label: "Junior" },
	{ value: "Mid", label: "Mid" },
	{ value: "Senior", label: "Senior" },
	{ value: "Lead", label: "Lead" },
	{ value: "Principal", label: "Principal" },
];

const EMPLOYMENT_OPTIONS: Array<{
	value: DraftState["employmentType"];
	label: string;
}> = [
	{ value: "Full-time", label: "Full-time" },
	{ value: "Part-time", label: "Part-time" },
	{ value: "Contract", label: "Contract" },
	{ value: "Internship", label: "Internship" },
];

const WORKPLACE_OPTIONS: Array<{
	value: DraftState["workplaceType"];
	label: string;
	icon: React.ReactNode;
}> = [
	{ value: "Remote", label: "Remote", icon: <Globe2 className="size-5" /> },
	{ value: "Hybrid", label: "Hybrid", icon: <Merge className="size-5" /> },
	{ value: "Onsite", label: "Onsite", icon: <Building2 className="size-5" /> },
];

export function PhaseDetails({
	draft,
	update,
	errors,
	setDraft,
	onSaveAndContinue,
	isSaving,
}: PhaseDetailsProps) {
	function handleBlueprintApply(content: {
		job_description?: string;
		skills?: string[];
		tools?: string[];
		pipeline?: { stages: unknown[] };
	}) {
		setDraft((prev) => mergeBlueprint(prev, content));
	}

	return (
		<div className="space-y-8">
			{/* Job title */}
			<div className="space-y-3">
				<Label htmlFor="phase-title">Job title</Label>
				<Input
					id="phase-title"
					value={draft.title}
					onChange={(e) => update("title", e.target.value)}
					placeholder="Senior backend engineer"
					aria-invalid={!!errors.title}
				/>
				{errors.title ? (
					<p className="text-xs text-destructive">{errors.title}</p>
				) : null}
			</div>

			{/* Internal title */}
			<div className="space-y-3">
				<Label htmlFor="phase-job-title">Internal title</Label>
				<Input
					id="phase-job-title"
					value={draft.jobTitle}
					onChange={(e) => update("jobTitle", e.target.value)}
					placeholder="Backend Engineer - Round 1"
					aria-invalid={!!errors.jobTitle}
				/>
				{errors.jobTitle ? (
					<p className="text-xs text-destructive">{errors.jobTitle}</p>
				) : null}
			</div>

			{/* Department */}
			<div className="space-y-3">
				<Label htmlFor="phase-department">Department</Label>
				<Input
					id="phase-department"
					value={draft.department}
					onChange={(e) => update("department", e.target.value)}
					placeholder="Engineering"
				/>
			</div>

			{/* Seniority */}
			<div className="space-y-3">
				<Label>Seniority</Label>
				<ButtonCardGroup
					value={draft.seniority}
					onChange={(v) => update("seniority", v)}
					options={SENIORITY_OPTIONS}
					columns={3}
					ariaLabel="Seniority level"
				/>
			</div>

			{/* Employment type */}
			<div className="space-y-3">
				<Label>Employment type</Label>
				<ButtonCardGroup
					value={draft.employmentType}
					onChange={(v) => update("employmentType", v)}
					options={EMPLOYMENT_OPTIONS}
					columns={4}
					ariaLabel="Employment type"
				/>
			</div>

			{/* Workplace type */}
			<div className="space-y-3">
				<Label>Workplace type</Label>
				<ButtonCardGroup
					value={draft.workplaceType}
					onChange={(v) => update("workplaceType", v)}
					options={WORKPLACE_OPTIONS}
					columns={3}
					ariaLabel="Workplace type"
				/>
			</div>

			{/* Locations — only when Hybrid or Onsite */}
			{draft.workplaceType === "Hybrid" || draft.workplaceType === "Onsite" ? (
				<div className="space-y-3">
					<Label>Locations</Label>
					<LocationsField
						value={draft.locations}
						onChange={(v) => update("locations", v)}
						workplaceType={draft.workplaceType}
					/>
				</div>
			) : null}

			{/* Salary */}
			<div className="space-y-3">
				<Label>Salary</Label>
				<FusedSalaryInput
					value={draft.salary}
					onChange={(v) => update("salary", v)}
				/>
			</div>

			{/* Experience */}
			<div className="space-y-3">
				<Label>Experience (years)</Label>
				<ExperienceRangeField
					value={draft.experience}
					onChange={(v) => update("experience", v)}
				/>
			</div>

			{/* Job description */}
			<div className="space-y-3">
				<Label htmlFor="phase-jd">Job description</Label>
				<Suspense fallback={<RichTextFallback value={draft.jobDescription} />}>
					<RichTextEditorLazy
						value={draft.jobDescription}
						onChange={(v) => update("jobDescription", v)}
						placeholder="Responsibilities, expectations, team context, and role outcomes."
						toolbarExtra={
							<DescriptionAiButton
								draft={draft}
								onApply={(desc) => update("jobDescription", desc)}
							/>
						}
					/>
				</Suspense>
			</div>

			{/* Skills, tools, tags — with blueprint AI */}
			<div className="border-t border-border pt-8 space-y-6">
				<BlueprintAiButton draft={draft} onApply={handleBlueprintApply} />

				<div className="space-y-3">
					<Label>Skills</Label>
					<TagInput
						value={draft.skills}
						onChange={(v) => update("skills", v)}
						placeholder="Rust, TypeScript…"
					/>
				</div>

				<div className="space-y-3">
					<Label>Tools</Label>
					<TagInput
						value={draft.tools}
						onChange={(v) => update("tools", v)}
						placeholder="AWS, Docker…"
					/>
				</div>

				<div className="space-y-3">
					<Label>Tags</Label>
					<TagInput
						value={draft.tags}
						onChange={(v) => update("tags", v)}
						placeholder="Backend, Platform…"
					/>
				</div>
			</div>

			{/* CTA */}
			<div className="flex justify-end pt-4">
				<Button type="button" disabled={isSaving} onClick={onSaveAndContinue}>
					{isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
					Save &amp; continue
					{!isSaving ? <ArrowRight className="size-4" /> : null}
				</Button>
			</div>
		</div>
	);
}
