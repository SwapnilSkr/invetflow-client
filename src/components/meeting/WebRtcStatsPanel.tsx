import { useRoomContext } from "@livekit/components-react";
import { Activity, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "#/components/ui/button";

type CodecRow = {
	peer: string;
	direction: string;
	kind: string;
	codec: string;
	rid: string;
	frameWidth: number | null;
	frameHeight: number | null;
	framesPerSecond: number | null;
	bytes: number | null;
	packetsLost: number | null;
	jitterMs: number | null;
	timestamp: number;
};

type PeerConnectionEntry = {
	label: string;
	pc: RTCPeerConnection;
};

export function WebRtcStatsPanel() {
	const room = useRoomContext();
	const [rows, setRows] = useState<CodecRow[]>([]);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;

		async function poll() {
			try {
				const next = await collectStats(room);
				if (!cancelled) {
					setRows(next);
					setError(null);
				}
			} catch (err) {
				if (!cancelled) {
					setError(err instanceof Error ? err.message : "Could not read stats");
				}
			}
		}

		void poll();
		const timer = window.setInterval(() => void poll(), 2_000);
		return () => {
			cancelled = true;
			window.clearInterval(timer);
		};
	}, [room]);

	return (
		<div className="absolute top-4 left-4 z-40 w-[min(920px,calc(100vw-2rem))] rounded-lg border border-meeting-border bg-meeting-bg/95 shadow-2xl backdrop-blur">
			<div className="flex items-center justify-between border-meeting-border border-b px-4 py-3">
				<div>
					<h2 className="flex items-center gap-2 font-semibold text-meeting-text text-sm">
						<Activity className="size-4" aria-hidden />
						WebRTC stats
					</h2>
					<p className="text-meeting-text-muted text-xs">
						Debug-only codec, simulcast, bitrate, jitter, and packet-loss view.
					</p>
				</div>
				<Button
					type="button"
					size="icon-sm"
					variant="ghost"
					onClick={() => void collectStats(room).then(setRows)}
					aria-label="Refresh WebRTC stats"
				>
					<RefreshCw className="size-4" aria-hidden />
				</Button>
			</div>
			<div className="max-h-80 overflow-auto">
				{error ? (
					<p className="px-4 py-3 text-destructive text-sm">{error}</p>
				) : rows.length === 0 ? (
					<p className="px-4 py-3 text-meeting-text-muted text-sm">
						Stats appear after the room connects and media starts publishing.
					</p>
				) : (
					<table className="w-full min-w-[780px] text-left text-xs">
						<thead className="sticky top-0 bg-meeting-surface text-meeting-text-muted">
							<tr>
								<th className="px-3 py-2 font-medium">Peer</th>
								<th className="px-3 py-2 font-medium">Direction</th>
								<th className="px-3 py-2 font-medium">Kind</th>
								<th className="px-3 py-2 font-medium">Codec</th>
								<th className="px-3 py-2 font-medium">RID</th>
								<th className="px-3 py-2 font-medium">Resolution</th>
								<th className="px-3 py-2 font-medium">FPS</th>
								<th className="px-3 py-2 font-medium">Bytes</th>
								<th className="px-3 py-2 font-medium">Loss</th>
								<th className="px-3 py-2 font-medium">Jitter</th>
							</tr>
						</thead>
						<tbody>
							{rows.map((row) => (
								<tr
									key={`${row.peer}:${row.direction}:${row.kind}:${row.rid}:${row.codec}`}
									className="border-meeting-border border-t"
								>
									<td className="px-3 py-2 text-meeting-text">{row.peer}</td>
									<td className="px-3 py-2 text-meeting-text">
										{row.direction}
									</td>
									<td className="px-3 py-2 text-meeting-text">{row.kind}</td>
									<td className="px-3 py-2 text-meeting-text">{row.codec}</td>
									<td className="px-3 py-2 text-meeting-text-muted">
										{row.rid || "-"}
									</td>
									<td className="px-3 py-2 text-meeting-text-muted">
										{row.frameWidth && row.frameHeight
											? `${row.frameWidth}x${row.frameHeight}`
											: "-"}
									</td>
									<td className="px-3 py-2 text-meeting-text-muted">
										{row.framesPerSecond ?? "-"}
									</td>
									<td className="px-3 py-2 text-meeting-text-muted">
										{row.bytes ?? "-"}
									</td>
									<td className="px-3 py-2 text-meeting-text-muted">
										{row.packetsLost ?? "-"}
									</td>
									<td className="px-3 py-2 text-meeting-text-muted">
										{row.jitterMs ?? "-"}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>
		</div>
	);
}

async function collectStats(room: unknown): Promise<CodecRow[]> {
	const peerConnections = findPeerConnections(room);
	const allRows = await Promise.all(
		peerConnections.map(async ({ label, pc }) =>
			statsRowsForPeerConnection(label, await pc.getStats()),
		),
	);
	return allRows.flat();
}

function findPeerConnections(room: unknown): PeerConnectionEntry[] {
	const root = room as Record<string, unknown>;
	const engine = root.engine as Record<string, unknown> | undefined;
	const pcManager = engine?.pcManager as Record<string, unknown> | undefined;
	const entries: PeerConnectionEntry[] = [];

	const candidates: Array<[string, unknown]> = [
		["publisher", pcManager?.publisher],
		["subscriber", pcManager?.subscriber],
	];
	for (const [label, candidate] of candidates) {
		const pc = extractPeerConnection(candidate);
		if (pc) {
			entries.push({ label, pc });
		}
	}

	const fallback = extractPeerConnection(root);
	if (fallback && entries.every((entry) => entry.pc !== fallback)) {
		entries.push({ label: "room", pc: fallback });
	}

	return entries;
}

function extractPeerConnection(candidate: unknown): RTCPeerConnection | null {
	if (!candidate || typeof candidate !== "object") {
		return null;
	}
	if (candidate instanceof RTCPeerConnection) {
		return candidate;
	}
	const record = candidate as Record<string, unknown>;
	for (const key of ["pc", "_pc", "peerConnection"]) {
		const value = record[key];
		if (value instanceof RTCPeerConnection) {
			return value;
		}
	}
	return null;
}

function statsRowsForPeerConnection(
	label: string,
	report: RTCStatsReport,
): CodecRow[] {
	const codecs = new Map<string, string>();
	for (const stat of report.values()) {
		const record = stat as RTCStats & Record<string, unknown>;
		if (record.type === "codec") {
			const mimeType = String(record.mimeType ?? "");
			codecs.set(record.id, mimeType.replace(/^video\/|^audio\//, ""));
		}
	}

	const rows: CodecRow[] = [];
	for (const stat of report.values()) {
		const record = stat as RTCStats & Record<string, unknown>;
		if (record.type !== "outbound-rtp" && record.type !== "inbound-rtp") {
			continue;
		}
		rows.push({
			peer: label,
			direction: record.type === "outbound-rtp" ? "out" : "in",
			kind: String(record.kind ?? record.mediaType ?? "-"),
			codec: codecs.get(String(record.codecId ?? "")) ?? "-",
			rid: String(record.rid ?? ""),
			frameWidth: numberOrNull(record.frameWidth),
			frameHeight: numberOrNull(record.frameHeight),
			framesPerSecond: numberOrNull(record.framesPerSecond),
			bytes: numberOrNull(record.bytesSent ?? record.bytesReceived),
			packetsLost: numberOrNull(record.packetsLost),
			jitterMs:
				typeof record.jitter === "number"
					? Math.round(record.jitter * 1000)
					: null,
			timestamp: record.timestamp,
		});
	}

	return rows;
}

function numberOrNull(value: unknown): number | null {
	return typeof value === "number" && Number.isFinite(value)
		? Math.round(value)
		: null;
}
