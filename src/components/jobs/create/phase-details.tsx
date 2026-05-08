import { lazy, Suspense } from "react";
import { Card, CardContent } from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Select } from "#/components/ui/select";
import { Textarea } from "#/components/ui/textarea";
import { AiGeneratePopover } from "./ai-generate-popover";
import { ExperienceRangeField } from "./experience-range-field";
import { mergeBlueprint } from "./job-create-state";
import { LocationsField } from "./locations-field";
import { SalaryRangeField } from "./salary-range-field";
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

export function PhaseDetails({
	draft,
	update,
	errors,
	setDraft,
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
		<Card className="border-border">
			<CardContent className="space-y-6 pt-6">
				{/* AI Blueprint */}
				<div className="flex justify-end">
					<AiGeneratePopover draft={draft} onApply={handleBlueprintApply} />
				</div>

				{/* Row 1: title + jobTitle */}
				<div className="grid gap-4 md:grid-cols-2">
					<div className="grid gap-2">
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
					<div className="grid gap-2">
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
				</div>

				{/* Row 2: department + seniority + employmentType */}
				<div className="grid gap-4 md:grid-cols-3">
					<div className="grid gap-2">
						<Label htmlFor="phase-department">Department</Label>
						<Input
							id="phase-department"
							value={draft.department}
							onChange={(e) => update("department", e.target.value)}
							placeholder="Engineering"
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="phase-seniority">Seniority</Label>
						<Select
							id="phase-seniority"
							value={draft.seniority}
							onChange={(e) =>
								update("seniority", e.target.value as DraftState["seniority"])
							}
						>
							<option value="">Select…</option>
							<option value="Junior">Junior</option>
							<option value="Mid">Mid</option>
							<option value="Senior">Senior</option>
							<option value="Lead">Lead</option>
							<option value="Principal">Principal</option>
						</Select>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="phase-employment-type">Employment type</Label>
						<Select
							id="phase-employment-type"
							value={draft.employmentType}
							onChange={(e) =>
								update(
									"employmentType",
									e.target.value as DraftState["employmentType"],
								)
							}
						>
							<option value="">Select…</option>
							<option value="Full-time">Full-time</option>
							<option value="Part-time">Part-time</option>
							<option value="Contract">Contract</option>
							<option value="Internship">Internship</option>
						</Select>
					</div>
				</div>

				{/* Row 3: workplaceType + locations */}
				<div className="grid gap-4 md:grid-cols-2">
					<div className="grid gap-2">
						<Label htmlFor="phase-workplace">Workplace type</Label>
						<Select
							id="phase-workplace"
							value={draft.workplaceType}
							onChange={(e) =>
								update(
									"workplaceType",
									e.target.value as DraftState["workplaceType"],
								)
							}
						>
							<option value="">Select…</option>
							<option value="Remote">Remote</option>
							<option value="Hybrid">Hybrid</option>
							<option value="Onsite">Onsite</option>
						</Select>
					</div>
					{draft.workplaceType !== "Remote" ? (
						<div className="grid gap-2">
							<Label>Locations</Label>
							<LocationsField
								value={draft.locations}
								onChange={(v) => update("locations", v)}
								workplaceType={draft.workplaceType}
							/>
						</div>
					) : null}
				</div>

				{/* Row 4: salary */}
				<div className="grid gap-2">
					<Label>Salary range</Label>
					<SalaryRangeField
						value={draft.salary}
						onChange={(v) => update("salary", v)}
					/>
				</div>

				{/* Row 5: skills + tools + tags */}
				<div className="grid gap-4 md:grid-cols-3">
					<div className="grid gap-2">
						<Label>Skills</Label>
						<TagInput
							value={draft.skills}
							onChange={(v) => update("skills", v)}
							placeholder="Rust, TypeScript…"
						/>
					</div>
					<div className="grid gap-2">
						<Label>Tools</Label>
						<TagInput
							value={draft.tools}
							onChange={(v) => update("tools", v)}
							placeholder="AWS, Docker…"
						/>
					</div>
					<div className="grid gap-2">
						<Label>Tags</Label>
						<TagInput
							value={draft.tags}
							onChange={(v) => update("tags", v)}
							placeholder="Backend, Platform…"
						/>
					</div>
				</div>

				{/* Row 6: experience */}
				<div className="grid gap-2">
					<Label>Experience range (years)</Label>
					<ExperienceRangeField
						value={draft.experience}
						onChange={(v) => update("experience", v)}
					/>
				</div>

				{/* Row 7: job description */}
				<div className="grid gap-2">
					<Label htmlFor="phase-jd">Job description</Label>
					<Suspense
						fallback={<RichTextFallback value={draft.jobDescription} />}
					>
						<RichTextEditorLazy
							value={draft.jobDescription}
							onChange={(v) => update("jobDescription", v)}
							placeholder="Responsibilities, expectations, team context, and role outcomes."
						/>
					</Suspense>
				</div>
			</CardContent>
		</Card>
	);
}
