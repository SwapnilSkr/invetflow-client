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
import { useState } from "react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { Skeleton } from "#/components/ui/skeleton";
import type { CreateInterviewRequest, Interview } from "#/integrations/api/client";
import {
	interviewQueries,
	useCreateInterview,
	useDeleteInterview,
} from "#/integrations/api/queries";
import { requireRecruiter } from "#/lib/require-role";
import { cn, getStatusColor } from "#/lib/utils";

export const Route = createFileRoute("/interviews/")({
	beforeLoad: requireRecruiter,
	component: InterviewsPage,
});

function InterviewsPage() {
	const [showCreate, setShowCreate] = useState(false);
	const { data, isLoading, error } = useQuery(interviewQueries.list());
	const createInterview = useCreateInterview();
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
				<Button onClick={() => setShowCreate(true)}>
					<Plus className="mr-2 h-4 w-4" />
					Create Interview
				</Button>
			</div>

			{showCreate && (
				<CreateInterviewForm
					onClose={() => setShowCreate(false)}
					onSubmit={async (formData) => {
						await createInterview.mutateAsync(formData);
						setShowCreate(false);
					}}
				/>
			)}

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
							<Button className="mt-4" onClick={() => setShowCreate(true)}>
								<Plus className="mr-2 h-4 w-4" />
								Create Interview
							</Button>
						</CardContent>
					</Card>
				) : (
					data?.interviews?.map((interview: Interview) => (
						<InterviewCard
							key={interview.id}
							interview={interview}
							onDelete={(id) => {
								if (confirm("Are you sure you want to delete this interview?")) {
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
							<Badge className={cn("flex-shrink-0", getStatusColor(interview.status))}>
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

function CreateInterviewForm({
	onClose,
	onSubmit,
}: {
	onClose: () => void;
	onSubmit: (data: CreateInterviewRequest) => Promise<void>;
}) {
	const [title, setTitle] = useState("");
	const [jobTitle, setJobTitle] = useState("");
	const [duration, setDuration] = useState(30);
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		try {
			await onSubmit({
				title,
				job_title: jobTitle,
				duration_minutes: duration,
				questions: [],
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
			<Card className="w-full max-w-md">
				<CardContent className="p-6">
					<h2 className="mb-4 text-lg font-semibold">Create Interview</h2>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="grid gap-2">
							<label className="text-sm font-medium">Title</label>
							<Input
								type="text"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder="e.g. Senior Frontend Developer"
								required
							/>
						</div>
						<div className="grid gap-2">
							<label className="text-sm font-medium">Job Title</label>
							<Input
								type="text"
								value={jobTitle}
								onChange={(e) => setJobTitle(e.target.value)}
								placeholder="e.g. React Engineer"
								required
							/>
						</div>
						<div className="grid gap-2">
							<label className="text-sm font-medium">
								Duration (minutes)
							</label>
							<Input
								type="number"
								value={duration}
								onChange={(e) =>
									setDuration(parseInt(e.target.value) || 30)
								}
								min={5}
								max={180}
							/>
						</div>
						<div className="flex gap-3 pt-2">
							<Button
								type="button"
								variant="outline"
								className="flex-1"
								onClick={onClose}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={loading}
								className="flex-1"
							>
								{loading ? "Creating..." : "Create"}
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
