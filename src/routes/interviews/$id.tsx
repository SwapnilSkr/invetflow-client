import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
	ArrowLeft,
	Calendar,
	Clock,
	Copy,
	LinkIcon,
	Play,
	Users,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { Separator } from "#/components/ui/separator";
import { Skeleton } from "#/components/ui/skeleton";
import { interviewQueries, useJoinInterview } from "#/integrations/api/queries";
import { getStatusColor } from "#/lib/utils";

export const Route = createFileRoute("/interviews/$id")({
	component: InterviewDetailPage,
});

function InterviewDetailPage() {
	const { id } = Route.useParams();
	const navigate = useNavigate();
	const {
		data: interview,
		isLoading,
		error,
	} = useQuery(interviewQueries.detail(id));
	const joinInterview = useJoinInterview();
	const [joining, setJoining] = useState(false);
	const [copied, setCopied] = useState(false);

	const handleJoin = async () => {
		setJoining(true);
		try {
			const result = await joinInterview.mutateAsync(id);
			navigate({
				to: "/interviews/$id/session",
				params: { id },
				search: {
					sessionId: result.session_id,
					token: result.livekit_token,
					url: result.livekit_url,
				},
			});
		} catch (err) {
			console.error("Failed to join:", err);
		} finally {
			setJoining(false);
		}
	};

	const copyInviteLink = async () => {
		if (interview?.invite_link) {
			await navigator.clipboard.writeText(interview.invite_link);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	if (isLoading) {
		return (
			<div className="container mx-auto px-4 py-8">
				<Skeleton className="mb-6 h-5 w-32" />
				<Skeleton className="mb-2 h-9 w-64" />
				<Skeleton className="mb-8 h-5 w-48" />
				<Skeleton className="h-64 w-full" />
			</div>
		);
	}

	if (error || !interview) {
		return (
			<div className="flex flex-col items-center justify-center py-20">
				<p className="text-lg font-medium text-destructive">
					Interview not found
				</p>
				<p className="mt-2 text-sm text-muted-foreground">
					This interview may have been deleted or you don&rsquo;t have access.
				</p>
				<Button variant="outline" className="mt-4" asChild>
					<Link to="/interviews">Back to interviews</Link>
				</Button>
			</div>
		);
	}

	const canJoin =
		interview.status === "Scheduled" || interview.status === "Draft";

	return (
		<div className="container mx-auto px-4 py-8">
			{/* Breadcrumb */}
			<div className="mb-6">
				<Button variant="ghost" size="sm" asChild>
					<Link to="/interviews">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to interviews
					</Link>
				</Button>
			</div>

			{/* Header */}
			<div className="mb-6 flex items-start justify-between">
				<div>
					<div className="flex items-center gap-3">
						<h1 className="text-2xl font-bold">{interview.title}</h1>
						<Badge className={getStatusColor(interview.status)}>
							{interview.status}
						</Badge>
					</div>
					<p className="mt-1 text-muted-foreground">{interview.job_title}</p>
				</div>
				<div className="flex gap-2">
					{canJoin && (
						<Button onClick={handleJoin} disabled={joining}>
							<Play className="mr-2 h-4 w-4" />
							{joining ? "Joining..." : "Join Interview"}
						</Button>
					)}
				</div>
			</div>

			<div className="grid gap-6 lg:grid-cols-3">
				{/* Main Content */}
				<div className="space-y-6 lg:col-span-2">
					{/* Description */}
					{interview.job_description && (
						<Card>
							<CardHeader>
								<CardTitle className="text-base">Description</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm leading-relaxed text-muted-foreground">
									{interview.job_description}
								</p>
							</CardContent>
						</Card>
					)}

					{/* Questions */}
					<Card>
						<CardHeader>
							<CardTitle className="text-base">
								Questions ({interview.questions?.length || 0})
							</CardTitle>
						</CardHeader>
						<CardContent>
							{interview.questions && interview.questions.length > 0 ? (
								<ol className="space-y-3">
									{interview.questions.map((q, idx) => (
										<li key={q.id || idx} className="flex gap-3">
											<span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
												{idx + 1}
											</span>
											<div className="flex-1">
												<p className="text-sm font-medium">
													{q.question}
												</p>
												<div className="mt-1 flex items-center gap-2">
													<Badge variant="secondary" className="text-xs">
														{q.category}
													</Badge>
													{q.time_limit_seconds && (
														<span className="text-xs text-muted-foreground">
															{q.time_limit_seconds}s limit
														</span>
													)}
												</div>
												{q.follow_up_prompts.length > 0 && (
													<p className="mt-1 text-xs text-muted-foreground">
														{q.follow_up_prompts.length} follow-up prompts
													</p>
												)}
											</div>
										</li>
									))}
								</ol>
							) : (
								<p className="text-sm text-muted-foreground">
									No questions added yet. The AI will generate questions
									based on the job description.
								</p>
							)}
						</CardContent>
					</Card>
				</div>

				{/* Sidebar */}
				<div className="space-y-4">
					{/* Details */}
					<Card>
						<CardHeader>
							<CardTitle className="text-base">Details</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="flex items-center justify-between text-sm">
								<span className="flex items-center gap-2 text-muted-foreground">
									<Clock className="h-4 w-4" />
									Duration
								</span>
								<span className="font-medium">
									{interview.duration_minutes} min
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
							<Separator />
							<div className="flex items-center justify-between text-sm">
								<span className="flex items-center gap-2 text-muted-foreground">
									<Calendar className="h-4 w-4" />
									Created
								</span>
								<span className="font-medium">
									{new Date(interview.created_at).toLocaleDateString()}
								</span>
							</div>
						</CardContent>
					</Card>

					{/* Candidate */}
					{interview.candidate_name && (
						<Card>
							<CardHeader>
								<CardTitle className="text-base">Candidate</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex items-center gap-3">
									<div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(79,184,178,0.14)] text-[var(--lagoon-deep)]">
										<span className="text-sm font-semibold">
											{interview.candidate_name.charAt(0).toUpperCase()}
										</span>
									</div>
									<div className="min-w-0">
										<p className="truncate text-sm font-medium">
											{interview.candidate_name}
										</p>
										<p className="truncate text-xs text-muted-foreground">
											{interview.candidate_email}
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					)}

					{/* Invite Link */}
					{interview.invite_link && (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-base">
									<LinkIcon className="h-4 w-4" />
									Invite Link
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex gap-2">
									<code className="flex-1 truncate rounded-md bg-muted px-3 py-2 text-xs">
										{interview.invite_link}
									</code>
									<Button
										variant="outline"
										size="icon-sm"
										onClick={copyInviteLink}
									>
										<Copy className="h-3.5 w-3.5" />
									</Button>
								</div>
								{copied && (
									<p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
										Copied to clipboard!
									</p>
								)}
							</CardContent>
						</Card>
					)}
				</div>
			</div>
		</div>
	);
}
