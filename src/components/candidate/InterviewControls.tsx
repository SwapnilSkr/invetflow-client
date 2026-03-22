import {
	Mic,
	MicOff,
	MonitorUp,
	MoreVertical,
	PhoneOff,
	Video,
	VideoOff,
} from "lucide-react";
import React from "react";
import { Button } from "#/components/ui/button";
import { cn } from "#/lib/utils";

interface InterviewControlsProps {
	audioEnabled: boolean;
	videoEnabled: boolean;
	screenSharing: boolean;
	onToggleAudio: () => void;
	onToggleVideo: () => void;
	onToggleScreenShare: () => void;
	onEndCall: () => void;
	disabled?: boolean;
}

export function InterviewControls({
	audioEnabled,
	videoEnabled,
	screenSharing,
	onToggleAudio,
	onToggleVideo,
	onToggleScreenShare,
	onEndCall,
	disabled = false,
}: InterviewControlsProps) {
	return (
		<div className="flex items-center justify-center gap-3 p-4 bg-card/95 backdrop-blur-sm border-t">
			{/* Audio Toggle */}
			<Button
				variant={audioEnabled ? "outline" : "destructive"}
				size="icon"
				onClick={onToggleAudio}
				disabled={disabled}
				className={cn(
					"h-12 w-12 rounded-full",
					!audioEnabled && "bg-red-500 hover:bg-red-600",
				)}
				aria-label={audioEnabled ? "Mute microphone" : "Unmute microphone"}
			>
				{audioEnabled ? (
					<Mic className="h-5 w-5" />
				) : (
					<MicOff className="h-5 w-5" />
				)}
			</Button>

			{/* Video Toggle */}
			<Button
				variant={videoEnabled ? "outline" : "destructive"}
				size="icon"
				onClick={onToggleVideo}
				disabled={disabled}
				className={cn(
					"h-12 w-12 rounded-full",
					!videoEnabled && "bg-red-500 hover:bg-red-600",
				)}
				aria-label={videoEnabled ? "Turn off camera" : "Turn on camera"}
			>
				{videoEnabled ? (
					<Video className="h-5 w-5" />
				) : (
					<VideoOff className="h-5 w-5" />
				)}
			</Button>

			{/* Screen Share Toggle */}
			<Button
				variant={screenSharing ? "default" : "outline"}
				size="icon"
				onClick={onToggleScreenShare}
				disabled={disabled}
				className={cn(
					"h-12 w-12 rounded-full",
					screenSharing && "bg-blue-500 hover:bg-blue-600 text-white",
				)}
				aria-label={
					screenSharing ? "Stop screen sharing" : "Start screen sharing"
				}
			>
				<MonitorUp className="h-5 w-5" />
			</Button>

			{/* End Call */}
			<Button
				variant="destructive"
				size="icon"
				onClick={onEndCall}
				disabled={disabled}
				className="h-12 w-12 rounded-full bg-red-600 hover:bg-red-700"
				aria-label="End interview"
			>
				<PhoneOff className="h-5 w-5" />
			</Button>
		</div>
	);
}
