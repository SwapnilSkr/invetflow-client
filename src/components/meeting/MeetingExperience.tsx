import type { TrackSourceWithOptions } from "@livekit/components-core";
import {
	isTrackReference,
	StartMediaButton,
	useConnectionState,
	useLocalParticipant,
	useParticipants,
	useRoomContext,
	useSpeakingParticipants,
	useTracks,
} from "@livekit/components-react";
import {
	ConnectionState,
	type DataPacket_Kind,
	type RemoteParticipant,
	RoomEvent,
	Track,
} from "livekit-client";
import { Users, Wifi } from "lucide-react";
import { useEffect, useState } from "react";
import { ChatPanel } from "./ChatPanel";
import { ControlBar } from "./ControlBar";
import type { MeetingChatMessage } from "./meeting-types";
import { VideoGrid } from "./VideoGrid";

const MEETING_TRACK_SOURCES: TrackSourceWithOptions[] = [
	{ source: Track.Source.Camera, withPlaceholder: true },
	{ source: Track.Source.ScreenShare, withPlaceholder: false },
] satisfies TrackSourceWithOptions[];

const TRACK_OPTIONS = { onlySubscribed: false } as const;
const CHAT_TOPIC = "invetflow-meeting-chat";
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

type MeetingExperienceProps = {
	title: string;
	roleLabel: string;
};

