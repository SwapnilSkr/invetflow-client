import {
	queryOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import {
	type AssignCandidateRequest,
	apiClient,
	apiClientPublic,
	type CandidateInterview,
	type CreateJobRequest,
	type InterviewScores,
	type Job,
	type JobInterviewsListResponse,
	type JoinJobResponse,
	type TranscriptEntry,
	type UpdateJobRequest,
} from "./client";

export const jobKeys = {
	all: ["jobs"] as const,
	lists: () => [...jobKeys.all, "list"] as const,
	list: (filters?: Record<string, string>) =>
		[...jobKeys.lists(), filters] as const,
	details: () => [...jobKeys.all, "detail"] as const,
	detail: (id: string) => [...jobKeys.details(), id] as const,
	byToken: (token: string) => [...jobKeys.all, "token", token] as const,
	jobInterviews: (jobId: string) =>
		[...jobKeys.all, "jobInterviews", jobId] as const,
};

export const candidateInterviewKeys = {
	all: ["candidateInterviews"] as const,
	details: () => [...candidateInterviewKeys.all, "detail"] as const,
	detail: (id: string) => [...candidateInterviewKeys.details(), id] as const,
	transcript: (id: string) =>
		[...candidateInterviewKeys.all, "transcript", id] as const,
	scores: (id: string) =>
		[...candidateInterviewKeys.all, "scores", id] as const,
};

export const jobQueries = {
	list: (limit = 20, offset = 0) =>
		queryOptions({
			queryKey: jobKeys.list({
				limit: String(limit),
				offset: String(offset),
			}),
			queryFn: () =>
				apiClient<{
					jobs: Job[];
					total: number;
					limit: number;
					offset: number;
				}>(`/api/jobs?limit=${limit}&offset=${offset}`),
		}),

	detail: (id: string) =>
		queryOptions({
			queryKey: jobKeys.detail(id),
			queryFn: () => apiClient<Job>(`/api/jobs/${id}`),
		}),

	byToken: (token: string) =>
		queryOptions({
			queryKey: jobKeys.byToken(token),
			queryFn: () => apiClientPublic<Job>(`/api/jobs/token/${token}`),
		}),

	jobInterviews: (jobId: string) =>
		queryOptions({
			queryKey: jobKeys.jobInterviews(jobId),
			queryFn: () =>
				apiClient<JobInterviewsListResponse>(`/api/jobs/${jobId}/interviews`),
		}),
};

export const candidateInterviewQueries = {
	detail: (id: string) =>
		queryOptions({
			queryKey: candidateInterviewKeys.detail(id),
			queryFn: () => apiClient<CandidateInterview>(`/api/interviews/${id}`),
		}),

	transcript: (id: string) =>
		queryOptions({
			queryKey: candidateInterviewKeys.transcript(id),
			queryFn: () =>
				apiClient<{ entries: TranscriptEntry[]; total: number }>(
					`/api/interviews/${id}/transcript`,
				),
		}),

	scores: (id: string) =>
		queryOptions({
			queryKey: candidateInterviewKeys.scores(id),
			queryFn: () =>
				apiClient<InterviewScores | null>(`/api/interviews/${id}/scores`),
		}),
};

export function useCreateJob() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: CreateJobRequest) =>
			apiClient<Job>("/api/jobs", {
				method: "POST",
				body: JSON.stringify(data),
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
		},
	});
}

export function useUpdateJob() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: UpdateJobRequest }) =>
			apiClient<Job>(`/api/jobs/${id}`, {
				method: "PUT",
				body: JSON.stringify(data),
			}),
		onSuccess: (_, { id }) => {
			queryClient.invalidateQueries({ queryKey: jobKeys.detail(id) });
			queryClient.invalidateQueries({ queryKey: jobKeys.jobInterviews(id) });
			queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
		},
	});
}

export function useDeleteJob() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) =>
			apiClient<void>(`/api/jobs/${id}`, { method: "DELETE" }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
		},
	});
}

export function useAssignCandidate() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: AssignCandidateRequest }) =>
			apiClient<Job>(`/api/jobs/${id}/assign`, {
				method: "POST",
				body: JSON.stringify(data),
			}),
		onSuccess: (_, { id }) => {
			queryClient.invalidateQueries({ queryKey: jobKeys.detail(id) });
			queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
		},
	});
}

export function useScheduleJob() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) =>
			apiClient<Job>(`/api/jobs/${id}/schedule`, {
				method: "POST",
			}),
		onSuccess: (_, id) => {
			queryClient.invalidateQueries({ queryKey: jobKeys.detail(id) });
			queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
		},
	});
}

export function useJoinJob() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (jobId: string) =>
			apiClient<JoinJobResponse>(`/api/jobs/${jobId}/join`, {
				method: "POST",
			}),
		onSuccess: (res) => {
			queryClient.invalidateQueries({
				queryKey: jobKeys.jobInterviews(res.job_id),
			});
		},
	});
}

export function useEndCandidateInterview() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) =>
			apiClient<CandidateInterview>(`/api/interviews/${id}/end`, {
				method: "POST",
			}),
		onSuccess: (row, id) => {
			queryClient.setQueryData(candidateInterviewKeys.detail(id), row);
			queryClient.invalidateQueries({
				queryKey: candidateInterviewKeys.detail(id),
			});
			queryClient.invalidateQueries({
				queryKey: candidateInterviewKeys.scores(id),
			});
			queryClient.invalidateQueries({
				queryKey: jobKeys.jobInterviews(row.job_id),
			});
		},
	});
}

export function useAppendTranscript() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			interviewId,
			data,
		}: {
			interviewId: string;
			data: {
				speaker: string;
				content: string;
				question_id?: string;
				confidence?: number;
			};
		}) =>
			apiClient<void>(`/api/interviews/${interviewId}/transcript`, {
				method: "POST",
				body: JSON.stringify(data),
			}),
		onSuccess: (_, { interviewId }) => {
			queryClient.invalidateQueries({
				queryKey: candidateInterviewKeys.transcript(interviewId),
			});
		},
	});
}

export function useSaveScores() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			interviewId,
			data,
		}: {
			interviewId: string;
			data: Omit<InterviewScores, "evaluated_at">;
		}) =>
			apiClient<InterviewScores>(`/api/interviews/${interviewId}/scores`, {
				method: "POST",
				body: JSON.stringify(data),
			}),
		onSuccess: (_, { interviewId }) => {
			queryClient.invalidateQueries({
				queryKey: candidateInterviewKeys.scores(interviewId),
			});
		},
	});
}
