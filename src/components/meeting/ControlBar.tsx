import {
	Camera,
	CameraOff,
	Captions,
	MessageSquare,
	Mic,
	MicOff,
	MonitorUp,
	MonitorX,
	PhoneOff,
} from "lucide-react";
import type { ReactNode } from "react";

type ControlBarProps = {
	isCameraEnabled: boolean;
	isChatOpen: boolean;
	isTranscriptOpen?: boolean;
	isMicrophoneEnabled: boolean;
	isScreenShareEnabled: boolean;
	allowScreenShare?: boolean;
	onLeave: () => void;
	onToggleCamera: () => void;
	onToggleChat: () => void;
	onToggleTranscript?: () => void;
	onToggleMicrophone: () => void;
	onToggleScreenShare: () => void;
};

export function ControlBar({
	isCameraEnabled,
	isChatOpen,
	isTranscriptOpen = false,
	isMicrophoneEnabled,
	isScreenShareEnabled,
	allowScreenShare = true,
	onLeave,
	onToggleCamera,
	onToggleChat,
	onToggleTranscript,
	onToggleMicrophone,
	onToggleScreenShare,
}: ControlBarProps) {
	return (
		<div className="absolute right-0 bottom-0 left-0 z-10 flex items-center justify-center border-meeting-border border-t bg-meeting-bg/85 px-3 py-3 backdrop-blur md:px-5">
			<div className="flex items-center gap-2 rounded-full bg-meeting-surface px-2 py-2 shadow-2xl ring-1 ring-meeting-border">
				<ControlButton
					label={isMicrophoneEnabled ? "Mute microphone" : "Unmute microphone"}
					active={isMicrophoneEnabled}
					onClick={onToggleMicrophone}
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
					onClick={onToggleCamera}
				>
					{isCameraEnabled ? (
						<Camera className="size-5" aria-hidden />
					) : (
						<CameraOff className="size-5" aria-hidden />
					)}
				</ControlButton>
				{allowScreenShare ? (
					<ControlButton
						label={
							isScreenShareEnabled ? "Stop presenting" : "Present your screen"
						}
						active={isScreenShareEnabled}
						onClick={onToggleScreenShare}
					>
						{isScreenShareEnabled ? (
							<MonitorX className="size-5" aria-hidden />
						) : (
							<MonitorUp className="size-5" aria-hidden />
						)}
					</ControlButton>
				) : null}
				<ControlButton
					label={isChatOpen ? "Close chat" : "Open chat"}
					active={isChatOpen}
					onClick={onToggleChat}
				>
					<MessageSquare className="size-5" aria-hidden />
				</ControlButton>
				{onToggleTranscript ? (
					<ControlButton
						label={isTranscriptOpen ? "Close transcript" : "Open transcript"}
						active={isTranscriptOpen}
						onClick={onToggleTranscript}
					>
						<Captions className="size-5" aria-hidden />
					</ControlButton>
				) : null}
				<button
					type="button"
					className="grid size-11 place-items-center rounded-full bg-destructive text-destructive-foreground transition hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
					onClick={onLeave}
					aria-label="Leave meeting"
					title="Leave meeting"
				>
					<PhoneOff className="size-5" aria-hidden />
				</button>
			</div>
		</div>
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
			className={`grid size-11 place-items-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-meeting-text ${
				active
					? "bg-meeting-text text-meeting-bg hover:bg-meeting-text-muted"
					: "bg-meeting-surface-hover text-meeting-text hover:bg-meeting-border"
			}`}
			onClick={onClick}
			aria-label={label}
			title={label}
		>
			{children}
		</button>
	);
}
