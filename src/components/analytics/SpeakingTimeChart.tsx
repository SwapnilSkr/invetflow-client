import type { MeetingAnalyticsSpeakerStats } from "#/integrations/api/client";

type SpeakingTimeChartProps = {
	bySpeaker: Record<string, MeetingAnalyticsSpeakerStats>;
};

export function SpeakingTimeChart({ bySpeaker }: SpeakingTimeChartProps) {
	const rows = Object.entries(bySpeaker).sort(
		([, left], [, right]) => right.words - left.words,
	);
	const totalWords = rows.reduce((sum, [, stats]) => sum + stats.words, 0);

	if (rows.length === 0) {
		return (
			<p className="rounded-md border border-border bg-card px-3 py-3 text-muted-foreground text-sm">
				No final transcript turns available yet.
			</p>
		);
	}

	return (
		<div className="space-y-3">
			{rows.map(([speaker, stats]) => {
				const percent = totalWords > 0 ? (stats.words / totalWords) * 100 : 0;
				return (
					<div
						key={speaker}
						className="grid gap-2 md:grid-cols-[220px_minmax(0,1fr)_110px]"
					>
						<div className="min-w-0">
							<p className="truncate font-medium text-foreground text-sm">
								{speaker}
							</p>
							<p className="text-muted-foreground text-xs">
								{stats.turns} turns · {stats.words} words
							</p>
						</div>
						<div className="h-8 overflow-hidden rounded bg-muted">
							<div
								className="h-full rounded bg-primary"
								style={{ width: `${Math.max(2, percent)}%` }}
							/>
						</div>
						<p className="text-muted-foreground text-sm md:text-right">
							{percent.toFixed(1)}%
						</p>
					</div>
				);
			})}
		</div>
	);
}
