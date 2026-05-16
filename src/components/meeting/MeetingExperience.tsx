import type {
	TrackReferenceOrPlaceholder,
	TrackSourceWithOptions,
} from "@livekit/components-core";
import {
	isTrackReference,
	StartMediaButton,
	useConnectionState,
	useLocalParticipant,
	useParticipants,
	useRoomContext,
	useSpeakingParticipants,
	useTracks,
	VideoTrack,
} from "@livekit/components-react";
import {
	ConnectionState,
	type DataPacket_Kind,
	type RemoteParticipant,
	RoomEvent,
	Track,
} from "livekit-client";
import {
	Camera,
	CameraOff,
	MessageSquare,
	Mic,
	MicOff,
	MonitorUp,
	MonitorX,
	PhoneOff,
	Users,
	Wifi,
	X,
} from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";

const MEETING_TRACK_SOURCES: TrackSourceWithOptions[] = [
	{ source: Track.Source.Camera, withPlaceholder: true },
	{ source: Track.Source.ScreenShare, withPlaceholder: false },
] satisfies TrackSourceWithOptions[];

const TRACK_OPTIONS = { onlySubscribed: false } as const;
const CHAT_TOPIC = "invetflow-meeting-chat";
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

type MeetingChatMessage = {
	id: string;
	message: string;
	timestamp: number;
	senderIdentity: string;
	senderName: string;
};

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
	const visibleTracks = cameraTracks;

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
			{
				reliable: true,
				topic: CHAT_TOPIC,
			},
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
						{spotlightTrack ? (
							<div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)_auto] gap-3 overflow-hidden xl:grid-cols-[minmax(0,1fr)_minmax(180px,260px)] xl:grid-rows-1">
								<ParticipantVideoTile
									trackRef={spotlightTrack}
									isSpeaking={isParticipantSpeaking(
										spotlightTrack.participant.identity,
										speakingParticipants,
									)}
									spotlight
								/>
								<div className="grid min-w-0 max-h-56 grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3 overflow-x-hidden overflow-y-auto xl:max-h-none xl:grid-cols-1 xl:auto-rows-min">
									{visibleTracks.map((trackRef) => (
										<ParticipantVideoTile
											key={tileKey(trackRef)}
											trackRef={trackRef}
											isSpeaking={isParticipantSpeaking(
												trackRef.participant.identity,
												speakingParticipants,
											)}
											compact
										/>
									))}
								</div>
							</div>
						) : (
							<div className={mainGridClass(visibleTracks.length)}>
								{visibleTracks.map((trackRef) => (
									<ParticipantVideoTile
										key={tileKey(trackRef)}
										trackRef={trackRef}
										isSpeaking={isParticipantSpeaking(
											trackRef.participant.identity,
											speakingParticipants,
										)}
										dense={visibleTracks.length > 4}
									/>
								))}
							</div>
						)}
					</div>

					{deviceError ? (
						<div className="absolute top-4 left-1/2 z-20 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-lg border border-red-400/40 bg-red-950/90 px-4 py-3 text-sm shadow-2xl">
							{deviceError}
						</div>
					) : null}

					<div className="absolute right-0 bottom-0 left-0 z-10 flex items-center justify-center border-white/10 border-t bg-neutral-950/85 px-3 py-3 backdrop-blur md:px-5">
						<div className="flex items-center gap-2 rounded-full bg-neutral-900 px-2 py-2 shadow-2xl ring-1 ring-white/10">
							<ControlButton
								label={
									isMicrophoneEnabled ? "Mute microphone" : "Unmute microphone"
								}
								active={isMicrophoneEnabled}
								onClick={toggleMicrophone}
							>
								{isMicrophoneEnabled ? (
									<Mic className="size-5" aria-hidden />
								) : (
									<MicOff className="size-5" aria-hidden />
								)}
							</ControlButton>
							<ControlButton
								label={isCameraEnabled ? "Turn camera off" : "Turn camera on"}
								active={isCameraEnabled}
								onClick={toggleCamera}
							>
								{isCameraEnabled ? (
									<Camera className="size-5" aria-hidden />
								) : (
									<CameraOff className="size-5" aria-hidden />
								)}
							</ControlButton>
							<ControlButton
								label={
									isScreenShareEnabled
										? "Stop presenting"
										: "Present your screen"
								}
								active={isScreenShareEnabled}
								onClick={toggleScreenShare}
							>
								{isScreenShareEnabled ? (
									<MonitorX className="size-5" aria-hidden />
								) : (
									<MonitorUp className="size-5" aria-hidden />
								)}
							</ControlButton>
							<ControlButton
								label={chatOpen ? "Close chat" : "Open chat"}
								active={chatOpen}
								onClick={() => setChatOpen(!chatOpen)}
							>
								<MessageSquare className="size-5" aria-hidden />
							</ControlButton>
							<button
								type="button"
								className="grid size-11 place-items-center rounded-full bg-red-600 text-white transition hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
								onClick={leaveMeeting}
								aria-label="Leave meeting"
								title="Leave meeting"
							>
								<PhoneOff className="size-5" aria-hidden />
							</button>
						</div>
					</div>

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

