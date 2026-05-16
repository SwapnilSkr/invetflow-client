import {
	useLocalParticipant,
	useParticipants,
} from "@livekit/components-react";
import { Loader2, ShieldCheck } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { Button } from "#/components/ui/button";
import { useAdmitParticipant } from "#/integrations/api/queries";

type WaitingRoomGateProps = {
	sessionId: string;
	jobId: string;
	applicationId: string;
	isHost: boolean;
	children: ReactNode;
};

function isAdmitted(participant: { metadata?: string | undefined }): boolean {
	if (!participant.metadata) return true;
	try {
		const meta = JSON.parse(participant.metadata) as {
			admitted?: boolean;
		};
		return meta.admitted !== false;
	} catch {
		return true;
	}
}

export function WaitingRoomGate({
	sessionId,
	jobId,
	applicationId,
	isHost,
	children,
}: WaitingRoomGateProps) {
	const participants = useParticipants();
	const { localParticipant } = useLocalParticipant();
	const admitMutation = useAdmitParticipant(jobId, applicationId);
	const [admittedIds, setAdmittedIds] = useState<Set<string>>(new Set());

	const localIsAdmitted = isAdmitted(localParticipant);

	useEffect(() => {
		if (!localIsAdmitted) {
			localParticipant.setMicrophoneEnabled(false);
			localParticipant.setCameraEnabled(false);
		} else {
			localParticipant.setMicrophoneEnabled(true);
			localParticipant.setCameraEnabled(true);
		}
	}, [localIsAdmitted, localParticipant]);

	const waitingParticipants = participants.filter(
		(p) =>
			p.identity !== localParticipant.identity &&
			!isAdmitted(p) &&
			!admittedIds.has(p.identity),
	);

	const hasWaiting = waitingParticipants.length > 0;

	async function handleAdmit(identity: string) {
		try {
			await admitMutation.mutateAsync({
				id: sessionId,
				participantIdentity: identity,
			});
			setAdmittedIds((prev) => new Set(prev).add(identity));
		} catch {
			// Error is handled by mutation; UI stays unchanged on failure
		}
	}

	if (!isHost && !localIsAdmitted) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background text-foreground">
				<div className="flex flex-col items-center gap-4 text-center">
					<div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
						<Loader2 className="size-8 animate-spin text-primary" />
					</div>
					<div className="space-y-1">
						<h2 className="text-lg font-semibold">Waiting for host</h2>
						<p className="text-sm text-muted-foreground">
							The host will admit you into the meeting shortly.
						</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="relative h-full w-full">
			{children}

			{isHost && hasWaiting ? (
				<div className="absolute top-4 left-4 z-30 w-80 max-w-[calc(100%-2rem)] rounded-xl border border-meeting-border bg-meeting-bg/95 p-4 shadow-2xl backdrop-blur">
					<div className="mb-3 flex items-center gap-2">
						<ShieldCheck className="size-4 text-primary" />
						<h3 className="font-semibold text-sm text-meeting-text">
							Waiting room
						</h3>
						<span className="ml-auto rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
							{waitingParticipants.length}
						</span>
					</div>
					<div className="space-y-2">
						{waitingParticipants.map((p) => (
							<div
								key={p.identity}
								className="flex items-center justify-between gap-3 rounded-lg bg-meeting-surface/50 px-3 py-2"
							>
								<span className="min-w-0 truncate text-sm text-meeting-text">
									{p.name || p.identity}
								</span>
								<Button
									size="sm"
									className="shrink-0"
									disabled={admitMutation.isPending}
									onClick={() => handleAdmit(p.identity)}
								>
									Admit
								</Button>
							</div>
						))}
					</div>
				</div>
			) : null}
		</div>
	);
}
