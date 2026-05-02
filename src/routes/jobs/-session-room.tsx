import { useQuery } from "@tanstack/react-query";
import { getRouteApi, Link, useNavigate } from "@tanstack/react-router";
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
import { useAuth } from "#/integrations/api/hooks";
import {
	candidateInterviewQueries,
	useEndCandidateInterview,
	useJoinJob,
} from "#/integrations/api/queries";
import { useInterviewRoom } from "#/integrations/livekit/use-interview-room";
import { readStoredInterviewAudioDevices } from "#/lib/interview-audio-prefs";

const routeApi = getRouteApi("/jobs/$id/session");

function isTerminalSessionStatus(status?: string) {
	return status === "Completed" || status === "Cancelled";
}

export function InterviewSessionPage() {
	const { id } = routeApi.useParams();
	const { sessionId, token, url, startRoom } = routeApi.useSearch();
	const navigate = useNavigate();
	const { user } = useAuth();
	const isCandidate = user?.role === "Candidate";

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
	const endCandidateInterview = useEndCandidateInterview();
	const joinJob = useJoinJob();

	const { data: session, isLoading: isSessionLoading } = useQuery({
		...candidateInterviewQueries.detail(sessionId),
		enabled: !!sessionId,
		refetchInterval: phase === "interview" ? 10000 : false,
	});
	const isTerminalSession = isTerminalSessionStatus(session?.status);
	const isLiveInterview = phase === "interview" && !isTerminalSession;

	const { data: transcriptData } = useQuery({
		...candidateInterviewQueries.transcript(sessionId),
		enabled: !!sessionId && isLiveInterview,
		refetchInterval: isLiveInterview ? 1500 : false,
	});

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
			to: "/jobs/$id/session",
			params: { id },
			search: { sessionId, token, url, startRoom: "1" },
			replace: true,
		});
	}, [navigate, id, sessionId, token, url]);

	const handleEndCall = useCallback(async () => {
		if (!sessionId || endCandidateInterview.isPending) return;
		setSessionActionError(null);
		try {
			const ended = await endCandidateInterview.mutateAsync(sessionId);
			await disconnectFromRoom();
			await navigate({
				to: "/jobs/$id/session",
				params: { id },
				search: { sessionId: ended.id },
				replace: true,
			});
		} catch (err) {
			setSessionActionError(
				err instanceof Error ? err.message : "Could not end the interview",
			);
		}
	}, [disconnectFromRoom, endCandidateInterview, id, navigate, sessionId]);

	const handleReconnect = useCallback(async () => {
		setSessionActionError(null);
		try {
			const result = await joinJob.mutateAsync(id);
			setPhase("interview");
			setShouldConnectToLiveKit(true);
			await navigate({
				to: "/jobs/$id/session",
				params: { id },
				search: {
					sessionId: result.interview_id,
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
	}, [id, joinJob, navigate]);

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
			<main className="page-wrap mx-auto max-w-lg">
				<Card>
					<CardContent className="space-y-3 p-8">
						<h1 className="text-lg font-semibold">Invalid session link</h1>
						<p className="text-sm text-muted-foreground">
							This page needs a session id. Open Join interview from the
							interview page again.
						</p>
						<Button asChild>
							<Link to="/jobs/$id" params={{ id }}>
								Back to job
							</Link>
						</Button>
					</CardContent>
				</Card>
			</main>
		);
	}

	if (isSessionLoading) {
		return (
			<main className="page-wrap mx-auto max-w-lg">
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
			<main className="page-wrap mx-auto max-w-lg">
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
								disabled={joinJob.isPending}
							>
								{joinJob.isPending ? "Reconnecting..." : "Reconnect"}
							</Button>
							<Button variant="outline" asChild>
								<Link to="/jobs/$id" params={{ id }}>
									Back to job
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
			<main className="page-wrap mx-auto max-w-2xl">
				<TechCheck
					onComplete={handleTechCheckComplete}
					onCancel={() => navigate({ to: "/jobs/$id", params: { id } })}
				/>
			</main>
		);
	}

	if (isTerminalSession) {
		const completedDuration = session?.duration_seconds ?? duration;
		return (
			<main className="page-wrap flex justify-center">
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
							<Link to={isCandidate ? "/candidate" : "/jobs"}>
								{isCandidate ? "Back to My jobs" : "Back to Jobs"}
							</Link>
						</Button>
					</CardContent>
				</Card>
			</main>
		);
	}

	return (
		<div className="flex min-h-svh flex-col">
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
				endDisabled={endCandidateInterview.isPending}
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
