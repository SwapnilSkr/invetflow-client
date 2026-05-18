import type React from "react";
import { useCallback, useEffect, useRef } from "react";
import { buildCreatePayload } from "#/components/jobs/create/job-create-state";
import type { DraftState } from "#/components/jobs/create/types";
import type { LaunchPreviewResponse } from "#/integrations/api/client";
import { candidateOrigin } from "#/lib/candidate-url";

const CANDIDATE_APP_URL = candidateOrigin();
const CANDIDATE_APP_ORIGIN = (() => {
	try {
		return new URL(CANDIDATE_APP_URL).origin;
	} catch {
		return CANDIDATE_APP_URL;
	}
})();

type Props = {
	draft: DraftState;
	analysis: LaunchPreviewResponse | null;
	className?: string;
	heightClass?: string;
};

export function CandidateJobPagePreview({
	draft,
	analysis,
	className,
	heightClass = "h-[600px]",
}: Props): React.ReactElement {
	const iframeRef = useRef<HTMLIFrameElement>(null);

	const sendPreviewMessage = useCallback(() => {
		const iframe = iframeRef.current;
		if (!iframe?.contentWindow) return;

		const payload = buildCreatePayload(draft, { publishOnCreate: false });
		const message: {
			type: string;
			payload: {
				job: ReturnType<typeof buildCreatePayload>;
				analysis?: LaunchPreviewResponse;
			};
		} = {
			type: "invetflow.jobLaunchPreview.v1",
			payload: { job: payload },
		};
		if (analysis) {
			message.payload.analysis = analysis;
		}
		iframe.contentWindow.postMessage(message, CANDIDATE_APP_ORIGIN);
	}, [draft, analysis]);

	useEffect(() => {
		sendPreviewMessage();
	}, [sendPreviewMessage]);

	return (
		<div className={`space-y-3 ${className ?? ""}`}>
			<p className="text-sm text-muted-foreground">
				This is a live preview of what candidates will see.
			</p>
			<div className="overflow-hidden rounded-lg border border-border">
				<iframe
					ref={iframeRef}
					src={`${CANDIDATE_APP_URL}/preview/job-launch`}
					title="Candidate preview"
					className={`w-full ${heightClass}`}
					sandbox="allow-scripts"
					onLoad={sendPreviewMessage}
				/>
			</div>
		</div>
	);
}
