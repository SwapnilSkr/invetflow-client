import { LiveKitRoom, RoomAudioRenderer } from "@livekit/components-react";
import "@livekit/components-styles";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { lazy, Suspense, useState } from "react";
import { MeetingExperience } from "#/components/meeting/MeetingExperience";
import { PreCallScreen } from "#/components/meeting/PreCallScreen";
import { WaitingRoomGate } from "#/components/meeting/WaitingRoomGate";
import { Alert, AlertDescription } from "#/components/ui/alert";
import { Button } from "#/components/ui/button";
import { humanInterviewQueries } from "#/integrations/api/queries";

const HostControlsMenu = lazy(() =>
	import("#/components/meeting/HostControlsMenu").then((module) => ({
		default: module.HostControlsMenu,
	})),
);

type MeetingRoomProps = {
	sessionId: string;
	jobId: string;
	isHost?: boolean;
	allowScreenShare?: boolean;
	showWebRtcStats?: boolean;
};

export function MeetingRoom({
	sessionId,
	jobId,
	isHost = false,
	allowScreenShare = true,
	showWebRtcStats = false,
}: MeetingRoomProps) {
	const navigate = useNavigate();
	const [phase, setPhase] = useState<"pre-call" | "in-meeting">("pre-call");
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

	if (phase === "pre-call") {
		return (
			<PreCallScreen
				sessionTitle="Human interview"
				onJoin={() => setPhase("in-meeting")}
			/>
		);
	}

	return (
		<div className="h-[100dvh] overflow-hidden bg-meeting-bg">
			<LiveKitRoom
				className="h-[100dvh] overflow-hidden bg-meeting-bg"
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
				<WaitingRoomGate
					sessionId={sessionId}
					jobId={joinMeeting.data.job_id}
					applicationId={joinMeeting.data.application_id}
					isHost={isHost}
				>
					<div className="relative h-full">
						{isHost ? (
							<div className="absolute top-4 right-4 z-40">
								<Suspense fallback={null}>
									<HostControlsMenu
										sessionId={sessionId}
										jobId={joinMeeting.data.job_id}
										applicationId={joinMeeting.data.application_id}
									/>
								</Suspense>
							</div>
						) : null}
						<MeetingExperience
							title="Human interview"
							roleLabel={isHost ? "Recruiter room" : "Candidate room"}
							allowScreenShare={allowScreenShare}
							sessionId={sessionId}
							showWebRtcStats={showWebRtcStats}
						/>
					</div>
				</WaitingRoomGate>
				<RoomAudioRenderer />
			</LiveKitRoom>
		</div>
	);
}
