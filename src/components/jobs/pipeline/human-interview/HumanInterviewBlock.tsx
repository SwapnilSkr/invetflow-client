import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import {
	Calendar,
	CalendarClock,
	ExternalLink,
	MapPin,
	Users,
} from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "#/components/ui/alert";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import type { HumanInterviewSession } from "#/integrations/api/client";
import {
	humanInterviewQueries,
	useCancelHumanInterview,
} from "#/integrations/api/queries";
import { OutcomeDialog } from "./OutcomeDialog";
import { ScheduleHumanInterviewDialog } from "./ScheduleHumanInterviewDialog";

interface HumanInterviewBlockProps {
	jobId: string;
	applicationId: string;
	orgId: string;
	stageId: string;
}

export function HumanInterviewBlock({
	jobId,
	applicationId,
	orgId,
	stageId,
}: HumanInterviewBlockProps) {
	const query = useQuery(
		humanInterviewQueries.forApplication(jobId, applicationId),
	);

	if (query.isLoading) {
		return <Skeleton className="h-32 w-full rounded-md" />;
	}
	if (query.isError) {
		return (
			<Alert variant="destructive">
				<AlertDescription>
					Could not load the human interview for this stage.
				</AlertDescription>
			</Alert>
		);
	}

	// Latest session for this stage (server returns newest first).
	const session = (query.data ?? []).find((s) => s.stage_id === stageId);

	if (!session) {
		return (
			<EmptyState
				jobId={jobId}
				applicationId={applicationId}
				orgId={orgId}
				stageId={stageId}
			/>
		);
	}

	if (session.status === "Completed") {
		return <CompletedView session={session} />;
	}

	if (session.status === "Cancelled" || session.status === "NoShow") {
		return (
			<TerminalNonCompleted
				session={session}
				jobId={jobId}
				applicationId={applicationId}
				orgId={orgId}
				stageId={stageId}
			/>
		);
	}

	return (
		<ScheduledView
			session={session}
			jobId={jobId}
			applicationId={applicationId}
			orgId={orgId}
			stageId={stageId}
		/>
	);
}

function EmptyState({
	jobId,
	applicationId,
	orgId,
	stageId,
}: HumanInterviewBlockProps) {
	const [open, setOpen] = useState(false);
	return (
		<div className="flex flex-col items-start gap-3 rounded-md border border-dashed border-border bg-muted/30 p-4">
			<div className="flex items-start gap-2">
				<CalendarClock
					className="mt-0.5 h-4 w-4 text-muted-foreground"
					aria-hidden="true"
				/>
				<div>
					<p className="text-sm font-medium text-foreground">
						No interview scheduled yet
					</p>
					<p className="text-xs text-muted-foreground">
						Pick interviewers and a time. The candidate will see the details.
					</p>
				</div>
			</div>
			<Button type="button" size="sm" onClick={() => setOpen(true)}>
				Schedule interview
			</Button>
			<ScheduleHumanInterviewDialog
				open={open}
				onOpenChange={setOpen}
				jobId={jobId}
				applicationId={applicationId}
				orgId={orgId}
				stageId={stageId}
			/>
		</div>
	);
}

