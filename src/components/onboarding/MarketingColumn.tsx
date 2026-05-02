import { ClipboardList, ScanLine, Sparkles } from "lucide-react";
import { cn } from "#/lib/utils";

const FEATURES = [
	{
		icon: Sparkles,
		title: "AI interviews",
		body: "We interview, rate, and select many candidates at once, any time of day.",
	},
	{
		icon: ClipboardList,
		title: "AI-native workflow",
		body: "Manage every step from screening to hiring on a single canvas built for AI.",
	},
	{
		icon: ScanLine,
		title: "Resume parsing",
		body: "Upload resumes and we sort, filter, and interview the best applicants for you.",
	},
] as const;

/**
 * Value-prop column for the split onboarding layout (right rail).
 * Replace testimonial and preview assets with production content when available.
 */
export function MarketingColumn({ className }: { className?: string }) {
	return (
		<div
			className={cn(
				"flex h-full min-h-0 flex-col justify-between gap-8 overflow-y-auto bg-(--onb-panel) p-8 lg:p-10",
				"border-t border-(--onb-border) lg:border-t-0",
				"lg:max-h-svh",
				className,
			)}
		>
			<div>
				<div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:gap-4 sm:text-left">
					<div
						aria-hidden
						className="mb-2 flex h-16 w-16 shrink-0 items-center justify-center text-2xl text-(--onb-gold) sm:mb-0"
					>
						<span className="font-serif text-2xl">🏅</span>
					</div>
					<div>
						<p className="text-2xl font-bold text-(--onb-text)">4.9</p>
						<p className="text-sm font-medium text-(--onb-muted)">
							Teams using InvetFlow
						</p>
					</div>
				</div>
				<blockquote className="mt-6 text-sm leading-relaxed text-(--onb-muted)">
					&ldquo;InvetFlow streamlined our first-round interviews. Clear
					scorecards and highlights help us find strong candidates without
					resume chaos.&rdquo;
				</blockquote>
				<div className="mt-4 flex items-center gap-2">
					<div className="h-8 w-8 rounded-full bg-(--onb-border)" />
					<div>
						<p className="text-sm font-medium text-(--onb-text)">People lead</p>
						<p className="text-xs text-(--onb-muted)">At a high-growth team</p>
					</div>
				</div>
			</div>

			<div
				className="overflow-hidden rounded-[var(--onb-radius-lg)] border border-(--onb-border) bg-(--onb-form-bg) shadow-sm"
				role="img"
				aria-label="Product interface preview (placeholder)"
			>
				<div className="grid gap-0 border-b border-(--onb-border) p-3 text-left text-xs text-(--onb-muted)">
					<div className="h-1.5 w-20 rounded bg-(--onb-border)" />
					<div className="mt-2 flex gap-1">
						{["Open roles", "Interviews", "Score", "Hired"].map((label) => (
							<span
								key={label}
								className="rounded bg-(--onb-page) px-1.5 py-0.5 text-[0.65rem] font-medium"
							>
								{label}
							</span>
						))}
					</div>
				</div>
				<div className="grid gap-2 p-4 sm:grid-cols-2">
					<div className="h-16 rounded border border-dashed border-(--onb-border) bg-(--onb-page)/40" />
					<div className="h-16 rounded border border-dashed border-(--onb-border) bg-(--onb-page)/40" />
				</div>
			</div>

			<div className="grid gap-4 sm:grid-cols-3 sm:gap-3">
				{FEATURES.map((f) => (
					<div key={f.title} className="text-left">
						<div className="mb-2 flex h-9 w-9 items-center justify-center rounded-[var(--onb-radius)] border border-(--onb-border) text-(--onb-text)">
							<f.icon className="h-4 w-4" strokeWidth={1.5} />
						</div>
						<p className="text-sm font-semibold text-(--onb-text)">{f.title}</p>
						<p className="mt-1 text-xs leading-relaxed text-(--onb-muted)">
							{f.body}
						</p>
					</div>
				))}
			</div>
		</div>
	);
}
