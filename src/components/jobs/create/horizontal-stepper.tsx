import { Check, Lock } from "lucide-react";
import { cn } from "#/lib/utils";

type StepStatus = "active" | "completed" | "locked" | "pending";

type Step = { label: string; status: StepStatus };
type Props = { steps: Step[]; onStepClick: (index: number) => void };

export function HorizontalStepper({ steps, onStepClick }: Props) {
	return (
		<div className="flex items-center gap-0">
			{steps.map((step, index) => {
				const isLocked = step.status === "locked";
				const isCompleted = step.status === "completed";
				const isActive = step.status === "active";
				const showConnector = index < steps.length - 1;
				const prevCompleted =
					index > 0 && steps[index - 1].status === "completed";

				return (
					<div key={step.label} className="flex items-center">
						<button
							type="button"
							disabled={isLocked}
							onClick={() => {
								if (!isLocked) onStepClick(index);
							}}
							className={cn(
								"flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
								isActive && "bg-primary text-primary-foreground",
								isCompleted && "bg-primary/10 text-primary",
								step.status === "pending" &&
									"text-muted-foreground hover:bg-muted",
								isLocked && "cursor-not-allowed text-muted-foreground/50",
							)}
						>
							<span className="flex size-5 items-center justify-center rounded-full border border-current/30 text-xs">
								{isCompleted ? (
									<Check className="size-3" />
								) : isLocked ? (
									<Lock className="size-3" />
								) : (
									index + 1
								)}
							</span>
							{step.label}
						</button>
						{showConnector ? (
							<span
								className={cn(
									"h-px w-8",
									prevCompleted ? "bg-primary" : "bg-border",
								)}
							/>
						) : null}
					</div>
				);
			})}
		</div>
	);
}
