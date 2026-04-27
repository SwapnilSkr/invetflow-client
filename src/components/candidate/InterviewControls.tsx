import {
	ChevronUp,
	Headphones,
	Mic,
	MicOff,
	MonitorUp,
	PhoneOff,
	Video,
	VideoOff,
} from "lucide-react";
import { Button } from "#/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
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
	endDisabled?: boolean;
	audioInputDevices?: MediaDeviceInfo[];
	audioOutputDevices?: MediaDeviceInfo[];
	activeAudioInputDeviceId?: string;
	activeAudioOutputDeviceId?: string;
	audioOutputSelectionSupported?: boolean;
	onRefreshAudioDevices?: () => void;
	onSelectMicrophone?: (deviceId: string) => void;
	onSelectSpeaker?: (deviceId: string) => void;
}

function deviceLabel(d: MediaDeviceInfo, fallback: string) {
	const label = d.label?.trim();
	return label || fallback;
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
	endDisabled = disabled,
	audioInputDevices = [],
	audioOutputDevices = [],
	activeAudioInputDeviceId,
	activeAudioOutputDeviceId,
	audioOutputSelectionSupported = false,
	onRefreshAudioDevices,
	onSelectMicrophone,
	onSelectSpeaker,
}: InterviewControlsProps) {
	const showAudioSettings =
		!disabled && !!onSelectMicrophone && !!onSelectSpeaker;

	return (
		<div className="flex items-center justify-center gap-3 p-4 bg-card/95 backdrop-blur-sm border-t">
			{/* Audio Toggle + device menu (Meet-style) */}
			<div className="flex items-stretch">
				<Button
					variant={audioEnabled ? "outline" : "destructive"}
					size="icon"
					onClick={onToggleAudio}
					disabled={disabled}
					className={cn(
						"h-12 w-12 rounded-full",
						showAudioSettings && "rounded-r-none border-r-0",
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
				{showAudioSettings && (
					<DropdownMenu
						onOpenChange={(open) => {
							if (open) onRefreshAudioDevices?.();
						}}
					>
						<DropdownMenuTrigger asChild>
							<Button
								variant={audioEnabled ? "outline" : "destructive"}
								size="icon"
								disabled={disabled}
								className={cn(
									"h-12 w-9 rounded-l-none px-0",
									!audioEnabled && "bg-red-500 hover:bg-red-600",
								)}
								aria-label="Microphone and speaker settings"
							>
								<ChevronUp className="h-4 w-4 opacity-80" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="center" side="top" className="w-56">
							<DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
								Audio
							</DropdownMenuLabel>
							<DropdownMenuSub>
								<DropdownMenuSubTrigger className="gap-2">
									<Mic className="h-4 w-4 shrink-0 opacity-70" />
									<span className="truncate">Microphone</span>
								</DropdownMenuSubTrigger>
								<DropdownMenuSubContent className="max-h-64 overflow-y-auto">
									{audioInputDevices.length === 0 ? (
										<div className="px-2 py-1.5 text-xs text-muted-foreground">
											No microphones found
										</div>
									) : (
										<DropdownMenuRadioGroup
											value={activeAudioInputDeviceId ?? ""}
											onValueChange={(id) => {
												if (id) onSelectMicrophone?.(id);
											}}
										>
											{audioInputDevices.map((d, i) => (
												<DropdownMenuRadioItem
													key={d.deviceId || `mic-${i}`}
													value={d.deviceId}
													className="pr-8"
												>
													<span className="truncate">
														{deviceLabel(d, `Microphone ${i + 1}`)}
													</span>
												</DropdownMenuRadioItem>
											))}
										</DropdownMenuRadioGroup>
									)}
								</DropdownMenuSubContent>
							</DropdownMenuSub>
							{audioOutputSelectionSupported ? (
								<DropdownMenuSub>
									<DropdownMenuSubTrigger className="gap-2">
										<Headphones className="h-4 w-4 shrink-0 opacity-70" />
										<span className="truncate">Speakers</span>
									</DropdownMenuSubTrigger>
									<DropdownMenuSubContent className="max-h-64 overflow-y-auto">
										<DropdownMenuRadioGroup
											value={activeAudioOutputDeviceId ?? ""}
											onValueChange={(id) => {
												if (id) onSelectSpeaker(id);
											}}
										>
											{audioOutputDevices.length === 0 ? (
												<div className="px-2 py-1.5 text-xs text-muted-foreground">
													No outputs found
												</div>
											) : (
												audioOutputDevices.map((d, i) => (
													<DropdownMenuRadioItem
														key={d.deviceId || `out-${i}`}
														value={d.deviceId}
														className="pr-8"
													>
														<span className="truncate">
															{deviceLabel(d, `Speaker ${i + 1}`)}
														</span>
													</DropdownMenuRadioItem>
												))
											)}
										</DropdownMenuRadioGroup>
									</DropdownMenuSubContent>
								</DropdownMenuSub>
							) : (
								<>
									<DropdownMenuSeparator />
									<div className="px-2 py-1.5 text-xs text-muted-foreground leading-snug">
										Speaker selection is not supported in this browser. Use
										system sound settings to pick a headset.
									</div>
								</>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				)}
			</div>

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
				disabled={endDisabled}
				className="h-12 w-12 rounded-full bg-red-600 hover:bg-red-700"
				aria-label="End interview"
			>
				<PhoneOff className="h-5 w-5" />
			</Button>
		</div>
	);
}
