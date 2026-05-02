import { useState } from "react";
import { Code2 } from "lucide-react";
import { DashboardSidebar } from "#/components/dashboard/DashboardSidebar";
import { Button } from "#/components/ui/button";

/**
 * Authenticated app chrome: sidebar + main region for routed page content.
 * `children` is the active route (same role as `<Outlet />` on a layout route).
 */
export function DashboardAppShell({ children }: { children: React.ReactNode }) {
	const [sidebarOpen, setSidebarOpen] = useState(true);

	return (
		<div className="flex min-h-svh w-full bg-[#f9fafb] text-[#111827]">
			<DashboardSidebar
				open={sidebarOpen}
				onToggle={() => setSidebarOpen((v) => !v)}
			/>
			<div className="relative flex min-h-svh min-w-0 flex-1 flex-col overflow-hidden p-5">
				{!sidebarOpen ? (
					<Button
						type="button"
						variant="outline"
						size="icon"
						className="animate-in fade-in duration-300 absolute top-10 left-10 z-10 h-8 w-8 shrink-0 rounded-lg border-black/8 bg-white text-[#6b7280] shadow-none transition-colors hover:bg-[#f9fafb]"
						aria-label="Expand sidebar"
						onClick={() => setSidebarOpen(true)}
					>
						<Code2 className="h-4 w-4" />
					</Button>
				) : null}
				<main className="min-h-0 w-full min-w-0 flex-1 overflow-auto rounded-[8px] border border-black/8 bg-white px-10 py-5">
					{children}
				</main>
			</div>
		</div>
	);
}
