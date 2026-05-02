import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	Calendar,
	Clock,
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
					<Card>
						<CardContent className="flex flex-col items-center justify-center py-16">
							<div className="mb-4 rounded-full bg-muted p-4">
								<Calendar className="h-8 w-8 text-muted-foreground" />
							</div>
							<p className="text-lg font-medium">No jobs yet</p>
							<p className="mt-1 text-sm text-muted-foreground">
								Create your first job to get started
							</p>
							<Button className="mt-4" asChild>
								<Link to="/jobs/new">
									<Plus className="mr-2 h-4 w-4" />
									Create job
								</Link>
							</Button>
						</CardContent>
					</Card>
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
		<Card className="transition-all hover:shadow-md">
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
								className={cn("flex-shrink-0", getStatusColor(job.status))}
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
