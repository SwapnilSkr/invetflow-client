import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ConnectionState } from "livekit-client";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import { useInterviewRoom } from "#/integrations/livekit/use-interview-room";
import { sessionQueries, useEndSession } from "#/integrations/api/queries";
import { InterviewStatusBar } from "#/components/candidate/InterviewStatusBar";
import { InterviewControls } from "#/components/candidate/InterviewControls";
import { AIInterviewTranscript } from "#/components/candidate/AIInterviewTranscript";
import { TechCheck } from "#/components/candidate/TechCheck";
import { requireSession } from "#/lib/require-session";

interface SessionSearch {
	sessionId: string;
	token: string;
	url: string;
}

export const Route = createFileRoute("/interviews/$id/session")({
	beforeLoad: requireSession,
	validateSearch: (search: Record<string, unknown>): SessionSearch => ({
		sessionId: search.sessionId as string,
		token: search.token as string,
		url: search.url as string,
	}),
	component: InterviewSessionPage,
});

function InterviewSessionPage() {
	const { id } = Route.useParams();
	const { sessionId, token, url } = Route.useSearch();
	const navigate = useNavigate();

	const [phase, setPhase] = useState<"tech-check" | "interview" | "completed">("tech-check");
	const [duration, setDuration] = useState(0);
	const durationRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const room = useInterviewRoom();
	const endSession = useEndSession();

	const { data: session } = useQuery({
		...sessionQueries.detail(sessionId),
		enabled: !!sessionId,
		refetchInterval: phase === "interview" ? 10000 : false,
	});

	const { data: transcriptData } = useQuery({
		...sessionQueries.transcript(sessionId),
		enabled: !!sessionId && phase === "interview",
		refetchInterval: phase === "interview" ? 3000 : false,
	});

	// Duration timer
	useEffect(() => {
		if (phase === "interview" && room.connectionState === ConnectionState.Connected) {
			durationRef.current = setInterval(() => {
				setDuration((d) => d + 1);
			}, 1000);
		}
		return () => {
			if (durationRef.current) clearInterval(durationRef.current);
		};
	}, [phase, room.connectionState]);

	const handleTechCheckComplete = useCallback(async () => {
		setPhase("interview");
		await room.connect(url, token);
	}, [url, token, room]);

	const handleEndCall = useCallback(async () => {
		await room.disconnect();
		await endSession.mutateAsync(sessionId);
		setPhase("completed");
	}, [room, endSession, sessionId]);

	const getConnectionStatus = (): "connecting" | "connected" | "reconnecting" | "error" => {
		switch (room.connectionState) {
			case ConnectionState.Connected:
				return "connected";
			case ConnectionState.Connecting:
				return "connecting";
			case ConnectionState.Reconnecting:
				return "reconnecting";
			default:
				return room.error ? "error" : "connecting";
		}
	};

	const transcriptMessages = (transcriptData?.entries ?? []).map((entry) => ({
		id: entry.id,
		type: entry.speaker.toLowerCase() as "ai" | "candidate" | "system",
		content: entry.content,
		timestamp: new Date(entry.timestamp),
		metadata: {
			confidence: entry.confidence ?? undefined,
		},
	}));

	if (phase === "tech-check") {
		return (
			<main className="page-wrap mx-auto max-w-2xl px-4 py-8">
				<TechCheck
					onComplete={handleTechCheckComplete}
					onCancel={() => navigate({ to: "/interviews/$id", params: { id } })}
				/>
			</main>
		);
	}

	if (phase === "completed") {
		return (
			<main className="page-wrap flex justify-center px-4 py-20">
				<Card className="w-full max-w-md text-center">
					<CardContent className="space-y-5 py-12">
						<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/30">
							<CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
						</div>
						<div>
							<h1 className="text-2xl font-bold">Interview Complete</h1>
							<p className="mt-2 text-muted-foreground">
								Your interview has been recorded. You&rsquo;ll receive
								feedback shortly.
							</p>
						</div>
						<p className="text-sm text-muted-foreground">
							Duration: {Math.floor(duration / 60)}m {duration % 60}s
						</p>
						<Button asChild className="mt-2">
							<Link to="/interviews">Back to Interviews</Link>
						</Button>
					</CardContent>
				</Card>
			</main>
		);
	}

	return (
		<div className="flex flex-col h-[calc(100vh-64px)]">
			<InterviewStatusBar
				status={getConnectionStatus()}
				audioEnabled={room.isMicEnabled}
				videoEnabled={room.isCameraEnabled}
				networkQuality="good"
				duration={duration}
			/>

			<div className="flex-1 flex overflow-hidden">
				{/* Video area */}
				<div className="flex-1 flex items-center justify-center bg-neutral-950 relative">
					<div id="livekit-video-container" className="w-full h-full" />

					{room.connectionState !== ConnectionState.Connected && (
						<div className="absolute inset-0 flex items-center justify-center bg-neutral-950/80">
							<div className="text-center text-white">
								<div className="h-8 w-8 mx-auto mb-3 animate-spin rounded-full border-2 border-neutral-600 border-t-white" />
								<p className="text-sm">
									{room.error || "Connecting to interview room..."}
								</p>
							</div>
						</div>
					)}
				</div>

				{/* Transcript sidebar */}
				<div className="w-96 border-l flex flex-col bg-white dark:bg-neutral-900">
					<div className="px-4 py-3 border-b">
						<h2 className="text-sm font-semibold">Interview Transcript</h2>
						<p className="text-xs text-neutral-500">
							{session?.current_question_index !== undefined
								? `Question ${session.current_question_index + 1}`
								: "Waiting..."}
						</p>
					</div>
					<AIInterviewTranscript
						messages={transcriptMessages}
						className="flex-1"
					/>
				</div>
			</div>

			<InterviewControls
				audioEnabled={room.isMicEnabled}
				videoEnabled={room.isCameraEnabled}
				screenSharing={room.isScreenShareEnabled}
				onToggleAudio={() => void room.toggleMic()}
				onToggleVideo={() => void room.toggleCamera()}
				onToggleScreenShare={() => void room.toggleScreenShare()}
				onEndCall={() => void handleEndCall()}
				disabled={room.connectionState !== ConnectionState.Connected}
			/>
		</div>
	);
}
