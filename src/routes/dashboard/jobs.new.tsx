import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createFileRoute,
	Link,
	useCanGoBack,
	useNavigate,
	useRouter,
} from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { lazy, Suspense, useRef, useState } from "react";
import { HorizontalStepper } from "#/components/jobs/create/horizontal-stepper";
import {
	buildMinimalCreatePayload,
	buildUpdatePayload,
	canAdvanceFromPhase,
	defaultDraft,
	draftFromJob,
	firstIncompleteWizardPhase,
	isPhaseIndexUnlocked,
	newClientId,
	normalizeJobStage,
	validatePhase,
} from "#/components/jobs/create/job-create-state";
import { PhaseDetails } from "#/components/jobs/create/phase-details";
import { PhaseProcess } from "#/components/jobs/create/phase-process";
import {
	type DraftState,
	PHASES,
	type Phase,
} from "#/components/jobs/create/types";
import { Alert, AlertDescription } from "#/components/ui/alert";
import { Button } from "#/components/ui/button";
import {
	isApiError,
	type Job,
	type StageAutomation,
	type StageType,
} from "#/integrations/api/client";
import {
	jobKeys,
	jobQueries,
	useCreateJob,
	useGenerateJobContent,
	useUpdateJob,
} from "#/integrations/api/queries";

const PhasePreview = lazy(() =>
	import("#/components/jobs/create/phase-preview").then((m) => ({
		default: m.PhasePreview,
	})),
);
const PhasePublish = lazy(() =>
	import("#/components/jobs/create/phase-publish").then((m) => ({
		default: m.PhasePublish,
	})),
);

function WizardPhaseFallback() {
	return (
		<div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
			<Loader2 className="size-8 animate-spin" aria-hidden />
			<p className="text-sm">Loading…</p>
		</div>
	);
}

export const Route = createFileRoute("/dashboard/jobs/new")({
	validateSearch: (s: Record<string, unknown>) => ({
		id: typeof s.id === "string" ? s.id : undefined,
	}),
	component: CreateJobPage,
});

type CreateJobWizardProps = {
	routeJobId: string | undefined;
	initialJob: Job | undefined;
};

function initWizardState(initialJob: Job | undefined): {
	draft: DraftState;
	phase: Phase;
	visitedPhases: Set<Phase>;
} {
	if (!initialJob) {
		return {
			draft: defaultDraft(),
			phase: "Details",
			visitedPhases: new Set<Phase>(["Details"]),
		};
	}
	const draft = draftFromJob(initialJob);
	const phase = firstIncompleteWizardPhase(draft, true);
	const end = PHASES.indexOf(phase) + 1;
	return {
		draft,
		phase,
		visitedPhases: new Set(PHASES.slice(0, end) as Phase[]),
	};
}

