import { useQuery } from "@tanstack/react-query";
import {
	createFileRoute,
	Link,
	Outlet,
	useNavigate,
	useRouterState,
} from "@tanstack/react-router";
import {
	ArrowLeft,
	Calendar,
	Clock,
	Copy,
	Globe2,
	History,
	Link as LinkIcon,
	Play,
	UserPlus,
	Users,
} from "lucide-react";
import { useId, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { Separator } from "#/components/ui/separator";
import { Skeleton } from "#/components/ui/skeleton";
import { ApiError } from "#/integrations/api/errors";
import { useAuth } from "#/integrations/api/hooks";
import {
	jobQueries,
	useAssignCandidate,
	useJoinJob,
	useScheduleJob,
	useUpdateJob,
} from "#/integrations/api/queries";
import { requireSession } from "#/lib/require-role";
import { getStatusColor } from "#/lib/utils";

export const Route = createFileRoute("/jobs/$id")({
	beforeLoad: requireSession,
	component: InterviewIdRoute,
});

function InterviewIdRoute() {
	const isSessionChild = useRouterState({
		select: (s) => s.location.pathname.endsWith("/session"),
	});
	if (isSessionChild) {
		return <Outlet />;
	}
	return <InterviewDetailPage />;
}

function InterviewDetailPage() {
	const { id } = Route.useParams();
	const { user } = useAuth();
	const isRecruiter = user?.role === "Recruiter";
	const navigate = useNavigate();
	const { data: job, isLoading, error } = useQuery(jobQueries.detail(id));
	const { data: interviewList } = useQuery({
		...jobQueries.jobInterviews(id),
		enabled: Boolean(
			user?.role === "Recruiter" && job && user.id === job.recruiter_id,
		),
	});
	const joinJob = useJoinJob();
	const assignCandidate = useAssignCandidate();
	const scheduleJob = useScheduleJob();
	const updateJob = useUpdateJob();
	const [joining, setJoining] = useState(false);
	const [copied, setCopied] = useState(false);
	const [joinError, setJoinError] = useState<string | null>(null);
	const [assignName, setAssignName] = useState("");
	const [assignEmail, setAssignEmail] = useState("");
	const assignNameId = useId();
	const assignEmailId = useId();

	const handleJoin = async () => {
		setJoinError(null);
		setJoining(true);
		try {
			const result = await joinJob.mutateAsync(id);
			navigate({
				to: "/jobs/$id/session",
				params: { id },
				search: {
					sessionId: result.interview_id,
					token: result.livekit_token,
					url: result.livekit_url,
				},
			});
		} catch (err) {
			const msg =
				err instanceof ApiError
					? err.message
					: "Could not start the session. The interview may need to be scheduled, or you may need to be the assignee (unless it is open to any signed-in user).";
			setJoinError(msg);
		} finally {
			setJoining(false);
		}
	};

	const copyInviteLink = async () => {
		if (!job?.invite_link) {
			return;
		}
		const link = job.invite_link.startsWith("http")
			? job.invite_link
			: `${window.location.origin}${job.invite_link.startsWith("/") ? "" : "/"}${job.invite_link}`;
		await navigator.clipboard.writeText(link);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	if (isLoading) {
		return (
			<div className="container mx-auto max-w-5xl">
				<Skeleton className="mb-6 h-5 w-32" />
				<Skeleton className="mb-2 h-9 w-64" />
				<Skeleton className="mb-8 h-5 w-48" />
				<Skeleton className="h-64 w-full" />
			</div>
		);
	}

	if (error || !job) {
		return (
			<div className="flex flex-col items-center justify-center py-20">
				<p className="text-lg font-medium text-destructive">Job not found</p>
				<p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
					This job may have been removed or you don&rsquo;t have access to it.
				</p>
				<Button variant="outline" className="mt-4" asChild>
					<Link to={isRecruiter ? "/dashboard" : "/candidate"}>Back</Link>
				</Button>
			</div>
		);
	}

	const isOwner = user?.id === job.recruiter_id;

	const isScheduledOrActive =
		job.status === "Scheduled" || job.status === "Active";
	const showJoinButton =
		(user?.role === "Candidate" && isScheduledOrActive) ||
		(user?.role === "Recruiter" &&
			isOwner &&
			(job.status === "Draft" || isScheduledOrActive)) ||
		(user?.role === "Recruiter" &&
			!isOwner &&
			job.is_public &&
			isScheduledOrActive);

	return (
		<div className="container mx-auto max-w-5xl">
			<div className="mb-6">
				<Button variant="ghost" size="sm" asChild>
					<Link to={isRecruiter ? "/jobs" : "/candidate"}>
						<ArrowLeft className="mr-2 h-4 w-4" />
						{isRecruiter ? "All jobs" : "My jobs"}
					</Link>
				</Button>
			</div>

			<div className="mb-6 flex flex-wrap items-start justify-between gap-4">
				<div>
					<div className="flex flex-wrap items-center gap-3">
						<h1 className="text-2xl font-bold tracking-tight">{job.title}</h1>
						<Badge className={getStatusColor(job.status)}>{job.status}</Badge>
					</div>
					<p className="mt-1 text-muted-foreground">{job.job_title}</p>
				</div>
				{showJoinButton ? (
					<Button onClick={handleJoin} disabled={joining}>
						<Play className="mr-2 h-4 w-4" />
						{joining ? "Joining…" : "Join interview room"}
					</Button>
				) : null}
			</div>

			{joinError ? (
				<Alert variant="destructive" className="mb-6">
					<AlertTitle>Could not join</AlertTitle>
					<AlertDescription>{joinError}</AlertDescription>
				</Alert>
			) : null}

			{!isRecruiter && isScheduledOrActive ? (
				<Alert className="mb-6">
					<AlertTitle>More than one visit is OK</AlertTitle>
					<AlertDescription>
						Joining resumes your unfinished <strong>answer session</strong>.
						After you end it, joining again starts a fresh session. Finishing a
						session does not close the job on its own—the hiring team ends the
						role when they are done.
					</AlertDescription>
				</Alert>
			) : null}

			{!isRecruiter && !isScheduledOrActive && job.status === "Draft" ? (
				<Alert className="mb-6">
					<AlertTitle>Not ready yet</AlertTitle>
					<AlertDescription>
						The hiring team has not finished scheduling. After it moves to
						scheduled, you can join if you are the assignee, or if this
						interview is open to any signed-in user.
					</AlertDescription>
				</Alert>
			) : null}

			<div className="grid gap-6 lg:grid-cols-3">
				<div className="space-y-6 lg:col-span-2">
					{job.job_description ? (
						<Card>
							<CardHeader>
								<CardTitle className="text-base">Description</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm leading-relaxed text-muted-foreground">
									{job.job_description}
								</p>
							</CardContent>
						</Card>
					) : null}

					<Card>
						<CardHeader>
							<CardTitle className="text-base">
								Question plan ({job.questions?.length ?? 0})
							</CardTitle>
						</CardHeader>
						<CardContent>
							{job.questions && job.questions.length > 0 ? (
								<ol className="space-y-3">
									{job.questions.map((q, idx) => (
										<li key={q.id || idx} className="flex gap-3">
											<span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
												{idx + 1}
											</span>
											<div className="min-w-0 flex-1">
												<p className="text-sm font-medium">{q.question}</p>
												<div className="mt-1 flex flex-wrap items-center gap-2">
													<Badge variant="secondary" className="text-xs">
														{q.category}
													</Badge>
													{q.time_limit_seconds ? (
														<span className="text-xs text-muted-foreground">
															{q.time_limit_seconds}s cap
														</span>
													) : null}
												</div>
											</div>
										</li>
									))}
								</ol>
							) : (
								<p className="text-sm text-muted-foreground">
									Add questions from the list view when that editor is
									available, or the session may use a generated plan.
								</p>
							)}
						</CardContent>
					</Card>
				</div>

				<div className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle className="text-base">Details</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3 text-sm">
							<div className="flex justify-between gap-2">
								<span className="text-muted-foreground flex items-center gap-2">
									<Clock className="h-4 w-4 shrink-0" />
									Duration
								</span>
								<span className="font-medium">{job.duration_minutes} min</span>
							</div>
							<Separator />
							<div className="flex justify-between gap-2">
								<span className="text-muted-foreground flex items-center gap-2">
									<Calendar className="h-4 w-4 shrink-0" />
									Created
								</span>
								<span className="font-medium">
									{new Date(job.created_at).toLocaleString()}
								</span>
							</div>
						</CardContent>
					</Card>

					{isRecruiter && isOwner ? (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-base">
									<History className="h-4 w-4" />
									Interviews
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="mb-3 text-sm text-muted-foreground">
									Joining resumes an unfinished interview for that candidate.
									Ending a call finishes that interview; the next join can start
									a new one while the job is
									<strong> scheduled or active</strong> (until you mark the role
									complete or cancelled below).
								</p>
								{interviewList?.interviews &&
								interviewList.interviews.length > 0 ? (
									<ul className="max-h-48 space-y-2 overflow-y-auto text-sm">
										{interviewList.interviews.map((s) => (
											<li
												key={s.id}
												className="flex flex-col gap-1 border-b border-border py-2 last:border-0 sm:flex-row sm:items-center sm:justify-between"
											>
												<Badge variant="secondary">{s.status}</Badge>
												<span className="text-xs text-muted-foreground tabular-nums">
													{new Date(s.started_at).toLocaleString()} ·{" "}
													{s.duration_seconds}s
												</span>
											</li>
										))}
									</ul>
								) : (
									<p className="text-sm text-muted-foreground">
										No interviews recorded yet.
									</p>
								)}
							</CardContent>
						</Card>
					) : null}

					{isRecruiter &&
					isOwner &&
					job.status !== "Completed" &&
					job.status !== "Cancelled" ? (
						<Card>
							<CardHeader>
								<CardTitle className="text-base">Hiring status</CardTitle>
							</CardHeader>
							<CardContent className="space-y-2">
								<p className="text-sm text-muted-foreground">
									When you are done with hiring for this posting, mark it
									complete (filled) or cancelled. That stops new answer sessions
									for this job.
								</p>
								<Button
									variant="secondary"
									className="w-full"
									disabled={updateJob.isPending}
									onClick={() => {
										if (
											!window.confirm(
												"Mark this job as filled? New answer sessions can no longer be started.",
											)
										) {
											return;
										}
										void updateJob.mutateAsync({
											id,
											data: { status: "Completed" },
										});
									}}
								>
									Mark position filled
								</Button>
								<Button
									variant="outline"
									className="w-full"
									disabled={updateJob.isPending}
									onClick={() => {
										if (
											!window.confirm(
												"Cancel this job posting? New answer sessions can no longer be started.",
											)
										) {
											return;
										}
										void updateJob.mutateAsync({
											id,
											data: { status: "Cancelled" },
										});
									}}
								>
									Cancel job posting
								</Button>
							</CardContent>
						</Card>
					) : null}

					{isRecruiter &&
					isOwner &&
					job.status !== "Completed" &&
					job.status !== "Cancelled" ? (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-base">
									<Globe2 className="h-4 w-4" />
									Access
								</CardTitle>
							</CardHeader>
							<CardContent>
								<label className="flex cursor-pointer items-start gap-3">
									<input
										type="checkbox"
										className="mt-1 size-4 rounded border-input"
										checked={job.is_public}
										onChange={(e) => {
											void updateJob.mutateAsync({
												id,
												data: { is_public: e.target.checked },
											});
										}}
										disabled={updateJob.isPending}
									/>
									<span>
										<span className="font-medium">
											Open to any signed-in user
										</span>
										<p className="text-sm text-muted-foreground">
											When scheduled, anyone with an account can join (not only
											the named assignee). Admins still cannot join as the
											candidate.
										</p>
									</span>
								</label>
							</CardContent>
						</Card>
					) : null}

					{isRecruiter && job.status === "Draft" ? (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-base">
									<UserPlus className="h-4 w-4" />
									Assign candidate
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								<p className="text-sm text-muted-foreground">
									Required before anyone can join. The account email must match
									an existing or future candidate signup.
								</p>
								<div className="space-y-2">
									<label className="text-sm font-medium" htmlFor={assignNameId}>
										Candidate name
									</label>
									<Input
										id={assignNameId}
										value={assignName}
										onChange={(e) => setAssignName(e.target.value)}
										placeholder="Alex Rivera"
									/>
								</div>
								<div className="space-y-2">
									<label
										className="text-sm font-medium"
										htmlFor={assignEmailId}
									>
										Candidate email
									</label>
									<Input
										id={assignEmailId}
										type="email"
										value={assignEmail}
										onChange={(e) => setAssignEmail(e.target.value)}
										placeholder="alex@company.com"
									/>
								</div>
								<Button
									className="w-full"
									disabled={
										!assignName.trim() ||
										!assignEmail.trim() ||
										assignCandidate.isPending
									}
									onClick={async () => {
										try {
											await assignCandidate.mutateAsync({
												id,
												data: {
													candidate_name: assignName.trim(),
													candidate_email: assignEmail.trim(),
												},
											});
											setAssignName("");
											setAssignEmail("");
										} catch {}
									}}
								>
									{assignCandidate.isPending ? "Saving…" : "Assign & schedule"}
								</Button>
								{assignCandidate.isError && assignCandidate.error ? (
									<p className="text-sm text-destructive" role="alert">
										{assignCandidate.error instanceof Error
											? assignCandidate.error.message
											: "Could not assign candidate."}
									</p>
								) : null}
							</CardContent>
						</Card>
					) : null}

					{isRecruiter && job.candidate_email && job.status === "Draft" ? (
						<Card>
							<CardContent className="pt-6">
								<Button
									variant="secondary"
									className="w-full"
									disabled={scheduleJob.isPending}
									onClick={async () => {
										try {
											await scheduleJob.mutateAsync(id);
										} catch {}
									}}
								>
									{scheduleJob.isPending ? "Scheduling…" : "Schedule interview"}
								</Button>
								<p className="mt-2 text-center text-xs text-muted-foreground">
									Use if the role stayed in Draft after data import.
								</p>
							</CardContent>
						</Card>
					) : null}

					{job.candidate_name || job.candidate_email ? (
						<Card>
							<CardHeader>
								<CardTitle className="text-base">Candidate</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex items-center gap-3">
									<div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200">
										<Users className="h-5 w-5" />
									</div>
									<div className="min-w-0">
										<p className="truncate text-sm font-medium">
											{job.candidate_name ?? "—"}
										</p>
										<p className="truncate text-xs text-muted-foreground">
											{job.candidate_email ?? ""}
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					) : null}

					{isRecruiter && job.invite_link ? (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-base">
									<LinkIcon className="h-4 w-4" />
									Candidate invite
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="mb-3 text-sm text-muted-foreground">
									{job.is_public
										? "Anyone signed in can use this link once the interview is scheduled (or use the interview from their account). "
										: "Share with the assignee. They sign in, then open this link. "}
									Candidate accounts work best for the interview experience.
								</p>
								<div className="flex gap-2">
									<code className="min-w-0 flex-1 truncate rounded-md bg-muted px-3 py-2 text-xs">
										{job.invite_link}
									</code>
									<Button
										variant="outline"
										size="icon"
										type="button"
										onClick={copyInviteLink}
									>
										<Copy className="h-3.5 w-3.5" />
									</Button>
								</div>
								{copied ? (
									<p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
										Copied to clipboard.
									</p>
								) : null}
							</CardContent>
						</Card>
					) : null}
				</div>
			</div>
		</div>
	);
}