function ScheduledView({
	session,
	jobId,
	applicationId,
	orgId,
	stageId,
}: {
	session: HumanInterviewSession;
} & HumanInterviewBlockProps) {
	const [rescheduleOpen, setRescheduleOpen] = useState(false);
	const [outcomeOpen, setOutcomeOpen] = useState(false);
	const cancel = useCancelHumanInterview(jobId, applicationId);

	const at = new Date(session.scheduled_at);
	const absoluteLabel = format(at, "EEE, MMM d 'at' h:mm a");
	const relativeLabel = formatDistanceToNow(at, { addSuffix: true });

	const handleCancel = () => {
		if (
			!window.confirm("Cancel this interview? The candidate will be reset.")
		) {
			return;
		}
		cancel.mutate(session.id);
	};

	return (
		<div className="space-y-3 rounded-md border border-border bg-card p-4">
			<div className="flex flex-wrap items-center gap-2">
				<Badge variant="secondary">{session.status}</Badge>
				<span className="text-sm font-medium text-foreground">
					{absoluteLabel}
				</span>
				<span className="text-xs text-muted-foreground">{relativeLabel}</span>
				<span className="text-xs text-muted-foreground">
					· {session.duration_minutes} min · {session.timezone}
				</span>
			</div>

			<div className="flex flex-wrap items-start gap-x-6 gap-y-2 text-sm text-foreground">
				<div className="flex items-start gap-2">
					<Users
						className="mt-0.5 h-4 w-4 text-muted-foreground"
						aria-hidden="true"
					/>
					<span>
						{session.interviewer_names.length > 0
							? session.interviewer_names.join(", ")
							: "(no interviewers)"}
					</span>
				</div>
				{session.meeting_link ? (
					<a
						href={session.meeting_link}
						target="_blank"
						rel="noreferrer"
						className="inline-flex items-center gap-1.5 text-primary hover:underline"
					>
						<ExternalLink className="h-4 w-4" aria-hidden="true" />
						Meeting link
					</a>
				) : null}
				{session.location ? (
					<div className="flex items-start gap-2">
						<MapPin
							className="mt-0.5 h-4 w-4 text-muted-foreground"
							aria-hidden="true"
						/>
						<span>{session.location}</span>
					</div>
				) : null}
			</div>

			<div className="flex flex-wrap gap-2 pt-1">
				<Button
					type="button"
					size="sm"
					onClick={() => setOutcomeOpen(true)}
					disabled={cancel.isPending}
				>
					Record outcome
				</Button>
				<Button
					type="button"
					size="sm"
					variant="outline"
					onClick={() => setRescheduleOpen(true)}
					disabled={cancel.isPending}
				>
					Reschedule
				</Button>
				<Button
					type="button"
					size="sm"
					variant="ghost"
					onClick={handleCancel}
					disabled={cancel.isPending}
				>
					Cancel
				</Button>
			</div>

			<ScheduleHumanInterviewDialog
				key={`${session.id}:${session.updated_at}:schedule`}
				open={rescheduleOpen}
				onOpenChange={setRescheduleOpen}
				jobId={jobId}
				applicationId={applicationId}
				orgId={orgId}
				stageId={stageId}
				existing={session}
			/>
			<OutcomeDialog
				key={`${session.id}:${session.updated_at}:outcome`}
				open={outcomeOpen}
				onOpenChange={setOutcomeOpen}
				jobId={jobId}
				applicationId={applicationId}
				session={session}
			/>
		</div>
	);
}

function CompletedView({ session }: { session: HumanInterviewSession }) {
	const at = new Date(session.scheduled_at);
	return (
		<div className="space-y-3 rounded-md border border-border bg-card p-4">
			<div className="flex flex-wrap items-center gap-2">
				{session.outcome === "Pass" ? (
					<Badge>Pass</Badge>
				) : session.outcome === "Fail" ? (
					<Badge variant="destructive">Fail</Badge>
				) : (
					<Badge variant="outline">Completed</Badge>
				)}
				{session.score != null ? (
					<span className="text-sm font-medium text-foreground">
						{session.score.toFixed(1)} / 10
					</span>
				) : null}
				<span className="ml-auto text-xs text-muted-foreground">
					<Calendar className="mr-1 inline h-3 w-3" aria-hidden="true" />
					{format(at, "MMM d, yyyy")}
				</span>
			</div>
			<div className="flex items-start gap-2 text-sm text-foreground">
				<Users
					className="mt-0.5 h-4 w-4 text-muted-foreground"
					aria-hidden="true"
				/>
				<span>
					{session.interviewer_names.length > 0
						? session.interviewer_names.join(", ")
						: "(no interviewers)"}
				</span>
			</div>
			{session.feedback_html ? (
				// Trust boundary: feedback HTML is authored by authenticated recruiters via our own Tiptap editor,
				// sanitized by Tiptap's schema before being persisted server-side. Render directly.
				<div
					className="prose prose-sm max-w-none text-sm text-foreground"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: see comment above
					dangerouslySetInnerHTML={{ __html: session.feedback_html }}
				/>
			) : (
				<p className="text-sm text-muted-foreground">No feedback recorded.</p>
			)}
		</div>
	);
}

function TerminalNonCompleted({
	session,
	jobId,
	applicationId,
	orgId,
	stageId,
}: {
	session: HumanInterviewSession;
} & HumanInterviewBlockProps) {
	const [open, setOpen] = useState(false);
	return (
		<div className="space-y-3 rounded-md border border-border bg-muted/40 p-4">
			<div className="flex items-center gap-2">
				<Badge variant="outline">{session.status}</Badge>
				<span className="text-sm text-muted-foreground">
					Last attempt {format(new Date(session.scheduled_at), "MMM d, yyyy")}
				</span>
			</div>
			<Button type="button" size="sm" onClick={() => setOpen(true)}>
				Schedule a new interview
			</Button>
			<ScheduleHumanInterviewDialog
				open={open}
				onOpenChange={setOpen}
				jobId={jobId}
				applicationId={applicationId}
				orgId={orgId}
				stageId={stageId}
			/>
		</div>
	);
}
