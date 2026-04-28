import { createFileRoute, Link } from "@tanstack/react-router";
import {
	Brain,
	Clock,
	Globe,
	LayoutDashboard,
	Shield,
	Video,
	Zap,
} from "lucide-react";
import { useAuth } from "#/integrations/api/hooks";

export const Route = createFileRoute("/")({ component: App });

const FEATURES = [
	{
		icon: Brain,
		title: "AI Interviewer",
		description:
			"Natural conversational AI that asks dynamic follow-up questions based on candidate responses.",
		color: "rgba(37,99,235,0.12)",
		iconColor: "text-blue-600 dark:text-blue-400",
	},
	{
		icon: Zap,
		title: "Real-time Scoring",
		description:
			"Automated evaluation of technical accuracy, communication, and problem-solving skills.",
		color: "rgba(251,191,36,0.14)",
		iconColor: "text-amber-600 dark:text-amber-400",
	},
	{
		icon: Video,
		title: "Low-Latency Video",
		description:
			"Sub-800ms response times powered by LiveKit WebRTC and a Rust backend.",
		color: "rgba(59,130,246,0.14)",
		iconColor: "text-blue-600 dark:text-blue-400",
	},
	{
		icon: Shield,
		title: "Anti-Cheat Proctoring",
		description:
			"Tab-switch detection, plagiarism scanning, and AI-generated content alerts.",
		color: "rgba(239,68,68,0.12)",
		iconColor: "text-red-600 dark:text-red-400",
	},
];

const HIGHLIGHTS = [
	{
		icon: LayoutDashboard,
		title: "Command Center",
		description:
			"AI-generated summaries, automated scorecards, and collaborative review tools for recruiters.",
	},
	{
		icon: Globe,
		title: "Multi-Language",
		description:
			"Conduct interviews in any language with real-time translation and evaluation.",
	},
	{
		icon: Clock,
		title: "Session Persistence",
		description:
			"Candidates can rejoin after disconnection — the AI remembers where they left off.",
	},
];

function App() {
	const { user, isAuthenticated, isLoading } = useAuth();
	const isCandidate = user?.role === "Candidate";

	return (
		<main className="page-wrap px-4 pb-8 pt-14">
			{/* Hero */}
			<section className="island-shell rise-in relative overflow-hidden rounded-4xl px-6 py-12 sm:px-10 sm:py-16">
				<div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.2),transparent_66%)]" />
				<div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(15,23,42,0.08),transparent_66%)]" />
				<p className="island-kicker mb-3">AI-Powered Interview Intelligence</p>
				<h1 className="display-title mb-5 max-w-3xl text-4xl leading-[1.02] font-bold tracking-tight text-(--sea-ink) sm:text-6xl">
					InvetFlow
				</h1>
				<p className="mb-8 max-w-2xl text-base leading-relaxed text-(--sea-ink-soft) sm:text-lg">
					Conduct AI-powered video interviews that understand and evaluate
					candidates in real-time. From adaptive questioning to automated
					scoring &mdash; hire smarter and faster.
				</p>
				<div className="flex flex-wrap gap-3">
					{!isLoading && isAuthenticated && user ? (
						<Link
							to={isCandidate ? "/candidate" : "/dashboard"}
							className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-5 py-2.5 text-sm font-semibold text-blue-700 no-underline transition hover:-translate-y-0.5 hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100 dark:hover:bg-blue-500/20"
						>
							<LayoutDashboard className="h-4 w-4" />
							{isCandidate ? "My interviews" : "Dashboard"}
						</Link>
					) : (
						<Link
							to="/onboarding"
							className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-5 py-2.5 text-sm font-semibold text-blue-700 no-underline transition hover:-translate-y-0.5 hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100 dark:hover:bg-blue-500/20"
						>
							Get started
						</Link>
					)}
					{!isLoading && !isAuthenticated ? (
						<Link
							to="/auth"
							className="inline-flex items-center gap-2 rounded-full border border-(--line) bg-white px-5 py-2.5 text-sm font-semibold text-(--sea-ink) no-underline shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-900"
						>
							Sign in
						</Link>
					) : null}
				</div>
			</section>

			{/* Feature Cards */}
			<section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{FEATURES.map(
					({ icon: Icon, title, description, color, iconColor }, index) => (
						<article
							key={title}
							className="island-shell feature-card rise-in rounded-2xl p-5"
							style={{ animationDelay: `${index * 90 + 80}ms` }}
						>
							<div
								className={`mb-3 inline-flex rounded-xl p-2.5 ${iconColor}`}
								style={{ backgroundColor: color }}
							>
								<Icon className="h-5 w-5" />
							</div>
							<h2 className="mb-2 text-base font-semibold text-(--sea-ink)">
								{title}
							</h2>
							<p className="m-0 text-sm leading-relaxed text-(--sea-ink-soft)">
								{description}
							</p>
						</article>
					),
				)}
			</section>

			{/* Highlights */}
			<section
				className="island-shell rise-in mt-8 rounded-4xl px-6 py-10 sm:px-10"
				style={{ animationDelay: "450ms" }}
			>
				<p className="island-kicker mb-2">Beyond basic interviews</p>
				<h2 className="display-title mb-6 text-2xl font-bold text-(--sea-ink) sm:text-3xl">
					Built for scale
				</h2>
				<div className="grid gap-6 sm:grid-cols-3">
					{HIGHLIGHTS.map(({ icon: Icon, title, description }) => (
						<div key={title} className="flex gap-3">
							<div className="shrink-0 rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
								<Icon className="h-5 w-5" />
							</div>
							<div>
								<h3 className="mb-1 text-sm font-semibold text-(--sea-ink)">
									{title}
								</h3>
								<p className="m-0 text-sm text-(--sea-ink-soft)">
									{description}
								</p>
							</div>
						</div>
					))}
				</div>
			</section>
		</main>
	);
}
