import {
	AlertCircle,
	BarChart3,
	Calendar,
	Clock,
	ExternalLink,
	Users,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import { Progress } from "#/components/ui/progress";
import { cn, formatDuration, getStatusColor } from "#/lib/utils";

interface Interview {
	id: string;
	title: string;
	jobTitle: string;
	status: "Scheduled" | "Active" | "Completed" | "Cancelled";
	candidateName?: string;
	candidateEmail?: string;
	duration: number;
	scheduledAt?: Date;
	completedAt?: Date;
	score?: number;
	totalCandidates?: number;
	completedCandidates?: number;
}

interface InterviewListProps {
	interviews: Interview[];
	onSelect: (interview: Interview) => void;
	onDelete?: (id: string) => void;
}

export function InterviewList({
	interviews,
	onSelect,
	onDelete,
}: InterviewListProps) {
	return (
		<div className="space-y-3">
			{interviews.map((interview) => (
				<InterviewCard
					key={interview.id}
					interview={interview}
					onSelect={() => onSelect(interview)}
					onDelete={onDelete}
				/>
			))}
		</div>
	);
}

function InterviewCard({
	interview,
	onSelect,
	onDelete,
}: {
	interview: Interview;
	onSelect: () => void;
	onDelete?: (id: string) => void;
}) {
	const isCompleted = interview.status === "Completed";
	const isActive = interview.status === "Active";

	return (
		<Card
			className={cn(
				"cursor-pointer transition-all hover:shadow-md",
				isActive && "ring-2 ring-blue-500/20",
			)}
			onClick={onSelect}
		>
			<CardContent className="p-4">
				<div className="flex items-start gap-4">
					{/* Status Indicator */}
					<div className="flex-shrink-0">
						<div
							className={cn(
								"w-3 h-3 rounded-full",
								isActive
									? "bg-blue-500 animate-pulse"
									: isCompleted
										? "bg-zinc-400"
										: interview.status === "Scheduled"
											? "bg-amber-500"
											: "bg-red-500",
							)}
						/>
					</div>

					{/* Main Content */}
					<div className="flex-1 min-w-0">
						<div className="flex items-start justify-between gap-2">
							<div>
								<h3 className="font-semibold text-lg truncate">
									{interview.title}
								</h3>
								<p className="text-sm text-muted-foreground">
									{interview.jobTitle}
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

						{/* Interview Details */}
						<div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
							<div className="flex items-center gap-1">
								<Clock className="h-4 w-4" />
								<span>{formatDuration(interview.duration)}</span>
							</div>

							{interview.scheduledAt && (
								<div className="flex items-center gap-1">
									<Calendar className="h-4 w-4" />
									<span>{interview.scheduledAt.toLocaleDateString()}</span>
								</div>
							)}

							{interview.totalCandidates !== undefined && (
								<div className="flex items-center gap-1">
									<Users className="h-4 w-4" />
									<span>
										{interview.completedCandidates || 0}/
										{interview.totalCandidates} completed
									</span>
								</div>
							)}
						</div>

						{/* Candidate Info */}
						{interview.candidateName && (
							<div className="flex items-center gap-2 mt-3 pt-3 border-t">
								<Avatar className="h-8 w-8">
									<AvatarImage src={undefined} alt={interview.candidateName} />
									<AvatarFallback>
										{interview.candidateName.charAt(0)}
									</AvatarFallback>
								</Avatar>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium truncate">
										{interview.candidateName}
									</p>
									<p className="text-xs text-muted-foreground truncate">
										{interview.candidateEmail}
									</p>
								</div>

								{/* Score */}
								{interview.score !== undefined && (
									<div className="flex items-center gap-2">
										<div
											className={cn(
												"flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium",
												interview.score >= 8
													? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
													: interview.score >= 6
														? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
														: interview.score >= 4
															? "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
															: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
											)}
										>
											<BarChart3 className="h-4 w-4" />
											{interview.score.toFixed(1)}/10
										</div>
									</div>
								)}
							</div>
						)}

						{/* Progress Bar for Group Interviews */}
						{interview.totalCandidates && interview.totalCandidates > 1 && (
							<div className="mt-3 pt-3 border-t">
								<div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
									<span>Completion Progress</span>
									<span>
										{Math.round(
											((interview.completedCandidates || 0) /
												interview.totalCandidates) *
												100,
										)}
										%
									</span>
								</div>
								<Progress
									value={
										((interview.completedCandidates || 0) /
											interview.totalCandidates) *
										100
									}
									className="h-2"
								/>
							</div>
						)}
					</div>

					{/* Actions */}
					<div className="flex flex-col gap-2">
						<Button variant="ghost" size="icon" className="h-8 w-8">
							<ExternalLink className="h-4 w-4" />
						</Button>
						{onDelete && (
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 text-red-500 hover:text-red-600"
								onClick={(e) => {
									e.stopPropagation();
									onDelete(interview.id);
								}}
							>
								<AlertCircle className="h-4 w-4" />
							</Button>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
