import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { ApplicationCard } from "#/components/jobs/pipeline/ApplicationCard";
import { InviteConfirmDialog } from "#/components/jobs/pipeline/InviteConfirmDialog";
import { InviteModal } from "#/components/jobs/pipeline/InviteModal";
import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import type { Application, Job } from "#/integrations/api/client";
import {
	applicationQueries,
	jobQueries,
	useAssignCandidate,
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
	applications: Application[];
	isInvitations?: boolean;
	allowInvite?: boolean;
};

function JobPipelinePage() {
	const { id } = Route.useParams();
	const { data: job } = useQuery(jobQueries.detail(id));
	const { data: applications = [] } = useQuery(applicationQueries.forJob(id));
	const assignCandidate = useAssignCandidate();
	const [inviteModalOpen, setInviteModalOpen] = useState(false);
	const [reinviteTarget, setReinviteTarget] = useState<{
		email: string;
		name: string | null;
	} | null>(null);
	const [flashMessage, setFlashMessage] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const inviteUrl = buildInviteUrl(job);
	const columns = useMemo(
		() => buildColumns(job, applications),
		[job, applications],
	);

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
		setFlashMessage("Invite link copied.");
		setTimeout(() => setFlashMessage(null), 2400);
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

			<div className="overflow-x-auto">
				<div className="flex min-w-max gap-4 pb-2">
					{columns.map((column) => (
						<section
							key={column.id}
							className="flex h-[70vh] w-80 flex-col rounded-xl border border-border bg-card"
						>
							<header className="flex items-center justify-between border-b border-border p-3">
								<div className="flex items-center gap-2">
									<h2 className="text-sm font-medium text-foreground">
										{column.title}
									</h2>
									<Badge variant="secondary">
										{column.applications.length}
									</Badge>
								</div>
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
							<div className="flex-1 space-y-3 overflow-y-auto p-3">
								{column.applications.length === 0 ? (
									<div className="rounded-lg border border-dashed border-border px-3 py-10 text-center text-sm text-muted-foreground">
										No candidates yet
									</div>
								) : (
									column.applications.map((application) => (
										<ApplicationCard
											key={application.id}
											application={application}
											inviteUrl={inviteUrl}
											isInvitationColumn={Boolean(column.isInvitations)}
											onCopyInvite={handleCopyInvite}
											onReinvite={(email, name) => {
												setReinviteTarget({ email, name });
											}}
										/>
									))
								)}
							</div>
						</section>
					))}
				</div>
			</div>

			<InviteModal
				jobId={id}
				open={inviteModalOpen}
				onOpenChange={setInviteModalOpen}
				onSuccess={(email) => {
					setFlashMessage(
						`Invitation sent — an email has been sent to ${email}`,
					);
				}}
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

	const stageColumns =
		job.pipeline?.stages?.map((stage) => ({
			id: `stage:${stage.id}`,
			title: stage.title ?? stage.stage_type,
			applications: applications.filter(
				(application) =>
					application.current_stage_id === stage.id &&
					application.board_status !== "Invited" &&
					application.board_status !== "Hired" &&
					application.board_status !== "Rejected",
			),
		})) ?? [];

	const prospects = applications.filter((application) => {
		if (["Invited", "Hired", "Rejected"].includes(application.board_status)) {
			return false;
		}
		if (application.current_stage_id) {
			return !job.pipeline.stages.some(
				(stage) => stage.id === application.current_stage_id,
			);
		}
		return true;
	});

	const invitations = applications.filter(
		(application) => application.board_status === "Invited",
	);
	const hired = applications.filter(
		(application) => application.board_status === "Hired",
	);
	const rejected = applications.filter(
		(application) => application.board_status === "Rejected",
	);

	return [
		{ id: "prospects", title: "Prospects", applications: prospects },
		{
			id: "invitations",
			title: "Invitations",
			applications: invitations,
			isInvitations: true,
		},
		...stageColumns,
		{ id: "hired", title: "Hired", applications: hired },
		{ id: "rejected", title: "Rejected", applications: rejected },
	];
}
