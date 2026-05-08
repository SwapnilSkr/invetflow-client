import { Card, CardContent } from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Switch } from "#/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import { TagInput } from "./tag-input";
import type { DraftState, DraftUpdate } from "./types";

type PhasePublishProps = {
	draft: DraftState;
	update: DraftUpdate;
};

// --- Visibility sub-tab ---

type VisibilityTabProps = {
	draft: DraftState;
	update: DraftUpdate;
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
		<div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
			<div>
				<Label htmlFor={id} className="text-sm font-medium">
					{label}
				</Label>
				{description ? (
					<p className="text-xs text-muted-foreground mt-0.5">{description}</p>
				) : null}
			</div>
			<Switch id={id} checked={checked} onCheckedChange={onChange} />
		</div>
	);
}

function VisibilityTab({ draft, update }: VisibilityTabProps) {
	return (
		<div className="space-y-3">
			<SwitchRow
				id="pub-public-link"
				label="Enable public invite link"
				description="Anyone with the link can apply."
				checked={draft.publicLinkEnabled}
				onChange={(v) => update("publicLinkEnabled", v)}
			/>
			<SwitchRow
				id="pub-careers-page"
				label="Show on careers page"
				description="List this role on your public careers page."
				checked={draft.careersPage}
				onChange={(v) => update("careersPage", v)}
			/>
			<div className="grid gap-2">
				<Label>External job boards</Label>
				<TagInput
					value={draft.externalBoards}
					onChange={(v) => update("externalBoards", v)}
					placeholder="LinkedIn, Indeed, Google Jobs…"
				/>
			</div>
		</div>
	);
}

// --- Application sub-tab ---

type ApplicationTabProps = {
	draft: DraftState;
	update: DraftUpdate;
};

function ApplicationTab({ draft, update }: ApplicationTabProps) {
	return (
		<div className="space-y-3">
			<SwitchRow
				id="app-resume"
				label="Require resume"
				checked={draft.requireResume}
				onChange={(v) => update("requireResume", v)}
			/>
			<SwitchRow
				id="app-phone"
				label="Require phone"
				checked={draft.requirePhone}
				onChange={(v) => update("requirePhone", v)}
			/>
			<SwitchRow
				id="app-linkedin"
				label="Require LinkedIn"
				checked={draft.requireLinkedin}
				onChange={(v) => update("requireLinkedin", v)}
			/>
			<SwitchRow
				id="app-consent"
				label="Require consent"
				description="Candidate must accept data processing consent."
				checked={draft.requireConsent}
				onChange={(v) => update("requireConsent", v)}
			/>
			<SwitchRow
				id="app-multi"
				label="Allow multiple applications"
				description="Candidate can apply again after cooldown period."
				checked={draft.allowMultipleApplications}
				onChange={(v) => update("allowMultipleApplications", v)}
			/>
			<div className="grid gap-2">
				<Label htmlFor="app-cooldown">Cooldown days</Label>
				<Input
					id="app-cooldown"
					type="number"
					value={draft.cooldownDays}
					onChange={(e) =>
						update("cooldownDays", Number(e.target.value) || 365)
					}
					className="max-w-[120px]"
				/>
			</div>
		</div>
	);
}

// --- Review sub-tab ---

type ReviewTabProps = {
	draft: DraftState;
};

function ReviewSummaryCard({
	title,
	items,
}: {
	title: string;
	items: string[];
}) {
	return (
		<div className="rounded-lg border border-border p-4">
			<h3 className="font-semibold text-foreground text-sm">{title}</h3>
			<ul className="mt-2 space-y-1 text-sm text-muted-foreground">
				{items.filter(Boolean).map((item) => (
					<li key={item}>{item}</li>
				))}
			</ul>
		</div>
	);
}

function ReviewTab({ draft }: ReviewTabProps) {
	return (
		<div className="grid gap-4 md:grid-cols-2">
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
				items={draft.pipeline.stages.map((s) => s.title)}
			/>
			<ReviewSummaryCard
				title="Voice interview"
				items={[
					`${draft.durationMinutes} minutes`,
					`${draft.passThreshold}/${draft.maxScore} pass threshold`,
					`${draft.rubric.length} rubric rows`,
					`Voice: ${draft.voiceGender}`,
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
	);
}

// --- Main export ---

export function PhasePublish({ draft, update }: PhasePublishProps) {
	return (
		<Card className="border-border">
			<CardContent className="pt-6">
				<Tabs defaultValue="visibility">
					<TabsList className="mb-4">
						<TabsTrigger value="visibility">Visibility</TabsTrigger>
						<TabsTrigger value="application">Application</TabsTrigger>
						<TabsTrigger value="review">Review</TabsTrigger>
					</TabsList>
					<TabsContent value="visibility">
						<VisibilityTab draft={draft} update={update} />
					</TabsContent>
					<TabsContent value="application">
						<ApplicationTab draft={draft} update={update} />
					</TabsContent>
					<TabsContent value="review">
						<ReviewTab draft={draft} />
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
}
