import { Link, useRouterState } from "@tanstack/react-router";
import {
	Briefcase,
	ChevronsUpDown,
	Code2,
	LayoutDashboard,
	LayoutGrid,
	ListVideo,
	Settings,
	Users,
} from "lucide-react";
import { BrandMark } from "#/components/onboarding/BrandMark";
import { Button } from "#/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { useAuth, useLogout } from "#/integrations/api/hooks";
import { cn } from "#/lib/utils";

const recruiterNav = [
	{
		to: "/dashboard" as const,
		label: "Dashboard",
		Icon: LayoutDashboard,
	},
	{ to: "/dashboard/jobs" as const, label: "Jobs", Icon: Briefcase },
	{
		to: "/dashboard/candidates" as const,
		label: "Candidates",
		Icon: Users,
	},
	{ to: "/dashboard/settings" as const, label: "Settings", Icon: Settings },
] as const;

const candidateNav = [
	{
		to: "/candidate" as const,
		label: "My jobs",
		Icon: ListVideo,
	},
] as const;

const SIDEBAR_WIDTH_CLASS = "w-[min(100%,280px)] lg:w-[272px]";
const SIDEBAR_INNER_WIDTH = "w-[min(100vw,280px)] lg:w-[272px]";

export function DashboardSidebar({
	open,
	onToggle,
}: {
	open: boolean;
	onToggle: () => void;
}) {
	const { user } = useAuth();
	const doLogout = useLogout();
	const pathname = useRouterState({ select: (s) => s.location.pathname });

	const isCandidate = user?.role === "Candidate";
	const nav = isCandidate ? candidateNav : recruiterNav;

	const companyName = isCandidate
		? user?.name?.trim() || "Candidate"
		: user?.company_name?.trim() || "Your company";
	const workspaceSubtitle = isCandidate
		? "Assigned roles and sessions"
		: user?.company_size
			? `Company size: ${user.company_size}`
			: user?.job_title
				? user.job_title
				: "Recruiter workspace";

	const brandLink = isCandidate ? "/candidate" : "/dashboard";

	return (
		<aside
			className={cn(
				"shrink-0 overflow-hidden bg-[#f9fafb] transition-[width] duration-300 ease-in-out motion-reduce:transition-none",
				open ? SIDEBAR_WIDTH_CLASS : "w-0",
			)}
			aria-hidden={!open}
		>
			<div
				inert={!open}
				className={cn(
					"flex h-full min-h-svh flex-col px-3 py-5",
					SIDEBAR_INNER_WIDTH,
				)}
			>
				<div className="flex items-center justify-between gap-2 px-1">
					<BrandMark linkTo={brandLink} />
					<Button
						type="button"
						variant="outline"
						size="icon"
						className="h-8 w-8 shrink-0 rounded-lg border-black/8 bg-white text-[#6b7280] shadow-none transition-colors hover:bg-[#f9fafb]"
						aria-label="Collapse sidebar"
						aria-expanded={open}
						onClick={onToggle}
					>
						<Code2 className="h-4 w-4 transition-transform duration-300 ease-in-out motion-reduce:transition-none" />
					</Button>
				</div>

				<div className="mt-5 rounded-xl border border-black/8 bg-white px-3 py-2.5">
					<button
						type="button"
						className="flex w-full items-center gap-2 rounded-lg text-left transition-colors hover:bg-[#f9fafb]"
						aria-label="Workspace"
					>
						<div
							aria-hidden
							className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#f3f4f6] text-[#6b7280]"
						>
							<LayoutGrid className="size-4" />
						</div>
						<div className="min-w-0 flex-1">
							<p className="truncate text-sm font-semibold text-[#111827]">
								{companyName}
							</p>
							<p className="truncate text-xs text-[#6b7280]">
								{workspaceSubtitle}
							</p>
						</div>
						<ChevronsUpDown className="size-4 shrink-0 text-[#9ca3af]" />
					</button>
				</div>

				<nav className="mt-6 flex flex-col gap-0.5 px-0.5" aria-label="Main">
					{nav.map(({ to, label, Icon }) => {
						const active =
							to === "/dashboard"
								? pathname === "/dashboard" || pathname === "/dashboard/"
								: to === "/candidate"
									? pathname === "/candidate" || pathname === "/candidate/"
									: to === "/dashboard/jobs"
										? pathname === "/dashboard/jobs" ||
											pathname.startsWith("/dashboard/jobs/") ||
											pathname === "/jobs" ||
											pathname.startsWith("/jobs/")
										: pathname === to || pathname.startsWith(`${to}/`);
						return (
							<Link
								key={to}
								to={to}
								className={cn(
									"flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium no-underline transition-colors",
									active
										? "border border-black/8 bg-white text-[#111827]"
										: "border border-transparent text-[#6b7280] hover:bg-black/3 hover:text-[#111827]",
								)}
							>
								<Icon className="size-[18px] shrink-0 opacity-90" />
								{label}
							</Link>
						);
					})}
				</nav>

				<div className="mt-auto pt-8">
					<div className="rounded-xl border border-black/8 bg-white p-2">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<button
									type="button"
									className="flex w-full items-center gap-2 rounded-lg p-1.5 text-left transition-colors hover:bg-[#f9fafb] data-[state=open]:bg-[#f9fafb]"
								>
									<div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#0052cc]/12 text-sm font-semibold text-[#0052cc]">
										{user?.name?.charAt(0).toUpperCase() ?? "U"}
									</div>
									<div className="min-w-0 flex-1">
										<p className="truncate text-sm font-semibold text-[#111827]">
											{user?.name?.trim() || "Account"}
										</p>
										<p className="truncate text-xs text-[#6b7280]">
											{isCandidate
												? "Candidate"
												: user?.job_title?.trim() || "Recruiter"}
										</p>
									</div>
									<ChevronsUpDown className="size-4 shrink-0 text-[#9ca3af]" />
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="start" className="w-56">
								<DropdownMenuItem
									className="cursor-pointer"
									onSelect={() => void doLogout()}
								>
									Sign out
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
			</div>
		</aside>
	);
}
