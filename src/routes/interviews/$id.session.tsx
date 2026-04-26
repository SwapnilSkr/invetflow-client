import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ConnectionState } from "livekit-client";
import { CheckCircle2 } from "lucide-react";
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { AIInterviewTranscript } from "#/components/candidate/AIInterviewTranscript";
import { InterviewControls } from "#/components/candidate/InterviewControls";
import { InterviewStatusBar } from "#/components/candidate/InterviewStatusBar";
import { TechCheck } from "#/components/candidate/TechCheck";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import { sessionQueries, useEndSession } from "#/integrations/api/queries";
import { useInterviewRoom } from "#/integrations/livekit/use-interview-room";
import { requireSession } from "#/lib/require-session";

interface SessionSearch {
	sessionId: string;
	token: string;
	url: string;
	/** Set to `"1"` after tech check so refresh / Strict remounts can resume the same step. */
	startRoom?: string;
}

function parseSessionSearch(search: Record<string, unknown>): SessionSearch {
	return {
		sessionId: String(search.sessionId ?? ""),
		token: String(search.token ?? ""),
		url: String(search.url ?? ""),
		startRoom:
			typeof search.startRoom === "string" ? search.startRoom : undefined,
	};
}

export const Route = createFileRoute("/interviews/$id/session")({
	beforeLoad: requireSession,
	validateSearch: (search: Record<string, unknown>): SessionSearch =>
		parseSessionSearch(search),
	component: InterviewSessionPage,
});

function InterviewSessionPage() {
	const { id } = Route.useParams();
	const { sessionId, token, url, startRoom } = Route.useSearch();
	const navigate = useNavigate();

	const pastTechCheck = startRoom === "1";
	const [phase, setPhase] = useState<"tech-check" | "interview" | "completed">(
		() => (pastTechCheck ? "interview" : "tech-check"),
	);
	const [shouldConnectToLiveKit, setShouldConnectToLiveKit] = useState(
		() => pastTechCheck,
	);
	const [duration, setDuration] = useState(0);
	const durationRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const videoContainerRef = useRef<HTMLDivElement>(null);

	const room = useInterviewRoom();
	const {
		connect: connectToRoom,
		connectionState,
		disconnect: disconnectFromRoom,
	} = room;
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

	// After the interview layout commits, connect so the video ref exists. useLayoutEffect
	// + URL `startRoom=1` avoid losing this step to React Strict Mode remounts.
	useLayoutEffect(() => {
		if (!shouldConnectToLiveKit || phase !== "interview") return;
		if (!sessionId || !token || !url) return;
		setShouldConnectToLiveKit(false);

		let attempts = 0;
		const run = () => {
			const el = videoContainerRef.current;
			if (!el && attempts < 30) {
				attempts += 1;
				requestAnimationFrame(run);
				return;
			}
			if (el) {
				void connectToRoom(url, token, { mediaContainer: el });
			}
		};
		run();
	}, [shouldConnectToLiveKit, phase, url, token, connectToRoom, sessionId]);

	// Duration timer
	useEffect(() => {
		if (
			phase === "interview" &&
			connectionState === ConnectionState.Connected
		) {
			durationRef.current = setInterval(() => {
				setDuration((d) => d + 1);
			}, 1000);
		}
		return () => {
			if (durationRef.current) clearInterval(durationRef.current);
		};
	}, [phase, connectionState]);

	const handleTechCheckComplete = useCallback(() => {
		setPhase("interview");
		setShouldConnectToLiveKit(true);
		void navigate({
			to: "/interviews/$id/session",
			params: { id },
			search: (prev) => ({ ...prev, startRoom: "1" }),
			replace: true,
		});
	}, [navigate, id]);

	const handleEndCall = useCallback(async () => {
		await disconnectFromRoom();
		await endSession.mutateAsync(sessionId);
		setPhase("completed");
	}, [disconnectFromRoom, endSession, sessionId]);

	const getConnectionStatus = ():
		| "connecting"
		| "connected"
		| "reconnecting"
		| "error" => {
		switch (connectionState) {
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

	if (!sessionId || !token || !url) {
		return (
			<main className="page-wrap mx-auto max-w-lg px-4 py-16">
				<Card>
					<CardContent className="space-y-3 p-8">
						<h1 className="text-lg font-semibold">Invalid session link</h1>
						<p className="text-sm text-muted-foreground">
							This page needs session, token, and room URL. Open Join interview
							from the interview page again.
						</p>
						<Button asChild>
							<Link to="/interviews/$id" params={{ id }}>
								Back to interview
							</Link>
						</Button>
					</CardContent>
				</Card>
			</main>
		);
	}

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
								Your interview has been recorded. You&rsquo;ll receive feedback
								shortly.
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
				networkQuality={room.networkQuality}
				duration={duration}
			/>

			{connectionState === ConnectionState.Connected &&
				room.remoteParticipantCount === 0 && (
					<div className="border-b border-amber-200/60 bg-amber-50/95 px-4 py-2.5 text-center text-xs leading-relaxed text-amber-950 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-100">
						<strong className="font-semibold">
							You are the only participant in the room.
						</strong>{" "}
						Run the <strong>invetflow-agent</strong> worker (and set
						LIVEKIT_AGENT_NAME=invetflow-agent plus AGENT_API_SECRET on the server)
						so the AI interviewer can join, or use another client on the same room.{" "}
						<a
							href="https://docs.livekit.io/agents/"
							className="underline underline-offset-2"
							target="_blank"
							rel="noreferrer"
						>
							LiveKit Agents
						</a>
					</div>
				)}

			<div className="flex-1 flex overflow-hidden">
				{/* Video area */}
				<div className="flex-1 flex items-center justify-center bg-neutral-950 relative">
					<div
						id="livekit-video-container"
						ref={videoContainerRef}
						className="grid h-full w-full min-h-0 min-w-0 grid-cols-1 place-items-stretch gap-0 md:grid-cols-2"
					/>

					{connectionState !== ConnectionState.Connected && (
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
				disabled={connectionState !== ConnectionState.Connected}
			/>
		</div>
	);
}
