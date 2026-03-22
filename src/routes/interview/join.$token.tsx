import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { interviewQueries, useJoinInterview } from "#/integrations/api/queries";
import { useState } from "react";

export const Route = createFileRoute("/interview/join/$token")({
	component: JoinByTokenPage,
});

function JoinByTokenPage() {
	const { token } = Route.useParams();
	const navigate = useNavigate();
	const { data: interview, isLoading, error } = useQuery(interviewQueries.byToken(token));
	const joinInterview = useJoinInterview();
	const [joining, setJoining] = useState(false);
	const [joinError, setJoinError] = useState<string | null>(null);

	const handleJoin = async () => {
		if (!interview) return;
		setJoining(true);
		setJoinError(null);
		try {
			const result = await joinInterview.mutateAsync(interview.id);
			navigate({
				to: "/interviews/$id/session",
				params: { id: interview.id },
				search: {
					sessionId: result.session_id,
					token: result.livekit_token,
					url: result.livekit_url,
				},
			});
		} catch (err) {
			setJoinError(err instanceof Error ? err.message : "Failed to join interview");
		} finally {
			setJoining(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-900 dark:border-neutral-800 dark:border-t-neutral-100" />
			</div>
		);
	}

	if (error || !interview) {
		return (
			<div className="flex flex-col items-center justify-center py-20">
				<p className="text-red-500 text-lg font-medium">Interview not found</p>
				<p className="text-sm text-neutral-500 mt-2">
					This invite link may have expired or is invalid.
				</p>
			</div>
		);
	}

	return (
		<div className="container mx-auto max-w-lg py-16 px-4">
			<div className="text-center space-y-6">
				<div className="space-y-2">
					<h1 className="text-2xl font-bold">{interview.title}</h1>
					<p className="text-neutral-500">{interview.job_title}</p>
				</div>

				<div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4 text-left space-y-2">
					<div className="flex justify-between text-sm">
						<span className="text-neutral-500">Duration</span>
						<span className="font-medium">{interview.duration_minutes} minutes</span>
					</div>
					<div className="flex justify-between text-sm">
						<span className="text-neutral-500">Questions</span>
						<span className="font-medium">{interview.questions?.length || 0}</span>
					</div>
					<div className="flex justify-between text-sm">
						<span className="text-neutral-500">Status</span>
						<span className="font-medium">{interview.status}</span>
					</div>
				</div>

				{joinError && (
					<div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-lg">
						<p className="text-sm text-red-600 dark:text-red-400">{joinError}</p>
					</div>
				)}

				<button
					type="button"
					onClick={handleJoin}
					disabled={joining || interview.status === "Completed" || interview.status === "Cancelled"}
					className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium text-lg"
				>
					{joining ? "Joining..." : "Join Interview"}
				</button>

				<p className="text-xs text-neutral-400">
					Make sure you have a working camera and microphone before joining.
				</p>
			</div>
		</div>
	);
}