type ParticipantVideoTileProps = {
	trackRef: TrackReferenceOrPlaceholder;
	isSpeaking: boolean;
	compact?: boolean;
	dense?: boolean;
	spotlight?: boolean;
};

function ParticipantVideoTile({
	trackRef,
	isSpeaking,
	compact = false,
	dense = false,
	spotlight = false,
}: ParticipantVideoTileProps) {
	const participant = trackRef.participant;
	const participantName =
		participant.name || participant.identity || "Participant";
	const videoReady =
		isTrackReference(trackRef) &&
		Boolean(trackRef.publication.track) &&
		!trackRef.publication.isMuted;
	const isScreenShare = trackRef.source === Track.Source.ScreenShare;

	return (
		<section
			className={`relative min-w-0 overflow-hidden rounded-xl bg-neutral-900 ring-1 transition ${
				isSpeaking ? "ring-emerald-400" : "ring-white/10"
			} ${tileSizeClass({ compact, dense, spotlight })}`}
		>
			{videoReady && isTrackReference(trackRef) ? (
				<VideoTrack
					trackRef={trackRef}
					className={`h-full w-full bg-neutral-900 ${
						isScreenShare ? "object-contain" : "object-cover"
					}`}
				/>
			) : (
				<div className="grid h-full w-full place-items-center bg-neutral-900">
					<div className="grid size-20 place-items-center rounded-full bg-neutral-700 font-semibold text-2xl text-white ring-1 ring-white/15 md:size-24">
						{initials(participantName)}
					</div>
				</div>
			)}

			<div className="absolute right-3 bottom-3 left-3 flex items-center justify-between gap-2">
				<div className="min-w-0 rounded-full bg-neutral-950/80 px-3 py-1.5 text-white shadow-lg backdrop-blur">
					<p className="truncate font-medium text-xs md:text-sm">
						{participantName}
						{participant.isLocal ? " (you)" : ""}
					</p>
				</div>
				<div className="grid size-8 shrink-0 place-items-center rounded-full bg-neutral-950/80 text-white shadow-lg backdrop-blur">
					{participant.isMicrophoneEnabled ? (
						<Mic className="size-4" aria-label="Microphone on" />
					) : (
						<MicOff
							className="size-4 text-red-300"
							aria-label="Microphone muted"
						/>
					)}
				</div>
			</div>

			{isScreenShare ? (
				<div className="absolute top-3 left-3 rounded-full bg-neutral-950/80 px-3 py-1.5 font-medium text-white text-xs shadow-lg backdrop-blur">
					Screen share
				</div>
			) : null}
		</section>
	);
}

type ControlButtonProps = {
	label: string;
	active: boolean;
	onClick: () => void;
	children: ReactNode;
};

function ControlButton({
	label,
	active,
	onClick,
	children,
}: ControlButtonProps) {
	return (
		<button
			type="button"
			className={`grid size-11 place-items-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
				active
					? "bg-white text-neutral-950 hover:bg-neutral-200"
					: "bg-neutral-700 text-white hover:bg-neutral-600"
			}`}
			onClick={onClick}
			aria-label={label}
			title={label}
		>
			{children}
		</button>
	);
}

type ChatPanelProps = {
	messages: MeetingChatMessage[];
	onClose: () => void;
	onSend: (message: string) => Promise<void>;
};

