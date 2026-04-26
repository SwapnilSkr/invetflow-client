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
import type { Interview } from "#/integrations/api/client";
import {
	interviewQueries,
	useDeleteInterview,
} from "#/integrations/api/queries";
import { requireRecruiter } from "#/lib/require-role";
import { cn, getStatusColor } from "#/lib/utils";

export const Route = createFileRoute("/interviews/")({
	beforeLoad: requireRecruiter,
	component: InterviewsPage,
});

function InterviewsPage() {
	const { data, isLoading, error } = useQuery(interviewQueries.list());
	const deleteInterview = useDeleteInterview();

	if (isLoading) {
		return (
			<div className="container mx-auto px-4 py-8">
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
					Error loading interviews
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
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8 flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Interviews</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						{data?.total ?? 0} total interviews
					</p>
				</div>
				<Button asChild>
					<Link to="/interviews/new">
						<Plus className="mr-2 h-4 w-4" />
						Create Interview
					</Link>
				</Button>
			</div>

			<div className="space-y-3">
				{data?.interviews?.length === 0 ? (
					<Card>
						<CardContent className="flex flex-col items-center justify-center py-16">
							<div className="mb-4 rounded-full bg-muted p-4">
								<Calendar className="h-8 w-8 text-muted-foreground" />
							</div>
							<p className="text-lg font-medium">No interviews yet</p>
							<p className="mt-1 text-sm text-muted-foreground">
								Create your first interview to get started
							</p>
							<Button className="mt-4" asChild>
								<Link to="/interviews/new">
									<Plus className="mr-2 h-4 w-4" />
									Create Interview
								</Link>
							</Button>
						</CardContent>
					</Card>
				) : (
					data?.interviews?.map((interview: Interview) => (
						<InterviewCard
							key={interview.id}
							interview={interview}
							onDelete={(id) => {
								if (
									confirm("Are you sure you want to delete this interview?")
								) {
									deleteInterview.mutate(id);
								}
							}}
						/>
					))
				)}
			</div>
		</div>
	);
}

function InterviewCard({
	interview,
	onDelete,
}: {
	interview: Interview;
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
									to="/interviews/$id"
									params={{ id: interview.id }}
									className="text-lg font-semibold no-underline hover:underline text-foreground"
								>
									{interview.title}
								</Link>
								<p className="mt-0.5 text-sm text-muted-foreground">
									{interview.job_title}
								</p>
							</div>
							<Badge
								className={cn(
									"flex-shrink-0",
									getStatusColor(interview.status),
								)}
							>
								{interview.status}
							</Badge>
						</div>

						<div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
							<div className="flex items-center gap-1">
								<Clock className="h-3.5 w-3.5" />
								<span>{interview.duration_minutes} min</span>
							</div>
							<div className="flex items-center gap-1">
								<Users className="h-3.5 w-3.5" />
								<span>{interview.questions?.length || 0} questions</span>
							</div>
							{interview.candidate_name && (
								<div className="flex items-center gap-1">
									<span className="font-medium text-foreground">
										{interview.candidate_name}
									</span>
								</div>
							)}
						</div>
					</div>

					<div className="flex items-center gap-1">
						<Button variant="ghost" size="icon-sm" asChild>
							<Link to="/interviews/$id" params={{ id: interview.id }}>
								<ExternalLink className="h-4 w-4" />
							</Link>
						</Button>
						<Button
							variant="ghost"
							size="icon-sm"
							className="text-destructive hover:text-destructive"
							onClick={() => onDelete(interview.id)}
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
