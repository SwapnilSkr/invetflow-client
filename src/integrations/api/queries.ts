import {
	queryOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import {
	type AssignCandidateRequest,
	apiClient,
	apiClientPublic,
	type CreateInterviewRequest,
	type Interview,
	type InterviewScores,
	type InterviewSessionListResponse,
	type JoinInterviewResponse,
	type Session,
	type TranscriptEntry,
	type UpdateInterviewRequest,
} from "./client";

// Interview Query Keys
export const interviewKeys = {
	all: ["interviews"] as const,
	lists: () => [...interviewKeys.all, "list"] as const,
	list: (filters?: Record<string, string>) =>
		[...interviewKeys.lists(), filters] as const,
	details: () => [...interviewKeys.all, "detail"] as const,
	detail: (id: string) => [...interviewKeys.details(), id] as const,
	byToken: (token: string) => [...interviewKeys.all, "token", token] as const,
	sessions: (id: string) => [...interviewKeys.all, "sessions", id] as const,
};

// Session Query Keys
export const sessionKeys = {
	all: ["sessions"] as const,
	details: () => [...sessionKeys.all, "detail"] as const,
	detail: (id: string) => [...sessionKeys.details(), id] as const,
	transcript: (id: string) => [...sessionKeys.all, "transcript", id] as const,
	scores: (id: string) => [...sessionKeys.all, "scores", id] as const,
};

// Interview Queries
export const interviewQueries = {
	list: (limit = 20, offset = 0) =>
		queryOptions({
			queryKey: interviewKeys.list({
				limit: String(limit),
				offset: String(offset),
			}),
			queryFn: () =>
				apiClient<{
					interviews: Interview[];
					total: number;
					limit: number;
					offset: number;
				}>(`/api/interviews?limit=${limit}&offset=${offset}`),
		}),

	detail: (id: string) =>
		queryOptions({
			queryKey: interviewKeys.detail(id),
			queryFn: () => apiClient<Interview>(`/api/interviews/${id}`),
		}),

	byToken: (token: string) =>
		queryOptions({
			queryKey: interviewKeys.byToken(token),
			queryFn: () =>
				apiClientPublic<Interview>(`/api/interviews/token/${token}`),
		}),

	sessions: (id: string) =>
		queryOptions({
			queryKey: interviewKeys.sessions(id),
			queryFn: () =>
				apiClient<InterviewSessionListResponse>(
					`/api/interviews/${id}/sessions`,
				),
		}),
};

// Session Queries
export const sessionQueries = {
	detail: (id: string) =>
		queryOptions({
			queryKey: sessionKeys.detail(id),
			queryFn: () => apiClient<Session>(`/api/sessions/${id}`),
		}),

	transcript: (id: string) =>
		queryOptions({
			queryKey: sessionKeys.transcript(id),
			queryFn: () =>
				apiClient<{ entries: TranscriptEntry[]; total: number }>(
					`/api/sessions/${id}/transcript`,
				),
		}),

	scores: (id: string) =>
		queryOptions({
			queryKey: sessionKeys.scores(id),
			queryFn: () =>
				apiClient<InterviewScores | null>(`/api/sessions/${id}/scores`),
		}),
};

// Interview Mutations
export function useCreateInterview() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: CreateInterviewRequest) =>
			apiClient<Interview>("/api/interviews", {
				method: "POST",
				body: JSON.stringify(data),
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: interviewKeys.lists() });
		},
	});
}

export function useUpdateInterview() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: UpdateInterviewRequest }) =>
			apiClient<Interview>(`/api/interviews/${id}`, {
				method: "PUT",
				body: JSON.stringify(data),
			}),
		onSuccess: (_, { id }) => {
			queryClient.invalidateQueries({ queryKey: interviewKeys.detail(id) });
			queryClient.invalidateQueries({ queryKey: interviewKeys.sessions(id) });
			queryClient.invalidateQueries({ queryKey: interviewKeys.lists() });
		},
	});
}

export function useDeleteInterview() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) =>
			apiClient<void>(`/api/interviews/${id}`, { method: "DELETE" }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: interviewKeys.lists() });
		},
	});
}

export function useAssignCandidate() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: AssignCandidateRequest }) =>
			apiClient<Interview>(`/api/interviews/${id}/assign`, {
				method: "POST",
				body: JSON.stringify(data),
			}),
		onSuccess: (_, { id }) => {
			queryClient.invalidateQueries({ queryKey: interviewKeys.detail(id) });
			queryClient.invalidateQueries({ queryKey: interviewKeys.lists() });
		},
	});
}

export function useScheduleInterview() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) =>
			apiClient<Interview>(`/api/interviews/${id}/schedule`, {
				method: "POST",
			}),
		onSuccess: (_, id) => {
			queryClient.invalidateQueries({ queryKey: interviewKeys.detail(id) });
			queryClient.invalidateQueries({ queryKey: interviewKeys.lists() });
		},
	});
}

export function useJoinInterview() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) =>
			apiClient<JoinInterviewResponse>(`/api/interviews/${id}/join`, {
				method: "POST",
			}),
		onSuccess: (res) => {
			queryClient.invalidateQueries({
				queryKey: interviewKeys.sessions(res.interview_id),
			});
		},
	});
}

// Session Mutations
export function useEndSession() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) =>
			apiClient<Session>(`/api/sessions/${id}/end`, { method: "POST" }),
		onSuccess: (session, id) => {
			queryClient.setQueryData(sessionKeys.detail(id), session);
			queryClient.invalidateQueries({ queryKey: sessionKeys.detail(id) });
			queryClient.invalidateQueries({ queryKey: sessionKeys.scores(id) });
			queryClient.invalidateQueries({
				queryKey: interviewKeys.sessions(session.interview_id),
			});
		},
	});
}

export function useAppendTranscript() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			sessionId,
			data,
		}: {
			sessionId: string;
			data: {
				speaker: string;
				content: string;
				question_id?: string;
				confidence?: number;
			};
		}) =>
			apiClient<void>(`/api/sessions/${sessionId}/transcript`, {
				method: "POST",
				body: JSON.stringify(data),
			}),
		onSuccess: (_, { sessionId }) => {
			queryClient.invalidateQueries({
				queryKey: sessionKeys.transcript(sessionId),
			});
		},
	});
}

export function useSaveScores() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			sessionId,
			data,
		}: {
			sessionId: string;
			data: Omit<InterviewScores, "evaluated_at">;
		}) =>
			apiClient<InterviewScores>(`/api/sessions/${sessionId}/scores`, {
				method: "POST",
				body: JSON.stringify(data),
			}),
		onSuccess: (_, { sessionId }) => {
			queryClient.invalidateQueries({
				queryKey: sessionKeys.scores(sessionId),
			});
		},
	});
}
