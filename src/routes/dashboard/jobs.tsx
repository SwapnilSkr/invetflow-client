import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, Clock, Plus, Trash2, Users } from "lucide-react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";
import type { Job } from "#/integrations/api/client";
import { jobQueries, useDeleteJob } from "#/integrations/api/queries";
import { cn, getStatusColor } from "#/lib/utils";

export const Route = createFileRoute("/dashboard/jobs")({
	component: DashboardJobsPage,
});

function DashboardJobsPage() {
	const { data, isLoading, error } = useQuery(jobQueries.list());
	const deleteJob = useDeleteJob();

	if (isLoading) {
		return (
			<div>
				<div className="mx-auto w-full max-w-6xl">
					<div className="mb-8 flex items-center justify-between">
						<Skeleton className="h-9 w-40" />
						<Skeleton className="h-9 w-36" />
					</div>
					<div className="space-y-4">
						<Skeleton className="h-28 w-full" />
						<Skeleton className="h-28 w-full" />
					</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center py-20">
				<p className="text-lg font-medium text-destructive">
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

	const jobs = data?.jobs ?? [];

	return (
		<div>
			<div className="mx-auto w-full max-w-6xl">
				<div className="mb-8 flex flex-wrap items-end justify-between gap-4">
					<div>
						<h1 className="text-2xl font-bold tracking-tight text-[#111827]">
							Jobs
						</h1>
						<p className="mt-1 text-[13.33px] text-[#6b7280]">
							Interview flows and openings ({data?.total ?? jobs.length} total)
						</p>
					</div>
					<Button
						asChild
						className="h-11 rounded-xl bg-[#0052cc] font-medium text-white hover:bg-[#0041a3]"
					>
						<Link to="/jobs/new">
							<Plus className="size-4" />
							<p className="text-sm">New job</p>
						</Link>
					</Button>
				</div>

				{jobs.length === 0 ? (
					<Card className="border-black/8 py-16 text-center">
						<CardContent>
							<div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f3f4f6]">
								<Calendar className="h-7 w-7 text-[#6b7280]" />
							</div>
							<p className="font-medium text-[#111827]">No jobs yet</p>
							<p className="mt-1 text-sm text-[#6b7280]">
								Create an interview flow to start hiring.
							</p>
							<Button
								className="mt-4 h-11 rounded-xl bg-[#0052cc] font-medium hover:bg-[#0041a3]"
								asChild
							>
								<Link to="/jobs/new">
									<Plus className="size-4" />
									<p className="text-sm">Create job</p>
								</Link>
							</Button>
						</CardContent>
					</Card>
				) : (
					<ul className="space-y-3">
						{jobs.map((row: Job) => (
							<li key={row.id}>
								<Card className="overflow-hidden border-black/8">
									<CardContent className="p-0">
										<div className="flex flex-wrap items-center gap-3 px-4 py-4">
											<Link
												to="/jobs/$id"
												params={{ id: row.id }}
												className="min-w-0 flex-1 no-underline"
											>
												<div className="flex flex-wrap items-center gap-2">
													<h3 className="font-semibold text-[#111827]">
														{row.title}
													</h3>
													<Badge
														className={cn(
															"text-xs",
															getStatusColor(row.status),
														)}
													>
														{row.status}
													</Badge>
												</div>
												<p className="mt-1 text-sm text-[#6b7280]">
													{row.job_title}
													{row.candidate_name
														? ` · ${row.candidate_name}`
														: " · No candidate yet"}
												</p>
												<div className="mt-2 flex items-center gap-4 text-xs text-[#6b7280]">
													<span className="inline-flex items-center gap-1">
														<Clock className="h-3.5 w-3.5" />
														{row.duration_minutes} min
													</span>
													{row.candidate_email ? (
														<span className="inline-flex items-center gap-1">
															<Users className="h-3.5 w-3.5" />
															Invited
														</span>
													) : null}
												</div>
											</Link>
											<Button
												variant="outline"
												size="sm"
												className="shrink-0 border-red-200 text-red-700 hover:bg-red-50"
												disabled={deleteJob.isPending}
												onClick={() => deleteJob.mutate(row.id)}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									</CardContent>
								</Card>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
}