/** Owns wizard state; remounted via `key` when switching virgin → saved id so draft hydration needs no effect. */
function CreateJobWizard({ routeJobId, initialJob }: CreateJobWizardProps) {
	const router = useRouter();
	const canGoBack = useCanGoBack();
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const createJob = useCreateJob();
	const updateJob = useUpdateJob();
	const generate = useGenerateJobContent();

	const initialWizardRef = useRef<ReturnType<typeof initWizardState> | null>(
		null,
	);
	function bootstrapWizardOnce() {
		if (initialWizardRef.current === null) {
			initialWizardRef.current = initWizardState(initialJob);
		}
		return initialWizardRef.current;
	}

	const [draft, setDraft] = useState<DraftState>(
		() => bootstrapWizardOnce().draft,
	);
	const hasPersistedJobId = Boolean(routeJobId);
	const [phase, setPhase] = useState<Phase>(() => bootstrapWizardOnce().phase);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [visitedPhases, setVisitedPhases] = useState<Set<Phase>>(
		() => bootstrapWizardOnce().visitedPhases,
	);
	/** Inline field errors only after user tries Save & continue for that phase */
	const [phasesWithShownValidation, setPhasesWithShownValidation] = useState<
		Set<Phase>
	>(() => new Set());

	const isSaving = createJob.isPending || updateJob.isPending;

	function update<K extends keyof DraftState>(key: K, value: DraftState[K]) {
		setDraft((prev) => ({ ...prev, [key]: value }));
	}

	async function handleGeneratePipeline() {
		setErrorMessage(null);
		try {
			const result = await generate.mutateAsync({
				kind: "pipeline",
				context: {
					title: draft.title,
					seniority: draft.seniority,
					job_description: draft.jobDescription,
				},
			});
			const content = result.content as { stages?: unknown[] };
			if (Array.isArray(content.stages)) {
				const rows = content.stages as Array<Record<string, unknown>>;
				setDraft((prev) => ({
					...prev,
					pipeline: {
						stages: rows.map((row, index) =>
							normalizeJobStage(
								{
									id: newClientId("stage"),
									title: String(row.title ?? `Stage ${index + 1}`),
									stage_type: ((row.stage_type as string) ||
										"ManualReview") as StageType,
									required: Boolean(row.required),
									candidate_facing: Boolean(row.candidate_facing),
									pass_threshold:
										typeof row.pass_threshold === "number"
											? row.pass_threshold
											: null,
									contributes_to_score: Boolean(row.contributes_to_score),
									automation: ((row.automation as string) ||
										"None") as StageAutomation,
									pass_score:
										typeof row.pass_score === "number"
											? row.pass_score
											: undefined,
								},
								index,
							),
						),
					},
				}));
			}
		} catch (e) {
			setErrorMessage(
				e instanceof Error ? e.message : "Could not generate pipeline.",
			);
		}
	}

	async function handleSaveAndContinue() {
		setErrorMessage(null);

		const validation = canAdvanceFromPhase(phase, draft);
		if (!validation.ok) {
			setPhasesWithShownValidation((prev) => new Set([...prev, phase]));
			setErrorMessage("Please fix the errors above before continuing.");
			return;
		}

		try {
			if (!routeJobId) {
				const created = await createJob.mutateAsync(
					buildMinimalCreatePayload(draft, { publishOnCreate: false }),
				);
				queryClient.setQueryData(jobKeys.detail(created.id), created);
				await navigate({
					to: "/dashboard/jobs/new",
					search: { id: created.id },
					replace: true,
				});
			} else {
				await updateJob.mutateAsync({
					id: routeJobId,
					data: buildUpdatePayload(draft),
				});
				advancePhase();
			}
		} catch (e) {
			if (isApiError(e) || e instanceof Error) {
				setErrorMessage(e.message);
			} else {
				setErrorMessage("Could not save the job.");
			}
		}
	}

	async function handlePublish() {
		setErrorMessage(null);
		if (!routeJobId) {
			setErrorMessage("Save the job first before publishing.");
			return;
		}
		try {
			await updateJob.mutateAsync({
				id: routeJobId,
				data: { ...buildUpdatePayload(draft), status: "Active" },
			});
			await navigate({ to: "/jobs/$id/pipeline", params: { id: routeJobId } });
		} catch (e) {
			if (isApiError(e) || e instanceof Error) {
				setErrorMessage(e.message);
			} else {
				setErrorMessage("Could not publish the job.");
			}
		}
	}

	function advancePhase() {
		const idx = PHASES.indexOf(phase);
		if (idx < PHASES.length - 1) {
			const next = PHASES[idx + 1];
			setPhase(next);
			setVisitedPhases((prev) => new Set([...prev, next]));
		}
	}

	function goBack() {
		const idx = PHASES.indexOf(phase);
		if (idx > 0) {
			setPhase(PHASES[idx - 1]);
		}
	}

	function handleHeaderBack() {
		if (canGoBack) {
			router.history.back();
			return;
		}
		void navigate({ to: "/dashboard/jobs" });
	}

	const currentPhaseIndex = PHASES.indexOf(phase);
	const inlinePhaseErrors = phasesWithShownValidation.has(phase)
		? validatePhase(phase, draft).errors
		: {};

	const steps = PHASES.map((p, index) => {
		const isVisited = visitedPhases.has(p);
		const unlocked = isPhaseIndexUnlocked(index, draft, hasPersistedJobId);
		let status: "active" | "completed" | "locked" | "pending";
		if (index === currentPhaseIndex) {
			status = "active";
		} else if (!unlocked) {
			status = "locked";
		} else if (index < currentPhaseIndex && isVisited) {
			status = "completed";
		} else {
			status = "pending";
		}
		return { label: p, status };
	});

	function handleStepClick(index: number) {
		const step = steps[index];
		if (step.status === "locked") {
			if (!routeJobId && index > 0) {
				setErrorMessage("Save the draft first to unlock later phases.");
			} else if (!validatePhase("Details", draft).ok) {
				setErrorMessage("Complete the Details step before opening this phase.");
			} else if (!validatePhase("Hiring process", draft).ok) {
				setErrorMessage(
					"Complete the Hiring process step before opening this phase.",
				);
			} else if (!validatePhase("Preview", draft).ok) {
				setErrorMessage("Complete the Preview step before opening this phase.");
			} else {
				setErrorMessage("This step is not available yet.");
			}
			return;
		}
		setPhase(PHASES[index]);
		setVisitedPhases((prev) => new Set([...prev, PHASES[index]]));
	}

	const headingTitle =
		draft.title.trim() || initialJob?.title || "Create new job";

	return (
		<div className="mx-auto w-full max-w-5xl">
			{/* Sticky header */}
			<div className="sticky top-0 z-20 -mx-4 mb-6 border-b border-border bg-background/80 px-4 py-4 backdrop-blur-sm">
				<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
					<div>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="-ml-2 mb-1 text-muted-foreground"
							onClick={handleHeaderBack}
						>
							<ArrowLeft className="size-4" />
							Back
						</Button>
						<h1 className="text-xl font-semibold tracking-tight text-foreground">
							{headingTitle}
						</h1>
					</div>
				</div>
				<div className="mt-4">
					<HorizontalStepper steps={steps} onStepClick={handleStepClick} />
				</div>
			</div>

			{/* Inline alert */}
			{errorMessage ? (
				<Alert variant="destructive" className="mb-4">
					<AlertDescription>{errorMessage}</AlertDescription>
				</Alert>
			) : null}

			{/* Step content */}
			{phase === "Details" ? (
				<PhaseDetails
					draft={draft}
					update={update}
					errors={inlinePhaseErrors}
					setDraft={setDraft}
					onSaveAndContinue={handleSaveAndContinue}
					isSaving={isSaving}
				/>
			) : null}

			{phase === "Hiring process" ? (
				<PhaseProcess
					draft={draft}
					update={update}
					errors={inlinePhaseErrors}
					onGeneratePipeline={handleGeneratePipeline}
					generating={generate.isPending}
					onSaveAndContinue={handleSaveAndContinue}
					isSaving={isSaving}
					onBack={goBack}
				/>
			) : null}

			{phase === "Preview" ? (
				<Suspense fallback={<WizardPhaseFallback />}>
					<PhasePreview
						draft={draft}
						routeJobId={routeJobId}
						onBack={goBack}
						onSaveAndContinue={handleSaveAndContinue}
						isSaving={isSaving}
					/>
				</Suspense>
			) : null}

			{phase === "Publish" ? (
				<Suspense fallback={<WizardPhaseFallback />}>
					<PhasePublish
						draft={draft}
						update={update}
						onPublish={handlePublish}
						isSaving={isSaving}
						canPublish={!!routeJobId}
						onBack={goBack}
					/>
				</Suspense>
			) : null}
		</div>
	);
}

