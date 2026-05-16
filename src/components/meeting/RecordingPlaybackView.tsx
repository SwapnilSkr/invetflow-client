import { Download } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "#/components/ui/button";
import type {
	HumanInterviewSession,
	MeetingTranscript,
	MeetingTranscriptTurn,
} from "#/integrations/api/client";
import { cn } from "#/lib/utils";

type RecordingPlaybackViewProps = {
	session: HumanInterviewSession;
	transcript: MeetingTranscript | null;
};

export function RecordingPlaybackView({
	session,
	transcript,
}: RecordingPlaybackViewProps) {
	const mediaRef = useRef<HTMLVideoElement>(null);
	const transcriptListRef = useRef<HTMLDivElement>(null);
	// Tracks whether the recruiter is actively reading earlier turns so auto-scroll
	// doesn't yank them forward on every timeupdate tick.
	const userScrolledAwayRef = useRef(false);
	const turns = (transcript?.turns ?? [])
		.filter((turn) => turn.is_final && turn.text.trim().length > 0)
		.slice()
		.sort((left, right) => left.start_ms - right.start_ms);
	const [activeIndex, setActiveIndex] = useState(-1);
	const transcriptText = transcriptToText(turns);
	const transcriptHref = `data:text/plain;charset=utf-8,${encodeURIComponent(transcriptText)}`;
	const captionsHref = `data:text/vtt;charset=utf-8,${encodeURIComponent(transcriptToVtt(turns))}`;

	useEffect(() => {
		if (activeIndex < 0 || userScrolledAwayRef.current) {
			return;
		}
		const container = transcriptListRef.current;
		const active = container?.querySelector<HTMLElement>(
			`[data-turn-index="${activeIndex}"]`,
		);
		if (!container || !active) {
			return;
		}
		const containerRect = container.getBoundingClientRect();
		const activeRect = active.getBoundingClientRect();
		const inView =
			activeRect.top >= containerRect.top &&
			activeRect.bottom <= containerRect.bottom;
		if (!inView) {
			active.scrollIntoView({ block: "nearest" });
		}
	}, [activeIndex]);

	function handleManualScroll() {
		const container = transcriptListRef.current;
		const active = container?.querySelector<HTMLElement>(
			`[data-turn-index="${activeIndex}"]`,
		);
		if (!container || !active) {
			return;
		}
		const containerRect = container.getBoundingClientRect();
		const activeRect = active.getBoundingClientRect();
		const inView =
			activeRect.top >= containerRect.top &&
			activeRect.bottom <= containerRect.bottom;
		userScrolledAwayRef.current = !inView;
	}

	function seekToTurn(turn: MeetingTranscriptTurn) {
		const media = mediaRef.current;
		if (!media) {
			return;
		}
		const offsetMs = transcript?.recording_offset_ms ?? 0;
		// Click-to-seek snaps the user back to following the playhead.
		userScrolledAwayRef.current = false;
		// offsetMs measures how far the recording leads the transcript timeline,
		// so video time = (transcript time + offset).
		media.currentTime = Math.max(0, (turn.start_ms + offsetMs) / 1000);
		void media.play().catch(() => undefined);
	}

	function handleTimeUpdate() {
		const media = mediaRef.current;
		if (!media || turns.length === 0) {
			return;
		}
		const offsetMs = transcript?.recording_offset_ms ?? 0;
		const currentMs = media.currentTime * 1000 - offsetMs;
		setActiveIndex(findActiveTurn(turns, currentMs));
	}

	if (!session.recording_url) {
		return (
			<div className="mx-auto max-w-3xl p-6">
				<p className="rounded-md border border-border bg-card px-4 py-3 text-muted-foreground text-sm">
					No recording URL is available for this interview.
				</p>
			</div>
		);
	}

	return (
		<div className="grid min-h-screen bg-background text-foreground lg:grid-cols-[minmax(0,1fr)_420px]">
			<main className="flex min-h-0 flex-col gap-4 p-4 md:p-6">
				<div className="min-h-0 flex-1">
					<video
						ref={mediaRef}
						src={session.recording_url}
						controls
						className="h-full max-h-[calc(100vh-8rem)] w-full rounded-md bg-black"
						onTimeUpdate={handleTimeUpdate}
					>
						<track
							kind="captions"
							src={captionsHref}
							srcLang="en"
							label="Transcript"
							default
						/>
					</video>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button asChild variant="outline">
						<a href={session.recording_url} download>
							<Download className="size-4" aria-hidden />
							Download recording
						</a>
					</Button>
					<Button asChild variant="outline" disabled={turns.length === 0}>
						<a href={transcriptHref} download="meeting-transcript.txt">
							<Download className="size-4" aria-hidden />
							Download transcript
						</a>
					</Button>
				</div>
			</main>
			<aside className="min-h-0 border-border border-t bg-card lg:border-t-0 lg:border-l">
				<div className="border-border border-b px-4 py-3">
					<h1 className="font-semibold text-base">Synced transcript</h1>
					<p className="text-muted-foreground text-sm">
						{turns.length} final turns
					</p>
				</div>
				<div
					ref={transcriptListRef}
					onScroll={handleManualScroll}
					className="max-h-[calc(100vh-73px)] space-y-2 overflow-y-auto p-3"
				>
					{turns.length === 0 ? (
						<p className="rounded-md bg-muted px-3 py-3 text-muted-foreground text-sm">
							Transcript turns are not available yet.
						</p>
					) : (
						turns.map((turn, index) => (
							<button
								key={`${turn.speaker_identity}:${turn.start_ms}:${turn.end_ms}:${turn.text}`}
								type="button"
								data-turn-index={index}
								className={cn(
									"block w-full rounded-md px-3 py-2 text-left text-sm transition",
									index === activeIndex
										? "bg-primary text-primary-foreground"
										: "bg-background hover:bg-muted",
								)}
								onClick={() => seekToTurn(turn)}
							>
								<span className="font-mono text-xs">
									{formatTimestamp(turn.start_ms)}
								</span>{" "}
								<span className="font-medium">
									{turn.speaker_name || turn.speaker_identity}:
								</span>{" "}
								<span>{turn.text}</span>
							</button>
						))
					)}
				</div>
			</aside>
		</div>
	);
}

