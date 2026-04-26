import {
	ConnectionQuality,
	ConnectionState,
	type LocalTrack,
	type LocalTrackPublication,
	type RemoteTrack,
	Room,
	RoomEvent,
	Track,
} from "livekit-client";
import { useCallback, useEffect, useRef, useState } from "react";

function mapConnectionQuality(q: ConnectionQuality): "good" | "fair" | "poor" {
	switch (q) {
		case ConnectionQuality.Excellent:
		case ConnectionQuality.Good:
			return "good";
		case ConnectionQuality.Poor:
			return "fair";
		default:
			return "poor";
	}
}

function attachTrack(
	track: RemoteTrack | LocalTrack,
	mediaContainer: HTMLElement | null,
	isLocalVideo: boolean,
) {
	if (track.kind === Track.Kind.Audio) {
		const el = track.attach();
		el.style.display = "none";
		(mediaContainer ?? document.body).appendChild(el);
		return;
	}
	if (track.kind === Track.Kind.Video && mediaContainer) {
		const el = track.attach() as HTMLVideoElement;
		el.playsInline = true;
		// Local preview: muted helps Safari/Chrome allow inline autoplay; remote must stay unmuted.
		if (isLocalVideo) {
			el.muted = true;
		}
		el.className = "h-full w-full min-h-0 min-w-0 object-cover";
		mediaContainer.appendChild(el);
	}
}

export interface ConnectOptions {
	/** Where to mount local/remote *video* elements. Audio is attached hidden on this or body. */
	mediaContainer?: HTMLElement | null;
}

export interface InterviewRoomState {
	room: Room | null;
	connectionState: ConnectionState;
	isMicEnabled: boolean;
	isCameraEnabled: boolean;
	isScreenShareEnabled: boolean;
	/** Downmapped from LiveKit connection quality for the local participant. */
	networkQuality: "good" | "fair" | "poor";
	/** Other participants in the room (e.g. AI agent or human); you are not counted. */
	remoteParticipantCount: number;
	error: string | null;
}

export interface InterviewRoomActions {
	connect: (
		url: string,
		token: string,
		options?: ConnectOptions,
	) => Promise<void>;
	disconnect: () => Promise<void>;
	toggleMic: () => Promise<void>;
	toggleCamera: () => Promise<void>;
	toggleScreenShare: () => Promise<void>;
}

