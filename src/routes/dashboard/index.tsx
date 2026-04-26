import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowLeft,
	BarChart3,
	Calendar,
	Download,
	Plus,
	Share2,
	Users,
} from "lucide-react";
import { useState } from "react";
import { AISummary } from "#/components/recruiter/AISummary";
import { InterviewList } from "#/components/recruiter/InterviewList";
import { VideoPlayer } from "#/components/recruiter/VideoPlayer";
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
import { requireSession } from "#/lib/require-session";
import { cn } from "#/lib/utils";

export const Route = createFileRoute("/dashboard/")({
	beforeLoad: requireSession,
	component: RecruiterDashboard,
});

function RecruiterDashboard() {
	const [selectedInterviewId, setSelectedInterviewId] = useState<
		string | null
	>(null);
	const { data: interviews, isLoading } = useQuery(interviewQueries.list());
	const { data: selectedInterview } = useQuery({
		...interviewQueries.detail(selectedInterviewId || ""),
		enabled: !!selectedInterviewId,
	});

	if (selectedInterviewId && selectedInterview) {
		return (
			<InterviewDetailView
				interview={selectedInterview}
				onBack={() => setSelectedInterviewId(null)}
			/>
		);
	}

	const interviewsList = interviews?.interviews ?? [];

	return (
		<div className="container mx-auto px-4 py-8">
			{/* Header */}
			<div className="mb-8 flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">Interview Dashboard</h1>
					<p className="mt-1 text-muted-foreground">
						Manage and review AI-powered interviews
					</p>
				</div>
				<Button asChild>
					<Link to="/interviews">
						<Plus className="mr-2 h-4 w-4" />
						Create Interview
					</Link>
				</Button>
			</div>

			{/* Stats Overview */}
			<div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
				<StatCard
					title="Total Interviews"
					value={interviewsList.length}
					icon={Calendar}
					loading={isLoading}
				/>
				<StatCard
					title="Active"
					value={
						interviewsList.filter(
							(i: Interview) => i.status === "Active",
						).length
					}
					icon={Users}
					loading={isLoading}
					color="emerald"
				/>
				<StatCard
					title="Scheduled"
					value={
						interviewsList.filter(
							(i: Interview) => i.status === "Scheduled",
						).length
					}
					icon={Calendar}
					loading={isLoading}
					color="amber"
				/>
				<StatCard
					title="Completed"
					value={
						interviewsList.filter(
							(i: Interview) => i.status === "Completed",
						).length
					}
					icon={BarChart3}
					loading={isLoading}
					color="blue"
				/>
			</div>

			{/* Interview List */}
			<Card>
				<CardHeader>
					<CardTitle>All Interviews</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="space-y-4">
							<Skeleton key="skeleton-1" className="h-24 w-full" />
							<Skeleton key="skeleton-2" className="h-24 w-full" />
							<Skeleton key="skeleton-3" className="h-24 w-full" />
						</div>
					) : interviewsList.length === 0 ? (
						<div className="py-12 text-center">
							<div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
								<Calendar className="h-7 w-7 text-muted-foreground" />
							</div>
							<p className="font-medium">No interviews yet</p>
							<p className="mt-1 text-sm text-muted-foreground">
								Create your first interview to see it here.
							</p>
							<Button className="mt-4" asChild>
								<Link to="/interviews">
									<Plus className="mr-2 h-4 w-4" />
									Create Interview
								</Link>
							</Button>
						</div>
					) : (
						<InterviewList
							interviews={interviewsList.map((i: Interview) => ({
								id: i.id,
								title: i.title,
								jobTitle: i.job_title,
								status: i.status as
									| "Scheduled"
									| "Active"
									| "Completed"
									| "Cancelled",
								candidateName: i.candidate_name ?? undefined,
								candidateEmail: i.candidate_email ?? undefined,
								duration: i.duration_minutes,
								scheduledAt: undefined,
								completedAt: undefined,
								score: undefined,
							}))}
							onSelect={(interview) =>
								setSelectedInterviewId(interview.id)
							}
						/>
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
	color?: "zinc" | "emerald" | "amber" | "blue";
}) {
	const colorClasses = {
		zinc: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
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
							<p className="mt-1 text-3xl font-bold">{value}</p>
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

function InterviewDetailView({
	interview,
	onBack,
}: {
	interview: Interview;
	onBack: () => void;
}) {
	// Try to load real scores if a session exists
	// For now we use mock data as a fallback since sessions aren't linked 1:1 from interviews yet
	const mockAISummary = {
		overallScore: 8.2,
		summary:
			"Strong technical knowledge and clear communication. Demonstrated deep understanding of frontend architecture and state management patterns.",
		strengths: [
			"Deep understanding of React and modern frontend patterns",
			"Strong experience with microservices architecture",
			"Excellent communication skills",
		],
		weaknesses: [
			"Limited experience with TypeScript strict mode",
			"Could benefit from more leadership experience",
		],
		redFlags: [],
		skillScores: {
			technical: 8.5,
			communication: 9.0,
			problemSolving: 8.0,
			culturalFit: 8.5,
		},
		reasoning:
			"Score: 8.2/10 because the candidate demonstrated deep knowledge of modern frontend development, particularly in React and state management. Strong communication throughout.",
		recommendation: "strong_hire" as const,
	};

	const mockComments = [
		{
			id: "1",
			author: "John Smith",
			authorRole: "Senior Recruiter",
			content:
				"Great answer on the system design question. Shows deep understanding of distributed systems.",
			timestamp: new Date(),
			timestamp_in_video: 245,
		},
		{
			id: "2",
			author: "Jane Doe",
			authorRole: "Tech Lead",
			content:
				"Strong communication throughout. Would be a good cultural fit.",
			timestamp: new Date(),
			timestamp_in_video: 892,
		},
	];

	return (
		<div className="container mx-auto px-4 py-8">
			{/* Header */}
			<div className="mb-6 flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button variant="outline" size="icon" onClick={onBack}>
						<ArrowLeft className="h-4 w-4" />
					</Button>
					<div>
						<h1 className="text-2xl font-bold">{interview.title}</h1>
						<p className="text-muted-foreground">
							{interview.candidate_name ?? "No candidate"}{" "}
							{interview.candidate_email
								? `\u00b7 ${interview.candidate_email}`
								: ""}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="outline">
						<Share2 className="mr-2 h-4 w-4" />
						Share
					</Button>
					<Button variant="outline">
						<Download className="mr-2 h-4 w-4" />
						Export
					</Button>
				</div>
			</div>

			{/* Main Content */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				{/* Video Player */}
				<div className="lg:col-span-2">
					<VideoPlayer
						videoUrl=""
						title="Interview Recording"
						duration={interview.duration_minutes * 60}
						comments={mockComments}
						highlights={[120, 245, 560, 892]}
					/>
				</div>

				{/* AI Summary */}
				<div>
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<BarChart3 className="h-5 w-5" />
								AI Analysis
							</CardTitle>
						</CardHeader>
						<CardContent>
							<AISummary {...mockAISummary} />
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
