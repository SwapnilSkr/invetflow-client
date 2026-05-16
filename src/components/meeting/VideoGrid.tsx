import type { TrackReferenceOrPlaceholder } from "@livekit/components-core";
import type { Participant } from "livekit-client";
import { ParticipantTile, participantTileKey } from "./ParticipantTile";

type VideoGridProps = {
	visibleTracks: TrackReferenceOrPlaceholder[];
	spotlightTrack?: TrackReferenceOrPlaceholder;
	speakingParticipants: Participant[];
};

export function VideoGrid({
	visibleTracks,
	spotlightTrack,
	speakingParticipants,
}: VideoGridProps) {
	if (spotlightTrack) {
		return (
			<div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)_auto] gap-3 overflow-hidden xl:grid-cols-[minmax(0,1fr)_minmax(180px,260px)] xl:grid-rows-1">
				<ParticipantTile
					trackRef={spotlightTrack}
					isSpeaking={isParticipantSpeaking(
						spotlightTrack.participant.identity,
						speakingParticipants,
					)}
					spotlight
				/>
				<div className="grid min-w-0 max-h-56 grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3 overflow-x-hidden overflow-y-auto xl:max-h-none xl:grid-cols-1 xl:auto-rows-min">
					{visibleTracks.map((trackRef) => (
						<ParticipantTile
							key={participantTileKey(trackRef)}
							trackRef={trackRef}
							isSpeaking={isParticipantSpeaking(
								trackRef.participant.identity,
								speakingParticipants,
							)}
							compact
						/>
					))}
				</div>
			</div>
		);
	}

	return (
		<div className={mainGridClass(visibleTracks.length)}>
			{visibleTracks.map((trackRef) => (
				<ParticipantTile
					key={participantTileKey(trackRef)}
					trackRef={trackRef}
					isSpeaking={isParticipantSpeaking(
						trackRef.participant.identity,
						speakingParticipants,
					)}
					dense={visibleTracks.length > 4}
				/>
			))}
		</div>
	);
}

function mainGridClass(count: number) {
	if (count <= 1) {
		return "grid h-full min-h-0 grid-cols-1 gap-3";
	}
	if (count <= 2) {
		return "grid h-full min-h-0 grid-cols-1 gap-3 md:grid-cols-2";
	}
	if (count <= 4) {
		return "grid h-full min-h-0 grid-cols-1 gap-3 sm:grid-cols-2";
	}
	return "grid min-h-0 content-start gap-3 overflow-y-auto overflow-x-hidden grid-cols-1 sm:grid-cols-2 xl:grid-cols-3";
}

function isParticipantSpeaking(
	identity: string,
	speakingParticipants: Array<{ identity: string }>,
) {
	return speakingParticipants.some(
		(participant) => participant.identity === identity,
	);
}
