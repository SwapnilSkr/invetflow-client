import { Link } from "@tanstack/react-router";
import { Briefcase, LayoutDashboard, ListVideo } from "lucide-react";
import { BrandMark } from "#/components/onboarding/BrandMark";
import { useAuth } from "#/integrations/api/hooks";
import AuthHeaderUser from "../integrations/auth/header-user.tsx";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
	const { user, isAuthenticated, isLoading } = useAuth();
	const isCandidate = user?.role === "Candidate";

	const brandLink =
		!isLoading && isAuthenticated && user
			? isCandidate
				? "/candidate"
				: "/dashboard"
			: "/onboarding";

	return (
		<header className="sticky top-0 z-50 border-b border-black/8 bg-[#ffffff]/92 px-4 backdrop-blur-lg">
			<nav className="page-wrap flex flex-wrap items-center gap-x-4 gap-y-3 py-3 sm:py-4">
				<div className="shrink-0">
					<BrandMark linkTo={brandLink} />
				</div>

				<div className="ml-auto flex items-center gap-2">
					<AuthHeaderUser />
					<ThemeToggle />
				</div>

				<div className="order-3 flex w-full flex-wrap items-center gap-x-5 gap-y-1 pb-1 text-sm font-medium sm:order-2 sm:w-auto sm:flex-nowrap sm:pb-0">
					{!isLoading && isAuthenticated && user ? (
						isCandidate ? (
							<Link
								to="/candidate"
								className="nav-link inline-flex items-center gap-1.5 text-[#6b7280] no-underline hover:text-[#111827]"
								activeProps={{ className: "nav-link is-active text-[#111827]" }}
							>
								<ListVideo className="h-3.5 w-3.5 opacity-80" />
								My jobs
							</Link>
						) : (
							<>
								<Link
									to="/dashboard"
									className="nav-link inline-flex items-center gap-1.5 text-[#6b7280] no-underline hover:text-[#111827]"
									activeProps={{
										className: "nav-link is-active text-[#111827]",
									}}
								>
									<LayoutDashboard className="h-3.5 w-3.5 opacity-80" />
									Dashboard
								</Link>
								<Link
									to="/dashboard/jobs"
									className="nav-link inline-flex items-center gap-1.5 text-[#6b7280] no-underline hover:text-[#111827]"
									activeProps={{
										className: "nav-link is-active text-[#111827]",
									}}
								>
									<Briefcase className="h-3.5 w-3.5 opacity-80" />
									Jobs
								</Link>
							</>
						)
					) : null}
				</div>
			</nav>
		</header>
	);
}
