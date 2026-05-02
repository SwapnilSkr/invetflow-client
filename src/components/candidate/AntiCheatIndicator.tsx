import { AlertTriangle, Eye, Lock, Shield } from "lucide-react";
import { Alert, AlertDescription } from "#/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { cn } from "#/lib/utils";

interface AntiCheatIndicatorProps {
	tabSwitchCount: number;
	maxTabSwitches: number;
	plagiarismScore?: number;
	isFullscreen: boolean;
	suspiciousActivity: Array<{
		id: string;
		type: "tab_switch" | "copy_paste" | "multiple_faces" | "no_face";
		timestamp: Date;
		details?: string;
	}>;
}

export function AntiCheatIndicator({
	tabSwitchCount,
	maxTabSwitches,
	plagiarismScore,
	isFullscreen,
	suspiciousActivity,
}: AntiCheatIndicatorProps) {
	const tabSwitchWarning = tabSwitchCount > 0;
	const plagiarismWarning =
		plagiarismScore !== undefined && plagiarismScore > 0.7;
	const fullscreenWarning = !isFullscreen;

	const hasWarnings =
		tabSwitchWarning ||
		plagiarismWarning ||
		fullscreenWarning ||
		suspiciousActivity.length > 0;

	return (
		<Card className="border-amber-200 shadow-sm dark:border-amber-800">
			<CardHeader className="pb-3">
				<CardTitle className="text-sm flex items-center gap-2">
					<Shield className="h-4 w-4 text-amber-500" />
					Proctoring Status
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3">
				{/* Tab Switch Warning */}
				<div
					className={cn(
						"flex items-center justify-between p-2 rounded-md text-sm",
						tabSwitchWarning
							? "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
							: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
					)}
				>
					<div className="flex items-center gap-2">
						<Eye className="h-4 w-4" />
						<span>Tab Switches</span>
					</div>
					<span className="font-medium">
						{tabSwitchCount} / {maxTabSwitches}
					</span>
				</div>

				{/* Plagiarism Score */}
				{plagiarismScore !== undefined && (
					<div
						className={cn(
							"flex items-center justify-between p-2 rounded-md text-sm",
							plagiarismWarning
								? "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
								: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
						)}
					>
						<div className="flex items-center gap-2">
							<Lock className="h-4 w-4" />
							<span>AI-Generated Content</span>
						</div>
						<span className="font-medium">
							{Math.round(plagiarismScore * 100)}%
						</span>
					</div>
				)}

				{/* Fullscreen Status */}
				<div
					className={cn(
						"flex items-center justify-between p-2 rounded-md text-sm",
						fullscreenWarning
							? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
							: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
					)}
				>
					<div className="flex items-center gap-2">
						<Shield className="h-4 w-4" />
						<span>Fullscreen Mode</span>
					</div>
					<span className="font-medium">
						{isFullscreen ? "Active" : "Required"}
					</span>
				</div>

				{/* Recent Activity */}
				{suspiciousActivity.length > 0 && (
					<div className="pt-2 border-t">
						<p className="text-xs font-medium text-muted-foreground mb-2">
							Recent Activity
						</p>
						<div className="space-y-1 max-h-24 overflow-y-auto">
							{suspiciousActivity.slice(-5).map((activity) => (
								<div
									key={activity.id}
									className="text-xs flex items-center gap-2 text-red-600 dark:text-red-400"
								>
									<AlertTriangle className="h-3 w-3" />
									<span className="capitalize">
										{activity.type.replace("_", " ")}
									</span>
									<span className="text-muted-foreground">
										{activity.timestamp.toLocaleTimeString([], {
											hour: "2-digit",
											minute: "2-digit",
										})}
									</span>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Warning Banner */}
				{hasWarnings && (
					<Alert variant="warning" className="mt-4">
						<AlertTriangle className="h-4 w-4" />
						<AlertDescription className="text-xs">
							Suspicious activity detected. This may affect your evaluation.
						</AlertDescription>
					</Alert>
				)}
			</CardContent>
		</Card>
	);
}
