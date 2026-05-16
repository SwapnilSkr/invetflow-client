import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { RecordingPlaybackView } from "#/components/meeting/RecordingPlaybackView";
import { humanInterviewQueries } from "#/integrations/api/queries";

export const Route = createFileRoute(
	"/jobs/$id/interviews/$sessionId/playback",
)({
	component: MeetingPlaybackRoute,
});

function MeetingPlaybackRoute() {
	const { sessionId } = Route.useParams();
	const session = useQuery(humanInterviewQueries.detail(sessionId));
	const transcript = useQuery(humanInterviewQueries.transcript(sessionId));

	if (session.isPending || transcript.isPending) {
		return <RouteShell>Loading playback...</RouteShell>;
	}

	if (session.isError || transcript.isError) {
		const error = session.error ?? transcript.error;
		return (
			<RouteShell>
				<span className="text-destructive">
					{error instanceof Error ? error.message : "Could not load playback."}
				</span>
			</RouteShell>
		);
	}

	return (
		<RecordingPlaybackView
			session={session.data}
			transcript={transcript.data ?? null}
		/>
	);
}

function RouteShell({ children }: { children: ReactNode }) {
	return (
		<div className="grid min-h-screen place-items-center bg-background p-6 text-muted-foreground text-sm">
			{children}
		</div>
	);
}