export function useInterviewRoom(): InterviewRoomState & InterviewRoomActions {
	const roomInstanceRef = useRef<Room | null>(null);
	const mediaContainerRef = useRef<HTMLElement | null>(null);

	const [room, setRoom] = useState<Room | null>(null);
	const [connectionState, setConnectionState] = useState<ConnectionState>(
		ConnectionState.Disconnected,
	);
	const [isMicEnabled, setIsMicEnabled] = useState(true);
	const [isCameraEnabled, setIsCameraEnabled] = useState(true);
	const [isScreenShareEnabled, setIsScreenShareEnabled] = useState(false);
	const [networkQuality, setNetworkQuality] = useState<
		"good" | "fair" | "poor"
	>("good");
	const [error, setError] = useState<string | null>(null);
	const [remoteParticipantCount, setRemoteParticipantCount] = useState(0);

	useEffect(() => {
		return () => {
			void roomInstanceRef.current?.disconnect();
		};
	}, []);

	const connect = useCallback(
		async (url: string, token: string, options?: ConnectOptions) => {
			const container = options?.mediaContainer ?? null;
			mediaContainerRef.current = container;
			if (container) {
				container.replaceChildren();
			}

			try {
				setError(null);
				setNetworkQuality("good");
				setRemoteParticipantCount(0);

				await roomInstanceRef.current?.disconnect();
				roomInstanceRef.current = null;
				setRoom(null);

				const lkRoom = new Room({
					// See RoomOptions in livekit-client / LiveKit "Realtime" docs
					adaptiveStream: true,
					dynacast: true,
					stopLocalTrackOnUnpublish: true,
					disconnectOnPageLeave: true,
					// 720p balances quality and CPU/bandwidth for interviews
					videoCaptureDefaults: {
						resolution: { width: 1280, height: 720, frameRate: 30 },
					},
					audioCaptureDefaults: {
						echoCancellation: true,
						noiseSuppression: true,
						autoGainControl: true,
					},
				});

				lkRoom.on(
					RoomEvent.ConnectionStateChanged,
					(state: ConnectionState) => {
						setConnectionState(state);
					},
				);

				lkRoom.on(RoomEvent.Disconnected, () => {
					setConnectionState(ConnectionState.Disconnected);
					setRemoteParticipantCount(0);
					mediaContainerRef.current?.replaceChildren();
				});

				const syncRemoteCount = () => {
					setRemoteParticipantCount(lkRoom.remoteParticipants.size);
				};
				lkRoom.on(RoomEvent.ParticipantConnected, syncRemoteCount);
				lkRoom.on(RoomEvent.ParticipantDisconnected, syncRemoteCount);

				lkRoom.on(
					RoomEvent.ConnectionQualityChanged,
					(quality: ConnectionQuality, participant) => {
						if (participant.isLocal) {
							setNetworkQuality(mapConnectionQuality(quality));
						}
					},
				);

				lkRoom.on(RoomEvent.MediaDevicesError, (e: Error) => {
					setError(`Media device error: ${e.message}`);
				});

				const onLocalTrack = (t: RemoteTrack | LocalTrack) => {
					attachTrack(t, mediaContainerRef.current, true);
				};
				const onRemoteTrack = (t: RemoteTrack | LocalTrack) => {
					attachTrack(t, mediaContainerRef.current, false);
				};

				lkRoom.on(RoomEvent.TrackSubscribed, (track) => onRemoteTrack(track));

				lkRoom.on(
					RoomEvent.LocalTrackPublished,
					(pub: LocalTrackPublication) => {
						if (pub.track) onLocalTrack(pub.track);
					},
				);

				lkRoom.on(RoomEvent.TrackUnsubscribed, (track) => {
					for (const el of track.detach()) {
						el.remove();
					}
				});

				// Sensible connect timeouts; defaults match livekit-client
				await lkRoom.connect(url, token, {
					autoSubscribe: true,
					webSocketTimeout: 20000,
					peerConnectionTimeout: 20000,
				});

				await lkRoom.localParticipant.enableCameraAndMicrophone();

				roomInstanceRef.current = lkRoom;
				setRoom(lkRoom);
				syncRemoteCount();
				setIsMicEnabled(true);
				setIsCameraEnabled(true);
			} catch (e) {
				const msg = e instanceof Error ? e.message : "Failed to connect";
				setError(msg);
				setConnectionState(ConnectionState.Disconnected);
				mediaContainerRef.current?.replaceChildren();
			}
		},
		[],
	);

	const disconnect = useCallback(async () => {
		mediaContainerRef.current?.replaceChildren();
		await roomInstanceRef.current?.disconnect();
		roomInstanceRef.current = null;
		setRoom(null);
		setConnectionState(ConnectionState.Disconnected);
		setRemoteParticipantCount(0);
	}, []);

	const toggleMic = useCallback(async () => {
		const r = roomInstanceRef.current;
		if (!r) return;
		const enabled = r.localParticipant.isMicrophoneEnabled;
		await r.localParticipant.setMicrophoneEnabled(!enabled);
		setIsMicEnabled(!enabled);
	}, []);

	const toggleCamera = useCallback(async () => {
		const r = roomInstanceRef.current;
		if (!r) return;
		const enabled = r.localParticipant.isCameraEnabled;
		await r.localParticipant.setCameraEnabled(!enabled);
		setIsCameraEnabled(!enabled);
	}, []);

	const toggleScreenShare = useCallback(async () => {
		const r = roomInstanceRef.current;
		if (!r) return;
		const enabled = r.localParticipant.isScreenShareEnabled;
		await r.localParticipant.setScreenShareEnabled(!enabled);
		setIsScreenShareEnabled(!enabled);
	}, []);

	return {
		room,
		connectionState,
		isMicEnabled,
		isCameraEnabled,
		isScreenShareEnabled,
		networkQuality,
		remoteParticipantCount,
		error,
		connect,
		disconnect,
		toggleMic,
		toggleCamera,
		toggleScreenShare,
	};
}
