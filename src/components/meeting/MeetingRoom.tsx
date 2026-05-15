import { LiveKitRoom, RoomAudioRenderer } from "@livekit/components-react";
import "@livekit/components-styles";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { MeetingExperience } from "#/components/meeting/MeetingExperience";
import { Alert, AlertDescription } from "#/components/ui/alert";
import { Button } from "#/components/ui/button";
import { humanInterviewQueries } from "#/integrations/api/queries";

type MeetingRoomProps = {
	sessionId: string;
	jobId: string;
};

export function MeetingRoom({ sessionId, jobId }: MeetingRoomProps) {
	const navigate = useNavigate();
	const joinMeeting = useQuery(humanInterviewQueries.joinToken(sessionId));

	if (joinMeeting.isError) {
		const message =
			joinMeeting.error instanceof Error
				? joinMeeting.error.message
				: "Could not join this meeting.";
		return (
			<div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-4 p-6">
				<Alert variant="destructive">
					<AlertDescription>{message}</AlertDescription>
				</Alert>
				<Button
					type="button"
					variant="outline"
					onClick={() =>
						navigate({ to: "/jobs/$id/pipeline", params: { id: jobId } })
					}
				>
					Back to pipeline
				</Button>
			</div>
		);
	}

	if (joinMeeting.isPending || !joinMeeting.data) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background text-foreground">
				<div className="flex items-center gap-3 text-sm text-muted-foreground">
					<Loader2 className="size-5 animate-spin" aria-hidden />
					Joining meeting...
				</div>
			</div>
		);
	}

	return (
		<div className="h-screen bg-background">
			<LiveKitRoom
				serverUrl={joinMeeting.data.livekit_url}
				token={joinMeeting.data.livekit_token}
				connect
				video
				audio
				options={{
					adaptiveStream: true,
					dynacast: true,
					videoCaptureDefaults: {
						resolution: { width: 1280, height: 720, frameRate: 24 },
					},
					publishDefaults: {
						dtx: true,
						red: true,
						videoCodec: "av1",
					},
				}}
				onDisconnected={() =>
					navigate({ to: "/jobs/$id/pipeline", params: { id: jobId } })
				}
			>
				<MeetingExperience title="Human interview" roleLabel="Recruiter room" />
				<RoomAudioRenderer />
			</LiveKitRoom>
		</div>
	);
}
