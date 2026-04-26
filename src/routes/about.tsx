import { createFileRoute } from "@tanstack/react-router";
import { Brain, Clock, Globe, Shield, Video, Zap } from "lucide-react";
import { Card, CardContent } from "#/components/ui/card";

export const Route = createFileRoute("/about")({
	component: About,
});

const CAPABILITIES = [
	{
		icon: Brain,
		title: "Adaptive AI Interviewer",
		description:
			"Our conversational AI asks dynamic follow-up questions based on candidate responses, not just scripted lists.",
	},
	{
		icon: Video,
		title: "Low-Latency Video",
		description:
			"Sub-800ms response times powered by LiveKit WebRTC and a Rust backend for real-time interaction.",
	},
	{
		icon: Zap,
		title: "Real-time Scoring",
		description:
			"Automated evaluation of technical accuracy, communication, and problem-solving as the interview progresses.",
	},
	{
		icon: Shield,
		title: "Anti-Cheat Proctoring",
		description:
			"Tab-switch detection, plagiarism scanning, and AI-generated content alerts to ensure integrity.",
	},
	{
		icon: Globe,
		title: "Multi-Language Support",
		description:
			"Conduct interviews in English while evaluating candidates speaking in other languages via real-time translation.",
	},
	{
		icon: Clock,
		title: "Session Persistence",
		description:
			"If a candidate's browser crashes, they can rejoin the exact same session and pick up where they left off.",
	},
];

function About() {
	return (
		<main className="page-wrap px-4 py-12">
			<section className="island-shell rise-in rounded-[2rem] p-6 sm:p-10">
				<p className="island-kicker mb-2">About InvetFlow</p>
				<h1 className="display-title mb-4 text-4xl font-bold text-[var(--sea-ink)] sm:text-5xl">
					Interview Intelligence, Reimagined.
				</h1>
				<p className="m-0 mb-8 max-w-3xl text-base leading-8 text-[var(--sea-ink-soft)]">
					InvetFlow is an AI-powered video interview platform that goes beyond
					simple recording. We deliver{" "}
					<strong>Interview Intelligence</strong> &mdash; where the software
					actively understands and evaluates candidates in real-time, giving
					recruiters actionable insights instead of hours of video to review.
				</p>

				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{CAPABILITIES.map(({ icon: Icon, title, description }) => (
						<Card
							key={title}
							className="feature-card border-(--line) bg-transparent"
						>
							<CardContent className="p-5">
								<div className="mb-3 inline-flex rounded-xl bg-[rgba(79,184,178,0.12)] p-2.5 text-[var(--lagoon-deep)]">
									<Icon className="h-5 w-5" />
								</div>
								<h3 className="mb-1.5 text-sm font-semibold text-(--sea-ink)">
									{title}
								</h3>
								<p className="m-0 text-sm leading-relaxed text-(--sea-ink-soft)">
									{description}
								</p>
							</CardContent>
						</Card>
					))}
				</div>
			</section>

			<section className="island-shell rise-in mt-8 rounded-2xl p-6 sm:p-8" style={{ animationDelay: "120ms" }}>
				<p className="island-kicker mb-2">Roadmap</p>
				<h2 className="display-title mb-6 text-2xl font-bold text-[var(--sea-ink)]">
					Where we&rsquo;re headed
				</h2>
				<div className="space-y-4">
					{[
						{
							version: "v1.0 (MVP)",
							focus: "Core Flow",
							detail:
								"LiveKit video + AI text-to-speech questioning + MongoDB storage + basic auth.",
						},
						{
							version: "v1.1",
							focus: "Intelligence",
							detail:
								"Automated transcription + scoring rubric + explainable AI reasoning.",
						},
						{
							version: "v2.0",
							focus: "Professional",
							detail:
								"Full recruiter Command Center dashboard + anti-cheat + ATS exports + collaborative review.",
						},
					].map((milestone) => (
						<div
							key={milestone.version}
							className="flex gap-4 rounded-lg border border-(--line) bg-(--surface) p-4"
						>
							<div className="shrink-0 rounded-lg bg-[rgba(79,184,178,0.14)] px-3 py-1.5 text-sm font-bold text-[var(--lagoon-deep)]">
								{milestone.version}
							</div>
							<div>
								<p className="mb-1 text-sm font-semibold text-[var(--sea-ink)]">
									{milestone.focus}
								</p>
								<p className="m-0 text-sm text-[var(--sea-ink-soft)]">
									{milestone.detail}
								</p>
							</div>
						</div>
					))}
				</div>
			</section>
		</main>
	);
}
