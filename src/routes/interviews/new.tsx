import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { useId, useState } from "react";
import { Alert, AlertDescription } from "#/components/ui/alert";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import type {
	CreateQuestionRequest,
	Question,
} from "#/integrations/api/client";
import { isApiError } from "#/integrations/api/errors";
import { useCreateInterview } from "#/integrations/api/queries";
import { requireRecruiter } from "#/lib/require-role";
import { cn } from "#/lib/utils";

export const Route = createFileRoute("/interviews/new")({
	beforeLoad: requireRecruiter,
	component: CreateInterviewPage,
});

const QUESTION_CATEGORIES: Question["category"][] = [
	"Behavioral",
	"Technical",
	"Situational",
	"Coding",
	"SystemDesign",
	"SoftSkills",
];

type DraftQuestion = {
	key: string;
	question: string;
	category: Question["category"];
};

function newDraftRow(): DraftQuestion {
	return {
		key: crypto.randomUUID(),
		question: "",
		category: "Behavioral",
	};
}

const textareaClassName = cn(
	"flex min-h-[140px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm",
	"placeholder:text-muted-foreground",
	"focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
	"disabled:cursor-not-allowed disabled:opacity-50",
);

const selectClassName = cn(
	"flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm",
	"focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
);

function CreateInterviewPage() {
	const navigate = useNavigate();
	const baseId = useId();
	const createInterview = useCreateInterview();

	const [title, setTitle] = useState("");
	const [jobTitle, setJobTitle] = useState("");
	const [duration, setDuration] = useState(30);
	const [jobDescription, setJobDescription] = useState("");
	const [draftQuestions, setDraftQuestions] = useState<DraftQuestion[]>([]);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setErrorMessage(null);

		const trimmedTitle = title.trim();
		const trimmedJob = jobTitle.trim();
		if (!trimmedTitle || !trimmedJob) {
			setErrorMessage("Title and job title are required.");
			return;
		}

		const questions: CreateQuestionRequest[] = draftQuestions
			.map((d) => ({
				question: d.question.trim(),
				category: d.category,
				follow_up_prompts: [] as string[],
			}))
			.filter((q) => q.question.length > 0);

		const body: Parameters<typeof createInterview.mutateAsync>[0] = {
			title: trimmedTitle,
			job_title: trimmedJob,
			duration_minutes: duration,
			questions,
		};

		const jd = jobDescription.trim();
		if (jd.length > 0) {
			body.job_description = jd;
		}

		try {
			const interview = await createInterview.mutateAsync(body);
			navigate({
				to: "/interviews/$id",
				params: { id: interview.id },
			});
		} catch (e: unknown) {
			if (isApiError(e)) {
				setErrorMessage(e.message);
				return;
			}
			if (e instanceof Error) {
				setErrorMessage(e.message);
				return;
			}
			setErrorMessage("Could not create the interview. Try again.");
		}
	};

	return (
		<div className="container mx-auto max-w-3xl px-4 py-8">
			<Button variant="ghost" className="mb-6 -ml-2 gap-1" asChild>
				<Link to="/interviews/">
					<ArrowLeft className="h-4 w-4" />
					All interviews
				</Link>
			</Button>

			<div className="mb-8">
				<h1 className="text-2xl font-bold tracking-tight">Create interview</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Set the basics, then add an optional full job description and expected
					questions so the AI interviewer can use them in the session.
				</p>
			</div>

			<form onSubmit={onSubmit} className="space-y-8">
				<Card>
					<CardHeader>
						<CardTitle>Basics</CardTitle>
						<CardDescription>
							Required. These identify the role and the session length.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid gap-2">
							<label
								htmlFor={`${baseId}-title`}
								className="text-sm font-medium leading-none"
							>
								Interview title
							</label>
							<Input
								id={`${baseId}-title`}
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder="e.g. Acme — Senior backend engineer (round 1)"
								required
								autoComplete="off"
							/>
						</div>
						<div className="grid gap-2">
							<label
								htmlFor={`${baseId}-job-title`}
								className="text-sm font-medium leading-none"
							>
								Job title
							</label>
							<Input
								id={`${baseId}-job-title`}
								value={jobTitle}
								onChange={(e) => setJobTitle(e.target.value)}
								placeholder="e.g. Senior Backend Engineer"
								required
								autoComplete="off"
							/>
						</div>
						<div className="grid gap-2 max-w-xs">
							<label
								htmlFor={`${baseId}-duration`}
								className="text-sm font-medium leading-none"
							>
								Duration (minutes)
							</label>
							<Input
								id={`${baseId}-duration`}
								type="number"
								value={duration}
								onChange={(e) =>
									setDuration(
										Math.max(5, Math.min(180, Number(e.target.value) || 30)),
									)
								}
								min={5}
								max={180}
							/>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Job description</CardTitle>
						<CardDescription>
							Optional. Paste the full posting or internal brief — the AI uses
							it to understand the role, stack, and seniority.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<textarea
							id={`${baseId}-jd`}
							name="job_description"
							className={textareaClassName}
							value={jobDescription}
							onChange={(e) => setJobDescription(e.target.value)}
							placeholder="Responsibilities, must-have skills, team context, etc."
							rows={8}
						/>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Expected questions</CardTitle>
						<CardDescription>
							Optional. Add the topics or exact questions you want covered, in
							order. Leave empty to let the AI choose a plan from the job
							context and role title.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{draftQuestions.length === 0 ? (
							<p className="text-sm text-muted-foreground">
								No questions added yet.
							</p>
						) : (
							<ul className="space-y-4">
								{draftQuestions.map((row, index) => (
									<li
										key={row.key}
										className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-start"
									>
										<div className="grid flex-1 gap-2 min-w-0">
											<label
												className="text-xs font-medium text-muted-foreground"
												htmlFor={`${baseId}-q-${row.key}`}
											>
												Question {index + 1}
											</label>
											<Input
												id={`${baseId}-q-${row.key}`}
												value={row.question}
												onChange={(e) => {
													const v = e.target.value;
													setDraftQuestions((prev) =>
														prev.map((d) =>
															d.key === row.key ? { ...d, question: v } : d,
														),
													);
												}}
												placeholder="What you want the candidate to be asked"
											/>
										</div>
										<div className="grid w-full gap-2 sm:w-44 sm:shrink-0">
											<span className="text-xs font-medium text-muted-foreground">
												Category
											</span>
											<select
												className={selectClassName}
												value={row.category}
												onChange={(e) => {
													const v = e.target.value as Question["category"];
													setDraftQuestions((prev) =>
														prev.map((d) =>
															d.key === row.key ? { ...d, category: v } : d,
														),
													);
												}}
												aria-label={`Category for question ${index + 1}`}
											>
												{QUESTION_CATEGORIES.map((c) => (
													<option key={c} value={c}>
														{c}
													</option>
												))}
											</select>
										</div>
										<Button
											type="button"
											variant="outline"
											size="icon"
											className="self-end sm:mt-7"
											onClick={() =>
												setDraftQuestions((prev) =>
													prev.filter((d) => d.key !== row.key),
												)
											}
											aria-label={`Remove question ${index + 1}`}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</li>
								))}
							</ul>
						)}
						<Button
							type="button"
							variant="secondary"
							className="w-full sm:w-auto"
							onClick={() =>
								setDraftQuestions((prev) => [...prev, newDraftRow()])
							}
						>
							<Plus className="mr-2 h-4 w-4" />
							Add expected question
						</Button>
					</CardContent>
				</Card>

				{errorMessage ? (
					<Alert variant="destructive">
						<AlertDescription>{errorMessage}</AlertDescription>
					</Alert>
				) : null}

				<div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
					<Button type="button" variant="outline" asChild>
						<Link to="/interviews/">Cancel</Link>
					</Button>
					<Button type="submit" disabled={createInterview.isPending}>
						{createInterview.isPending ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Creating…
							</>
						) : (
							"Create interview"
						)}
					</Button>
				</div>
			</form>
		</div>
	);
}
