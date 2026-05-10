import {
	DragDropContext,
	Draggable,
	Droppable,
	type DropResult,
} from "@hello-pangea/dnd";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, UserPlus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ApplicationCard } from "#/components/jobs/pipeline/ApplicationCard";
import { InviteConfirmDialog } from "#/components/jobs/pipeline/InviteConfirmDialog";
import { InviteModal } from "#/components/jobs/pipeline/InviteModal";
import { ProspectModal } from "#/components/jobs/pipeline/ProspectModal";
import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import type { Application, Job } from "#/integrations/api/client";
import {
	applicationQueries,
	jobQueries,
	useAssignCandidate,
	useUpdateBoardStatus,
} from "#/integrations/api/queries";
import { requireStaff } from "#/lib/require-role";
import { getStatusColor } from "#/lib/utils";

export const Route = createFileRoute("/jobs/$id/pipeline")({
	beforeLoad: requireStaff,
	loader: async ({ context, params }) => {
		await Promise.all([
			context.queryClient.ensureQueryData(jobQueries.detail(params.id)),
			context.queryClient.ensureQueryData(applicationQueries.forJob(params.id)),
		]);
	},
	component: JobPipelinePage,
});

type PipelineColumn = {
	id: string;
	title: string;
	boardStatus: Application["board_status"];
	applications: Application[];
	isInvitations?: boolean;
	isProspects?: boolean;
	allowInvite?: boolean;
};

