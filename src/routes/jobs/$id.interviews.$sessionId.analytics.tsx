import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BarChart3, Clock, FileText, HardDrive, Video } from "lucide-react";
import type { ReactNode } from "react";
import { MeetingTimeline } from "#/components/analytics/MeetingTimeline";
import { SpeakingTimeChart } from "#/components/analytics/SpeakingTimeChart";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import { humanInterviewQueries } from "#/integrations/api/queries";

export const Route = createFileRoute(
	"/jobs/$id/interviews/$sessionId/analytics",
)({
	component: MeetingAnalyticsRoute,
});

function MeetingAnalyticsRoute() {
	const { id, sessionId } = Route.useParams();
	const analytics = useQuery(humanInterviewQueries.analytics(id, sessionId));

	if (analytics.isPending) {
		return <Shell>Loading analytics...</Shell>;
	}

	if (analytics.isError) {
		return (
			<Shell>
				<span className="text-destructive">
					{analytics.error instanceof Error
						? analytics.error.message
						: "Could not load analytics."}
				</span>
			</Shell>
		);
	}

	const data = analytics.data;
	const transcript = data.transcript;
	const recording = data.recording;

	return (
		<div className="min-h-screen bg-background p-4 text-foreground md:p-6">
			<div className="mx-auto max-w-6xl space-y-6">
				<header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
					<div>
						<h1 className="font-semibold text-2xl">Meeting analytics</h1>
						<p className="text-muted-foreground text-sm">
							Scheduled {formatDateTime(data.scheduled_at)}
						</p>
					</div>
					<div className="flex flex-wrap gap-2">
						<Button asChild variant="outline">
							<Link
								to="/jobs/$id/interviews/$sessionId/playback"
								params={{ id, sessionId }}
							>
								<Video className="size-4" aria-hidden />
								Playback
							</Link>
						</Button>
						<Button asChild variant="outline">
							<Link to="/jobs/$id/pipeline" params={{ id }}>
								Back to pipeline
							</Link>
						</Button>
					</div>
				</header>

				<section className="grid gap-3 md:grid-cols-4">
					<MetricCard
						icon={<Clock className="size-4" aria-hidden />}
						label="Actual duration"
						value={
							data.actual_duration_seconds !== null
								? formatDuration(data.actual_duration_seconds)
								: "-"
						}
					/>
					<MetricCard
						icon={<Clock className="size-4" aria-hidden />}
						label="Scheduled"
						value={`${data.scheduled_duration_minutes}m`}
					/>
					<MetricCard
						icon={<BarChart3 className="size-4" aria-hidden />}
						label="Peak participants"
						value={data.participant_count_peak.toString()}
					/>
					<MetricCard
						icon={<FileText className="size-4" aria-hidden />}
						label="Transcript turns"
						value={transcript?.turn_count.toString() ?? "-"}
					/>
				</section>

				<Tabs defaultValue="timeline">
					<TabsList>
						<TabsTrigger value="timeline">Timeline</TabsTrigger>
						<TabsTrigger value="speaking">Speaking time</TabsTrigger>
						<TabsTrigger value="recording">Recording details</TabsTrigger>
						<TabsTrigger value="transcript">Transcript stats</TabsTrigger>
					</TabsList>
					<TabsContent value="timeline" className="mt-4">
						<Panel>
							<MeetingTimeline
								participants={data.participants}
								startedAt={data.started_at}
								endedAt={data.ended_at}
							/>
						</Panel>
					</TabsContent>
					<TabsContent value="speaking" className="mt-4">
						<Panel>
							<SpeakingTimeChart bySpeaker={transcript?.by_speaker ?? {}} />
						</Panel>
					</TabsContent>
					<TabsContent value="recording" className="mt-4">
						<Panel>
							<div className="grid gap-4 md:grid-cols-3">
								<Detail label="Status" value={recording?.status ?? "-"} />
								<Detail
									label="Size"
									value={
										recording?.size_bytes
											? formatBytes(recording.size_bytes)
											: "-"
									}
								/>
								<Detail
									label="Storage class"
									value={recording?.storage_class ?? "STANDARD / unknown"}
								/>
							</div>
							{recording?.storage_class === "GLACIER_IR" ? (
								<p className="mt-4 rounded-md bg-muted px-3 py-2 text-muted-foreground text-sm">
									Storage class: GLACIER_IR — retrieval may take seconds.
								</p>
							) : null}
							{recording?.url ? (
								<Button asChild className="mt-4" variant="outline">
									<a href={recording.url}>
										<HardDrive className="size-4" aria-hidden />
										Open recording object
									</a>
								</Button>
							) : null}
						</Panel>
					</TabsContent>
					<TabsContent value="transcript" className="mt-4">
						<Panel>
							<div className="mb-4 flex flex-wrap gap-2">
								<Badge variant="secondary">
									{transcript?.words ?? 0} words
								</Badge>
								<Badge variant="secondary">
									Summary{" "}
									{transcript?.summary_available ? "available" : "missing"}
								</Badge>
							</div>
							<SpeakingTimeChart bySpeaker={transcript?.by_speaker ?? {}} />
						</Panel>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}

function Shell({ children }: { children: ReactNode }) {
	return (
		<div className="grid min-h-screen place-items-center bg-background p-6 text-muted-foreground text-sm">
			{children}
		</div>
	);
}

function Panel({ children }: { children: ReactNode }) {
	return (
		<section className="rounded-md border border-border bg-card p-4">
			{children}
		</section>
	);
}

function MetricCard({
	icon,
	label,
	value,
}: {
	icon: ReactNode;
	label: string;
	value: string;
}) {
	return (
		<div className="rounded-md border border-border bg-card p-4">
			<p className="flex items-center gap-2 text-muted-foreground text-xs">
				{icon}
				{label}
			</p>
			<p className="mt-2 font-semibold text-2xl">{value}</p>
		</div>
	);
}

function Detail({ label, value }: { label: string; value: string }) {
	return (
		<div>
			<p className="text-muted-foreground text-xs">{label}</p>
			<p className="mt-1 font-medium text-sm">{value}</p>
		</div>
	);
}

function formatDateTime(value: string) {
	return new Intl.DateTimeFormat(undefined, {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(new Date(value));
}

function formatDuration(seconds: number) {
	const minutes = Math.floor(seconds / 60);
	const remainder = seconds % 60;
	return `${minutes}m ${remainder}s`;
}

function formatBytes(bytes: number) {
	const units = ["B", "KB", "MB", "GB"];
	let value = bytes;
	let unit = 0;
	while (value >= 1024 && unit < units.length - 1) {
		value /= 1024;
		unit += 1;
	}
	return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}
