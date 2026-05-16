import {
	useLocalParticipant,
	useParticipants,
	useRoomContext,
} from "@livekit/components-react";
import {
	DoorOpen,
	MicOff,
	MoreVertical,
	PhoneOff,
	Radio,
	UserX,
} from "lucide-react";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import {
	useAdmitParticipant,
	useEndHumanInterview,
	useStartHumanInterview,
} from "#/integrations/api/queries";

const textEncoder = new TextEncoder();

type HostControlsMenuProps = {
	sessionId: string;
};

export function HostControlsMenu({ sessionId }: HostControlsMenuProps) {
	const room = useRoomContext();
	const participants = useParticipants();
	const { localParticipant } = useLocalParticipant();
	const [started, setStarted] = useState(false);
	const startMutation = useStartHumanInterview();
	const endMutation = useEndHumanInterview();
	const admitMutation = useAdmitParticipant();

	const remoteParticipants = participants.filter(
		(p) => p.identity !== localParticipant.identity,
	);

	async function handleMute(identity: string) {
		await localParticipant.publishData(
			textEncoder.encode(
				JSON.stringify({ type: "host-mute", targetIdentity: identity }),
			),
			{ reliable: true },
		);
	}

	async function handleRemove(identity: string) {
		if (!window.confirm(`Remove ${identity} from the meeting?`)) return;
		await localParticipant.publishData(
			textEncoder.encode(
				JSON.stringify({ type: "host-remove", targetIdentity: identity }),
			),
			{ reliable: true },
		);
	}

	async function handleEndForAll() {
		if (
			!window.confirm(
				"End the meeting for all participants? This cannot be undone.",
			)
		)
			return;
		try {
			await endMutation.mutateAsync(sessionId);
			await room.disconnect();
		} catch {
			// Error handled by mutation
		}
	}

	async function handleStartSession() {
		if (started) return;
		try {
			await startMutation.mutateAsync(sessionId);
			setStarted(true);
		} catch {
			// Error handled by mutation
		}
	}

	async function handleAdmitAll() {
		const waiting = remoteParticipants.filter((p) => {
			if (!p.metadata) return false;
			try {
				const meta = JSON.parse(p.metadata) as { admitted?: boolean };
				return meta.admitted === false;
			} catch {
				return false;
			}
		});
		for (const p of waiting) {
			try {
				await admitMutation.mutateAsync({
					id: sessionId,
					participantIdentity: p.identity,
				});
			} catch {
				// Continue admitting others on failure
			}
		}
	}

	return (
		<div className="flex items-center gap-2">
			<Button
				type="button"
				size="sm"
				variant={started ? "ghost" : "secondary"}
				className="text-xs"
				disabled={startMutation.isPending || started}
				onClick={handleStartSession}
			>
				<Radio className="mr-1 size-3.5" />
				{started ? "Started" : "Start session"}
			</Button>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						type="button"
						size="icon-sm"
						variant="ghost"
						aria-label="Host controls"
					>
						<MoreVertical className="size-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-56">
					<DropdownMenuItem
						className="gap-2"
						onSelect={(e) => {
							e.preventDefault();
							void handleAdmitAll();
						}}
					>
						<DoorOpen className="size-4" />
						Admit all from waiting room
					</DropdownMenuItem>

					{remoteParticipants.map((p) => (
						<div key={p.identity} className="px-2 py-1">
							<p className="mb-1 truncate text-xs font-medium text-muted-foreground">
								{p.name || p.identity}
							</p>
							<div className="flex gap-1">
								<Button
									size="sm"
									variant="ghost"
									className="h-7 text-xs"
									onClick={() => void handleMute(p.identity)}
								>
									<MicOff className="mr-1 size-3" />
									Mute
								</Button>
								<Button
									size="sm"
									variant="ghost"
									className="h-7 text-xs text-destructive hover:text-destructive"
									onClick={() => void handleRemove(p.identity)}
								>
									<UserX className="mr-1 size-3" />
									Remove
								</Button>
							</div>
						</div>
					))}

					<DropdownMenuItem
						className="gap-2 text-destructive focus:text-destructive"
						onSelect={(e) => {
							e.preventDefault();
							void handleEndForAll();
						}}
					>
						<PhoneOff className="size-4" />
						End for all
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
