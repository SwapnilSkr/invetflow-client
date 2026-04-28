import {
	AlertCircle,
	Mic,
	MicOff,
	Video,
	VideoOff,
	Wifi,
	WifiOff,
} from "lucide-react";
import { Badge } from "#/components/ui/badge";
import { cn } from "#/lib/utils";

interface InterviewStatusBarProps {
	status: "connecting" | "connected" | "reconnecting" | "error";
	audioEnabled: boolean;
	videoEnabled: boolean;
	networkQuality: "good" | "fair" | "poor";
	latency?: number;
	duration?: number;
	aiSpeaking?: boolean;
	candidateSpeaking?: boolean;
}

export function InterviewStatusBar({
	status,
	audioEnabled,
	videoEnabled,
	networkQuality,
	latency,
	duration,
	aiSpeaking,
	candidateSpeaking,
}: InterviewStatusBarProps) {
	const formatDuration = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	return (
		<div className="flex items-center justify-between px-4 py-3 bg-card/95 backdrop-blur-sm border-b">
			<div className="flex items-center gap-4">
				{/* Connection Status */}
				<div className="flex items-center gap-2">
					{status === "connecting" && (
						<>
							<div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
							<span className="text-sm text-amber-600 dark:text-amber-400">
								Connecting...
							</span>
						</>
					)}
					{status === "connected" && (
						<>
							<div className="h-2 w-2 rounded-full bg-blue-500" />
							<span className="text-sm text-blue-600 dark:text-blue-400">
								Connected
							</span>
						</>
					)}
					{status === "reconnecting" && (
						<>
							<div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
							<span className="text-sm text-amber-600 dark:text-amber-400">
								Reconnecting...
							</span>
						</>
					)}
					{status === "error" && (
						<>
							<AlertCircle className="h-4 w-4 text-red-500" />
							<span className="text-sm text-red-600 dark:text-red-400">
								Connection Error
							</span>
						</>
					)}
				</div>

				{/* Speaking Indicators */}
				{(aiSpeaking || candidateSpeaking) && (
					<div className="flex items-center gap-2">
						{aiSpeaking && (
							<Badge
								variant="secondary"
								className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
							>
								<span className="flex items-center gap-1">
									<span className="relative flex h-2 w-2">
										<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
										<span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
									</span>
									AI Speaking
								</span>
							</Badge>
						)}
						{candidateSpeaking && (
							<Badge
								variant="secondary"
								className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
							>
								<span className="flex items-center gap-1">
									<span className="relative flex h-2 w-2">
										<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
										<span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
									</span>
									You
								</span>
							</Badge>
						)}
					</div>
				)}
			</div>

			<div className="flex items-center gap-4">
				{/* Duration */}
				{duration !== undefined && (
					<div className="text-sm font-mono text-muted-foreground">
						{formatDuration(duration)}
					</div>
				)}

				{/* Device Status */}
				<div className="flex items-center gap-2">
					{audioEnabled ? (
						<Mic className="h-4 w-4 text-blue-500" />
					) : (
						<MicOff className="h-4 w-4 text-red-500" />
					)}
					{videoEnabled ? (
						<Video className="h-4 w-4 text-blue-500" />
					) : (
						<VideoOff className="h-4 w-4 text-red-500" />
					)}
				</div>

				{/* Network Quality */}
				<div
					className="flex items-center gap-1"
					title={`Latency: ${latency}ms`}
				>
					{networkQuality === "good" ? (
						<Wifi className="h-4 w-4 text-blue-500" />
					) : networkQuality === "fair" ? (
						<Wifi className="h-4 w-4 text-amber-500" />
					) : (
						<WifiOff className="h-4 w-4 text-red-500" />
					)}
					{latency && (
						<span
							className={cn(
								"text-xs",
								latency < 150
									? "text-blue-600 dark:text-blue-400"
									: latency < 300
										? "text-amber-600 dark:text-amber-400"
										: "text-red-600 dark:text-red-400",
							)}
						>
							{latency}ms
						</span>
					)}
				</div>
			</div>
		</div>
	);
}
