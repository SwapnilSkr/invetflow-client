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
import { isAudioOutputSelectionSupported } from "#/lib/interview-audio-prefs";

const TRANSCRIPTION_TOPIC = "lk.transcription";
const TRANSCRIPTION_SEGMENT_ATTRIBUTE = "lk.segment_id";

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
	/** Prefer this capture device after joining (requires permission). */
	audioInputDeviceId?: string;
	/** Prefer this playback device for remote audio (see `audioOutputSelectionSupported`). */
	audioOutputDeviceId?: string;
}

export interface LiveTranscriptMessage {
	id: string;
	speaker: "ai" | "candidate";
	content: string;
	timestamp: number;
	isFinal: boolean;
	language?: string;
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
	/** LiveKit transcription stream, including interim updates before Mongo persistence. */
	liveTranscriptMessages: LiveTranscriptMessage[];
	error: string | null;
	/** Enumerated mic devices (labels may be empty until permission). */
	audioInputDevices: MediaDeviceInfo[];
	/** Enumerated speaker / headset output devices. */
	audioOutputDevices: MediaDeviceInfo[];
	activeAudioInputDeviceId: string | undefined;
	activeAudioOutputDeviceId: string | undefined;
	/** Whether `setSinkId` works in this browser (Chrome/Edge; limited elsewhere). */
	audioOutputSelectionSupported: boolean;
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
	refreshMediaDevices: () => Promise<void>;
	setMicrophoneDevice: (deviceId: string) => Promise<boolean>;
	setSpeakerDevice: (deviceId: string) => Promise<boolean>;
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
	const [liveTranscriptMessages, setLiveTranscriptMessages] = useState<
		LiveTranscriptMessage[]
	>([]);
	const [audioInputDevices, setAudioInputDevices] = useState<MediaDeviceInfo[]>(
		[],
	);
	const [audioOutputDevices, setAudioOutputDevices] = useState<
		MediaDeviceInfo[]
	>([]);
	const [activeAudioInputDeviceId, setActiveAudioInputDeviceId] = useState<
		string | undefined
	>();
	const [activeAudioOutputDeviceId, setActiveAudioOutputDeviceId] = useState<
		string | undefined
	>();
	const [audioOutputSelectionSupported] = useState(
		isAudioOutputSelectionSupported,
	);

	const syncDevicesFromRoom = useCallback((lkRoom: Room) => {
		setActiveAudioInputDeviceId(lkRoom.getActiveDevice("audioinput"));
		setActiveAudioOutputDeviceId(lkRoom.getActiveDevice("audiooutput"));
	}, []);

