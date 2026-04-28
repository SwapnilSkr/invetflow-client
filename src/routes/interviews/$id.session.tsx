import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ConnectionState } from "livekit-client";
import { CheckCircle2 } from "lucide-react";
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { AIInterviewTranscript } from "#/components/candidate/AIInterviewTranscript";
import { InterviewControls } from "#/components/candidate/InterviewControls";
import { InterviewStatusBar } from "#/components/candidate/InterviewStatusBar";
import { TechCheck } from "#/components/candidate/TechCheck";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import {
	sessionQueries,
	useEndSession,
	useJoinInterview,
} from "#/integrations/api/queries";
import { useInterviewRoom } from "#/integrations/livekit/use-interview-room";
import { readStoredInterviewAudioDevices } from "#/lib/interview-audio-prefs";
import { requireSession } from "#/lib/require-session";

interface SessionSearch {
	sessionId: string;
	token?: string;
	url?: string;
	/** Set to `"1"` after tech check so refresh / Strict remounts can resume the same step. */
	startRoom?: string;
}

function parseSessionSearch(search: Record<string, unknown>): SessionSearch {
	const token = typeof search.token === "string" ? search.token.trim() : "";
	const url = typeof search.url === "string" ? search.url.trim() : "";
	return {
		sessionId: String(search.sessionId ?? ""),
		token: token || undefined,
		url: url || undefined,
		startRoom:
			typeof search.startRoom === "string" ? search.startRoom : undefined,
	};
}

