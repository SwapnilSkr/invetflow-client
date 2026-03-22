import {
	Mic,
	MicOff,
	Monitor,
	MonitorOff,
	Video,
	VideoOff,
} from "lucide-react";
import React from "react";
import { Button } from "#/components/ui/button";
import { cn } from "#/lib/utils";

interface TechCheckProps {
	onComplete: (devices: {
		audio: boolean;
		video: boolean;
		screen: boolean;
	}) => void;
	onCancel?: () => void;
}

const AUDIO_BARS = [
	{ id: "bar-1", multiplier: 0.5 },
	{ id: "bar-2", multiplier: 0.75 },
	{ id: "bar-3", multiplier: 1 },
	{ id: "bar-4", multiplier: 0.75 },
	{ id: "bar-5", multiplier: 0.5 },
];

export function TechCheck({ onComplete, onCancel }: TechCheckProps) {
	const [audioEnabled, setAudioEnabled] = React.useState(false);
	const [videoEnabled, setVideoEnabled] = React.useState(false);
	const [screenEnabled, setScreenEnabled] = React.useState(false);
	const [testingAudio, setTestingAudio] = React.useState(false);
	const [audioLevel, setAudioLevel] = React.useState(0);
	const videoRef = React.useRef<HTMLVideoElement>(null);

	React.useEffect(() => {
		if (videoEnabled && videoRef.current) {
			navigator.mediaDevices
				.getUserMedia({ video: true, audio: false })
				.then((stream) => {
					if (videoRef.current) {
						videoRef.current.srcObject = stream;
					}
				})
				.catch((err) => {
					console.error("Failed to access camera:", err);
					setVideoEnabled(false);
				});
		}
		return () => {
			if (videoRef.current?.srcObject) {
				const stream = videoRef.current.srcObject as MediaStream;
				stream.getTracks().forEach((track) => {
					track.stop();
				});
			}
		};
	}, [videoEnabled]);

	const testAudio = async () => {
		setTestingAudio(true);
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			const audioContext = new AudioContext();
			const analyser = audioContext.createAnalyser();
			const source = audioContext.createMediaStreamSource(stream);
			source.connect(analyser);
			analyser.fftSize = 256;

			const dataArray = new Uint8Array(analyser.frequencyBinCount);
			const interval = setInterval(() => {
				analyser.getByteFrequencyData(dataArray);
				const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
				setAudioLevel(average);
			}, 100);

			setTimeout(() => {
				clearInterval(interval);
				stream.getTracks().forEach((track) => {
					track.stop();
				});
				audioContext.close();
				setTestingAudio(false);
				setAudioEnabled(true);
				setAudioLevel(0);
			}, 3000);
		} catch (err) {
			console.error("Failed to access microphone:", err);
			setTestingAudio(false);
			setAudioEnabled(false);
		}
	};

	const allReady = audioEnabled && videoEnabled;

	return (
		<div className="space-y-6">
			<div className="text-center space-y-2">
				<h2 className="text-2xl font-semibold">Tech Check</h2>
				<p className="text-muted-foreground">
					Let's make sure your camera and microphone are working properly before
					the interview.
				</p>
			</div>

			<div className="space-y-4">
				{/* Audio Test */}
				<div
					className={cn(
						"p-4 rounded-lg border transition-colors",
						audioEnabled
							? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800"
							: "bg-card",
					)}
				>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div
								className={cn(
									"p-2 rounded-full",
									audioEnabled
										? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400"
										: "bg-muted",
								)}
							>
								{audioEnabled ? (
									<Mic className="h-5 w-5" />
								) : (
									<MicOff className="h-5 w-5" />
								)}
							</div>
							<div>
								<p className="font-medium">Microphone</p>
								<p className="text-sm text-muted-foreground">
									{audioEnabled
										? "Working properly"
										: testingAudio
											? "Testing..."
											: "Click to test"}
								</p>
							</div>
						</div>
						{testingAudio ? (
							<div className="flex items-center gap-2">
								<div className="flex gap-0.5">
									{AUDIO_BARS.map((bar) => (
										<div
											key={bar.id}
											className="w-1 bg-emerald-500 rounded-full transition-all duration-100"
											style={{
												height: `${Math.max(8, Math.min(32, (audioLevel / 255) * 32 * bar.multiplier))}px`,
												opacity: audioLevel > 20 ? 1 : 0.3,
											}}
										/>
									))}
								</div>
								<span className="text-sm text-muted-foreground">Speak now</span>
							</div>
						) : (
							<Button
								variant={audioEnabled ? "outline" : "default"}
								size="sm"
								onClick={testAudio}
								disabled={testingAudio}
							>
								{audioEnabled ? "Test Again" : "Test Microphone"}
							</Button>
						)}
					</div>
				</div>

				{/* Video Test */}
				<div
					className={cn(
						"p-4 rounded-lg border transition-colors",
						videoEnabled
							? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800"
							: "bg-card",
					)}
				>
					<div className="flex items-center justify-between mb-4">
						<div className="flex items-center gap-3">
							<div
								className={cn(
									"p-2 rounded-full",
									videoEnabled
										? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400"
										: "bg-muted",
								)}
							>
								{videoEnabled ? (
									<Video className="h-5 w-5" />
								) : (
									<VideoOff className="h-5 w-5" />
								)}
							</div>
							<div>
								<p className="font-medium">Camera</p>
								<p className="text-sm text-muted-foreground">
									{videoEnabled ? "Camera working" : "Enable to preview"}
								</p>
							</div>
						</div>
						<Button
							variant={videoEnabled ? "outline" : "default"}
							size="sm"
							onClick={() => setVideoEnabled(!videoEnabled)}
						>
							{videoEnabled ? "Disable" : "Enable Camera"}
						</Button>
					</div>
					{videoEnabled && (
						<div className="aspect-video bg-black rounded-lg overflow-hidden">
							<video
								ref={videoRef}
								autoPlay
								muted
								playsInline
								className="w-full h-full object-cover"
							/>
						</div>
					)}
				</div>

				{/* Screen Share Test */}
				<div
					className={cn(
						"p-4 rounded-lg border transition-colors",
						screenEnabled
							? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800"
							: "bg-card",
					)}
				>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div
								className={cn(
									"p-2 rounded-full",
									screenEnabled
										? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400"
										: "bg-muted",
								)}
							>
								{screenEnabled ? (
									<Monitor className="h-5 w-5" />
								) : (
									<MonitorOff className="h-5 w-5" />
								)}
							</div>
							<div>
								<p className="font-medium">Screen Sharing</p>
								<p className="text-sm text-muted-foreground">
									{screenEnabled
										? "Ready to share"
										: "Optional for coding interviews"}
								</p>
							</div>
						</div>
						<Button
							variant={screenEnabled ? "outline" : "default"}
							size="sm"
							onClick={() => setScreenEnabled(!screenEnabled)}
						>
							{screenEnabled ? "Disable" : "Enable"}
						</Button>
					</div>
				</div>
			</div>

			<div className="flex gap-3 pt-4">
				{onCancel && (
					<Button variant="outline" className="flex-1" onClick={onCancel}>
						Cancel
					</Button>
				)}
				<Button
					className="flex-1"
					onClick={() =>
						onComplete({
							audio: audioEnabled,
							video: videoEnabled,
							screen: screenEnabled,
						})
					}
					disabled={!allReady}
				>
					{allReady ? "Continue to Interview" : "Complete Tech Check"}
				</Button>
			</div>
		</div>
	);
}