function CreateJobPage() {
	const { id } = Route.useSearch();

	const loadSavedJob = typeof id === "string" && id.length > 0;

	const {
		data: existingJob,
		isPending: jobDetailPending,
		isError: jobDetailError,
		error: jobDetailErr,
	} = useQuery({
		...jobQueries.detail(id ?? ""),
		enabled: loadSavedJob,
	});

	const showJobLoading = loadSavedJob && !existingJob && jobDetailPending;
	const showJobError =
		loadSavedJob && !existingJob && !jobDetailPending && jobDetailError;

	if (showJobLoading) {
		return (
			<div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
				<Loader2 className="size-8 animate-spin" aria-hidden />
				<p className="text-sm">Loading job draft…</p>
			</div>
		);
	}

	if (showJobError) {
		const msg =
			jobDetailErr instanceof Error
				? jobDetailErr.message
				: "Could not load this job.";
		return (
			<div className="mx-auto w-full max-w-5xl space-y-4">
				<Alert variant="destructive">
					<AlertDescription>{msg}</AlertDescription>
				</Alert>
				<Button type="button" variant="outline" asChild>
					<Link to="/dashboard/jobs">Back to jobs</Link>
				</Button>
			</div>
		);
	}

	const wizardKey = id ?? "__new__";
	const initialJob: Job | undefined = loadSavedJob ? existingJob : undefined;

	return (
		<CreateJobWizard key={wizardKey} routeJobId={id} initialJob={initialJob} />
	);
}
