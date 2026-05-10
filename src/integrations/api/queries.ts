import {
	queryOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import {
	type Application,
	type AssessmentListParams,
	type AssignCandidateRequest,
	apiClient,
	apiClientPublic,
	type CandidateInterview,
	type CreateCodingAssessmentPayload,
	type CreateGenericAssessmentPayload,
	type CreateJobRequest,
	type CreatePrescreeningFormPayload,
	type CreatePsychometricAssessmentPayload,
	type CreateVoiceAssessmentPayload,
	createCodingAssessment,
	createGenericAssessment,
	createPrescreeningForm,
	createPsychometricAssessment,
	createVoiceAssessment,
	deleteCodingAssessment,
	deleteGenericAssessment,
	deletePrescreeningForm,
	deletePsychometricAssessment,
	deleteVoiceAssessment,
	type GenerateJobContentRequest,
	type GenerateJobContentResponse,
	getCodingAssessment,
	getGenericAssessment,
	getPrescreeningForm,
	getPsychometricAssessment,
	getVoiceAssessment,
	type InterviewScores,
	type Job,
	type JobInterviewsListResponse,
	type JoinJobResponse,
	listCodingAssessments,
	listGenericAssessments,
	listPrescreeningForms,
	listPsychometricAssessments,
	listVoiceAssessments,
	type Organization,
	type TranscriptEntry,
	type UpdateJobRequest,
	updateCodingAssessment,
	updateGenericAssessment,
	updatePrescreeningForm,
	updatePsychometricAssessment,
	updateVoiceAssessment,
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

export const organizationKeys = {
	all: ["organizations"] as const,
	current: () => [...organizationKeys.all, "current"] as const,
};

export const applicationKeys = {
	forJob: (jobId: string) => ["applications", "job", jobId] as const,
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

export const assessmentKeys = {
	all: ["assessments"] as const,
	voice: () => [...assessmentKeys.all, "voice"] as const,
	voiceList: (params?: AssessmentListParams) =>
		[...assessmentKeys.voice(), "list", params ?? {}] as const,
	voiceDetail: (id: string) => [...assessmentKeys.voice(), id] as const,
	generic: () => [...assessmentKeys.all, "generic"] as const,
	genericList: (params?: AssessmentListParams) =>
		[...assessmentKeys.generic(), "list", params ?? {}] as const,
	genericDetail: (id: string) => [...assessmentKeys.generic(), id] as const,
	coding: () => [...assessmentKeys.all, "coding"] as const,
	codingList: (params?: AssessmentListParams) =>
		[...assessmentKeys.coding(), "list", params ?? {}] as const,
	codingDetail: (id: string) => [...assessmentKeys.coding(), id] as const,
	psychometric: () => [...assessmentKeys.all, "psychometric"] as const,
	psychometricList: (params?: AssessmentListParams) =>
		[...assessmentKeys.psychometric(), "list", params ?? {}] as const,
	psychometricDetail: (id: string) =>
		[...assessmentKeys.psychometric(), id] as const,
	prescreening: () => [...assessmentKeys.all, "prescreening"] as const,
	prescreeningList: (params?: AssessmentListParams) =>
		[...assessmentKeys.prescreening(), "list", params ?? {}] as const,
	prescreeningDetail: (id: string) =>
		[...assessmentKeys.prescreening(), id] as const,
};

export const assessmentQueries = {
	voice: {
		list: (params: AssessmentListParams = {}) =>
			queryOptions({
				queryKey: assessmentKeys.voiceList(params),
				queryFn: () => listVoiceAssessments(params),
			}),
		detail: (id: string) =>
			queryOptions({
				queryKey: assessmentKeys.voiceDetail(id),
				queryFn: () => getVoiceAssessment(id),
				enabled: id.length > 0,
			}),
	},
	generic: {
		list: (params: AssessmentListParams = {}) =>
			queryOptions({
				queryKey: assessmentKeys.genericList(params),
				queryFn: () => listGenericAssessments(params),
			}),
		detail: (id: string) =>
			queryOptions({
				queryKey: assessmentKeys.genericDetail(id),
				queryFn: () => getGenericAssessment(id),
				enabled: id.length > 0,
			}),
	},
	coding: {
		list: (params: AssessmentListParams = {}) =>
			queryOptions({
				queryKey: assessmentKeys.codingList(params),
				queryFn: () => listCodingAssessments(params),
			}),
		detail: (id: string) =>
			queryOptions({
				queryKey: assessmentKeys.codingDetail(id),
				queryFn: () => getCodingAssessment(id),
				enabled: id.length > 0,
			}),
	},
	psychometric: {
		list: (params: AssessmentListParams = {}) =>
			queryOptions({
				queryKey: assessmentKeys.psychometricList(params),
				queryFn: () => listPsychometricAssessments(params),
			}),
		detail: (id: string) =>
			queryOptions({
				queryKey: assessmentKeys.psychometricDetail(id),
				queryFn: () => getPsychometricAssessment(id),
				enabled: id.length > 0,
			}),
	},
	prescreening: {
		list: (params: AssessmentListParams = {}) =>
			queryOptions({
				queryKey: assessmentKeys.prescreeningList(params),
				queryFn: () => listPrescreeningForms(params),
			}),
		detail: (id: string) =>
			queryOptions({
				queryKey: assessmentKeys.prescreeningDetail(id),
				queryFn: () => getPrescreeningForm(id),
				enabled: id.length > 0,
			}),
	},
};

function invalidateAllAssessmentLists(qc: ReturnType<typeof useQueryClient>) {
	void qc.invalidateQueries({ queryKey: assessmentKeys.voice() });
	void qc.invalidateQueries({ queryKey: assessmentKeys.generic() });
	void qc.invalidateQueries({ queryKey: assessmentKeys.coding() });
	void qc.invalidateQueries({ queryKey: assessmentKeys.psychometric() });
	void qc.invalidateQueries({ queryKey: assessmentKeys.prescreening() });
}

export function useCreateVoiceAssessment() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (body: CreateVoiceAssessmentPayload) =>
			createVoiceAssessment(body),
		onSuccess: () => invalidateAllAssessmentLists(qc),
	});
}