function isTerminalSessionStatus(status?: string) {
	return status === "Completed" || status === "Cancelled";
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
	const [phase, setPhase] = useState<"tech-check" | "interview">(() =>
		pastTechCheck ? "interview" : "tech-check",
	);
	const [shouldConnectToLiveKit, setShouldConnectToLiveKit] = useState(
		() => pastTechCheck,
	);
	const [duration, setDuration] = useState(0);
	const [sessionActionError, setSessionActionError] = useState<string | null>(
		null,
	);
	const durationRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const videoContainerRef = useRef<HTMLDivElement>(null);

	const room = useInterviewRoom();
	const {
		connect: connectToRoom,
		connectionState,
		disconnect: disconnectFromRoom,
	} = room;
	const endSession = useEndSession();
	const joinInterview = useJoinInterview();

	const { data: session, isLoading: isSessionLoading } = useQuery({
		...sessionQueries.detail(sessionId),
		enabled: !!sessionId,
		refetchInterval: phase === "interview" ? 10000 : false,
	});
	const isTerminalSession = isTerminalSessionStatus(session?.status);
	const isLiveInterview = phase === "interview" && !isTerminalSession;

	const { data: transcriptData } = useQuery({
		...sessionQueries.transcript(sessionId),
		enabled: !!sessionId && isLiveInterview,
		refetchInterval: isLiveInterview ? 1500 : false,
	});

	// After the interview layout commits, connect so the video ref exists. useLayoutEffect
	// + URL `startRoom=1` avoid losing this step to React Strict Mode remounts.
	useLayoutEffect(() => {
		if (!shouldConnectToLiveKit || !isLiveInterview) return;
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
				const audioPrefs = readStoredInterviewAudioDevices();
				void connectToRoom(url, token, {
					mediaContainer: el,
					...audioPrefs,
				});
			}
		};
		run();
	}, [
		shouldConnectToLiveKit,
		isLiveInterview,
		url,
		token,
		connectToRoom,
		sessionId,
	]);

	useEffect(() => {
		if (!isTerminalSession) return;
		void disconnectFromRoom();
	}, [disconnectFromRoom, isTerminalSession]);

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
		if (!token || !url) return;
		setPhase("interview");
		setShouldConnectToLiveKit(true);
		void navigate({
			to: "/interviews/$id/session",
			params: { id },
			search: { sessionId, token, url, startRoom: "1" },
			replace: true,
		});
	}, [navigate, id, sessionId, token, url]);

	const handleEndCall = useCallback(async () => {
		if (!sessionId || endSession.isPending) return;
		setSessionActionError(null);
		try {
			const ended = await endSession.mutateAsync(sessionId);
			await disconnectFromRoom();
			await navigate({
				to: "/interviews/$id/session",
				params: { id },
				search: { sessionId: ended.id },
				replace: true,
			});
		} catch (err) {
			setSessionActionError(
				err instanceof Error ? err.message : "Could not end the interview",
			);
		}
	}, [disconnectFromRoom, endSession, id, navigate, sessionId]);

	const handleReconnect = useCallback(async () => {
		setSessionActionError(null);
		try {
			const result = await joinInterview.mutateAsync(id);
			setPhase("interview");
			setShouldConnectToLiveKit(true);
			await navigate({
				to: "/interviews/$id/session",
				params: { id },
				search: {
					sessionId: result.session_id,
					token: result.livekit_token,
					url: result.livekit_url,
					startRoom: "1",
				},
				replace: true,
			});
		} catch (err) {
			setSessionActionError(
				err instanceof Error ? err.message : "Could not reconnect to the room",
			);
		}
	}, [id, joinInterview, navigate]);

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

	const transcriptMessages = useMemo(() => {
		const storedMessages = (transcriptData?.entries ?? []).map((entry) => ({
			id: entry.id,
			type: entry.speaker.toLowerCase() as "ai" | "candidate" | "system",
			content: entry.content,
			timestamp: new Date(entry.timestamp),
			metadata: {
				confidence: entry.confidence ?? undefined,
				isFinal: true,
			},
		}));
		const normalise = (s: string) =>
			s
				.trim()
				.toLocaleLowerCase()
				.replace(/[^\p{L}\p{N}\s]/gu, "")
				.replace(/\s+/g, " ");
		const storedFingerprints = new Set(
			storedMessages.map(
				(message) => `${message.type}:${normalise(message.content)}`,
			),
		);
		const liveMessages = room.liveTranscriptMessages
			.filter(
				(message) =>
					!storedFingerprints.has(
						`${message.speaker}:${normalise(message.content)}`,
					),
			)
			.map((message) => ({
				id: `live:${message.id}`,
				type: message.speaker,
				content: message.content,
				timestamp: new Date(message.timestamp),
				metadata: {
					isFinal: message.isFinal,
				},
			}));

		return [...storedMessages, ...liveMessages].sort(
			(a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
		);
	}, [room.liveTranscriptMessages, transcriptData?.entries]);

	if (!sessionId) {
		return (
			<main className="page-wrap mx-auto max-w-lg px-4 py-16">
				<Card>
					<CardContent className="space-y-3 p-8">
						<h1 className="text-lg font-semibold">Invalid session link</h1>
						<p className="text-sm text-muted-foreground">
							This page needs a session id. Open Join interview from the
							interview page again.
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

	if (isSessionLoading) {
		return (
			<main className="page-wrap mx-auto max-w-lg px-4 py-16">
				<Card>
					<CardContent className="space-y-3 p-8">
						<h1 className="text-lg font-semibold">Loading session</h1>
						<p className="text-sm text-muted-foreground">
							Checking the current interview session status.
						</p>
					</CardContent>
				</Card>
			</main>
		);
	}

	if (!isTerminalSession && (!token || !url)) {
		return (
			<main className="page-wrap mx-auto max-w-lg px-4 py-16">
				<Card>
					<CardContent className="space-y-4 p-8">
						<div>
							<h1 className="text-lg font-semibold">Reconnect required</h1>
							<p className="mt-2 text-sm text-muted-foreground">
								This session is still open, but this page does not have a room
								token. Reconnect to get a fresh LiveKit token for the same
								active interview session.
							</p>
						</div>
						{sessionActionError ? (
							<p className="text-sm text-destructive">{sessionActionError}</p>
						) : null}
						<div className="flex gap-2">
							<Button
								onClick={() => void handleReconnect()}
								disabled={joinInterview.isPending}
							>
								{joinInterview.isPending ? "Reconnecting..." : "Reconnect"}
							</Button>
							<Button variant="outline" asChild>
								<Link to="/interviews/$id" params={{ id }}>
									Back to interview
								</Link>
							</Button>
						</div>
					</CardContent>
				</Card>
			</main>
		);
	}

	if (phase === "tech-check" && !isTerminalSession) {
		return (
			<main className="page-wrap mx-auto max-w-2xl px-4 py-8">
				<TechCheck
					onComplete={handleTechCheckComplete}
					onCancel={() => navigate({ to: "/interviews/$id", params: { id } })}
				/>
			</main>
		);
	}

	if (isTerminalSession) {
		const completedDuration = session?.duration_seconds ?? duration;
		return (
			<main className="page-wrap flex justify-center px-4 py-20">
				<Card className="w-full max-w-md text-center">
					<CardContent className="space-y-5 py-12">
						<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/30">
							<CheckCircle2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
						</div>
						<div>
							<h1 className="text-2xl font-bold">Interview Complete</h1>
							<p className="mt-2 text-muted-foreground">
								Your interview has been recorded. You&rsquo;ll receive feedback
								shortly.
							</p>
						</div>
						<p className="text-sm text-muted-foreground">
							Duration: {Math.floor(completedDuration / 60)}m{" "}
							{completedDuration % 60}s
						</p>
						{session?.video_recording_status ? (
							<p className="text-xs text-muted-foreground">
								Recording: {session.video_recording_status}
							</p>
						) : null}
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

			{sessionActionError ? (
				<div className="border-b border-destructive/30 bg-destructive/10 px-4 py-2.5 text-center text-xs leading-relaxed text-destructive">
					{sessionActionError}
				</div>
			) : null}

			{connectionState === ConnectionState.Connected &&
				room.remoteParticipantCount === 0 && (
					<div className="border-b border-amber-200/60 bg-amber-50/95 px-4 py-2.5 text-center text-xs leading-relaxed text-amber-950 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-100">
						<strong className="font-semibold">
							You are the only participant in the room.
						</strong>{" "}
						Run the <strong>invetflow-agent</strong> worker (and set
						LIVEKIT_AGENT_NAME=invetflow-agent plus AGENT_API_SECRET on the
						server) so the AI interviewer can join, or use another client on the
						same room.{" "}
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
				endDisabled={endSession.isPending}
				audioInputDevices={room.audioInputDevices}
				audioOutputDevices={room.audioOutputDevices}
				activeAudioInputDeviceId={room.activeAudioInputDeviceId}
				activeAudioOutputDeviceId={room.activeAudioOutputDeviceId}
				audioOutputSelectionSupported={room.audioOutputSelectionSupported}
				onRefreshAudioDevices={() => void room.refreshMediaDevices()}
				onSelectMicrophone={(deviceId) =>
					void room.setMicrophoneDevice(deviceId)
				}
				onSelectSpeaker={(deviceId) => void room.setSpeakerDevice(deviceId)}
			/>
		</div>
	);
}