function JobPipelinePage() {
	const { id } = Route.useParams();
	const { data: job } = useQuery(jobQueries.detail(id));
	const { data: applications = [] } = useQuery(applicationQueries.forJob(id));
	const assignCandidate = useAssignCandidate();
	const updateBoardStatus = useUpdateBoardStatus(id);
	const [inviteModalOpen, setInviteModalOpen] = useState(false);
	const [prospectModalOpen, setProspectModalOpen] = useState(false);
	const [reinviteTarget, setReinviteTarget] = useState<{
		email: string;
		name: string | null;
		cooldownActive: boolean;
	} | null>(null);
	const [inviteProspectTarget, setInviteProspectTarget] = useState<{
		applicationId: string;
		email: string;
		name: string | null;
	} | null>(null);
	const [flashMessage, setFlashMessage] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const inviteUrl = buildInviteUrl(job);
	const baseColumns = buildColumns(job, applications);
	const [columnOrder, setColumnOrder] = useState<string[]>([]);
	useEffect(() => {
		setColumnOrder((prev) => {
			const known = new Set(baseColumns.map((column) => column.id));
			const kept = prev.filter((id) => known.has(id));
			const missing = baseColumns
				.map((column) => column.id)
				.filter((id) => !kept.includes(id));
			return [...kept, ...missing];
		});
	}, [baseColumns]);
	const byId = new Map(baseColumns.map((column) => [column.id, column]));
	const columns = columnOrder
		.map((id) => byId.get(id))
		.filter((column): column is PipelineColumn => Boolean(column));

	if (!job) {
		return (
			<div className="container mx-auto max-w-7xl py-6">
				<p className="text-sm text-muted-foreground">Job not found.</p>
			</div>
		);
	}

	const canInvite = job.status === "Draft" || job.status === "Scheduled";

	const handleCopyInvite = async (url: string) => {
		await navigator.clipboard.writeText(url);
		if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
		setFlashMessage("Invite link copied.");
		flashTimerRef.current = setTimeout(() => setFlashMessage(null), 2400);
	};

	const handleReinvite = async () => {
		if (!reinviteTarget) return;
		setErrorMessage(null);
		try {
			await assignCandidate.mutateAsync({
				id,
				data: {
					candidate_name:
						reinviteTarget.name ||
						reinviteTarget.email.split("@")[0] ||
						"Candidate",
					candidate_email: reinviteTarget.email.trim().toLowerCase(),
				},
			});
			setFlashMessage(`Invitation re-sent to ${reinviteTarget.email}`);
			setReinviteTarget(null);
		} catch (err) {
			setErrorMessage(
				err instanceof Error ? err.message : "Could not re-send invitation.",
			);
		}
	};

	const handleInviteProspect = async () => {
		if (!inviteProspectTarget) return;
		setErrorMessage(null);
		try {
			await updateBoardStatus.mutateAsync({
				applicationId: inviteProspectTarget.applicationId,
				boardStatus: "Invited",
				intent: "promote_to_invited",
			});
			setFlashMessage(`Invitation sent to ${inviteProspectTarget.email}`);
			setInviteProspectTarget(null);
		} catch (err) {
			setErrorMessage(
				err instanceof Error ? err.message : "Could not invite prospect.",
			);
		}
	};

	const handleDragEnd = (result: DropResult) => {
		if (!result.destination) return;
		if (result.type === "COLUMN") {
			setColumnOrder((prev) => {
				const next = [...prev];
				const [moved] = next.splice(result.source.index, 1);
				if (!moved) return prev;
				next.splice(result.destination?.index ?? 0, 0, moved);
				return next;
			});
			return;
		}
		if (result.destination.droppableId === result.source.droppableId) return;
		const destination = columns.find(
			(column) => column.id === result.destination?.droppableId,
		);
		if (!destination) return;
		updateBoardStatus.mutate({
			applicationId: result.draggableId,
			boardStatus: destination.boardStatus,
			intent:
				destination.boardStatus === "Invited"
					? "promote_to_invited"
					: undefined,
		});
	};

	return (
		<div className="container mx-auto max-w-7xl py-6">
			<div className="mb-6 flex items-center justify-between gap-4">
				<div>
					<Button variant="ghost" size="sm" asChild>
						<Link to="/jobs/$id" params={{ id }}>
							<ArrowLeft className="mr-2 h-4 w-4" />
							Back to job
						</Link>
					</Button>
					<div className="mt-3 flex items-center gap-3">
						<h1 className="text-2xl font-semibold">{job.title}</h1>
						<Badge className={getStatusColor(job.status)}>{job.status}</Badge>
					</div>
				</div>
			</div>

			{flashMessage ? (
				<Alert className="mb-4" variant="success">
					<AlertTitle>Success</AlertTitle>
					<AlertDescription>{flashMessage}</AlertDescription>
				</Alert>
			) : null}
			{errorMessage ? (
				<Alert className="mb-4" variant="destructive">
					<AlertTitle>Action failed</AlertTitle>
					<AlertDescription>{errorMessage}</AlertDescription>
				</Alert>
			) : null}

			<DragDropContext onDragEnd={handleDragEnd}>
				<div className="overflow-x-auto">
					<Droppable droppableId="board" direction="horizontal" type="COLUMN">
						{(boardProvided) => (
							<div
								ref={boardProvided.innerRef}
								{...boardProvided.droppableProps}
								className="flex min-w-max gap-4 pb-2"
							>
								{columns.map((column, columnIndex) => (
									<Draggable
										key={column.id}
										draggableId={`column:${column.id}`}
										index={columnIndex}
									>
										{(columnProvided) => (
											<section
												ref={columnProvided.innerRef}
												{...columnProvided.draggableProps}
												className="flex h-[70vh] w-80 flex-col rounded-xl border border-border bg-card"
											>
												<header className="flex items-center justify-between border-b border-border p-3">
													<div
														className="flex cursor-grab items-center gap-2 active:cursor-grabbing"
														{...columnProvided.dragHandleProps}
													>
														<h2 className="text-sm font-medium text-foreground">
															{column.title}
														</h2>
														<Badge variant="secondary">
															{column.applications.length}
														</Badge>
													</div>
													{column.isProspects ? (
														<Button
															variant="outline"
															size="icon-sm"
															onClick={() => setProspectModalOpen(true)}
															disabled={!canInvite}
															aria-label="Add prospect"
														>
															<UserPlus className="h-4 w-4" />
														</Button>
													) : null}
													{column.isInvitations ? (
														<Button
															variant="outline"
															size="icon-sm"
															onClick={() => setInviteModalOpen(true)}
															disabled={!canInvite}
															aria-label="Invite candidate"
														>
															<UserPlus className="h-4 w-4" />
														</Button>
													) : null}
												</header>
												<Droppable droppableId={column.id} type="CARD">
													{(provided) => (
														<div
															ref={provided.innerRef}
															{...provided.droppableProps}
															className="flex-1 space-y-3 overflow-y-auto p-3"
														>
															{column.applications.length === 0 ? (
																<div className="rounded-lg border border-dashed border-border px-3 py-10 text-center text-sm text-muted-foreground">
																	No candidates yet
																</div>
															) : (
																column.applications.map(
																	(application, index) => (
																		<Draggable
																			key={application.id}
																			draggableId={application.id}
																			index={index}
																		>
																			{(dragProvided) => (
																				<div
																					ref={dragProvided.innerRef}
																					{...dragProvided.draggableProps}
																					{...dragProvided.dragHandleProps}
																					className="cursor-grab active:cursor-grabbing"
																				>
																					<ApplicationCard
																						application={application}
																						inviteUrl={inviteUrl}
																						isInvitationColumn={Boolean(
																							column.isInvitations,
																						)}
																						isProspectsColumn={Boolean(
																							column.isProspects,
																						)}
																						onCopyInvite={handleCopyInvite}
																						onReinvite={(
																							email,
																							name,
																							cooldownActive,
																						) => {
																							setReinviteTarget({
																								email,
																								name,
																								cooldownActive,
																							});
																						}}
																						onInviteProspect={(
																							applicationId,
																							email,
																							name,
																						) => {
																							setInviteProspectTarget({
																								applicationId,
																								email,
																								name,
																							});
																						}}
																					/>
																				</div>
																			)}
																		</Draggable>
																	),
																)
															)}
															{provided.placeholder}
														</div>
													)}
												</Droppable>
											</section>
										)}
									</Draggable>
								))}
								{boardProvided.placeholder}
							</div>
						)}
					</Droppable>
				</div>
			</DragDropContext>

			<InviteModal
				jobId={id}
				applications={applications}
				open={inviteModalOpen}
				onOpenChange={setInviteModalOpen}
				onSuccess={(email) => {
					setFlashMessage(
						`Invitation sent — an email has been sent to ${email}`,
					);
				}}
				onBulkSuccess={setFlashMessage}
			/>

			<ProspectModal
				jobId={id}
				open={prospectModalOpen}
				onOpenChange={setProspectModalOpen}
				onSuccess={() => setFlashMessage("Prospect added")}
			/>

			<InviteConfirmDialog
				open={Boolean(reinviteTarget)}
				onOpenChange={(open) => {
					if (!open) setReinviteTarget(null);
				}}
				email={reinviteTarget?.email ?? ""}
				title="Re-send invitation to {email}?"
				confirmLabel="Send Invitation"
				onConfirm={() => void handleReinvite()}
				pending={assignCandidate.isPending}
				cooldownActive={Boolean(reinviteTarget?.cooldownActive)}
			/>

			<InviteConfirmDialog
				open={Boolean(inviteProspectTarget)}
				onOpenChange={(open) => {
					if (!open) setInviteProspectTarget(null);
				}}
				email={inviteProspectTarget?.email ?? ""}
				title="Invite {email} for this role?"
				confirmLabel="Send Invitation"
				onConfirm={() => void handleInviteProspect()}
				pending={assignCandidate.isPending}
			/>
		</div>
	);
}