export function useUpdateVoiceAssessment() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			body,
		}: {
			id: string;
			body: Partial<CreateVoiceAssessmentPayload>;
		}) => updateVoiceAssessment(id, body),
		onSuccess: (_row, { id }) => {
			invalidateAllAssessmentLists(qc);
			void qc.invalidateQueries({ queryKey: assessmentKeys.voiceDetail(id) });
		},
	});
}

export function useDeleteVoiceAssessment() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: deleteVoiceAssessment,
		onSuccess: () => invalidateAllAssessmentLists(qc),
	});
}

export function useCreateGenericAssessment() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (body: CreateGenericAssessmentPayload) =>
			createGenericAssessment(body),
		onSuccess: () => invalidateAllAssessmentLists(qc),
	});
}

export function useUpdateGenericAssessment() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			body,
		}: {
			id: string;
			body: Partial<CreateGenericAssessmentPayload>;
		}) => updateGenericAssessment(id, body),
		onSuccess: (_row, { id }) => {
			invalidateAllAssessmentLists(qc);
			void qc.invalidateQueries({
				queryKey: assessmentKeys.genericDetail(id),
			});
		},
	});
}

export function useDeleteGenericAssessment() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: deleteGenericAssessment,
		onSuccess: () => invalidateAllAssessmentLists(qc),
	});
}

export function useCreateCodingAssessment() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (body: CreateCodingAssessmentPayload) =>
			createCodingAssessment(body),
		onSuccess: () => invalidateAllAssessmentLists(qc),
	});
}

export function useUpdateCodingAssessment() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			body,
		}: {
			id: string;
			body: Partial<CreateCodingAssessmentPayload>;
		}) => updateCodingAssessment(id, body),
		onSuccess: (_row, { id }) => {
			invalidateAllAssessmentLists(qc);
			void qc.invalidateQueries({
				queryKey: assessmentKeys.codingDetail(id),
			});
		},
	});
}

export function useDeleteCodingAssessment() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: deleteCodingAssessment,
		onSuccess: () => invalidateAllAssessmentLists(qc),
	});
}

export function useCreatePsychometricAssessment() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (body: CreatePsychometricAssessmentPayload) =>
			createPsychometricAssessment(body),
		onSuccess: () => invalidateAllAssessmentLists(qc),
	});
}

export function useUpdatePsychometricAssessment() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			body,
		}: {
			id: string;
			body: Partial<CreatePsychometricAssessmentPayload>;
		}) => updatePsychometricAssessment(id, body),
		onSuccess: (_row, { id }) => {
			invalidateAllAssessmentLists(qc);
			void qc.invalidateQueries({
				queryKey: assessmentKeys.psychometricDetail(id),
			});
		},
	});
}

export function useDeletePsychometricAssessment() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: deletePsychometricAssessment,
		onSuccess: () => invalidateAllAssessmentLists(qc),
	});
}

export function useCreatePrescreeningForm() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (body: CreatePrescreeningFormPayload) =>
			createPrescreeningForm(body),
		onSuccess: () => invalidateAllAssessmentLists(qc),
	});
}

export function useUpdatePrescreeningForm() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			body,
		}: {
			id: string;
			body: Partial<CreatePrescreeningFormPayload>;
		}) => updatePrescreeningForm(id, body),
		onSuccess: (_row, { id }) => {
			invalidateAllAssessmentLists(qc);
			void qc.invalidateQueries({
				queryKey: assessmentKeys.prescreeningDetail(id),
			});
		},
	});
}

export function useDeletePrescreeningForm() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: deletePrescreeningForm,
		onSuccess: () => invalidateAllAssessmentLists(qc),
	});
}

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

export const organizationQueries = {
	current: () =>
		queryOptions({
			queryKey: organizationKeys.current(),
			queryFn: () =>
				apiClient<Organization | null>("/api/organizations/current"),
		}),
};

export const applicationQueries = {
	forJob: (jobId: string) =>
		queryOptions({
			queryKey: applicationKeys.forJob(jobId),
			queryFn: () =>
				apiClient<Application[]>(`/api/jobs/${jobId}/applications`),
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

export function useGenerateJobContent() {
	return useMutation({
		mutationFn: (data: GenerateJobContentRequest) =>
			apiClient<GenerateJobContentResponse>("/api/jobs/generate", {
				method: "POST",
				body: JSON.stringify(data),
			}),
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
			queryClient.invalidateQueries({ queryKey: applicationKeys.forJob(id) });
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
