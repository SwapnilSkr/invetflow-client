import {
	AlertTriangle,
	Brain,
	Code,
	Lightbulb,
	MessageSquare,
	Target,
	ThumbsDown,
	ThumbsUp,
	Users,
} from "lucide-react";
import type React from "react";
import { Badge } from "#/components/ui/badge";
import { Card, CardContent } from "#/components/ui/card";
import { Progress } from "#/components/ui/progress";
import { Separator } from "#/components/ui/separator";
import { cn, getScoreBgColor, getScoreColor } from "#/lib/utils";

interface AISummaryProps {
	overallScore: number;
	summary: string;
	strengths: string[];
	weaknesses: string[];
	redFlags: string[];
	skillScores: {
		technical: number;
		communication: number;
		problemSolving: number;
		culturalFit: number;
	};
	reasoning: string;
	recommendation:
		| "strong_hire"
		| "hire"
		| "neutral"
		| "reject"
		| "strong_reject";
}

export function AISummary({
	overallScore,
	summary,
	strengths,
	weaknesses,
	redFlags,
	skillScores,
	reasoning,
	recommendation,
}: AISummaryProps) {
	const recommendationConfig = {
		strong_hire: {
			label: "Strong Hire",
			color:
				"bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
			icon: ThumbsUp,
		},
		hire: {
			label: "Hire",
			color:
				"bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
			icon: ThumbsUp,
		},
		neutral: {
			label: "Neutral",
			color: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
			icon: Target,
		},
		reject: {
			label: "Reject",
			color: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
			icon: ThumbsDown,
		},
		strong_reject: {
			label: "Strong Reject",
			color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
			icon: ThumbsDown,
		},
	};

	const config = recommendationConfig[recommendation];
	const Icon = config.icon;

	return (
		<div className="space-y-6">
			{/* Overall Score & Recommendation */}
			<div className="flex items-start gap-6">
				<div
					className={cn(
						"flex flex-col items-center justify-center w-24 h-24 rounded-2xl border-2",
						getScoreBgColor(overallScore),
						overallScore >= 8
							? "border-emerald-300"
							: overallScore >= 6
								? "border-amber-300"
								: overallScore >= 4
									? "border-orange-300"
									: "border-red-300",
					)}
				>
					<span
						className={cn("text-3xl font-bold", getScoreColor(overallScore))}
					>
						{overallScore.toFixed(1)}
					</span>
					<span className="text-xs text-muted-foreground">/ 10</span>
				</div>

				<div className="flex-1">
					<Badge className={cn("mb-2", config.color)}>
						<Icon className="h-3 w-3 mr-1" />
						{config.label}
					</Badge>
					<p className="text-sm text-muted-foreground leading-relaxed">
						{summary}
					</p>
				</div>
			</div>

			<Separator />

			{/* Skill Breakdown */}
			<div>
				<h4 className="text-sm font-medium mb-4 flex items-center gap-2">
					<Brain className="h-4 w-4" />
					Skill Assessment
				</h4>
				<div className="grid grid-cols-2 gap-4">
					<SkillScore
						label="Technical"
						score={skillScores.technical}
						icon={Code}
					/>
					<SkillScore
						label="Communication"
						score={skillScores.communication}
						icon={MessageSquare}
					/>
					<SkillScore
						label="Problem Solving"
						score={skillScores.problemSolving}
						icon={Lightbulb}
					/>
					<SkillScore
						label="Cultural Fit"
						score={skillScores.culturalFit}
						icon={Users}
					/>
				</div>
			</div>

			<Separator />

			{/* Strengths & Weaknesses */}
			<div className="grid grid-cols-2 gap-6">
				<div>
					<h4 className="text-sm font-medium mb-3 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
						<ThumbsUp className="h-4 w-4" />
						Key Strengths
					</h4>
					<ul className="space-y-2">
						{strengths.map((strength) => (
							<li key={strength} className="text-sm flex items-start gap-2">
								<span className="text-emerald-500 mt-1">•</span>
								<span className="text-muted-foreground">{strength}</span>
							</li>
						))}
					</ul>
				</div>

				<div>
					<h4 className="text-sm font-medium mb-3 flex items-center gap-2 text-amber-600 dark:text-amber-400">
						<Target className="h-4 w-4" />
						Areas for Improvement
					</h4>
					<ul className="space-y-2">
						{weaknesses.map((weakness) => (
							<li key={weakness} className="text-sm flex items-start gap-2">
								<span className="text-amber-500 mt-1">•</span>
								<span className="text-muted-foreground">{weakness}</span>
							</li>
						))}
					</ul>
				</div>
			</div>

			{/* Red Flags */}
			{redFlags.length > 0 && (
				<>
					<Separator />
					<div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
						<h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-red-600 dark:text-red-400">
							<AlertTriangle className="h-4 w-4" />
							Red Flags
						</h4>
						<ul className="space-y-1">
							{redFlags.map((flag) => (
								<li
									key={flag}
									className="text-sm text-red-700 dark:text-red-300"
								>
									• {flag}
								</li>
							))}
						</ul>
					</div>
				</>
			)}

			<Separator />

			{/* AI Reasoning */}
			<div>
				<h4 className="text-sm font-medium mb-2 flex items-center gap-2">
					<Brain className="h-4 w-4" />
					AI Reasoning
				</h4>
				<Card className="bg-muted/50">
					<CardContent className="p-4">
						<p className="text-sm text-muted-foreground leading-relaxed">
							{reasoning}
						</p>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

function SkillScore({
	label,
	score,
	icon: Icon,
}: {
	label: string;
	score: number;
	icon: React.ComponentType<{ className?: string }>;
}) {
	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<Icon className="h-4 w-4" />
					<span>{label}</span>
				</div>
				<span className={cn("text-sm font-medium", getScoreColor(score))}>
					{score.toFixed(1)}
				</span>
			</div>
			<Progress value={score * 10} className="h-2" />
		</div>
	);
}
