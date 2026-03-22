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

export const Route = createFileRoute("/")({ component: App });

const FEATURES = [
	{
		icon: Brain,
		title: "AI Interviewer",
		description:
			"Natural conversational AI that asks dynamic follow-up questions based on candidate responses.",
		color: "rgba(79,184,178,0.14)",
		iconColor: "text-[var(--lagoon-deep)]",
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
	return (
		<main className="page-wrap px-4 pb-8 pt-14">
			{/* Hero */}
			<section className="island-shell rise-in relative overflow-hidden rounded-[2rem] px-6 py-12 sm:px-10 sm:py-16">
				<div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.32),transparent_66%)]" />
				<div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.18),transparent_66%)]" />
				<p className="island-kicker mb-3">AI-Powered Interview Intelligence</p>
				<h1 className="display-title mb-5 max-w-3xl text-4xl leading-[1.02] font-bold tracking-tight text-[var(--sea-ink)] sm:text-6xl">
					InvetFlow
				</h1>
				<p className="mb-8 max-w-2xl text-base leading-relaxed text-[var(--sea-ink-soft)] sm:text-lg">
					Conduct AI-powered video interviews that understand and evaluate
					candidates in real-time. From adaptive questioning to automated
					scoring &mdash; hire smarter and faster.
				</p>
				<div className="flex flex-wrap gap-3">
					<Link
						to="/dashboard"
						className="inline-flex items-center gap-2 rounded-full border border-[rgba(50,143,151,0.3)] bg-[rgba(79,184,178,0.14)] px-5 py-2.5 text-sm font-semibold text-[var(--lagoon-deep)] no-underline transition hover:-translate-y-0.5 hover:bg-[rgba(79,184,178,0.24)]"
					>
						<LayoutDashboard className="h-4 w-4" />
						Go to Dashboard
					</Link>
					<Link
						to="/auth"
						className="inline-flex items-center gap-2 rounded-full border border-[rgba(23,58,64,0.2)] bg-white/50 px-5 py-2.5 text-sm font-semibold text-[var(--sea-ink)] no-underline transition hover:-translate-y-0.5 hover:border-[rgba(23,58,64,0.35)]"
					>
						Sign In
					</Link>
				</div>
			</section>

			{/* Feature Cards */}
			<section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{FEATURES.map(({ icon: Icon, title, description, color, iconColor }, index) => (
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
						<h2 className="mb-2 text-base font-semibold text-[var(--sea-ink)]">
							{title}
						</h2>
						<p className="m-0 text-sm leading-relaxed text-[var(--sea-ink-soft)]">
							{description}
						</p>
					</article>
				))}
			</section>

			{/* Highlights */}
			<section className="island-shell rise-in mt-8 rounded-[2rem] px-6 py-10 sm:px-10" style={{ animationDelay: "450ms" }}>
				<p className="island-kicker mb-2">Beyond basic interviews</p>
				<h2 className="display-title mb-6 text-2xl font-bold text-[var(--sea-ink)] sm:text-3xl">
					Built for scale
				</h2>
				<div className="grid gap-6 sm:grid-cols-3">
					{HIGHLIGHTS.map(({ icon: Icon, title, description }) => (
						<div key={title} className="flex gap-3">
							<div className="flex-shrink-0 rounded-lg bg-[rgba(79,184,178,0.1)] p-2 text-[var(--lagoon-deep)]">
								<Icon className="h-5 w-5" />
							</div>
							<div>
								<h3 className="mb-1 text-sm font-semibold text-[var(--sea-ink)]">
									{title}
								</h3>
								<p className="m-0 text-sm text-[var(--sea-ink-soft)]">
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
