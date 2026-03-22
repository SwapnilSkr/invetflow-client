import { createFileRoute } from "@tanstack/react-router";
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
import { useQuery } from "@tanstack/react-query";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";
import { interviewQueries } from "#/integrations/api/queries";
import { cn } from "#/lib/utils";

export const Route = createFileRoute("/dashboard/")({
	component: RecruiterDashboard,
});

function RecruiterDashboard() {
	const [selectedInterviewId, setSelectedInterviewId] = useState<string | null>(
		null,
	);
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

	return (
		<div className="container mx-auto py-8 px-4">
			{/* Header */}
			<div className="flex items-center justify-between mb-8">
				<div>
					<h1 className="text-3xl font-bold">Interview Dashboard</h1>
					<p className="text-muted-foreground mt-1">
						Manage and review AI-powered interviews
					</p>
				</div>
				<Button>
					<Plus className="h-4 w-4 mr-2" />
					Create Interview
				</Button>
			</div>

			{/* Stats Overview */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
				<StatCard
					title="Total Interviews"
					value={interviews?.interviews?.length || 0}
					icon={Calendar}
					loading={isLoading}
				/>
				<StatCard
					title="Active"
					value={
						interviews?.interviews?.filter((i: any) => i.status === "Active")
							.length || 0
					}
					icon={Users}
					loading={isLoading}
					color="emerald"
				/>
				<StatCard
					title="Scheduled"
					value={
						interviews?.interviews?.filter((i: any) => i.status === "Scheduled")
							.length || 0
					}
					icon={Calendar}
					loading={isLoading}
					color="amber"
				/>
				<StatCard
					title="Completed"
					value={
						interviews?.interviews?.filter((i: any) => i.status === "Completed")
							.length || 0
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
					) : (
						<InterviewList
							interviews={
								interviews?.interviews?.map((i: any) => ({
									id: i.id,
									title: i.title,
									jobTitle: i.job_title,
									status: i.status,
									candidateName: i.candidate_name,
									candidateEmail: i.candidate_email,
									duration: i.duration_minutes,
									scheduledAt: i.scheduled_at
										? new Date(i.scheduled_at)
										: undefined,
									completedAt: i.completed_at
										? new Date(i.completed_at)
										: undefined,
									score: i.score,
								})) || []
							}
							onSelect={(interview) => setSelectedInterviewId(interview.id)}
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
		amber: "bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-400",
		blue: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400",
	};

	return (
		<Card>
			<CardContent className="p-6">
				<div className="flex items-center justify-between">
					<div>
						<p className="text-sm text-muted-foreground">{title}</p>
						{loading ? (
							<Skeleton className="h-8 w-16 mt-1" />
						) : (
							<p className="text-3xl font-bold mt-1">{value}</p>
						)}
					</div>
					<div className={cn("p-3 rounded-full", colorClasses[color])}>
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
	interview: any;
	onBack: () => void;
}) {
	const mockAISummary = {
		overallScore: 8.2,
		summary:
			"Sarah demonstrated excellent technical knowledge and strong problem-solving abilities. She communicated clearly and showed enthusiasm for the role.",
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
			"Score: 8.2/10 because the candidate demonstrated deep knowledge of modern frontend development, particularly in React and state management.",
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
			content: "Strong communication throughout. Would be a good cultural fit.",
			timestamp: new Date(),
			timestamp_in_video: 892,
		},
	];

	return (
		<div className="container mx-auto py-8 px-4">
			{/* Header */}
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center gap-4">
					<Button variant="outline" size="icon" onClick={onBack}>
						<ArrowLeft className="h-4 w-4" />
					</Button>
					<div>
						<h1 className="text-2xl font-bold">{interview.title}</h1>
						<p className="text-muted-foreground">
							{interview.candidate_name} • {interview.candidate_email}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="outline">
						<Share2 className="h-4 w-4 mr-2" />
						Share
					</Button>
					<Button variant="outline">
						<Download className="h-4 w-4 mr-2" />
						Export
					</Button>
				</div>
			</div>

			{/* Main Content */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Video Player */}
				<div className="lg:col-span-2">
					<VideoPlayer
						videoUrl={interview.video_url || ""}
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
