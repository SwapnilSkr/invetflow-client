import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Clock, HelpCircle, Mic, Users, Video } from "lucide-react";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Separator } from "#/components/ui/separator";
import { Skeleton } from "#/components/ui/skeleton";
import { interviewQueries, useJoinInterview } from "#/integrations/api/queries";

export const Route = createFileRoute("/interview/join/$token")({
	component: JoinByTokenPage,
});

function JoinByTokenPage() {
	const { token } = Route.useParams();
	const navigate = useNavigate();
	const {
		data: interview,
		isLoading,
		error,
	} = useQuery(interviewQueries.byToken(token));
	const joinInterview = useJoinInterview();
	const [joining, setJoining] = useState(false);
	const [joinError, setJoinError] = useState<string | null>(null);

	const handleJoin = async () => {
		if (!interview) return;
		setJoining(true);
		setJoinError(null);
		try {
			const result = await joinInterview.mutateAsync(interview.id);
			navigate({
				to: "/interviews/$id/session",
				params: { id: interview.id },
				search: {
					sessionId: result.session_id,
					token: result.livekit_token,
					url: result.livekit_url,
				},
			});
		} catch (err) {
			setJoinError(
				err instanceof Error ? err.message : "Failed to join interview",
			);
		} finally {
			setJoining(false);
		}
	};

	if (isLoading) {
		return (
			<main className="page-wrap flex justify-center px-4 py-16">
				<Card className="w-full max-w-lg">
					<CardContent className="space-y-4 p-8">
						<Skeleton className="mx-auto h-8 w-48" />
						<Skeleton className="mx-auto h-5 w-32" />
						<Skeleton className="h-24 w-full" />
						<Skeleton className="h-12 w-full" />
					</CardContent>
				</Card>
			</main>
		);
	}

	if (error || !interview) {
		return (
			<main className="page-wrap flex justify-center px-4 py-16">
				<Card className="w-full max-w-lg">
					<CardContent className="py-16 text-center">
						<div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20">
							<HelpCircle className="h-7 w-7 text-red-500" />
						</div>
						<p className="text-lg font-medium text-destructive">
							Interview not found
						</p>
						<p className="mt-2 text-sm text-muted-foreground">
							This invite link may have expired or is invalid.
						</p>
					</CardContent>
				</Card>
			</main>
		);
	}

	const isJoinable =
		interview.status !== "Completed" && interview.status !== "Cancelled";

	return (
		<main className="page-wrap flex justify-center px-4 py-16">
			<Card className="w-full max-w-lg">
				<CardHeader className="text-center">
					<div className="mx-auto mb-2 flex items-center gap-2">
						<span className="h-2 w-2 rounded-full bg-[linear-gradient(90deg,#56c6be,#7ed3bf)]" />
						<span className="text-sm font-semibold text-[var(--sea-ink)]">
							InvetFlow
						</span>
					</div>
					<CardTitle className="text-xl">{interview.title}</CardTitle>
					<p className="text-muted-foreground">{interview.job_title}</p>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Interview Details */}
					<div className="space-y-3 rounded-lg bg-muted/50 p-4">
						<div className="flex items-center justify-between text-sm">
							<span className="flex items-center gap-2 text-muted-foreground">
								<Clock className="h-4 w-4" />
								Duration
							</span>
							<span className="font-medium">
								{interview.duration_minutes} minutes
							</span>
						</div>
						<Separator />
						<div className="flex items-center justify-between text-sm">
							<span className="flex items-center gap-2 text-muted-foreground">
								<Users className="h-4 w-4" />
								Questions
							</span>
							<span className="font-medium">
								{interview.questions?.length || 0}
							</span>
						</div>
					</div>

					{/* Requirements */}
					<div className="space-y-2">
						<p className="text-sm font-medium">Before you begin</p>
						<div className="grid grid-cols-2 gap-2">
							<div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
								<Video className="h-4 w-4 text-emerald-500" />
								Working camera
							</div>
							<div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
								<Mic className="h-4 w-4 text-emerald-500" />
								Working microphone
							</div>
						</div>
					</div>

					{joinError && (
						<div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
							<p className="text-sm text-red-600 dark:text-red-400">
								{joinError}
							</p>
						</div>
					)}

					<Button
						className="w-full"
						size="lg"
						onClick={handleJoin}
						disabled={joining || !isJoinable}
					>
						{joining ? (
							<span className="flex items-center gap-2">
								<span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
								Joining...
							</span>
						) : !isJoinable ? (
							"Interview unavailable"
						) : (
							"Join Interview"
						)}
					</Button>

					<p className="text-center text-xs text-muted-foreground">
						You&rsquo;ll go through a quick tech check before the interview
						starts.
					</p>
				</CardContent>
			</Card>
		</main>
	);
}