function findActiveTurn(turns: MeetingTranscriptTurn[], currentMs: number) {
	let low = 0;
	let high = turns.length - 1;
	let best = -1;
	while (low <= high) {
		const mid = Math.floor((low + high) / 2);
		if (turns[mid].start_ms <= currentMs) {
			best = mid;
			low = mid + 1;
		} else {
			high = mid - 1;
		}
	}
	return best;
}

function formatTimestamp(ms: number) {
	const totalSeconds = Math.max(0, Math.floor(ms / 1000));
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${minutes.toString().padStart(2, "0")}:${seconds
		.toString()
		.padStart(2, "0")}`;
}

function transcriptToText(turns: MeetingTranscriptTurn[]) {
	return turns
		.map(
			(turn) =>
				`[${formatTimestamp(turn.start_ms)}] ${
					turn.speaker_name || turn.speaker_identity
				}: ${turn.text}`,
		)
		.join("\n");
}

function transcriptToVtt(turns: MeetingTranscriptTurn[]) {
	const cues = turns.map((turn, index) => {
		const start = formatVttTimestamp(turn.start_ms);
		const end = formatVttTimestamp(Math.max(turn.end_ms, turn.start_ms + 1000));
		return `${index + 1}\n${start} --> ${end}\n${
			turn.speaker_name || turn.speaker_identity
		}: ${turn.text}`;
	});
	return `WEBVTT\n\n${cues.join("\n\n")}`;
}

function formatVttTimestamp(ms: number) {
	const totalMs = Math.max(0, Math.floor(ms));
	const hours = Math.floor(totalMs / 3_600_000);
	const minutes = Math.floor((totalMs % 3_600_000) / 60_000);
	const seconds = Math.floor((totalMs % 60_000) / 1000);
	const millis = totalMs % 1000;
	return `${hours.toString().padStart(2, "0")}:${minutes
		.toString()
		.padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${millis
		.toString()
		.padStart(3, "0")}`;
}
