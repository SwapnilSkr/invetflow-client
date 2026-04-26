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
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
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
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8 flex flex-wrap items-end justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
					<p className="mt-1 text-muted-foreground">
						Manage interview templates, assign candidates, and share invite links.
					</p>
				</div>
				<Button asChild>
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
						interviewsList.filter((i: Interview) => i.status === "Draft")
							.length
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
					color="emerald"
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

			<Card>
				<CardHeader>
					<CardTitle>Interviews</CardTitle>
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
							<div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
								<Calendar className="h-7 w-7 text-muted-foreground" />
							</div>
							<p className="font-medium">No interviews yet</p>
							<p className="mt-1 text-sm text-muted-foreground">
								Create an interview, then assign a candidate so they can join.
							</p>
							<Button className="mt-4" asChild>
								<Link to="/interviews">
									<Plus className="mr-2 h-4 w-4" />
									Create interview
								</Link>
							</Button>
						</div>
					) : (
						<ul className="divide-y rounded-lg border">
							{interviewsList.map((interview: Interview) => (
								<li key={interview.id}>
									<Link
										to="/interviews/$id"
										params={{ id: interview.id }}
										className="flex flex-wrap items-center gap-3 px-4 py-4 transition-colors hover:bg-muted/50"
									>
										<div className="min-w-0 flex-1">
											<div className="flex flex-wrap items-center gap-2">
												<span className="font-medium">{interview.title}</span>
												<Badge
													className={cn(
														"text-xs",
														getStatusColor(interview.status),
													)}
												>
													{interview.status}
												</Badge>
											</div>
											<p className="mt-0.5 text-sm text-muted-foreground">
												{interview.job_title}
												{interview.candidate_name
													? ` · ${interview.candidate_name}`
													: " · No candidate yet"}
											</p>
										</div>
										<div className="flex items-center gap-3 text-sm text-muted-foreground">
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
	color?: "zinc" | "emerald" | "amber" | "blue" | "slate";
}) {
	const colorClasses = {
		zinc: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
		slate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
		emerald:
			"bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400",
		amber:
			"bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-400",
		blue: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400",
	};

	return (
		<Card>
			<CardContent className="p-6">
				<div className="flex items-center justify-between">
					<div>
						<p className="text-sm text-muted-foreground">{title}</p>
						{loading ? (
							<Skeleton className="mt-1 h-8 w-16" />
						) : (
							<p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>
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
