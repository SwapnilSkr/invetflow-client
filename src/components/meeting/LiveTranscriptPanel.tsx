import { useRoomContext } from "@livekit/components-react";
import { useQuery } from "@tanstack/react-query";
import {
	type DataPacket_Kind,
	type RemoteParticipant,
	RoomEvent,
} from "livekit-client";
import { Captions, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "#/components/ui/button";
import type { MeetingTranscriptTurn } from "#/integrations/api/client";
import { humanInterviewQueries } from "#/integrations/api/queries";
import { cn } from "#/lib/utils";

const TRANSCRIPT_TOPIC = "invetflow-meeting-transcript";
const textDecoder = new TextDecoder();

type LiveTranscriptPanelProps = {
	sessionId: string;
	open: boolean;
	onClose: () => void;
};

type IncomingTranscriptTurn = MeetingTranscriptTurn & {
	type?: string;
};

export function LiveTranscriptPanel({
	sessionId,
	open,
	onClose,
}: LiveTranscriptPanelProps) {
	const room = useRoomContext();
	const [turns, setTurns] = useState<MeetingTranscriptTurn[]>([]);
	const [pollingEnabled, setPollingEnabled] = useState(false);
	const lastDataChannelAt = useRef(Date.now());
	const transcriptQuery = useQuery({
		...humanInterviewQueries.transcript(sessionId),
		enabled: open && pollingEnabled && sessionId.length > 0,
		refetchInterval: pollingEnabled ? 2_000 : false,
	});

	useEffect(() => {
		if (!open) {
			return;
		}
		const timer = window.setInterval(() => {
			setPollingEnabled(Date.now() - lastDataChannelAt.current > 10_000);
		}, 2_000);
		return () => window.clearInterval(timer);
	}, [open]);

	useEffect(() => {
		const queryTurns = transcriptQuery.data?.turns;
		if (queryTurns) {
			setTurns((current) => mergeTurns(current, queryTurns));
		}
	}, [transcriptQuery.data?.turns]);

	useEffect(() => {
		function handleDataReceived(
			payload: Uint8Array,
			_participant?: RemoteParticipant,
			_kind?: DataPacket_Kind,
			topic?: string,
		) {
			if (topic !== TRANSCRIPT_TOPIC) {
				return;
			}
			try {
				const parsed = JSON.parse(
					textDecoder.decode(payload),
				) as IncomingTranscriptTurn;
				lastDataChannelAt.current = Date.now();
				setPollingEnabled(false);
				setTurns((current) => mergeTurn(current, parsed));
			} catch {
				// Ignore malformed captions. Durable transcript polling still recovers final turns.
			}
		}

		room.on(RoomEvent.DataReceived, handleDataReceived);
		return () => {
			room.off(RoomEvent.DataReceived, handleDataReceived);
		};
	}, [room]);

	const renderedTurns = turns
		.filter((turn) => turn.text.trim().length > 0)
		.slice(-80);

	if (!open) {
		return null;
	}

	return (
		<aside className="absolute inset-x-3 bottom-20 z-30 flex max-h-[calc(100dvh-7rem)] min-h-0 flex-col overflow-hidden rounded-xl border border-meeting-border bg-meeting-bg shadow-2xl lg:static lg:inset-auto lg:max-h-none lg:rounded-none lg:border-t-0 lg:border-r-0 lg:border-b-0">
			<div className="flex shrink-0 items-center justify-between border-meeting-border border-b px-4 py-3">
				<div className="min-w-0">
					<h2 className="flex items-center gap-2 font-semibold text-meeting-text text-sm">
						<Captions className="size-4" aria-hidden />
						Transcript
					</h2>
					<p className="text-meeting-text-muted text-xs">
						{pollingEnabled ? "Polling final transcript" : "Live captions"}
					</p>
				</div>
				<Button
					type="button"
					size="icon-sm"
					variant="ghost"
					onClick={onClose}
					className="text-meeting-text-muted hover:bg-meeting-surface-hover hover:text-meeting-text"
					aria-label="Close transcript"
				>
					<X className="size-4" aria-hidden />
				</Button>
			</div>
			<div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-3">
				{renderedTurns.length === 0 ? (
					<p className="rounded-lg bg-meeting-surface/50 px-3 py-3 text-meeting-text-muted text-sm">
						Transcript will appear when someone speaks.
					</p>
				) : (
					renderedTurns.map((turn) => (
						<div
							key={turnKey(turn)}
							className={cn(
								"rounded-lg bg-meeting-surface/50 px-3 py-2",
								!turn.is_final && "font-mono opacity-80",
							)}
						>
							<div className="flex min-w-0 items-center gap-2">
								<span className="truncate font-medium text-meeting-text text-xs">
									{turn.speaker_name || turn.speaker_identity}
								</span>
								{!turn.is_final ? (
									<span className="shrink-0 text-meeting-text-muted text-[11px]">
										live
									</span>
								) : null}
							</div>
							<p className="mt-1 whitespace-pre-wrap break-words text-meeting-text text-sm">
								{turn.text}
							</p>
						</div>
					))
				)}
			</div>
		</aside>
	);
}

function turnKey(turn: MeetingTranscriptTurn) {
	return `${turn.speaker_identity}:${turn.start_ms}:${turn.end_ms}:${turn.text}`;
}

function mergeTurns(
	current: MeetingTranscriptTurn[],
	incoming: MeetingTranscriptTurn[],
) {
	return incoming.reduce(mergeTurn, current);
}

function mergeTurn(
	current: MeetingTranscriptTurn[],
	incoming: IncomingTranscriptTurn,
) {
	const next = {
		speaker_identity: incoming.speaker_identity,
		speaker_name: incoming.speaker_name,
		text: incoming.text,
		start_ms: incoming.start_ms ?? Date.now(),
		end_ms: incoming.end_ms ?? incoming.start_ms ?? Date.now(),
		confidence: incoming.confidence ?? 0,
		is_final: incoming.is_final ?? false,
	};
	const index = current.findIndex(
		(turn) =>
			turn.speaker_identity === next.speaker_identity &&
			(turn.start_ms === next.start_ms ||
				(!turn.is_final && turn.speaker_identity === next.speaker_identity)),
	);
	if (index < 0) {
		return [...current, next];
	}
	const copy = current.slice();
	copy[index] = next;
	return copy;
}
