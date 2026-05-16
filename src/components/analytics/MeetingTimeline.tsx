import type { MeetingAnalyticsParticipant } from "#/integrations/api/client";

type MeetingTimelineProps = {
	participants: MeetingAnalyticsParticipant[];
	startedAt: string | null;
	endedAt: string | null;
};

export function MeetingTimeline({
	participants,
	startedAt,
	endedAt,
}: MeetingTimelineProps) {
	const start = minTime(
		startedAt,
		participants.map((p) => p.joined_at),
	);
	const end = maxTime(
		endedAt,
		participants.map((p) => p.left_at ?? p.joined_at),
	);
	const span = Math.max(1, end - start);

	return (
		<div className="space-y-3">
			{participants.length === 0 ? (
				<p className="rounded-md border border-border bg-card px-3 py-3 text-muted-foreground text-sm">
					No participant events recorded yet.
				</p>
			) : (
				participants.map((participant) => {
					const joined = new Date(participant.joined_at).getTime();
					const left = participant.left_at
						? new Date(participant.left_at).getTime()
						: end;
					const offset = ((joined - start) / span) * 100;
					const width = Math.max(2, ((left - joined) / span) * 100);
					return (
						<div
							key={`${participant.identity}:${participant.joined_at}`}
							className="grid gap-2 md:grid-cols-[220px_minmax(0,1fr)_90px]"
						>
							<div className="min-w-0">
								<p className="truncate font-medium text-foreground text-sm">
									{participant.display_name || participant.identity}
								</p>
								<p className="truncate text-muted-foreground text-xs">
									{formatTime(participant.joined_at)} -{" "}
									{participant.left_at
										? formatTime(participant.left_at)
										: "Open"}
								</p>
							</div>
							<div className="relative h-8 overflow-hidden rounded bg-muted">
								<div
									className="absolute top-1 bottom-1 rounded bg-primary"
									style={{ left: `${offset}%`, width: `${width}%` }}
								/>
							</div>
							<p className="text-muted-foreground text-sm md:text-right">
								{formatDuration(participant.seconds_present)}
							</p>
						</div>
					);
				})
			)}
		</div>
	);
}

function minTime(seed: string | null, values: string[]) {
	const times = values.map((value) => new Date(value).getTime());
	if (seed) {
		times.push(new Date(seed).getTime());
	}
	return Math.min(...times.filter(Number.isFinite));
}

function maxTime(seed: string | null, values: string[]) {
	const times = values.map((value) => new Date(value).getTime());
	if (seed) {
		times.push(new Date(seed).getTime());
	}
	return Math.max(...times.filter(Number.isFinite));
}

function formatTime(value: string) {
	return new Intl.DateTimeFormat(undefined, {
		hour: "2-digit",
		minute: "2-digit",
	}).format(new Date(value));
}

function formatDuration(seconds: number) {
	const minutes = Math.floor(seconds / 60);
	const remainder = seconds % 60;
	return `${minutes}m ${remainder}s`;
}
