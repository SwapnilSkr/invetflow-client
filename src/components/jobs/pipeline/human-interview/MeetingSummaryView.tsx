import { useQuery } from "@tanstack/react-query";
import { ChevronDown, FileText } from "lucide-react";
import { useState } from "react";
import type { HumanInterviewSession } from "#/integrations/api/client";
import { humanInterviewQueries } from "#/integrations/api/queries";

export function MeetingSummaryView({
	session,
}: {
	session: HumanInterviewSession;
}) {
	const [expanded, setExpanded] = useState(false);
	const transcriptQuery = useQuery(
		humanInterviewQueries.transcript(session.id),
	);
	const transcript = transcriptQuery.data;

	if (!transcript) {
		if (session.transcript_status === "Streaming") {
			return (
				<p className="text-sm text-muted-foreground">
					Transcript is being finalized.
				</p>
			);
		}
		return null;
	}

	return (
		<div className="space-y-3 border-border border-t pt-3">
			<div className="flex items-center gap-2 text-sm font-medium text-foreground">
				<FileText className="size-4 text-muted-foreground" aria-hidden />
				Meeting summary
			</div>
			{transcript.summary_html ? (
				<div
					className="prose prose-sm max-w-none text-sm text-foreground"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: model output is constrained to simple summary HTML for recruiter review.
					dangerouslySetInnerHTML={{ __html: transcript.summary_html }}
				/>
			) : (
				<p className="text-sm text-muted-foreground">
					Summary is not available yet.
				</p>
			)}

			<div className="grid gap-2 sm:grid-cols-2">
				<ChipGroup title="Topics" values={transcript.key_topics} />
				<ChipGroup title="Actions" values={transcript.action_items} />
				<ChipGroup title="Strengths" values={transcript.strengths} />
				<ChipGroup title="Concerns" values={transcript.concerns} />
			</div>

			<button
				type="button"
				className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
				onClick={() => setExpanded((current) => !current)}
			>
				<ChevronDown
					className={`size-4 transition ${expanded ? "rotate-180" : ""}`}
					aria-hidden
				/>
				{expanded ? "Hide transcript" : "Show transcript"}
			</button>

			{expanded ? (
				<div className="max-h-72 space-y-2 overflow-y-auto rounded-md border border-border bg-muted/30 p-3">
					{transcript.turns.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							No transcript turns.
						</p>
					) : (
						transcript.turns.map((turn) => {
							const seconds = Math.max(0, Math.floor(turn.start_ms / 1000));
							const timestamp = formatTimestamp(seconds);
							return (
								<div
									key={`${turn.speaker_identity}:${turn.start_ms}:${turn.end_ms}:${turn.text}`}
									className="grid gap-1 text-sm"
								>
									<div className="flex min-w-0 items-center gap-2">
										<a
											href={
												session.recording_url
													? `${session.recording_url}#t=${seconds}`
													: undefined
											}
											target={session.recording_url ? "_blank" : undefined}
											rel={session.recording_url ? "noreferrer" : undefined}
											className="font-mono text-muted-foreground text-xs"
										>
											{timestamp}
										</a>
										<span className="truncate font-medium text-foreground text-xs">
											{turn.speaker_name || turn.speaker_identity}
										</span>
									</div>
									<p className="whitespace-pre-wrap break-words text-foreground">
										{turn.text}
									</p>
								</div>
							);
						})
					)}
				</div>
			) : null}
		</div>
	);
}

function ChipGroup({ title, values }: { title: string; values: string[] }) {
	if (values.length === 0) {
		return null;
	}
	return (
		<div className="space-y-1">
			<p className="text-muted-foreground text-xs">{title}</p>
			<div className="flex flex-wrap gap-1.5">
				{values.map((value) => (
					<span
						key={value}
						className="rounded-md border border-border bg-background px-2 py-1 text-foreground text-xs"
					>
						{value}
					</span>
				))}
			</div>
		</div>
	);
}

function formatTimestamp(totalSeconds: number) {
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;
	return [hours, minutes, seconds]
		.map((part) => String(part).padStart(2, "0"))
		.join(":");
}