export function MeetingExperience({
	title,
	roleLabel,
}: MeetingExperienceProps) {
	const room = useRoomContext();
	const connectionState = useConnectionState(room);
	const participants = useParticipants();
	const speakingParticipants = useSpeakingParticipants();
	const {
		isCameraEnabled,
		isMicrophoneEnabled,
		isScreenShareEnabled,
		localParticipant,
	} = useLocalParticipant();
	const [chatOpen, setChatOpen] = useState(false);
	const [deviceError, setDeviceError] = useState<string | null>(null);
	const [chatMessages, setChatMessages] = useState<MeetingChatMessage[]>([]);
	const tracks = useTracks(MEETING_TRACK_SOURCES, TRACK_OPTIONS);
	const cameraTracks = tracks.filter(
		(trackRef) => trackRef.source === Track.Source.Camera,
	);
	const screenShareTracks = tracks.filter(
		(trackRef) =>
			trackRef.source === Track.Source.ScreenShare &&
			isTrackReference(trackRef),
	);
	const spotlightTrack = screenShareTracks[0];

	async function toggleMicrophone() {
		setDeviceError(null);
		try {
			await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
		} catch (error) {
			setDeviceError(errorMessage(error, "Microphone could not be updated."));
		}
	}

	async function toggleCamera() {
		setDeviceError(null);
		try {
			await localParticipant.setCameraEnabled(!isCameraEnabled, {
				resolution: { width: 1280, height: 720, frameRate: 24 },
			});
		} catch (error) {
			setDeviceError(errorMessage(error, "Camera could not be updated."));
		}
	}

	async function toggleScreenShare() {
		setDeviceError(null);
		try {
			await localParticipant.setScreenShareEnabled(!isScreenShareEnabled);
		} catch (error) {
			setDeviceError(errorMessage(error, "Screen share could not be updated."));
		}
	}

	async function leaveMeeting() {
		await room.disconnect();
	}

	useEffect(() => {
		function handleDataReceived(
			payload: Uint8Array,
			participant?: RemoteParticipant,
			_kind?: DataPacket_Kind,
			topic?: string,
		) {
			if (topic !== CHAT_TOPIC) {
				return;
			}

			try {
				const parsed = JSON.parse(
					textDecoder.decode(payload),
				) as MeetingChatMessage;
				setChatMessages((current) =>
					current.some((message) => message.id === parsed.id)
						? current
						: [...current, parsed],
				);
			} catch {
				const senderName =
					participant?.name || participant?.identity || "Participant";
				setChatMessages((current) => [
					...current,
					{
						id: crypto.randomUUID(),
						message: textDecoder.decode(payload),
						timestamp: Date.now(),
						senderIdentity: participant?.identity || "unknown",
						senderName,
					},
				]);
			}
		}

		room.on(RoomEvent.DataReceived, handleDataReceived);
		return () => {
			room.off(RoomEvent.DataReceived, handleDataReceived);
		};
	}, [room]);

	async function sendChatMessage(message: string) {
		const chatMessage: MeetingChatMessage = {
			id: crypto.randomUUID(),
			message,
			timestamp: Date.now(),
			senderIdentity: localParticipant.identity,
			senderName:
				localParticipant.name || localParticipant.identity || "Participant",
		};

		await localParticipant.publishData(
			textEncoder.encode(JSON.stringify(chatMessage)),
			{ reliable: true, topic: CHAT_TOPIC },
		);
		setChatMessages((current) => [...current, chatMessage]);
	}

	return (
		<div className="fixed inset-0 z-50 flex h-[100dvh] min-h-0 flex-col overflow-hidden bg-neutral-950 text-white">
			<header className="flex h-16 shrink-0 items-center justify-between border-white/10 border-b px-4 md:px-6">
				<div className="min-w-0">
					<p className="truncate font-semibold text-sm md:text-base">{title}</p>
					<p className="text-neutral-400 text-xs">{roleLabel}</p>
				</div>
				<div className="flex items-center gap-3 text-neutral-300 text-xs">
					<span className="hidden items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 sm:flex">
						<Wifi className="size-3.5" aria-hidden />
						{connectionLabel(connectionState)}
					</span>
					<span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
						<Users className="size-3.5" aria-hidden />
						{participants.length}
					</span>
				</div>
			</header>

			<div
				className={`grid min-h-0 flex-1 grid-cols-1 ${
					chatOpen ? "lg:grid-cols-[minmax(0,1fr)_360px]" : "lg:grid-cols-1"
				}`}
			>
				<main className="relative min-h-0 overflow-hidden">
					<div className="flex h-full min-h-0 flex-col gap-3 p-3 pb-24 md:p-5 md:pb-28">
						<VideoGrid
							visibleTracks={cameraTracks}
							spotlightTrack={spotlightTrack}
							speakingParticipants={speakingParticipants}
						/>
					</div>

					{deviceError ? (
						<div className="absolute top-4 left-1/2 z-20 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-lg border border-destructive bg-destructive px-4 py-3 text-destructive-foreground text-sm shadow-2xl">
							{deviceError}
						</div>
					) : null}

					<ControlBar
						isCameraEnabled={isCameraEnabled}
						isChatOpen={chatOpen}
						isMicrophoneEnabled={isMicrophoneEnabled}
						isScreenShareEnabled={isScreenShareEnabled}
						onLeave={leaveMeeting}
						onToggleCamera={toggleCamera}
						onToggleChat={() => setChatOpen(!chatOpen)}
						onToggleMicrophone={toggleMicrophone}
						onToggleScreenShare={toggleScreenShare}
					/>

					<div className="absolute right-4 bottom-24 z-10">
						<StartMediaButton className="rounded-full bg-white px-4 py-2 font-medium text-neutral-950 text-sm shadow-xl transition hover:bg-neutral-200" />
					</div>
				</main>

				{chatOpen ? (
					<ChatPanel
						messages={chatMessages}
						onClose={() => setChatOpen(false)}
						onSend={sendChatMessage}
					/>
				) : null}
			</div>
		</div>
	);
}

function connectionLabel(state: ConnectionState) {
	if (state === ConnectionState.Connected) {
		return "Connected";
	}
	if (state === ConnectionState.Connecting) {
		return "Connecting";
	}
	if (state === ConnectionState.Reconnecting) {
		return "Reconnecting";
	}
	return "Disconnected";
}

function errorMessage(error: unknown, fallback: string) {
	return error instanceof Error && error.message.trim()
		? error.message
		: fallback;
}
