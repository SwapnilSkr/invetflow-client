import {
	AlertTriangle,
	ArrowLeft,
	CheckCircle2,
	Clock,
	Globe2,
	LayoutGrid,
	Loader2,
	Play,
	ShieldAlert,
	User,
	Users,
	Video,
	XCircle,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "#/components/ui/button";
import { useDebouncedValue } from "#/hooks/use-debounced-value";
import type {
	LaunchPreviewFinding,
	LaunchPreviewResponse,
	LaunchPreviewSeverity,
	LaunchPreviewStageSummary,
	StageType,
} from "#/integrations/api/client";
import { useAnalyzeJobLaunchPreview } from "#/integrations/api/queries";
import { candidateOrigin } from "#/lib/candidate-url";
import { buildCreatePayload } from "./job-create-state";
import type { DraftState } from "./types";

const CANDIDATE_APP_URL = candidateOrigin();
const CANDIDATE_APP_ORIGIN = (() => {
	try {
		return new URL(CANDIDATE_APP_URL).origin;
	} catch {
		return CANDIDATE_APP_URL;
	}
})();

type TabKey = "workflow" | "candidate" | "hiring-team" | "launch-check";

const TAB_LABELS: { key: TabKey; label: string }[] = [
	{ key: "workflow", label: "Workflow" },
	{ key: "candidate", label: "Candidate" },
	{ key: "hiring-team", label: "Hiring team" },
	{ key: "launch-check", label: "Launch check" },
];

const ESTIMATED_MINUTES: Record<StageType, number> = {
	Applied: 0,
	Prescreening: 5,
	VoiceInterview: 20,
	GenericAssessment: 15,
	CodingAssessment: 45,
	PsychometricAssessment: 12,
	Consent: 2,
	HumanInterview: 30,
	ManualReview: 0,
	Offer: 0,
	Hired: 0,
	Rejected: 0,
};

function candidateMinutesForStage(stage: {
	stage_type: StageType;
	candidate_facing: boolean;
}): number {
	const base = ESTIMATED_MINUTES[stage.stage_type] ?? 0;
	if (base > 0) return base;
	return stage.candidate_facing ? 2 : 0;
}

/** Non-authoritative fallback for skeleton/initial render before the first server response. */
function fallbackStageSummaries(
	draft: DraftState,
): LaunchPreviewStageSummary[] {
	return draft.pipeline.stages.map((s) => ({
		stage_id: s.id,
		title: s.title ?? s.stage_type,
		stage_type: s.stage_type,
		candidate_facing: s.candidate_facing,
		automation: s.automation,
		linked_assessment: !!(
			s.voice_assessment_id ??
			s.generic_assessment_id ??
			s.coding_assessment_id ??
			s.psychometric_assessment_id ??
			s.prescreening_form_id
		),
		contributes_to_score: s.contributes_to_score,
		estimated_minutes: candidateMinutesForStage(s),
	}));
}

function SeverityIcon({ severity }: { severity: LaunchPreviewSeverity }) {
	if (severity === "blocker")
		return <XCircle className="size-5 shrink-0 text-destructive" />;
	if (severity === "warning")
		return <AlertTriangle className="size-5 shrink-0 text-amber-500" />;
	return <CheckCircle2 className="size-5 shrink-0 text-emerald-500" />;
}

function FindingCard({ finding }: { finding: LaunchPreviewFinding }) {
	return (
		<div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-3">
			<SeverityIcon severity={finding.severity} />
			<div>
				<p className="text-sm font-medium text-foreground">{finding.title}</p>
				<p className="text-xs text-muted-foreground">{finding.detail}</p>
			</div>
		</div>
	);
}

function WorkflowCanvas({
	stageSummaries,
	draftStages,
}: {
	stageSummaries: LaunchPreviewStageSummary[];
	draftStages: DraftState["pipeline"]["stages"];
}) {
	return (
		<div className="space-y-3">
			{stageSummaries.length === 0 ? (
				<p className="text-sm text-muted-foreground">No stages defined yet.</p>
			) : (
				<ol className="space-y-2">
					{stageSummaries.map((s, idx) => {
						const draftStage = draftStages.find((ds) => ds.id === s.stage_id);
						return (
							<li
								key={s.stage_id}
								className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3"
							>
								<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
									{idx + 1}
								</span>
								<div className="min-w-0 flex-1">
									<p className="text-sm font-medium text-foreground">
										{s.title}
									</p>
									<p className="text-xs text-muted-foreground">
										{s.stage_type}
										{s.candidate_facing ? " · Candidate-facing" : " · Internal"}
										{s.linked_assessment ? " · Linked" : ""}
										{s.contributes_to_score ? " · Scored" : ""}
										{s.automation !== "None" ? ` · ${s.automation}` : ""}
										{s.estimated_minutes > 0
											? ` · ~${s.estimated_minutes} min`
											: ""}
									</p>
									{draftStage?.stage_type === "HumanInterview" &&
									draftStage.human_interview_config ? (
										<p className="mt-1 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
											<Video className="size-3" />
											{draftStage.human_interview_config.max_duration_minutes}{" "}
											min · recording{" "}
											{draftStage.human_interview_config.recording_enabled
												? "on"
												: "off"}
											· transcript{" "}
											{draftStage.human_interview_config.transcription_enabled
												? "on"
												: "off"}
											· waiting room{" "}
											{draftStage.human_interview_config.waiting_room_enabled
												? "on"
												: "off"}
										</p>
									) : null}
								</div>
							</li>
						);
					})}
				</ol>
			)}
		</div>
	);
}

function CandidatePreview({
	draft,
	analysis,
}: {
	draft: DraftState;
	analysis: LaunchPreviewResponse | null;
}) {
	const iframeRef = useRef<HTMLIFrameElement>(null);

	const sendPreviewMessage = useCallback(() => {
		const iframe = iframeRef.current;
		if (!iframe?.contentWindow) return;

		const payload = buildCreatePayload(draft, { publishOnCreate: false });
		const message: {
			type: string;
			payload: {
				job: ReturnType<typeof buildCreatePayload>;
				analysis?: LaunchPreviewResponse;
			};
		} = {
			type: "invetflow.jobLaunchPreview.v1",
			payload: { job: payload },
		};
		if (analysis) {
			message.payload.analysis = analysis;
		}
		iframe.contentWindow.postMessage(message, CANDIDATE_APP_ORIGIN);
	}, [draft, analysis]);

	useEffect(() => {
		sendPreviewMessage();
	}, [sendPreviewMessage]);

	return (
		<div className="space-y-3">
			<p className="text-sm text-muted-foreground">
				This is a live preview of what candidates will see.
			</p>
			<div className="overflow-hidden rounded-lg border border-border">
				<iframe
					ref={iframeRef}
					src={`${CANDIDATE_APP_URL}/preview/job-launch`}
					title="Candidate preview"
					className="h-[600px] w-full"
					sandbox="allow-scripts"
					onLoad={sendPreviewMessage}
				/>
			</div>
		</div>
	);
}

function HiringTeamSummary({
	stageSummaries,
	automationPercent,
}: {
	stageSummaries: LaunchPreviewStageSummary[];
	automationPercent: number;
}) {
	const manualStages = stageSummaries.filter(
		(s) => !s.candidate_facing && s.stage_type !== "Applied",
	);
	const automatedActions = stageSummaries.filter(
		(s) => s.automation !== "None",
	);

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
				<MetricCard
					icon={<Users className="size-4 text-primary" />}
					label="Internal stages"
					value={String(manualStages.length)}
				/>
				<MetricCard
					icon={<Play className="size-4 text-primary" />}
					label="Automated actions"
					value={String(automatedActions.length)}
				/>
				<MetricCard
					icon={<Globe2 className="size-4 text-primary" />}
					label="Automation coverage"
					value={`${automationPercent}%`}
				/>
				<MetricCard
					icon={<LayoutGrid className="size-4 text-primary" />}
					label="Total stages"
					value={String(stageSummaries.length)}
				/>
			</div>

			{manualStages.length > 0 ? (
				<div className="rounded-lg border border-border">
					<div className="border-b border-border px-4 py-3">
						<h3 className="text-sm font-semibold text-foreground">
							Recruiter touchpoints
						</h3>
						<p className="mt-0.5 text-xs text-muted-foreground">
							Stages that require hiring team action.
						</p>
					</div>
					<div className="divide-y divide-border">
						{manualStages.map((s) => (
							<div
								key={s.stage_id}
								className="flex items-center justify-between px-4 py-3"
							>
								<div className="flex items-center gap-3">
									<User className="size-4 text-muted-foreground" />
									<div>
										<p className="text-sm font-medium text-foreground">
											{s.title}
										</p>
										<p className="text-xs text-muted-foreground">
											{s.stage_type}
										</p>
									</div>
								</div>
								{s.automation !== "None" ? (
									<span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
										Auto: {s.automation}
									</span>
								) : (
									<span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
										Manual
									</span>
								)}
							</div>
						))}
					</div>
				</div>
			) : (
				<p className="text-sm text-muted-foreground">
					No internal review stages defined.
				</p>
			)}
		</div>
	);
}

