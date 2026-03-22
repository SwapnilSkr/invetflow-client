import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import type { CreateInterviewRequest } from "#/integrations/api/client";
import {
	interviewQueries,
	useCreateInterview,
	useDeleteInterview,
} from "#/integrations/api/queries";

export const Route = createFileRoute("/interviews/")({
	component: InterviewsPage,
});

function InterviewsPage() {
	const [showCreate, setShowCreate] = useState(false);
	const { data, isLoading, error } = useQuery(interviewQueries.list());
	const createInterview = useCreateInterview();
	const deleteInterview = useDeleteInterview();

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-900 dark:border-neutral-800 dark:border-t-neutral-100" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center py-20">
				<p className="text-red-500">Error loading interviews</p>
				<p className="text-sm text-neutral-500 mt-2">
					{(error as Error).message}
				</p>
			</div>
		);
	}

	return (
		<div className="container mx-auto py-8 px-4">
			<div className="flex items-center justify-between mb-8">
				<h1 className="text-2xl font-bold">Interviews</h1>
				<button
					type="button"
					onClick={() => setShowCreate(true)}
					className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 transition-colors"
				>
					Create Interview
				</button>
			</div>

			{showCreate && (
				<CreateInterviewForm
					onClose={() => setShowCreate(false)}
					onSubmit={async (data) => {
						await createInterview.mutateAsync(data);
						setShowCreate(false);
					}}
				/>
			)}

			<div className="grid gap-4">
				{data?.interviews?.length === 0 ? (
					<div className="text-center py-12">
						<p className="text-neutral-500">
							No interviews yet. Create your first interview!
						</p>
					</div>
				) : (
					data?.interviews?.map((interview) => (
						<div
							key={interview.id}
							className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
						>
							<div className="flex items-start justify-between">
								<div>
									<h3 className="font-medium">{interview.title}</h3>
									<p className="text-sm text-neutral-500 mt-1">
										{interview.job_title}
									</p>
									<div className="flex gap-2 mt-2">
										<span
											className={`text-xs px-2 py-0.5 rounded-full ${
												interview.status === "Active"
													? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
													: interview.status === "Completed"
														? "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
														: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
											}`}
										>
											{interview.status}
										</span>
										<span className="text-xs text-neutral-400">
											{interview.duration_minutes} min
										</span>
									</div>
								</div>
								<div className="flex gap-2">
									<a
										href={`/interviews/${interview.id}`}
										className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
									>
										View
									</a>
									<button
										type="button"
										onClick={() => {
											if (
												confirm(
													"Are you sure you want to delete this interview?",
												)
											) {
												deleteInterview.mutate(interview.id);
											}
										}}
										className="text-sm text-red-600 hover:text-red-700"
									>
										Delete
									</button>
								</div>
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
}

function CreateInterviewForm({
	onClose,
	onSubmit,
}: {
	onClose: () => void;
	onSubmit: (data: CreateInterviewRequest) => Promise<void>;
}) {
	const [title, setTitle] = useState("");
	const [jobTitle, setJobTitle] = useState("");
	const [duration, setDuration] = useState(30);
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		try {
			await onSubmit({
				title,
				job_title: jobTitle,
				duration_minutes: duration,
				questions: [],
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
			<div className="bg-white dark:bg-neutral-900 rounded-lg p-6 w-full max-w-md">
				<h2 className="text-lg font-semibold mb-4">Create Interview</h2>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label className="text-sm font-medium">Title</label>
						<input
							type="text"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							className="w-full mt-1 px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-transparent"
							required
						/>
					</div>
					<div>
						<label className="text-sm font-medium">Job Title</label>
						<input
							type="text"
							value={jobTitle}
							onChange={(e) => setJobTitle(e.target.value)}
							className="w-full mt-1 px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-transparent"
							required
						/>
					</div>
					<div>
						<label className="text-sm font-medium">Duration (minutes)</label>
						<input
							type="number"
							value={duration}
							onChange={(e) => setDuration(parseInt(e.target.value) || 30)}
							className="w-full mt-1 px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-transparent"
							min={5}
							max={180}
						/>
					</div>
					<div className="flex gap-3 pt-4">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={loading}
							className="flex-1 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 disabled:opacity-50"
						>
							{loading ? "Creating..." : "Create"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
