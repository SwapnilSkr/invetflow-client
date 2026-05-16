import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense, useState } from "react";
import { Alert, AlertDescription } from "#/components/ui/alert";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Skeleton } from "#/components/ui/skeleton";
import type { HumanInterviewSession } from "#/integrations/api/client";
import { isApiError } from "#/integrations/api/errors";
import {
	humanInterviewQueries,
	useRecordHumanInterviewOutcome,
} from "#/integrations/api/queries";

const RichTextEditor = lazy(() =>
	import("#/components/jobs/create/rich-text-editor").then((m) => ({
		default: m.RichTextEditor,
	})),
);

interface OutcomeDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	jobId: string;
	applicationId: string;
	session: HumanInterviewSession;
}

export function OutcomeDialog({
	open,
	onOpenChange,
	jobId,
	applicationId,
	session,
}: OutcomeDialogProps) {
	const [outcome, setOutcome] = useState<"Pass" | "Fail">(
		session.outcome === "Fail" ? "Fail" : "Pass",
	);
	const [score, setScore] = useState<string>(
		session.score != null ? String(session.score) : "",
	);
	const [feedbackHtml, setFeedbackHtml] = useState<string>(
		session.feedback_html ?? "",
	);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const mutation = useRecordHumanInterviewOutcome(jobId, applicationId);
	const transcriptQuery = useQuery({
		...humanInterviewQueries.transcript(session.id),
		enabled: open && session.id.length > 0,
	});
	const summaryHtml = transcriptQuery.data?.summary_html;

	const handleClose = (next: boolean) => {
		if (!next) {
			setErrorMessage(null);
		}
		onOpenChange(next);
	};

	const submit = async () => {
		setErrorMessage(null);
		const parsedScore = score.trim() === "" ? null : Number.parseFloat(score);
		if (parsedScore != null && Number.isNaN(parsedScore)) {
			setErrorMessage("Score must be a number between 0 and 10.");
			return;
		}
		if (parsedScore != null && (parsedScore < 0 || parsedScore > 10)) {
			setErrorMessage("Score must be between 0 and 10.");
			return;
		}
		try {
			await mutation.mutateAsync({
				id: session.id,
				body: {
					outcome,
					score: parsedScore,
					feedback_html: feedbackHtml.trim() ? feedbackHtml : null,
				},
			});
			handleClose(false);
		} catch (e) {
			if (isApiError(e)) setErrorMessage(e.message);
			else if (e instanceof Error) setErrorMessage(e.message);
			else setErrorMessage("Could not save outcome.");
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>Record outcome</DialogTitle>
					<DialogDescription>
						This advances the candidate to the next stage on Pass, or marks the
						stage failed on Fail.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div className="space-y-1.5">
						<Label>Outcome</Label>
						<div className="grid grid-cols-2 gap-2">
							<Button
								type="button"
								variant={outcome === "Pass" ? "default" : "outline"}
								onClick={() => setOutcome("Pass")}
								disabled={mutation.isPending}
							>
								Pass
							</Button>
							<Button
								type="button"
								variant={outcome === "Fail" ? "destructive" : "outline"}
								onClick={() => setOutcome("Fail")}
								disabled={mutation.isPending}
							>
								Fail
							</Button>
						</div>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="hi-score">Score (0–10)</Label>
						<Input
							id="hi-score"
							type="number"
							min={0}
							max={10}
							step={0.5}
							value={score}
							onChange={(e) => setScore(e.target.value)}
							placeholder="Leave blank to omit"
							disabled={mutation.isPending}
						/>
					</div>

					<div className="space-y-1.5">
						<div className="flex items-center justify-between gap-3">
							<Label>Feedback</Label>
							<Button
								type="button"
								size="sm"
								variant="outline"
								onClick={() => {
									if (summaryHtml) {
										setFeedbackHtml(summaryHtml);
									}
								}}
								disabled={!summaryHtml || mutation.isPending}
							>
								Insert from meeting summary
							</Button>
						</div>
						<Suspense fallback={<Skeleton className="h-40 w-full" />}>
							<RichTextEditor
								value={feedbackHtml}
								onChange={setFeedbackHtml}
								placeholder="Notes for the hiring team..."
							/>
						</Suspense>
					</div>

					{errorMessage ? (
						<Alert variant="destructive">
							<AlertDescription>{errorMessage}</AlertDescription>
						</Alert>
					) : null}
				</div>

				<DialogFooter>
					<Button
						type="button"
						variant="ghost"
						onClick={() => handleClose(false)}
						disabled={mutation.isPending}
					>
						Cancel
					</Button>
					<Button type="button" onClick={submit} disabled={mutation.isPending}>
						Save outcome
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