	const refreshMediaDevices = useCallback(async () => {
		const lkRoom = roomInstanceRef.current;
		try {
			const requestMicPermission = !lkRoom;
			const [inputs, outputs] = await Promise.all([
				Room.getLocalDevices("audioinput", requestMicPermission),
				Room.getLocalDevices("audiooutput", false),
			]);
			setAudioInputDevices(inputs);
			setAudioOutputDevices(outputs);
			if (lkRoom) {
				syncDevicesFromRoom(lkRoom);
			}
		} catch (e) {
			console.warn("Could not refresh media devices", e);
		}
	}, [syncDevicesFromRoom]);

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
				setLiveTranscriptMessages([]);

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
					// OpenAI's realtime STT applies its own model-tuned noise reduction.
					// Stacking browser noiseSuppression + voiceIsolation + Krisp on top of it
					// degrades the signal and produces dropped or hallucinated words. Keep
					// only echoCancellation (prevents speaker→mic feedback loops) and
					// autoGainControl (normalises volume across mic distances).
					audioCaptureDefaults: {
						echoCancellation: true,
						noiseSuppression: false,
						autoGainControl: true,
						voiceIsolation: false,
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
					setLiveTranscriptMessages([]);
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

				// LiveKit can deliver the same utterance through both `TranscriptionReceived`
				// and the `lk.transcription` text stream, with different segment IDs, which
				// produced duplicate lines. Rely on the text stream only (see TOPIC_TRANSCRIPTION
				// in livekit agents).
				lkRoom.registerTextStreamHandler(
					TRANSCRIPTION_TOPIC,
					async (reader, participantInfo) => {
						const segmentId =
							reader.info.attributes?.[TRANSCRIPTION_SEGMENT_ATTRIBUTE] ??
							reader.info.id;
						const speaker =
							participantInfo.identity === lkRoom.localParticipant.identity
								? "candidate"
								: "ai";
						const ts = reader.info.timestamp || Date.now();
						let content = "";
						let rafId: ReturnType<typeof requestAnimationFrame> | null = null;

						const commit = (isFinal: boolean) => {
							const text = content.trim();
							if (!text) return;
							setLiveTranscriptMessages((current) => {
								const byId = new Map(
									current.map((message) => [message.id, message]),
								);
								byId.set(segmentId, {
									id: segmentId,
									speaker,
									content: text,
									timestamp: ts,
									isFinal,
								});
								return Array.from(byId.values()).sort(
									(a, b) => a.timestamp - b.timestamp,
								);
							});
						};

						for await (const chunk of reader) {
							content += chunk;
							// Debounce interim updates to one per animation frame to avoid
							// hammering React state with a re-render on every STT chunk.
							if (rafId !== null) cancelAnimationFrame(rafId);
							rafId = requestAnimationFrame(() => {
								rafId = null;
								commit(false);
							});
						}

						// Stream closed — this segment is now final.
						if (rafId !== null) {
							cancelAnimationFrame(rafId);
							rafId = null;
						}
						commit(true);
					},
				);

				lkRoom.on(RoomEvent.MediaDevicesError, (e: Error) => {
					setError(`Media device error: ${e.message}`);
				});

				lkRoom.on(
					RoomEvent.ActiveDeviceChanged,
					(kind: MediaDeviceKind, deviceId: string) => {
						if (kind === "audioinput") setActiveAudioInputDeviceId(deviceId);
						if (kind === "audiooutput") setActiveAudioOutputDeviceId(deviceId);
					},
				);

				lkRoom.on(RoomEvent.MediaDevicesChanged, () => {
					void refreshMediaDevices();
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
						if (pub.track) {
							onLocalTrack(pub.track);
						}
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
					websocketTimeout: 20000,
					peerConnectionTimeout: 20000,
				});

				roomInstanceRef.current = lkRoom;

				await lkRoom.localParticipant.enableCameraAndMicrophone();

				await refreshMediaDevices();

				if (options?.audioInputDeviceId) {
					await lkRoom.switchActiveDevice(
						"audioinput",
						options.audioInputDeviceId,
						true,
					);
				}
				if (options?.audioOutputDeviceId && isAudioOutputSelectionSupported()) {
					await lkRoom.switchActiveDevice(
						"audiooutput",
						options.audioOutputDeviceId,
						true,
					);
				}
				syncDevicesFromRoom(lkRoom);

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
		[refreshMediaDevices, syncDevicesFromRoom],
	);

	const disconnect = useCallback(async () => {
		mediaContainerRef.current?.replaceChildren();
		await roomInstanceRef.current?.disconnect();
		roomInstanceRef.current = null;
		setRoom(null);
		setConnectionState(ConnectionState.Disconnected);
		setRemoteParticipantCount(0);
		setLiveTranscriptMessages([]);
		setActiveAudioInputDeviceId(undefined);
		setActiveAudioOutputDeviceId(undefined);
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

	const setMicrophoneDevice = useCallback(async (deviceId: string) => {
		const r = roomInstanceRef.current;
		if (!r) return false;
		return r.switchActiveDevice("audioinput", deviceId, true);
	}, []);

	const setSpeakerDevice = useCallback(async (deviceId: string) => {
		const r = roomInstanceRef.current;
		if (!r || !isAudioOutputSelectionSupported()) return false;
		return r.switchActiveDevice("audiooutput", deviceId, true);
	}, []);

	return {
		room,
		connectionState,
		isMicEnabled,
		isCameraEnabled,
		isScreenShareEnabled,
		networkQuality,
		remoteParticipantCount,
		liveTranscriptMessages,
		error,
		audioInputDevices,
		audioOutputDevices,
		activeAudioInputDeviceId,
		activeAudioOutputDeviceId,
		audioOutputSelectionSupported,
		connect,
		disconnect,
		toggleMic,
		toggleCamera,
		toggleScreenShare,
		refreshMediaDevices,
		setMicrophoneDevice,
		setSpeakerDevice,
	};
}
