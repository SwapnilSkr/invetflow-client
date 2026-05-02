import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";

export const Route = createFileRoute("/dashboard/candidates")({
	component: DashboardCandidatesPage,
});

function DashboardCandidatesPage() {
	return (
		<div className="px-6 py-8 lg:px-10">
			<div className="mx-auto max-w-3xl">
				<div className="mb-2 flex items-center gap-2">
					<div className="flex size-10 items-center justify-center rounded-xl bg-[#f3f4f6]">
						<Users className="size-5 text-[#6b7280]" />
					</div>
					<h1 className="text-2xl font-bold tracking-tight text-[#111827]">
						Candidates
					</h1>
				</div>
				<p className="text-[13.33px] leading-relaxed text-[#6b7280]">
					A dedicated candidate pipeline is on the way. Today, assign candidates
					when you schedule or open an interview from{" "}
					<span className="font-medium text-[#111827]">Jobs</span>.
				</p>
			</div>
		</div>
	);
}