function MetricCard({
	icon,
	label,
	value,
}: {
	icon: React.ReactNode;
	label: string;
	value: string;
}) {
	return (
		<div className="rounded-lg border border-border bg-muted/40 p-4">
			<div className="mb-1.5">{icon}</div>
			<p className="text-xl font-semibold text-foreground">{value}</p>
			<p className="text-xs text-muted-foreground">{label}</p>
		</div>
	);
}

function SkeletonMetricCard() {
	return (
		<div className="rounded-lg border border-border bg-muted/40 p-4">
			<div className="mb-1.5 h-4 w-4 animate-pulse rounded bg-muted" />
			<div className="h-6 w-16 animate-pulse rounded bg-muted" />
			<div className="mt-1 h-3 w-24 animate-pulse rounded bg-muted" />
		</div>
	);
}

function LaunchCheckSkeleton() {
	return (
		<div className="space-y-4">
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
				<SkeletonMetricCard />
				<SkeletonMetricCard />
				<SkeletonMetricCard />
				<SkeletonMetricCard />
			</div>
			<div className="flex items-center gap-2 text-sm text-muted-foreground">
				<Loader2 className="size-4 animate-spin" />
				Running launch analysis…
			</div>
		</div>
	);
}

function LaunchCheckTab({
	analysis,
	isLoading,
	refreshError,
}: {
	analysis: LaunchPreviewResponse | null;
	isLoading: boolean;
	refreshError: string | null;
}) {
	if (!analysis && isLoading) {
		return <LaunchCheckSkeleton />;
	}

	if (!analysis) {
		return (
			<div className="text-sm text-muted-foreground">
				No analysis yet. Make changes to see launch readiness.
			</div>
		);
	}

	const hasBlockers = analysis.blocking_issues.length > 0;

	return (
		<div className="space-y-4">
			{isLoading ? (
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<Loader2 className="size-4 animate-spin" />
					Refreshing analysis…
				</div>
			) : null}

			{refreshError ? (
				<div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
					<AlertTriangle className="size-4 shrink-0" />
					{refreshError}
				</div>
			) : null}

			<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
				<MetricCard
					icon={
						<ShieldAlert
							className={`size-4 ${hasBlockers ? "text-destructive" : "text-emerald-500"}`}
						/>
					}
					label="Readiness"
					value={`${analysis.readiness_score}%`}
				/>
				<MetricCard
					icon={<Clock className="size-4 text-primary" />}
					label="Candidate time"
					value={`${analysis.candidate_time_minutes} min`}
				/>
				<MetricCard
					icon={<Users className="size-4 text-primary" />}
					label="Candidate stages"
					value={String(analysis.candidate_facing_stage_count)}
				/>
				<MetricCard
					icon={<LayoutGrid className="size-4 text-primary" />}
					label="Scoring coverage"
					value={`${analysis.scoring_coverage_percent}%`}
				/>
			</div>

			{hasBlockers ? (
				<div className="space-y-2">
					<h3 className="text-sm font-semibold text-destructive">
						Blocking issues
					</h3>
					{analysis.blocking_issues.map((f) => (
						<FindingCard key={f.code} finding={f} />
					))}
				</div>
			) : null}

			{analysis.warnings.length > 0 ? (
				<div className="space-y-2">
					<h3 className="text-sm font-semibold text-amber-600">Warnings</h3>
					{analysis.warnings.map((f) => (
						<FindingCard key={f.code} finding={f} />
					))}
				</div>
			) : null}

			{analysis.recommendations.length > 0 ? (
				<div className="space-y-2">
					<h3 className="text-sm font-semibold text-emerald-600">
						Recommendations
					</h3>
					{analysis.recommendations.map((f) => (
						<FindingCard key={f.code} finding={f} />
					))}
				</div>
			) : null}

			{!hasBlockers &&
			analysis.warnings.length === 0 &&
			analysis.recommendations.length === 0 ? (
				<div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
					<CheckCircle2 className="size-5" />
					Everything looks good. Ready to publish.
				</div>
			) : null}
		</div>
	);
}

