import { ArrowLeft, Check, Globe2, LayoutGrid, Lock } from "lucide-react";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Switch } from "#/components/ui/switch";
import { cn } from "#/lib/utils";
import { TagInput } from "./tag-input";
import type { DraftState, DraftUpdate } from "./types";

type PhasePublishProps = {
	draft: DraftState;
	update: DraftUpdate;
	onPublish: () => Promise<void>;
	isSaving: boolean;
	canPublish: boolean;
	onBack: () => void;
};

function SwitchRow({
	id,
	label,
	description,
	checked,
	onChange,
}: {
	id: string;
	label: string;
	description?: string;
	checked: boolean;
	onChange: (v: boolean) => void;
}) {
	return (
		<div className="flex items-center justify-between px-4 py-3.5">
			<div>
				<Label htmlFor={id} className="text-sm font-medium">
					{label}
				</Label>
				{description ? (
					<p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
				) : null}
			</div>
			<Switch id={id} checked={checked} onCheckedChange={onChange} />
		</div>
	);
}

function ReviewSummaryCard({
	title,
	items,
}: {
	title: string;
	items: string[];
}) {
	return (
		<div className="rounded-lg border border-border p-4">
			<h3 className="text-sm font-semibold text-foreground">{title}</h3>
			<ul className="mt-2 space-y-1 text-sm text-muted-foreground">
				{items.filter(Boolean).map((item) => (
					<li key={item}>{item}</li>
				))}
			</ul>
		</div>
	);
}