function buildInviteUrl(job: Job | undefined): string | null {
	if (!job?.invite_token) {
		return null;
	}
	const candidateOrigin =
		import.meta.env.VITE_CANDIDATE_APP_URL || window.location.origin;
	return `${candidateOrigin.replace(/\/$/, "")}/interview/join/${job.invite_token}`;
}

function buildColumns(
	job: Job | undefined,
	applications: Application[],
): PipelineColumn[] {
	if (!job) {
		return [];
	}

	const usedStageStatuses = new Set<Application["board_status"]>();
	const stageColumns = (job.pipeline?.stages ?? []).flatMap((stage) => {
		const boardStatus = boardStatusForStage(stage.stage_type);
		if (
			["Prospect", "Invited", "Hired", "Rejected"].includes(boardStatus) ||
			usedStageStatuses.has(boardStatus)
		) {
			return [];
		}
		usedStageStatuses.add(boardStatus);
		return [
			{
				id: `stage:${boardStatus}`,
				title: stage.title ?? stage.stage_type,
				boardStatus,
				applications: applications.filter(
					(application) => application.board_status === boardStatus,
				),
			},
		];
	});

	const byStatus = (boardStatus: Application["board_status"]) =>
		applications.filter(
			(application) => application.board_status === boardStatus,
		);

	return [
		{
			id: "prospects",
			title: "Prospects",
			boardStatus: "Prospect",
			applications: byStatus("Prospect"),
			isProspects: true,
		},
		{
			id: "invitations",
			title: "Invitations",
			boardStatus: "Invited",
			applications: byStatus("Invited"),
			isInvitations: true,
		},
		...stageColumns,
		{
			id: "hired",
			title: "Hired",
			boardStatus: "Hired",
			applications: byStatus("Hired"),
		},
		{
			id: "rejected",
			title: "Rejected",
			boardStatus: "Rejected",
			applications: byStatus("Rejected"),
		},
	];
}

function boardStatusForStage(stageType: string): Application["board_status"] {
	switch (stageType) {
		case "Applied":
			return "Applied";
		case "Prescreening":
			return "Screening";
		case "Offer":
			return "Offer";
		case "Hired":
			return "Hired";
		case "Rejected":
			return "Rejected";
		default:
			return "Interview";
	}
}