type PhasePreviewProps = {
	draft: DraftState;
	routeJobId: string | undefined;
	onBack: () => void;
	onSaveAndContinue: () => Promise<void>;
	isSaving: boolean;
};

export function PhasePreview({
	draft,
	onBack,
	onSaveAndContinue,
	isSaving,
}: PhasePreviewProps) {
	const [activeTab, setActiveTab] = useState<TabKey>("workflow");
	const { mutateAsync, isPending } = useAnalyzeJobLaunchPreview();
	const [serverResult, setServerResult] =
		useState<LaunchPreviewResponse | null>(null);
	const [refreshError, setRefreshError] = useState<string | null>(null);
	const requestIdRef = useRef(0);

	const debouncedDraft = useDebouncedValue(draft, 500);

	useEffect(() => {
		const currentId = ++requestIdRef.current;
		async function run() {
			const payload = buildCreatePayload(debouncedDraft, {
				publishOnCreate: false,
			});
			try {
				const result = await mutateAsync({ job: payload });
				if (currentId === requestIdRef.current) {
					setServerResult(result);
					setRefreshError(null);
				}
			} catch {
				if (currentId === requestIdRef.current) {
					setRefreshError("Preview analysis could not refresh");
				}
			}
		}
		void run();
	}, [debouncedDraft, mutateAsync]);

	const fallbackSummaries = fallbackStageSummaries(draft);
	const displaySummaries = serverResult?.stage_summaries ?? fallbackSummaries;
	const displayAutomationPercent =
		serverResult?.automation_coverage_percent ?? 0;

	return (
		<div className="space-y-4">
			<div className="space-y-1">
				<h2 className="text-lg font-semibold tracking-tight text-foreground">
					Launch Simulator
				</h2>
				<p className="text-sm text-muted-foreground">
					Preview the candidate experience, hiring team workload, and launch
					readiness before publishing.
				</p>
			</div>

			{/* Tabs */}
			<div className="flex gap-1 rounded-lg border border-border bg-muted/40 p-1">
				{TAB_LABELS.map((t) => (
					<button
						key={t.key}
						type="button"
						onClick={() => setActiveTab(t.key)}
						className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
							activeTab === t.key
								? "bg-background text-foreground shadow-sm"
								: "text-muted-foreground hover:text-foreground"
						}`}
					>
						{t.label}
					</button>
				))}
			</div>

			{/* Tab content */}
			{activeTab === "workflow" ? (
				<WorkflowCanvas
					stageSummaries={displaySummaries}
					draftStages={draft.pipeline.stages}
				/>
			) : null}

			{activeTab === "candidate" ? (
				<CandidatePreview draft={draft} analysis={serverResult} />
			) : null}

			{activeTab === "hiring-team" ? (
				<HiringTeamSummary
					stageSummaries={displaySummaries}
					automationPercent={displayAutomationPercent}
				/>
			) : null}

			{activeTab === "launch-check" ? (
				<LaunchCheckTab
					analysis={serverResult}
					isLoading={isPending}
					refreshError={refreshError}
				/>
			) : null}

			{/* CTA row */}
			<div className="flex items-center justify-between pt-2">
				<Button type="button" variant="ghost" onClick={onBack}>
					<ArrowLeft className="size-4" />
					Back
				</Button>
				<Button
					type="button"
					disabled={isSaving}
					onClick={() => void onSaveAndContinue()}
				>
					{isSaving ? (
						<span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
					) : null}
					Save & continue
				</Button>
			</div>
		</div>
	);
}
