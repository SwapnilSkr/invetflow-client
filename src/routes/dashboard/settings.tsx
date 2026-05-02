import { createFileRoute, Link } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { useAuth } from "#/integrations/api/hooks";

export const Route = createFileRoute("/dashboard/settings")({
	component: DashboardSettingsPage,
});

function DashboardSettingsPage() {
	const { user } = useAuth();

	return (
		<div>
			<div className="mx-auto w-full max-w-6xl">
				<div className="mb-6 flex items-center gap-2">
					<div className="flex size-10 items-center justify-center rounded-xl bg-[#f3f4f6]">
						<Settings className="size-5 text-[#6b7280]" />
					</div>
					<h1 className="text-2xl font-bold tracking-tight text-[#111827]">
						Settings
					</h1>
				</div>
				<dl className="space-y-4 rounded-[8px] border border-black/8 bg-[#fafafa] p-6">
					<div>
						<dt className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">
							Email
						</dt>
						<dd className="mt-1 text-sm text-[#111827]">
							{user?.email ?? "—"}
						</dd>
					</div>
					<div>
						<dt className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">
							Company name
						</dt>
						<dd className="mt-1 text-sm text-[#111827]">
							{user?.company_name?.trim() || "—"}
						</dd>
					</div>
					<div>
						<dt className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">
							Company size
						</dt>
						<dd className="mt-1 text-sm text-[#111827]">
							{user?.company_size?.trim() || "—"}
						</dd>
					</div>
					<div>
						<dt className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">
							Your title
						</dt>
						<dd className="mt-1 text-sm text-[#111827]">
							{user?.job_title?.trim() || "—"}
						</dd>
					</div>
				</dl>
				<p className="mt-6 text-[13.33px] text-[#6b7280]">
					To update profile fields, use{" "}
					<Link
						to="/onboarding"
						search={{ step: "profile" }}
						className="font-medium text-[#0052cc] no-underline hover:underline"
					>
						onboarding profile
					</Link>{" "}
					(or we can add inline editing here later).
				</p>
			</div>
		</div>
	);
}
