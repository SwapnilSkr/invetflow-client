import {
	Loader2,
	Mic,
	MicOff,
	Monitor,
	Video,
	VideoOff,
	Volume2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "#/components/ui/button";

type PreCallScreenProps = {
	onJoin: () => void;
	sessionTitle?: string;
};

export function PreCallScreen({ onJoin, sessionTitle }: PreCallScreenProps) {
	const videoRef = useRef<HTMLVideoElement>(null);
	const [stream, setStream] = useState<MediaStream | null>(null);
	const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
	const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
	const [selectedAudio, setSelectedAudio] = useState<string>("");
	const [selectedVideo, setSelectedVideo] = useState<string>("");
	const [micEnabled, setMicEnabled] = useState(true);
	const [camEnabled, setCamEnabled] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const audioContextRef = useRef<AudioContext | null>(null);

	useEffect(() => {
		async function init() {
			try {
				const mediaStream = await navigator.mediaDevices.getUserMedia({
					video: true,
					audio: true,
				});
				setStream(mediaStream);
				if (videoRef.current) {
					videoRef.current.srcObject = mediaStream;
				}

				const devices = await navigator.mediaDevices.enumerateDevices();
				setAudioDevices(devices.filter((d) => d.kind === "audioinput"));
				setVideoDevices(devices.filter((d) => d.kind === "videoinput"));

				const videoTrack = mediaStream.getVideoTracks()[0];
				const audioTrack = mediaStream.getAudioTracks()[0];
				if (videoTrack)
					setSelectedVideo(videoTrack.getSettings().deviceId ?? "");
				if (audioTrack)
					setSelectedAudio(audioTrack.getSettings().deviceId ?? "");
			} catch (err) {
				const message =
					err instanceof Error
						? err.message
						: "Could not access camera or microphone.";
				if (message.includes("Permission denied")) {
					setError(
						"Camera and microphone access were denied. Please allow permissions in your browser and reload the page.",
					);
				} else {
					setError(message);
				}
			} finally {
				setLoading(false);
			}
		}
		void init();

		return () => {
			if (audioContextRef.current) {
				audioContextRef.current.close();
			}
		};
	}, []);

	useEffect(() => {
		return () => {
			if (stream) {
				for (const track of stream.getTracks()) {
					track.stop();
				}
			}
		};
	}, [stream]);

	async function switchDevice(kind: "audio" | "video", deviceId: string) {
		if (!stream) return;
		try {
			const constraints: MediaStreamConstraints =
				kind === "audio"
					? { audio: { deviceId: { exact: deviceId } } }
					: { video: { deviceId: { exact: deviceId } } };
			const newStream = await navigator.mediaDevices.getUserMedia(constraints);
			const newTrack =
				kind === "audio"
					? newStream.getAudioTracks()[0]
					: newStream.getVideoTracks()[0];
			if (!newTrack) return;

			const oldTracks =
				kind === "audio" ? stream.getAudioTracks() : stream.getVideoTracks();
			for (const track of oldTracks) {
				stream.removeTrack(track);
				track.stop();
			}
			stream.addTrack(newTrack);

			if (kind === "video" && videoRef.current) {
				videoRef.current.srcObject = stream;
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not switch device.");
		}
	}

	function toggleMic() {
		if (!stream) return;
		const audioTracks = stream.getAudioTracks();
		const next = !micEnabled;
		for (const track of audioTracks) {
			track.enabled = next;
		}
		setMicEnabled(next);
	}

	function toggleCam() {
		if (!stream) return;
		const videoTracks = stream.getVideoTracks();
		const next = !camEnabled;
		for (const track of videoTracks) {
			track.enabled = next;
		}
		setCamEnabled(next);
	}

	function playTestTone() {
		try {
			const AudioCtx =
				window.AudioContext ||
				(window as unknown as { webkitAudioContext: typeof AudioContext })
					.webkitAudioContext;
			const ctx = new AudioCtx();
			audioContextRef.current = ctx;
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.frequency.value = 440;
			gain.gain.value = 0.1;
			osc.start();
			osc.stop(ctx.currentTime + 0.5);
		} catch {
			setError("Audio test could not play.");
		}
	}

	if (loading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background text-foreground">
				<div className="flex items-center gap-3 text-sm text-muted-foreground">
					<Loader2 className="size-5 animate-spin" aria-hidden />
					Checking devices...
				</div>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-background p-6">
			<div className="w-full max-w-md space-y-6">
				<div className="space-y-1 text-center">
					<h1 className="text-xl font-semibold text-foreground">
						{sessionTitle ?? "Ready to join?"}
					</h1>
					<p className="text-sm text-muted-foreground">
						Check your camera and microphone before entering.
					</p>
				</div>

				{error ? (
					<div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
						{error}
					</div>
				) : null}

				<div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-meeting-bg">
					<video
						ref={videoRef}
						autoPlay
						muted
						playsInline
						className="h-full w-full object-cover"
					/>
					{!camEnabled ? (
						<div className="absolute inset-0 flex items-center justify-center bg-meeting-surface">
							<VideoOff className="size-10 text-meeting-text-muted" />
						</div>
					) : null}
				</div>

				<div className="flex items-center justify-center gap-3">
					<button
						type="button"
						onClick={toggleMic}
						className={`grid size-12 place-items-center rounded-full transition ${
							micEnabled
								? "bg-primary text-primary-foreground hover:bg-primary/90"
								: "bg-muted text-muted-foreground hover:bg-muted/80"
						}`}
						aria-label={micEnabled ? "Mute microphone" : "Unmute microphone"}
					>
						{micEnabled ? (
							<Mic className="size-5" />
						) : (
							<MicOff className="size-5" />
						)}
					</button>
					<button
						type="button"
						onClick={toggleCam}
						className={`grid size-12 place-items-center rounded-full transition ${
							camEnabled
								? "bg-primary text-primary-foreground hover:bg-primary/90"
								: "bg-muted text-muted-foreground hover:bg-muted/80"
						}`}
						aria-label={camEnabled ? "Turn camera off" : "Turn camera on"}
					>
						{camEnabled ? (
							<Video className="size-5" />
						) : (
							<VideoOff className="size-5" />
						)}
					</button>
				</div>

				<div className="space-y-3">
					<div className="grid gap-1.5">
						<label
							htmlFor="mic-select"
							className="text-xs text-muted-foreground"
						>
							Microphone
						</label>
						<select
							id="mic-select"
							className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
							value={selectedAudio}
							onChange={(e) => {
								setSelectedAudio(e.target.value);
								void switchDevice("audio", e.target.value);
							}}
						>
							{audioDevices.map((d) => (
								<option key={d.deviceId} value={d.deviceId}>
									{d.label || "Microphone"}
								</option>
							))}
						</select>
					</div>
					<div className="grid gap-1.5">
						<label
							htmlFor="cam-select"
							className="text-xs text-muted-foreground"
						>
							Camera
						</label>
						<select
							id="cam-select"
							className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
							value={selectedVideo}
							onChange={(e) => {
								setSelectedVideo(e.target.value);
								void switchDevice("video", e.target.value);
							}}
						>
							{videoDevices.map((d) => (
								<option key={d.deviceId} value={d.deviceId}>
									{d.label || "Camera"}
								</option>
							))}
						</select>
					</div>
				</div>

				<div className="flex items-center gap-3">
					<Button
						type="button"
						variant="outline"
						className="flex-1"
						onClick={playTestTone}
					>
						<Volume2 className="mr-2 size-4" />
						Test audio
					</Button>
					<Button
						type="button"
						className="flex-1"
						onClick={() => {
							if (stream) {
								for (const track of stream.getTracks()) {
									track.stop();
								}
								setStream(null);
							}
							onJoin();
						}}
					>
						<Monitor className="mr-2 size-4" />
						Join now
					</Button>
				</div>
			</div>
		</div>
	);
}
