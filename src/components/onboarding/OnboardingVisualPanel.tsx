import { cn } from "#/lib/utils";

/**
 * Right-rail placeholder matching Figma onboarding frames (neutral panel).
 */
export function OnboardingVisualPanel({ className }: { className?: string }) {
	return (
		<div
			className={cn(
				"hidden min-h-0 w-full max-w-[540px] lg:flex",
				"items-stretch justify-center p-0",
				className,
			)}
		>
			<div
				aria-hidden
				className="h-full min-h-[628px] w-full rounded-[20px] bg-[#d9d9d9] lg:min-h-[min(85vh,795px)]"
			/>
		</div>
	);
}
