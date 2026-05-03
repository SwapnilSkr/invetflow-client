import { createFileRoute } from "@tanstack/react-router";
import { Network, Users } from "lucide-react";

export const Route = createFileRoute("/dashboard/candidates")({
	component: DashboardCandidatesPage,
});

function DashboardCandidatesPage() {
	return (
		<div>
			<div className="mx-auto w-full max-w-6xl">
				<div className="mb-8 flex flex-wrap items-end justify-between gap-4">
					<div>
						<h1 className="text-2xl font-bold tracking-tight text-[#111827]">
							Candidates
						</h1>
					</div>
				</div>

				<div className="relative overflow-hidden rounded-xl border border-black/8 bg-gradient-to-b from-white to-[#f9fafb] px-8 py-20 text-center shadow-sm">
					<div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_10%,transparent_100%)]" />

					<div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center">
						<div className="absolute inset-0 animate-pulse rounded-full bg-[#16a34a]/10 blur-xl" />
						<div className="absolute inset-0 rotate-45 rounded-xl border border-black/5 bg-white/50" />
						<div className="relative flex h-12 w-12 items-center justify-center rounded-lg border border-black/8 bg-white shadow-sm ring-1 ring-black/5">
							<Network className="size-5 text-[#16a34a]" />
						</div>
					</div>

					<h3 className="relative text-base font-semibold tracking-tight text-[#111827]">
						Awaiting Candidate Pipeline
					</h3>
					<p className="relative mx-auto mt-1.5 max-w-sm text-[13.33px] text-[#6b7280]">
						A dedicated candidate pipeline module is being initialized. For now, assign candidates seamlessly when you schedule or open an interview from the <span className="font-medium text-[#111827]">Jobs</span> panel.
					</p>
				</div>
			</div>
		</div>
	);
}
