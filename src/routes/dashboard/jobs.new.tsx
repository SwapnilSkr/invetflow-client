import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { useId, useState } from "react";
import {
	buildCreateJobPayload,
	canContinueCreateJobStep,
	defaultDraft,
	normalizeGeneratedContent,
	splitList,
} from "#/components/jobs/create/job-create-state";
import {
	JobDescriptionStep,
	PrescreeningStep,
	PublishingStep,
	RequirementsStep,
	ReviewStep,
	StagesStep,
	VoiceStep,
} from "#/components/jobs/create/job-create-steps";
import {
	CREATE_JOB_STEPS,
	type DraftState,
	type GenerateKind,
} from "#/components/jobs/create/types";
import { Alert, AlertDescription } from "#/components/ui/alert";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { isApiError } from "#/integrations/api/errors";
import {
	useCreateJob,
	useGenerateJobContent,
} from "#/integrations/api/queries";
import { cn } from "#/lib/utils";

export const Route = createFileRoute("/dashboard/jobs/new")({
	component: CreateJobPage,
});

function CreateJobPage() {
	const baseId = useId();
	const navigate = useNavigate();
	const createJob = useCreateJob();
	const generate = useGenerateJobContent();
	const [step, setStep] = useState(0);
	const [draft, setDraft] = useState<DraftState>(() => defaultDraft());
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const canContinue = canContinueCreateJobStep(step, draft);

	const update = <K extends keyof DraftState>(key: K, value: DraftState[K]) => {
		setDraft((prev) => ({ ...prev, [key]: value }));
	};

	const generateContent = async (kind: GenerateKind) => {
		setErrorMessage(null);
		try {
			const result = await generate.mutateAsync({
				kind,
				context: {
					title: draft.title,
					job_title: draft.jobTitle,
					department: draft.department,
					seniority: draft.seniority,
					job_description: draft.jobDescription,
					skills: splitList(draft.skills),
					pipeline: draft.pipeline,
				},
			});
			const content = result.content as Record<string, unknown>;
			setDraft((prev) => ({
				...prev,
				...normalizeGeneratedContent(kind, content),
			}));
		} catch (e) {
			setErrorMessage(
				e instanceof Error ? e.message : "Could not generate content.",
			);
		}
	};

	const submit = async () => {
		setErrorMessage(null);
		try {
			const row = await createJob.mutateAsync(buildCreateJobPayload(draft));
			void navigate({ to: "/jobs/$id", params: { id: row.id } });
		} catch (e) {
			if (isApiError(e) || e instanceof Error) {
				setErrorMessage(e.message);
			} else {
				setErrorMessage("Could not create the job.");
			}
		}
	};

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

			<div className="mb-6 flex flex-wrap items-end justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold tracking-tight text-[#111827]">
						Create job
					</h1>
					<p className="mt-1 text-sm text-[#6b7280]">
						Define the posting, hiring stages, screening, and AI voice interview
						before sharing the public invite link.
					</p>
				</div>
				<Button
					type="button"
					disabled={createJob.isPending}
					onClick={submit}
					className="h-10 rounded-xl bg-[#0052cc] text-white hover:bg-[#0041a3]"
				>
					{createJob.isPending ? (
						<Loader2 className="size-4 animate-spin" />
					) : (
						<Check className="size-4" />
					)}
					Create {draft.publishOnCreate ? "and publish" : "draft"}
				</Button>
			</div>

			<div className="grid gap-6 lg:grid-cols-[260px_1fr]">
				<Card className="h-fit border-black/8">
					<CardContent className="p-2">
						{CREATE_JOB_STEPS.map((label, index) => (
							<button
								key={label}
								type="button"
								className={cn(
									"flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
									index === step
										? "bg-[#0052cc] text-white"
										: "text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111827]",
								)}
								onClick={() => setStep(index)}
							>
								<span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-current/25 text-xs">
									{index + 1}
								</span>
								{label}
							</button>
						))}
					</CardContent>
				</Card>

				<div className="space-y-4">
					{errorMessage ? (
						<Alert variant="destructive">
							<AlertDescription>{errorMessage}</AlertDescription>
						</Alert>
					) : null}
					<Card className="border-black/8">
						<CardHeader>
							<CardTitle>{CREATE_JOB_STEPS[step]}</CardTitle>
						</CardHeader>
						<CardContent className="space-y-5">
							{step === 0 ? (
								<JobDescriptionStep
									baseId={baseId}
									draft={draft}
									update={update}
									generateContent={generateContent}
									generating={generate.isPending}
								/>
							) : null}
							{step === 1 ? (
								<RequirementsStep draft={draft} update={update} />
							) : null}
							{step === 2 ? (
								<StagesStep
									draft={draft}
									update={update}
									generateContent={generateContent}
									generating={generate.isPending}
								/>
							) : null}
							{step === 3 ? (
								<VoiceStep
									draft={draft}
									update={update}
									generateContent={generateContent}
									generating={generate.isPending}
								/>
							) : null}
							{step === 4 ? (
								<PrescreeningStep draft={draft} update={update} />
							) : null}
							{step === 5 ? (
								<PublishingStep draft={draft} update={update} />
							) : null}
							{step === 6 ? <ReviewStep draft={draft} /> : null}
						</CardContent>
					</Card>

					<div className="flex justify-between">
						<Button
							type="button"
							variant="outline"
							disabled={step === 0}
							onClick={() => setStep((s) => Math.max(0, s - 1))}
						>
							<ArrowLeft className="size-4" />
							Previous
						</Button>
						{step < CREATE_JOB_STEPS.length - 1 ? (
							<Button
								type="button"
								disabled={!canContinue}
								onClick={() =>
									setStep((s) => Math.min(CREATE_JOB_STEPS.length - 1, s + 1))
								}
							>
								Next
								<ArrowRight className="size-4" />
							</Button>
						) : (
							<Button
								type="button"
								disabled={createJob.isPending}
								onClick={submit}
							>
								{createJob.isPending ? "Creating..." : "Create job"}
							</Button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
