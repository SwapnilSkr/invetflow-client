import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { interviewQueries, useJoinInterview } from "#/integrations/api/queries";

export const Route = createFileRoute("/interviews/$id")({
	component: InterviewDetailPage,
});

function InterviewDetailPage() {
	const { id } = Route.useParams();
	const navigate = useNavigate();
	const {
		data: interview,
		isLoading,
		error,
	} = useQuery(interviewQueries.detail(id));
	const joinInterview = useJoinInterview();
	const [joining, setJoining] = useState(false);

	const handleJoin = async () => {
		setJoining(true);
		try {
			const result = await joinInterview.mutateAsync(id);
			navigate({
				to: "/interviews/$id/session",
				params: { id },
				search: {
					sessionId: result.session_id,
					token: result.livekit_token,
					url: result.livekit_url,
				},
			});
		} catch (err) {
			console.error("Failed to join:", err);
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
				<p className="text-red-500">Interview not found</p>
			</div>
		);
	}

	return (
		<div className="container mx-auto py-8 px-4">
			<div className="mb-8">
				<a
					href="/interviews"
					className="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
				>
					← Back to interviews
				</a>
			</div>

			<div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-6">
				<div className="flex items-start justify-between mb-6">
					<div>
						<h1 className="text-2xl font-bold">{interview.title}</h1>
						<p className="text-neutral-500 mt-1">{interview.job_title}</p>
					</div>
					<span
						className={`text-sm px-3 py-1 rounded-full ${
							interview.status === "Active"
								? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
								: interview.status === "Completed"
									? "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
									: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
						}`}
					>
						{interview.status}
					</span>
				</div>

				{interview.job_description && (
					<div className="mb-6">
						<h2 className="text-sm font-medium text-neutral-500 mb-2">
							Description
						</h2>
						<p className="text-neutral-700 dark:text-neutral-300">
							{interview.job_description}
						</p>
					</div>
				)}

				<div className="grid grid-cols-2 gap-4 mb-6">
					<div>
						<h2 className="text-sm font-medium text-neutral-500 mb-1">
							Duration
						</h2>
						<p>{interview.duration_minutes} minutes</p>
					</div>
					<div>
						<h2 className="text-sm font-medium text-neutral-500 mb-1">
							Questions
						</h2>
						<p>{interview.questions?.length || 0} questions</p>
					</div>
				</div>

				{interview.questions && interview.questions.length > 0 && (
					<div className="mb-6">
						<h2 className="text-sm font-medium text-neutral-500 mb-3">
							Questions
						</h2>
						<ol className="list-decimal list-inside space-y-2">
							{interview.questions.map((q, idx) => (
								<li
									key={q.id || idx}
									className="text-neutral-700 dark:text-neutral-300"
								>
									<span className="font-medium">{q.question}</span>
									<span className="text-xs text-neutral-400 ml-2">
										({q.category})
									</span>
								</li>
							))}
						</ol>
					</div>
				)}

				{interview.candidate_name && (
					<div className="mb-6 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
						<h2 className="text-sm font-medium text-neutral-500 mb-2">
							Candidate
						</h2>
						<p className="font-medium">{interview.candidate_name}</p>
						<p className="text-sm text-neutral-500">
							{interview.candidate_email}
						</p>
					</div>
				)}

				{interview.invite_link && (
					<div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
						<h2 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
							Invite Link
						</h2>
						<code className="text-sm break-all">{interview.invite_link}</code>
					</div>
				)}

				<div className="flex gap-3">
					{(interview.status === "Scheduled" ||
						interview.status === "Draft") && (
						<button
							type="button"
							onClick={handleJoin}
							disabled={joining}
							className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
						>
							{joining ? "Joining..." : "Join Interview"}
						</button>
					)}
					<a
						href={`/interviews/${id}/edit`}
						className="px-6 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800"
					>
						Edit
					</a>
				</div>
			</div>
		</div>
	);
}