export function PhasePublish({
	draft,
	update,
	onPublish,
	isSaving,
	canPublish,
	onBack,
}: PhasePublishProps) {
	const visibilityValue = draft.publicLinkEnabled ? "Public" : "Private";

	return (
		<div className="space-y-4">
			{/* Section 1: Job visibility */}
			<div className="space-y-3">
				<Label>Job visibility</Label>
				<div className="grid grid-cols-2 gap-3">
					{(
						[
							{
								value: "Public",
								label: "Public",
								description: "Anyone with the link can apply",
								icon: <Globe2 className="size-5 text-muted-foreground" />,
							},
							{
								value: "Private",
								label: "Private",
								description: "Only invited candidates can apply",
								icon: <Lock className="size-5 text-muted-foreground" />,
							},
						] as const
					).map((opt) => {
						const selected = visibilityValue === opt.value;
						return (
							<button
								key={opt.value}
								type="button"
								aria-pressed={selected}
								onClick={() =>
									update("publicLinkEnabled", opt.value === "Public")
								}
								className={cn(
									"relative flex cursor-pointer flex-col items-start rounded-lg border bg-muted/40 px-4 py-3.5 text-left transition-all",
									selected
										? "border-primary bg-primary/5"
										: "border-border hover:border-input/80 hover:bg-muted",
								)}
							>
								<span className="mb-1.5">{opt.icon}</span>
								<span className="text-sm font-medium text-foreground">
									{opt.label}
								</span>
								<span className="mt-0.5 text-xs text-muted-foreground">
									{opt.description}
								</span>
								{selected ? (
									<span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
										<Check className="size-3" />
									</span>
								) : null}
							</button>
						);
					})}
				</div>
			</div>

			{/* Section 2: Distribution */}
			<div className="rounded-lg border border-border">
				<div className="border-b border-border px-4 py-3">
					<h3 className="text-sm font-semibold text-foreground">
						Job distribution
					</h3>
					<p className="mt-0.5 text-xs text-muted-foreground">
						Where this job appears.
					</p>
				</div>
				<div className="grid gap-3 p-4 sm:grid-cols-2">
					{/* Careers page toggle card */}
					<button
						type="button"
						onClick={() => update("careersPage", !draft.careersPage)}
						className={cn(
							"relative flex flex-col gap-1 rounded-lg border p-4 text-left transition-all",
							draft.careersPage
								? "border-primary bg-primary/5"
								: "border-border bg-muted/40 hover:bg-muted",
						)}
					>
						<LayoutGrid className="size-5 text-muted-foreground" />
						<span className="text-sm font-medium text-foreground">
							Careers page
						</span>
						<span className="text-xs text-muted-foreground">
							List on your public careers page
						</span>
						{draft.careersPage ? (
							<span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
								<Check className="size-3" />
							</span>
						) : null}
					</button>

					{/* External boards */}
					<div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/40 p-4">
						<Label className="text-sm font-medium text-foreground">
							External job boards
						</Label>
						<TagInput
							value={draft.externalBoards}
							onChange={(v) => update("externalBoards", v)}
							placeholder="LinkedIn, Indeed, Google Jobs…"
						/>
					</div>
				</div>
			</div>

			{/* Section 3: Application requirements */}
			<div className="rounded-lg border border-border">
				<div className="border-b border-border px-4 py-3">
					<h3 className="text-sm font-semibold text-foreground">
						Application requirements
					</h3>
					<p className="mt-0.5 text-xs text-muted-foreground">
						What candidates must provide to apply.
					</p>
				</div>
				<div className="divide-y divide-border">
					<SwitchRow
						id="app-resume"
						label="Resume"
						description="Require resume upload"
						checked={draft.requireResume}
						onChange={(v) => update("requireResume", v)}
					/>
					<SwitchRow
						id="app-phone"
						label="Phone"
						description="Require phone number"
						checked={draft.requirePhone}
						onChange={(v) => update("requirePhone", v)}
					/>
					<SwitchRow
						id="app-linkedin"
						label="LinkedIn"
						description="Require LinkedIn URL"
						checked={draft.requireLinkedin}
						onChange={(v) => update("requireLinkedin", v)}
					/>
					<SwitchRow
						id="app-consent"
						label="Consent"
						description="Require data processing consent"
						checked={draft.requireConsent}
						onChange={(v) => update("requireConsent", v)}
					/>
					<SwitchRow
						id="app-multi"
						label="Allow multiple applications"
						description="Candidates can re-apply after cooldown"
						checked={draft.allowMultipleApplications}
						onChange={(v) => update("allowMultipleApplications", v)}
					/>
					<div className="flex items-center justify-between px-4 py-3.5">
						<div>
							<Label htmlFor="app-cooldown" className="text-sm font-medium">
								Cooldown days
							</Label>
						</div>
						<Input
							id="app-cooldown"
							type="number"
							value={draft.cooldownDays}
							onChange={(e) =>
								update("cooldownDays", Number(e.target.value) || 365)
							}
							className="max-w-[100px]"
						/>
					</div>
				</div>
			</div>

			{/* Section 4: Review */}
			<div className="rounded-lg border border-border">
				<div className="border-b border-border px-4 py-3">
					<h3 className="text-sm font-semibold text-foreground">Review</h3>
					<p className="mt-0.5 text-xs text-muted-foreground">
						Confirm details before publishing.
					</p>
				</div>
				<div className="grid gap-3 p-4 md:grid-cols-2">
					<ReviewSummaryCard
						title="Posting"
						items={[
							draft.title,
							draft.jobTitle,
							draft.department,
							draft.seniority,
							draft.employmentType,
							draft.workplaceType,
							draft.locations.map((l) => l.label).join(", "),
						]}
					/>
					<ReviewSummaryCard
						title="Skills & experience"
						items={[
							draft.skills.length ? `Skills: ${draft.skills.join(", ")}` : "",
							draft.tools.length ? `Tools: ${draft.tools.join(", ")}` : "",
							draft.experience
								? `${draft.experience.min_years ?? 0}–${draft.experience.max_years ?? "∞"} years`
								: "",
						]}
					/>
					<ReviewSummaryCard
						title="Pipeline"
						items={draft.pipeline.stages.map((s) =>
							[s.stage_type, s.title].filter(Boolean).join(" — "),
						)}
					/>
					<ReviewSummaryCard
						title="Assessment links"
						items={[
							`${draft.pipeline.stages.filter((s) => s.voice_assessment_id).length} voice`,
							`${draft.pipeline.stages.filter((s) => s.generic_assessment_id).length} generic`,
							`${draft.pipeline.stages.filter((s) => s.coding_assessment_id).length} coding`,
							`${draft.pipeline.stages.filter((s) => s.psychometric_assessment_id).length} psychometric`,
							`${draft.pipeline.stages.filter((s) => s.prescreening_form_id).length} prescreening`,
						]}
					/>
					<ReviewSummaryCard
						title="Visibility"
						items={[
							draft.publicLinkEnabled ? "Public link enabled" : "Link disabled",
							draft.careersPage ? "On careers page" : "Not on careers page",
							draft.externalBoards.length
								? `Boards: ${draft.externalBoards.join(", ")}`
								: "No external boards",
						]}
					/>
					<ReviewSummaryCard
						title="Application"
						items={[
							draft.requireResume ? "Resume required" : "Resume optional",
							draft.requirePhone ? "Phone required" : "Phone optional",
							draft.requireLinkedin ? "LinkedIn required" : "LinkedIn optional",
							draft.requireConsent ? "Consent required" : "",
							draft.allowMultipleApplications
								? `Multiple applications allowed (${draft.cooldownDays}d cooldown)`
								: "Single application only",
						]}
					/>
				</div>
			</div>

			{/* CTA row */}
			<div className="flex items-center justify-between pt-2">
				<Button type="button" variant="ghost" onClick={onBack}>
					<ArrowLeft className="size-4" />
					Back
				</Button>
				<Button
					type="button"
					disabled={isSaving || !canPublish}
					onClick={onPublish}
				>
					{isSaving ? (
						<span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
					) : (
						<Check className="size-4" />
					)}
					Publish job
				</Button>
			</div>
		</div>
	);
}
