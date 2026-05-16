import type { TrackReferenceOrPlaceholder } from "@livekit/components-core";
import { isTrackReference, VideoTrack } from "@livekit/components-react";
import { Track } from "livekit-client";
import { Mic, MicOff } from "lucide-react";

type ParticipantTileProps = {
	trackRef: TrackReferenceOrPlaceholder;
	isSpeaking: boolean;
	compact?: boolean;
	dense?: boolean;
	spotlight?: boolean;
};

export function ParticipantTile({
	trackRef,
	isSpeaking,
	compact = false,
	dense = false,
	spotlight = false,
}: ParticipantTileProps) {
	const participant = trackRef.participant;
	const participantName =
		participant.name || participant.identity || "Participant";
	const videoReady =
		isTrackReference(trackRef) &&
		Boolean(trackRef.publication.track) &&
		!trackRef.publication.isMuted;
	const isScreenShare = trackRef.source === Track.Source.ScreenShare;

	return (
		<section
			className={`relative min-w-0 overflow-hidden rounded-xl bg-neutral-900 ring-1 transition ${
				isSpeaking ? "ring-emerald-400" : "ring-white/10"
			} ${tileSizeClass({ compact, dense, spotlight })}`}
		>
			{videoReady && isTrackReference(trackRef) ? (
				<VideoTrack
					trackRef={trackRef}
					className={`h-full w-full bg-neutral-900 ${
						isScreenShare ? "object-contain" : "object-cover"
					}`}
				/>
			) : (
				<div className="grid h-full w-full place-items-center bg-neutral-900">
					<div className="grid size-20 place-items-center rounded-full bg-neutral-700 font-semibold text-2xl text-white ring-1 ring-white/15 md:size-24">
						{initials(participantName)}
					</div>
				</div>
			)}

			<div className="absolute right-3 bottom-3 left-3 flex items-center justify-between gap-2">
				<div className="min-w-0 rounded-full bg-neutral-950/80 px-3 py-1.5 text-white shadow-lg backdrop-blur">
					<p className="truncate font-medium text-xs md:text-sm">
						{participantName}
						{participant.isLocal ? " (you)" : ""}
					</p>
				</div>
				<div className="grid size-8 shrink-0 place-items-center rounded-full bg-neutral-950/80 text-white shadow-lg backdrop-blur">
					{participant.isMicrophoneEnabled ? (
						<Mic className="size-4" aria-label="Microphone on" />
					) : (
						<MicOff
							className="size-4 text-destructive"
							aria-label="Microphone muted"
						/>
					)}
				</div>
			</div>

			{isScreenShare ? (
				<div className="absolute top-3 left-3 rounded-full bg-neutral-950/80 px-3 py-1.5 font-medium text-white text-xs shadow-lg backdrop-blur">
					Screen share
				</div>
			) : null}
		</section>
	);
}

export function participantTileKey(trackRef: TrackReferenceOrPlaceholder) {
	if (isTrackReference(trackRef)) {
		return `${trackRef.participant.identity}-${trackRef.source}-${trackRef.publication.trackSid}`;
	}
	return `${trackRef.participant.identity}-${trackRef.source}-placeholder`;
}

function tileSizeClass({
	compact,
	dense,
	spotlight,
}: {
	compact: boolean;
	dense: boolean;
	spotlight: boolean;
}) {
	if (spotlight) {
		return "h-full min-h-0 w-full";
	}
	if (compact) {
		return "aspect-video h-auto min-h-0 w-full";
	}
	if (dense) {
		return "aspect-video min-h-36 w-full";
	}
	return "h-full min-h-0 w-full";
}

function initials(name: string) {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) {
		return "?";
	}
	const first = parts[0]?.[0] ?? "";
	const second = parts.length > 1 ? (parts[1]?.[0] ?? "") : "";
	return `${first}${second}`.toUpperCase();
}
