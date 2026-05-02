import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	BarChart3,
	Calendar,
	ChevronRight,
	Clock,
	Plus,
	Users,
} from "lucide-react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";
import type { Interview } from "#/integrations/api/client";
import { interviewQueries } from "#/integrations/api/queries";
import { requireRecruiter } from "#/lib/require-role";
import { cn, getStatusColor } from "#/lib/utils";

export const Route = createFileRoute("/dashboard/")({
	beforeLoad: requireRecruiter,
	component: RecruiterDashboard,
});

function RecruiterDashboard() {
	const { data: interviews, isLoading } = useQuery(interviewQueries.list());

	const interviewsList = interviews?.interviews ?? [];

	return (
		<div className="mx-auto max-w-6xl px-4 py-8 text-[#111827]">
			<div className="mb-8 flex flex-wrap items-end justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold tracking-wide">Dashboard</h1>
					<p className="mt-1 text-[13.33px] text-[#6b7280]">
						Manage interview flows, AI questions, and candidate invites from one
						place.
					</p>
				</div>
				<Button
					asChild
					className="h-11 rounded-xl bg-[#0052cc] font-medium text-white hover:bg-[#0041a3]"
				>
					<Link to="/interviews">
						<Plus className="mr-2 h-4 w-4" />
						New interview
					</Link>
				</Button>
			</div>

			<div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<StatCard
					title="Total"
					value={interviewsList.length}
					icon={Calendar}
					loading={isLoading}
				/>
				<StatCard
					title="Draft"
					value={
						interviewsList.filter((i: Interview) => i.status === "Draft").length
					}
					icon={Calendar}
					loading={isLoading}
					color="slate"
				/>
				<StatCard
					title="Scheduled / active"
					value={
						interviewsList.filter(
							(i: Interview) =>
								i.status === "Scheduled" || i.status === "Active",
						).length
					}
					icon={Users}
					loading={isLoading}
					color="blue"
				/>
				<StatCard
					title="Completed"
					value={
						interviewsList.filter((i: Interview) => i.status === "Completed")
							.length
					}
					icon={BarChart3}
					loading={isLoading}
					color="blue"
				/>
			</div>

			<Card className="border-black/8 shadow-sm">
				<CardHeader>
					<CardTitle className="text-lg font-semibold tracking-tight">
						Interviews
					</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="space-y-4">
							<Skeleton className="h-20 w-full" />
							<Skeleton className="h-20 w-full" />
							<Skeleton className="h-20 w-full" />
						</div>
					) : interviewsList.length === 0 ? (
						<div className="py-12 text-center">
							<div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f3f4f6]">
								<Calendar className="h-7 w-7 text-[#6b7280]" />
							</div>
							<p className="font-medium">No interviews yet</p>
							<p className="mt-1 text-sm text-[#6b7280]">
								Create a job opening and configure AI questions, then invite
								candidates.
							</p>
							<Button
								className="mt-4 h-11 rounded-xl bg-[#0052cc] font-medium hover:bg-[#0041a3]"
								asChild
							>
								<Link to="/interviews">
									<Plus className="mr-2 h-4 w-4" />
									Create interview
								</Link>
							</Button>
						</div>
					) : (
						<ul className="divide-y divide-black/8 overflow-hidden rounded-xl border border-black/8">
							{interviewsList.map((interview: Interview) => (
								<li key={interview.id}>
									<Link
										to="/interviews/$id"
										params={{ id: interview.id }}
										className="flex flex-wrap items-center gap-3 bg-white px-4 py-4 transition-colors hover:bg-[#f9fafb]"
									>
										<div className="min-w-0 flex-1">
											<div className="flex flex-wrap items-center gap-2">
												<span className="font-medium text-[#111827]">
													{interview.title}
												</span>
												<Badge
													className={cn(
														"text-xs",
														getStatusColor(interview.status),
													)}
												>
													{interview.status}
												</Badge>
											</div>
											<p className="mt-0.5 text-sm text-[#6b7280]">
												{interview.job_title}
												{interview.candidate_name
													? ` · ${interview.candidate_name}`
													: " · No candidate yet"}
											</p>
										</div>
										<div className="flex items-center gap-3 text-sm text-[#6b7280]">
											<span className="inline-flex items-center gap-1">
												<Clock className="h-3.5 w-3.5" />
												{interview.duration_minutes} min
											</span>
											<ChevronRight className="h-4 w-4 shrink-0 opacity-50" />
										</div>
									</Link>
								</li>
							))}
						</ul>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

function StatCard({
	title,
	value,
	icon: Icon,
	loading,
	color = "zinc",
}: {
	title: string;
	value: number;
	icon: React.ComponentType<{ className?: string }>;
	loading?: boolean;
	color?: "zinc" | "amber" | "blue" | "slate";
}) {
	const colorClasses = {
		zinc: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
		slate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
		amber: "bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-400",
		blue: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400",
	};

	return (
		<Card className="border-black/8 shadow-sm">
			<CardContent className="p-6">
				<div className="flex items-center justify-between">
					<div>
						<p className="text-sm text-[#6b7280]">{title}</p>
						{loading ? (
							<Skeleton className="mt-1 h-8 w-16" />
						) : (
							<p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-[#111827]">
								{value}
							</p>
						)}
					</div>
					<div className={cn("rounded-full p-3", colorClasses[color])}>
						<Icon className="h-5 w-5" />
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