function ChatPanel({ messages, onClose, onSend }: ChatPanelProps) {
	const [draft, setDraft] = useState("");
	const [isSending, setIsSending] = useState(false);
	const [sendError, setSendError] = useState<string | null>(null);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const message = draft.trim();
		if (!message || isSending) {
			return;
		}

		setDraft("");
		setSendError(null);
		setIsSending(true);
		try {
			await onSend(message);
		} catch (error) {
			setDraft(message);
			setSendError(errorMessage(error, "Message could not be sent."));
		} finally {
			setIsSending(false);
		}
	}

	return (
		<aside className="absolute inset-x-3 bottom-20 z-30 flex max-h-[calc(100dvh-7rem)] min-h-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-neutral-950 shadow-2xl lg:static lg:inset-auto lg:max-h-none lg:rounded-none lg:border-t-0 lg:border-r-0 lg:border-b-0">
			<div className="flex h-14 shrink-0 items-center justify-between border-white/10 border-b px-4">
				<div>
					<p className="font-semibold text-sm">Meeting chat</p>
					<p className="text-neutral-400 text-xs">Visible to everyone here</p>
				</div>
				<button
					type="button"
					className="grid size-9 place-items-center rounded-full text-neutral-300 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
					onClick={onClose}
					aria-label="Close chat"
				>
					<X className="size-4" aria-hidden />
				</button>
			</div>

			<div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
				{messages.length === 0 ? (
					<p className="rounded-lg bg-white/5 px-3 py-3 text-neutral-400 text-sm">
						No messages yet.
					</p>
				) : (
					messages.map((message) => (
						<div key={message.id} className="rounded-lg bg-white/5 px-3 py-2">
							<div className="flex items-center justify-between gap-3 text-xs">
								<span className="truncate font-medium text-white">
									{message.senderName}
								</span>
								<span className="shrink-0 text-neutral-500">
									{new Date(message.timestamp).toLocaleTimeString([], {
										hour: "2-digit",
										minute: "2-digit",
									})}
								</span>
							</div>
							<p className="mt-1 whitespace-pre-wrap break-words text-neutral-200 text-sm">
								{message.message}
							</p>
						</div>
					))
				)}
			</div>

			<form
				className="shrink-0 border-white/10 border-t p-3"
				onSubmit={handleSubmit}
			>
				{sendError ? (
					<p className="mb-2 rounded-md bg-red-950 px-3 py-2 text-red-100 text-xs">
						{sendError}
					</p>
				) : null}
				<div className="flex gap-2">
					<input
						value={draft}
						onChange={(event) => setDraft(event.target.value)}
						placeholder="Message everyone"
						className="min-w-0 flex-1 rounded-full border border-white/10 bg-neutral-900 px-4 py-2 text-sm text-white outline-none transition placeholder:text-neutral-500 focus:border-white/40"
					/>
					<button
						type="submit"
						disabled={draft.trim().length === 0 || isSending}
						className="rounded-full bg-white px-4 py-2 font-medium text-neutral-950 text-sm transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
					>
						Send
					</button>
				</div>
			</form>
		</aside>
	);
}

function mainGridClass(count: number) {
	if (count <= 1) {
		return "grid h-full min-h-0 grid-cols-1 gap-3";
	}
	if (count <= 2) {
		return "grid h-full min-h-0 grid-cols-1 gap-3 md:grid-cols-2";
	}
	if (count <= 4) {
		return "grid h-full min-h-0 grid-cols-1 gap-3 sm:grid-cols-2";
	}
	return "grid min-h-0 content-start gap-3 overflow-y-auto overflow-x-hidden grid-cols-1 sm:grid-cols-2 xl:grid-cols-3";
}

function tileSizeClass({
	compact,
	dense,
	spotlight,
}: {
	compact: boolean;
	dense: boolean;
	spotlight: boolean;
}) {
	if (spotlight) {
		return "h-full min-h-0 w-full";
	}
	if (compact) {
		return "aspect-video h-auto min-h-0 w-full";
	}
	if (dense) {
		return "aspect-video min-h-36 w-full";
	}
	return "h-full min-h-0 w-full";
}

function tileKey(trackRef: TrackReferenceOrPlaceholder) {
	if (isTrackReference(trackRef)) {
		return `${trackRef.participant.identity}-${trackRef.source}-${trackRef.publication.trackSid}`;
	}
	return `${trackRef.participant.identity}-${trackRef.source}-placeholder`;
}

function initials(name: string) {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) {
		return "?";
	}
	const first = parts[0]?.[0] ?? "";
	const second = parts.length > 1 ? (parts[1]?.[0] ?? "") : "";
	return `${first}${second}`.toUpperCase();
}

function isParticipantSpeaking(
	identity: string,
	speakingParticipants: Array<{ identity: string }>,
) {
	return speakingParticipants.some(
		(participant) => participant.identity === identity,
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
