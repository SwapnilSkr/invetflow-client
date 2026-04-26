import { ConnectionState, Room, RoomEvent, Track } from "livekit-client";
import { useCallback, useEffect, useRef, useState } from "react";

export interface InterviewRoomState {
	room: Room | null;
	connectionState: ConnectionState;
	isMicEnabled: boolean;
	isCameraEnabled: boolean;
	isScreenShareEnabled: boolean;
	error: string | null;
}

export interface InterviewRoomActions {
	connect: (url: string, token: string) => Promise<void>;
	disconnect: () => Promise<void>;
	toggleMic: () => Promise<void>;
	toggleCamera: () => Promise<void>;
	toggleScreenShare: () => Promise<void>;
}

export function useInterviewRoom(): InterviewRoomState & InterviewRoomActions {
	const roomRef = useRef<Room | null>(null);
	const [connectionState, setConnectionState] = useState<ConnectionState>(
		ConnectionState.Disconnected,
	);
	const [isMicEnabled, setIsMicEnabled] = useState(true);
	const [isCameraEnabled, setIsCameraEnabled] = useState(true);
	const [isScreenShareEnabled, setIsScreenShareEnabled] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		return () => {
			roomRef.current?.disconnect();
		};
	}, []);

	const connect = useCallback(async (url: string, token: string) => {
		try {
			setError(null);
			const room = new Room({
				adaptiveStream: true,
				dynacast: true,
			});

			room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
				setConnectionState(state);
			});

			room.on(RoomEvent.Disconnected, () => {
				setConnectionState(ConnectionState.Disconnected);
			});

			room.on(RoomEvent.MediaDevicesError, (e: Error) => {
				setError(`Media device error: ${e.message}`);
			});

			room.on(RoomEvent.TrackSubscribed, (track) => {
				if (track.kind === Track.Kind.Audio) {
					const audioEl = track.attach();
					document.body.appendChild(audioEl);
				}
			});

			room.on(RoomEvent.TrackUnsubscribed, (track) => {
				track.detach().forEach((el) => el.remove());
			});

			await room.connect(url, token);
			await room.localParticipant.enableCameraAndMicrophone();

			roomRef.current = room;
			setIsMicEnabled(true);
			setIsCameraEnabled(true);
		} catch (e) {
			const msg = e instanceof Error ? e.message : "Failed to connect";
			setError(msg);
			setConnectionState(ConnectionState.Disconnected);
		}
	}, []);

	const disconnect = useCallback(async () => {
		await roomRef.current?.disconnect();
		roomRef.current = null;
		setConnectionState(ConnectionState.Disconnected);
	}, []);

	const toggleMic = useCallback(async () => {
		const room = roomRef.current;
		if (!room) return;
		const enabled = room.localParticipant.isMicrophoneEnabled;
		await room.localParticipant.setMicrophoneEnabled(!enabled);
		setIsMicEnabled(!enabled);
	}, []);

	const toggleCamera = useCallback(async () => {
		const room = roomRef.current;
		if (!room) return;
		const enabled = room.localParticipant.isCameraEnabled;
		await room.localParticipant.setCameraEnabled(!enabled);
		setIsCameraEnabled(!enabled);
	}, []);

	const toggleScreenShare = useCallback(async () => {
		const room = roomRef.current;
		if (!room) return;
		const enabled = room.localParticipant.isScreenShareEnabled;
		await room.localParticipant.setScreenShareEnabled(!enabled);
		setIsScreenShareEnabled(!enabled);
	}, []);

	return {
		room: roomRef.current,
		connectionState,
		isMicEnabled,
		isCameraEnabled,
		isScreenShareEnabled,
		error,
		connect,
		disconnect,
		toggleMic,
		toggleCamera,
		toggleScreenShare,
	};
}
