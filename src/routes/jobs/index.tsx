import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	Calendar,
	Clock,
	Cpu,
	ExternalLink,
	Plus,
	Trash2,
	Users,
} from "lucide-react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";
import type { Job } from "#/integrations/api/client";
import { jobQueries, useDeleteJob } from "#/integrations/api/queries";
import { requireRecruiter } from "#/lib/require-role";
import { cn, getStatusColor } from "#/lib/utils";

export const Route = createFileRoute("/jobs/")({
	beforeLoad: requireRecruiter,
	component: InterviewsPage,
});

function InterviewsPage() {
	const { data, isLoading, error } = useQuery(jobQueries.list());
	const deleteJob = useDeleteJob();

	if (isLoading) {
		return (
			<div className="container mx-auto">
				<div className="mb-8 flex items-center justify-between">
					<Skeleton className="h-9 w-40" />
					<Skeleton className="h-9 w-36" />
				</div>
				<div className="space-y-4">
					<Skeleton className="h-28 w-full" />
					<Skeleton className="h-28 w-full" />
					<Skeleton className="h-28 w-full" />
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center py-20">
				<p className="text-destructive text-lg font-medium">
					Error loading jobs
				</p>
				<p className="mt-2 text-sm text-muted-foreground">
					{(error as Error).message}
				</p>
				<Button
					variant="outline"
					className="mt-4"
					onClick={() => window.location.reload()}
				>
					Try again
				</Button>
			</div>
		);
	}

	return (
		<div className="container mx-auto">
			<div className="mb-8 flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Jobs</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						{data?.total ?? 0} total jobs
					</p>
				</div>
				<Button asChild>
					<Link to="/jobs/new">
						<Plus className="mr-2 h-4 w-4" />
						Create job
					</Link>
				</Button>
			</div>

			<div className="space-y-3">
				{data?.jobs?.length === 0 ? (
					<div className="relative overflow-hidden rounded-xl border border-black/5 bg-gradient-to-b from-white to-[#f9fafb] px-8 py-20 text-center shadow-sm">
						<div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_10%,transparent_100%)]" />

						<div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center">
							<div className="absolute inset-0 animate-pulse rounded-full bg-[#0052cc]/10 blur-xl" />
							<div className="absolute -inset-1 rounded-full border border-black/5" />
							<div className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-black/10 bg-white shadow-sm ring-1 ring-black/5">
								<Cpu className="size-5 text-[#0052cc]" />
							</div>
							<div className="absolute -left-1 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full border border-[#0052cc] bg-white" />
							<div className="absolute -right-1 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full border border-[#0052cc] bg-white" />
						</div>

						<h3 className="relative text-base font-semibold tracking-tight text-[#111827]">
							No active job configurations
						</h3>
						<p className="relative mx-auto mt-1.5 max-w-sm text-sm text-[#6b7280]">
							Your workspace is empty. Create a new job requisition to start processing candidate interviews.
						</p>
						<div className="relative mt-6">
							<Button asChild className="h-10 rounded-lg bg-[#0052cc] font-medium text-white shadow-sm transition-all hover:bg-[#0041a3] hover:shadow">
								<Link to="/jobs/new">
									<Plus className="mr-2 h-4 w-4" />
									Create job
								</Link>
							</Button>
						</div>
					</div>
				) : (
					data?.jobs?.map((row: Job) => (
						<JobRowCard
							key={row.id}
							job={row}
							onDelete={(jid) => {
								if (confirm("Are you sure you want to delete this job?")) {
									deleteJob.mutate(jid);
								}
							}}
						/>
					))
				)}
			</div>
		</div>
	);
}

function JobRowCard({
	job,
	onDelete,
}: {
	job: Job;
	onDelete: (id: string) => void;
}) {
	return (
		<Card className="transition-colors">
			<CardContent className="p-4">
				<div className="flex items-start gap-4">
					<div className="flex-1 min-w-0">
						<div className="flex items-start justify-between gap-3">
							<div className="min-w-0">
								<Link
									to="/jobs/$id"
									params={{ id: job.id }}
									className="text-lg font-semibold no-underline hover:underline text-foreground"
								>
									{job.title}
								</Link>
								<p className="mt-0.5 text-sm text-muted-foreground">
									{job.job_title}
								</p>
							</div>
							<Badge
								className={cn("shrink-0", getStatusColor(job.status))}
							>
								{job.status}
							</Badge>
						</div>

						<div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
							<div className="flex items-center gap-1">
								<Clock className="h-3.5 w-3.5" />
								<span>{job.duration_minutes} min</span>
							</div>
							<div className="flex items-center gap-1">
								<Users className="h-3.5 w-3.5" />
								<span>{job.questions?.length || 0} questions</span>
							</div>
							{job.candidate_name && (
								<div className="flex items-center gap-1">
									<span className="font-medium text-foreground">
										{job.candidate_name}
									</span>
								</div>
							)}
						</div>
					</div>

					<div className="flex items-center gap-1">
						<Button variant="ghost" size="icon-sm" asChild>
							<Link to="/jobs/$id" params={{ id: job.id }}>
								<ExternalLink className="h-4 w-4" />
							</Link>
						</Button>
						<Button
							variant="ghost"
							size="icon-sm"
							className="text-destructive hover:text-destructive"
							onClick={() => onDelete(job.id)}
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
