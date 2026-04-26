import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, Clock, ExternalLink, Inbox } from "lucide-react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";
import type { Interview } from "#/integrations/api/client";
import { interviewQueries } from "#/integrations/api/queries";
import { requireCandidate } from "#/lib/require-role";
import { cn, getStatusColor } from "#/lib/utils";

export const Route = createFileRoute("/candidate/")({
	beforeLoad: requireCandidate,
	component: CandidateHome,
});

function CandidateHome() {
	const { data, isLoading, error } = useQuery(interviewQueries.list());

	if (isLoading) {
		return (
			<div className="container mx-auto max-w-3xl px-4 py-10">
				<Skeleton className="mb-6 h-10 w-48" />
				<div className="space-y-3">
					<Skeleton className="h-24 w-full" />
					<Skeleton className="h-24 w-full" />
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="container mx-auto max-w-3xl px-4 py-16 text-center">
				<p className="text-destructive font-medium">
					Could not load interviews
				</p>
				<p className="mt-2 text-sm text-muted-foreground">
					{(error as Error).message}
				</p>
			</div>
		);
	}

	const list = data?.interviews ?? [];

	return (
		<div className="container mx-auto max-w-3xl px-4 py-10">
			<div className="mb-8">
				<h1 className="text-3xl font-bold tracking-tight">My interviews</h1>
				<p className="mt-2 text-muted-foreground">
					When a recruiter assigns you and the interview is scheduled, you can
					open it from here and join the session.
				</p>
			</div>

			{list.length === 0 ? (
				<Card className="border-dashed">
					<CardContent className="flex flex-col items-center py-14 text-center">
						<div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
							<Inbox className="h-7 w-7 text-muted-foreground" />
						</div>
						<p className="font-medium">No interviews yet</p>
						<p className="mt-2 max-w-sm text-sm text-muted-foreground">
							You will see interviews here once a hiring team assigns your email
							to a role. You can also open a link from an invite email.
						</p>
					</CardContent>
				</Card>
			) : (
				<div className="space-y-3">
					{list.map((interview: Interview) => (
						<Card key={interview.id}>
							<CardHeader className="pb-2">
								<div className="flex flex-wrap items-start justify-between gap-3">
									<div>
										<CardTitle className="text-lg">{interview.title}</CardTitle>
										<p className="mt-1 text-sm text-muted-foreground">
											{interview.job_title}
										</p>
									</div>
									<Badge className={cn(getStatusColor(interview.status))}>
										{interview.status}
									</Badge>
								</div>
							</CardHeader>
							<CardContent className="flex flex-wrap items-center gap-4 border-t pt-4 text-sm text-muted-foreground">
								<span className="inline-flex items-center gap-1">
									<Clock className="h-3.5 w-3.5" />
									{interview.duration_minutes} min
								</span>
								<span className="inline-flex items-center gap-1">
									<Calendar className="h-3.5 w-3.5" />
									Updated {new Date(interview.updated_at).toLocaleDateString()}
								</span>
								<Button
									variant="secondary"
									size="sm"
									className="ml-auto"
									asChild
								>
									<Link
										to="/interviews/$id"
										params={{ id: interview.id }}
										className="inline-flex items-center gap-1"
									>
										View
										<ExternalLink className="h-3.5 w-3.5" />
									</Link>
								</Button>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
