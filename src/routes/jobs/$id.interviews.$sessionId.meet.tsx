import { createFileRoute } from "@tanstack/react-router";
import { MeetingRoom } from "#/components/meeting/MeetingRoom";

export const Route = createFileRoute("/jobs/$id/interviews/$sessionId/meet")({
	component: RecruiterMeetingRoute,
});

function RecruiterMeetingRoute() {
	const { id, sessionId } = Route.useParams();
	return <MeetingRoom jobId={id} sessionId={sessionId} />;
}
