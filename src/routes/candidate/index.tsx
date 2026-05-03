import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, Clock, ExternalLink, Inbox, Network } from "lucide-react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";
import type { Job } from "#/integrations/api/client";
import { jobQueries } from "#/integrations/api/queries";
import { requireCandidate } from "#/lib/require-role";
import { cn, getStatusColor } from "#/lib/utils";

export const Route = createFileRoute("/candidate/")({
	beforeLoad: requireCandidate,
	component: CandidateHome,
});

function CandidateHome() {
	const { data, isLoading, error } = useQuery(jobQueries.list());

	if (isLoading) {
		return (
			<div className="container mx-auto max-w-3xl">
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
			<div className="container mx-auto max-w-3xl py-16 text-center">
				<p className="text-destructive font-medium">Could not load jobs</p>
				<p className="mt-2 text-sm text-muted-foreground">
					{(error as Error).message}
				</p>
			</div>
		);
	}

	const list = data?.jobs ?? [];

	return (
		<div className="container mx-auto max-w-3xl">
			<div className="mb-8">
				<h1 className="text-3xl font-bold tracking-tight">My jobs</h1>
				<p className="mt-2 text-muted-foreground">
					When a recruiter assigns you and the role is scheduled, you can open
					it from here and join the interview session.
				</p>
			</div>

			{list.length === 0 ? (
				<div className="relative overflow-hidden rounded-xl border border-black/5 bg-gradient-to-b from-white to-[#f9fafb] px-8 py-20 text-center shadow-sm">
					<div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_10%,transparent_100%)]" />

					<div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center">
						<div className="absolute inset-0 animate-pulse rounded-full bg-[#16a34a]/10 blur-xl" />
						<div className="absolute inset-0 rotate-45 rounded-xl border border-black/5 bg-white/50" />
						<div className="relative flex h-12 w-12 items-center justify-center rounded-lg border border-black/10 bg-white shadow-sm ring-1 ring-black/5">
							<Network className="size-5 text-[#16a34a]" />
						</div>
					</div>

					<h3 className="relative text-base font-semibold tracking-tight text-[#111827]">
						Awaiting System Assignment
					</h3>
					<p className="relative mx-auto mt-1.5 max-w-sm text-sm text-[#6b7280]">
						You have no pending interview sessions. Roles will automatically appear here once the recruitment team links your profile to an active job.
					</p>
				</div>
			) : (
				<div className="space-y-3">
					{list.map((row: Job) => (
						<Card key={row.id}>
							<CardHeader className="pb-2">
								<div className="flex flex-wrap items-start justify-between gap-3">
									<div>
										<CardTitle className="text-lg">{row.title}</CardTitle>
										<p className="mt-1 text-sm text-muted-foreground">
											{row.job_title}
										</p>
									</div>
									<Badge className={cn(getStatusColor(row.status))}>
										{row.status}
									</Badge>
								</div>
							</CardHeader>
							<CardContent className="flex flex-wrap items-center gap-4 border-t pt-4 text-sm text-muted-foreground">
								<span className="inline-flex items-center gap-1">
									<Clock className="h-3.5 w-3.5" />
									{row.duration_minutes} min
								</span>
								<span className="inline-flex items-center gap-1">
									<Calendar className="h-3.5 w-3.5" />
									Updated {new Date(row.updated_at).toLocaleDateString()}
								</span>
								<Button
									variant="secondary"
									size="sm"
									className="ml-auto"
									asChild
								>
									<Link
										to="/jobs/$id"
										params={{ id: row.id }}
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
