import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Loader2, Lock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
	buildCreatePayload,
	buildUpdatePayload,
	defaultDraft,
	draftFromJob,
	newClientId,
	validatePhase,
} from "#/components/jobs/create/job-create-state";
import { PhaseDetails } from "#/components/jobs/create/phase-details";
import { PhaseProcess } from "#/components/jobs/create/phase-process";
import { PhasePublish } from "#/components/jobs/create/phase-publish";
import {
	type DraftState,
	PHASES,
	type Phase,
} from "#/components/jobs/create/types";
import { Alert, AlertDescription } from "#/components/ui/alert";
import { Button } from "#/components/ui/button";
import { isApiError } from "#/integrations/api/errors";
import {
	jobQueries,
	useCreateJob,
	useGenerateJobContent,
	useUpdateJob,
} from "#/integrations/api/queries";
import { cn } from "#/lib/utils";

export const Route = createFileRoute("/dashboard/jobs/new")({
	validateSearch: (s: Record<string, unknown>) => ({
		id: typeof s.id === "string" ? s.id : undefined,
	}),
	component: CreateJobPage,
});

function CreateJobPage() {
	const navigate = useNavigate();
	const { id } = Route.useSearch();

	const { data: existingJob } = useQuery({
		...jobQueries.detail(id ?? ""),
		enabled: typeof id === "string" && id.length > 0,
	});

	const createJob = useCreateJob();
	const updateJob = useUpdateJob();
	const generate = useGenerateJobContent();

	const [phase, setPhase] = useState<Phase>("Details");
	const [draft, setDraft] = useState<DraftState>(() => defaultDraft());
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [visitedPhases, setVisitedPhases] = useState<Set<Phase>>(
		() => new Set<Phase>(["Details"]),
	);
	const seededRef = useRef<string | undefined>(undefined);

	// Seed draft once when job data arrives (resume from URL id)
	useEffect(() => {
		if (existingJob && seededRef.current !== existingJob.id) {
			seededRef.current = existingJob.id;
			setDraft(draftFromJob(existingJob));
		}
	}, [existingJob]);

	const isSaving = createJob.isPending || updateJob.isPending;
	const isLastPhase = phase === "Publish";

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
						stages: rows.map((row, index) => ({
							id: newClientId("stage"),
							title: String(row.title ?? `Stage ${index + 1}`),
							stage_type: ((row.stage_type as string) ||
								"ManualReview") as import("#/integrations/api/client").StageType,
							required: Boolean(row.required),
							candidate_facing: Boolean(row.candidate_facing),
							pass_threshold:
								typeof row.pass_threshold === "number"
									? row.pass_threshold
									: null,
							contributes_to_score: Boolean(row.contributes_to_score),
							automation: ((row.automation as string) ||
								"None") as import("#/integrations/api/client").StageAutomation,
							order: index,
						})),
					},
				}));
			}
		} catch (e) {
			setErrorMessage(
				e instanceof Error ? e.message : "Could not generate pipeline.",
			);
		}
	}

	async function handleGenerateRubric() {
		setErrorMessage(null);
		try {
			const result = await generate.mutateAsync({
				kind: "rubric_questions",
				context: {
					title: draft.title,
					job_title: draft.jobTitle,
					seniority: draft.seniority,
					skills: draft.skills,
					job_description: draft.jobDescription,
				},
			});
			const content = result.content as {
				rubric?: Array<Record<string, unknown>>;
			};
			if (Array.isArray(content.rubric)) {
				const rows = content.rubric;
				setDraft((prev) => ({
					...prev,
					rubric: rows.map((row, index) => ({
						id: newClientId("rubric"),
						skill: String(row.skill ?? ""),
						weight: Number(row.weight ?? 1),
						scoring_guide: String(row.scoring_guide ?? ""),
						question: String(row.question ?? ""),
						follow_up_prompts: Array.isArray(row.follow_up_prompts)
							? row.follow_up_prompts.map(String)
							: [],
						order: index,
					})),
				}));
			}
		} catch (e) {
			setErrorMessage(
				e instanceof Error ? e.message : "Could not generate rubric.",
			);
		}
	}

	async function handleSaveAndContinue() {
		setErrorMessage(null);

		const validation = validatePhase(phase, draft);
		if (!validation.ok) {
			setErrorMessage("Please fix the errors above before continuing.");
			return;
		}

		try {
			if (!id) {
				// First save — POST to create Draft
				const created = await createJob.mutateAsync(
					buildCreatePayload(draft, { publishOnCreate: false }),
				);
				await navigate({
					to: "/dashboard/jobs/new",
					search: { id: created.id },
					replace: true,
				});
				advancePhase();
			} else {
				// Subsequent saves — PUT
				await updateJob.mutateAsync({ id, data: buildUpdatePayload(draft) });
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
		if (!id) {
			setErrorMessage("Save the job first before publishing.");
			return;
		}
		try {
			await updateJob.mutateAsync({
				id,
				data: { ...buildUpdatePayload(draft), status: "Active" },
			});
			await navigate({ to: "/jobs/$id", params: { id } });
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

	// Derive per-phase validation errors for inline display
	const phaseErrors = validatePhase(phase, draft).errors;

	return (
		<div className="mx-auto w-full max-w-6xl">
			<Button
				type="button"
				variant="ghost"
				className="mb-3 -ml-2"
				onClick={() => void navigate({ to: "/dashboard/jobs" })}
			>
				<ArrowLeft className="size-4" />
				Back to jobs
			</Button>

			<div className="mb-6">
				<h1 className="text-2xl font-bold tracking-tight text-foreground">
					{id ? "Edit job" : "Create job"}
				</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Define the posting, hiring stages, screening, and AI voice interview
					before sharing the public invite link.
				</p>
			</div>

			<div className="grid gap-6 lg:grid-cols-[240px_1fr]">
				{/* Sidebar */}
				<div className="h-fit rounded-lg border border-border bg-card p-2">
					{PHASES.map((p, index) => {
						const isActive = p === phase;
						const isDisabled = index > 0 && !id;
						const isVisited = visitedPhases.has(p);

						return (
							<button
								key={p}
								type="button"
								disabled={isDisabled}
								className={cn(
									"flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
									isActive
										? "bg-primary text-primary-foreground"
										: isDisabled
											? "cursor-not-allowed text-muted-foreground/50"
											: "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
								)}
								onClick={() => {
									if (!isDisabled) {
										setPhase(p);
										setVisitedPhases((prev) => new Set([...prev, p]));
									}
								}}
							>
								<span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-current/25 text-xs">
									{isDisabled ? (
										<Lock className="size-3" />
									) : isVisited && !isActive ? (
										<Check className="size-3" />
									) : (
										index + 1
									)}
								</span>
								{p}
							</button>
						);
					})}
				</div>

				{/* Main content */}
				<div className="space-y-4">
					{errorMessage ? (
						<Alert variant="destructive">
							<AlertDescription>{errorMessage}</AlertDescription>
						</Alert>
					) : null}

					{phase === "Details" ? (
						<PhaseDetails
							draft={draft}
							update={update}
							errors={phaseErrors}
							setDraft={setDraft}
						/>
					) : null}

					{phase === "Hiring process" ? (
						<PhaseProcess
							draft={draft}
							update={update}
							errors={phaseErrors}
							onGeneratePipeline={handleGeneratePipeline}
							onGenerateRubric={handleGenerateRubric}
							generating={generate.isPending}
						/>
					) : null}

					{phase === "Publish" ? (
						<PhasePublish draft={draft} update={update} />
					) : null}

					{/* Footer navigation */}
					<div className="flex justify-between pt-2">
						<Button
							type="button"
							variant="outline"
							disabled={phase === "Details"}
							onClick={goBack}
						>
							<ArrowLeft className="size-4" />
							Back
						</Button>

						{isLastPhase ? (
							<Button
								type="button"
								disabled={isSaving || !id}
								onClick={handlePublish}
							>
								{isSaving ? (
									<Loader2 className="size-4 animate-spin" />
								) : (
									<Check className="size-4" />
								)}
								Publish job
							</Button>
						) : (
							<Button
								type="button"
								disabled={isSaving}
								onClick={handleSaveAndContinue}
							>
								{isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
								Save &amp; continue
								{!isSaving ? <ArrowRight className="size-4" /> : null}
							</Button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
