import { useQuery } from "@tanstack/react-query";
import { Check, ChevronDown, ChevronUp, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "#/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { Progress } from "#/components/ui/progress";
import { Skeleton } from "#/components/ui/skeleton";
import type { StageAttempt } from "#/integrations/api/client";
import { applicationQueries } from "#/integrations/api/queries";
import { HumanInterviewBlock } from "./human-interview/HumanInterviewBlock";

interface ApplicationDetailDrawerProps {
	jobId: string;
	applicationId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function ApplicationDetailDrawer({
	jobId,
	applicationId,
	open,
	onOpenChange,
}: ApplicationDetailDrawerProps) {
	const detail = useQuery({
		...applicationQueries.recruiterDetail(jobId, applicationId),
		enabled: open && jobId.length > 0 && applicationId.length > 0,
	});
	const application = detail.data?.application;
	const attempts = application?.stage_attempts ?? [];
	const orgId = application?.organization_id ?? "";

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{application?.candidate_name ||
							application?.candidate_email ||
							"Candidate"}
					</DialogTitle>
					<DialogDescription>{application?.candidate_email}</DialogDescription>
				</DialogHeader>

				{detail.isLoading ? (
					<div className="space-y-4">
						<Skeleton className="h-12 w-full" />
						<Skeleton className="h-12 w-full" />
						<Skeleton className="h-12 w-full" />
					</div>
				) : detail.error ? (
					<p className="text-sm text-muted-foreground">
						Could not load application details.
					</p>
				) : attempts.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						No stage attempts yet.
					</p>
				) : (
					<div className="space-y-3">
						{attempts.map((attempt) => (
							<AttemptSection
								key={attempt.stage_id}
								attempt={attempt}
								jobId={jobId}
								applicationId={applicationId}
								orgId={orgId}
							/>
						))}
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}

function AttemptSection({
	attempt,
	jobId,
	applicationId,
	orgId,
}: {
	attempt: StageAttempt;
	jobId: string;
	applicationId: string;
	orgId: string;
}) {
	const [expanded, setExpanded] = useState(false);
	const isHumanInterview = attempt.stage_type === "HumanInterview";
	const hasExpandableBody = isHumanInterview || !!attempt.responses;

	return (
		<div className="rounded-lg border border-border">
			<button
				type="button"
				onClick={() => setExpanded((v) => !v)}
				className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
			>
				<div className="flex items-center gap-3">
					<span className="text-sm font-medium">{attempt.stage_type}</span>
					<StatusBadge status={attempt.status} />
					{attempt.score != null ? (
						<span className="text-xs text-muted-foreground">
							{Math.round(attempt.score * 100)}%
						</span>
					) : null}
				</div>
				{expanded ? (
					<ChevronUp className="h-4 w-4 text-muted-foreground" />
				) : (
					<ChevronDown className="h-4 w-4 text-muted-foreground" />
				)}
			</button>
			{expanded && hasExpandableBody ? (
				<div className="border-t border-border px-4 py-3">
					{isHumanInterview ? (
						orgId ? (
							<HumanInterviewBlock
								jobId={jobId}
								applicationId={applicationId}
								orgId={orgId}
								stageId={attempt.stage_id}
							/>
						) : (
							<p className="text-sm text-muted-foreground">
								Loading organization context...
							</p>
						)
					) : attempt.responses ? (
						<ResponsesView
							stageType={attempt.stage_type}
							responses={attempt.responses}
						/>
					) : null}
				</div>
			) : null}
		</div>
	);
}

function StatusBadge({ status }: { status: StageAttempt["status"] }) {
	switch (status) {
		case "Completed":
			return (
				<Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
					Completed
				</Badge>
			);
		case "Failed":
			return <Badge variant="destructive">Failed</Badge>;
		case "Pending":
			return <Badge variant="outline">Pending</Badge>;
		case "InProgress":
			return <Badge variant="secondary">In Progress</Badge>;
		case "Skipped":
			return <Badge variant="outline">Skipped</Badge>;
		default:
			return <Badge variant="outline">{status}</Badge>;
	}
}

function ResponsesView({
	stageType,
	responses,
}: {
	stageType: string;
	responses: unknown;
}) {
	if (!responses || typeof responses !== "object") {
		return <pre className="text-xs">{JSON.stringify(responses, null, 2)}</pre>;
	}

	const r = responses as Record<string, unknown>;

	switch (stageType) {
		case "Prescreening":
			return <PrescreeningResponses responses={r} />;
		case "GenericAssessment":
			return <GenericResponses responses={r} />;
		case "CodingAssessment":
			return <CodingResponses responses={r} />;
		case "PsychometricAssessment":
			return <PsychometricResponses responses={r} />;
		default:
			return (
				<pre className="text-xs">{JSON.stringify(responses, null, 2)}</pre>
			);
	}
}

function PrescreeningResponses({
	responses,
}: {
	responses: Record<string, unknown>;
}) {
	const items = responses.responses;
	if (!Array.isArray(items) || items.length === 0) {
		return <pre className="text-xs">{JSON.stringify(responses, null, 2)}</pre>;
	}
	return (
		<ul className="space-y-2">
			{items.map((item, idx) => {
				const q = item as Record<string, unknown>;
				return (
					<li key={String(q.question_id ?? q.id ?? idx)} className="text-sm">
						<p className="font-medium">
							{String(q.question_label ?? q.question_id ?? "Question")}
						</p>
						<p className="text-muted-foreground">{JSON.stringify(q.answer)}</p>
					</li>
				);
			})}
		</ul>
	);
}

function GenericResponses({
	responses,
}: {
	responses: Record<string, unknown>;
}) {
	const items = responses.answers;
	if (!Array.isArray(items) || items.length === 0) {
		return <pre className="text-xs">{JSON.stringify(responses, null, 2)}</pre>;
	}
	return (
		<ul className="space-y-2">
			{items.map((item, idx) => {
				const a = item as Record<string, unknown>;
				const correct = a.is_correct ?? false;
				return (
					<li
						key={String(a.question_id ?? a.id ?? idx)}
						className="flex items-start gap-2 text-sm"
					>
						{correct ? (
							<Check className="mt-0.5 h-4 w-4 text-green-600" />
						) : (
							<X className="mt-0.5 h-4 w-4 text-destructive" />
						)}
						<div>
							<p className="font-medium">
								{String(a.question_text ?? a.question_id ?? "Question")}
							</p>
							<p className="text-muted-foreground">
								Selected:{" "}
								{String(a.selected_option_label ?? a.selected_option_id ?? "—")}
							</p>
						</div>
					</li>
				);
			})}
		</ul>
	);
}

function CodingResponses({
	responses,
}: {
	responses: Record<string, unknown>;
}) {
	const results = responses.results;
	if (!results || typeof results !== "object") {
		return <pre className="text-xs">{JSON.stringify(responses, null, 2)}</pre>;
	}
	const obj = results as Record<string, { passed?: boolean }>;
	return (
		<table className="w-full text-sm">
			<thead>
				<tr className="border-b border-border">
					<th className="py-1 text-left font-medium">Problem</th>
					<th className="py-1 text-left font-medium">Result</th>
				</tr>
			</thead>
			<tbody>
				{Object.entries(obj).map(([key, val]) => (
					<tr key={key} className="border-b border-border">
						<td className="py-1">{key}</td>
						<td className="py-1">
							{val.passed ? (
								<span className="text-green-600">Passed</span>
							) : (
								<span className="text-destructive">Failed</span>
							)}
						</td>
					</tr>
				))}
			</tbody>
		</table>
	);
}

function PsychometricResponses({
	responses,
}: {
	responses: Record<string, unknown>;
}) {
	const traitScores = responses.trait_scores;
	if (!traitScores || typeof traitScores !== "object") {
		return <pre className="text-xs">{JSON.stringify(responses, null, 2)}</pre>;
	}
	const obj = traitScores as Record<string, number>;
	return (
		<div className="space-y-3">
			{Object.entries(obj).map(([trait, score]) => (
				<div key={trait}>
					<div className="flex items-center justify-between text-sm">
						<span className="font-medium">{trait}</span>
						<span className="text-muted-foreground">
							{typeof score === "number" ? score.toFixed(1) : String(score)} /
							10
						</span>
					</div>
					<Progress
						value={typeof score === "number" ? score * 10 : 0}
						className="mt-1 h-2"
					/>
				</div>
			))}
		</div>
	);
}
