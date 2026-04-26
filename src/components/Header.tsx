import { Link } from "@tanstack/react-router";
import { LayoutDashboard, ListVideo } from "lucide-react";
import { useAuth } from "#/integrations/api/hooks";
import AuthHeaderUser from "../integrations/auth/header-user.tsx";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
	const { user, isAuthenticated, isLoading } = useAuth();
	const isCandidate = user?.role === "Candidate";

	return (
		<header className="sticky top-0 z-50 border-b border-(--line) bg-(--header-bg) px-4 backdrop-blur-lg">
			<nav className="page-wrap flex flex-wrap items-center gap-x-3 gap-y-2 py-3 sm:py-4">
				<h2 className="m-0 shrink-0 text-base font-semibold tracking-tight">
					<Link
						to="/"
						className="inline-flex items-center gap-2 rounded-full border border-(--chip-line) bg-(--chip-bg) px-3 py-1.5 text-sm text-(--sea-ink) no-underline shadow-[0_8px_24px_rgba(30,90,72,0.08)] sm:px-4 sm:py-2"
					>
						<span className="h-2 w-2 rounded-full bg-[linear-gradient(90deg,#56c6be,#7ed3bf)]" />
						InvetFlow
					</Link>
				</h2>

				<div className="ml-auto flex items-center gap-1.5 sm:ml-0 sm:gap-2">
					<AuthHeaderUser />
					<ThemeToggle />
				</div>

				<div className="order-3 flex w-full flex-wrap items-center gap-x-4 gap-y-1 pb-1 text-sm font-semibold sm:order-2 sm:w-auto sm:flex-nowrap sm:pb-0">
					<Link
						to="/"
						className="nav-link"
						activeProps={{ className: "nav-link is-active" }}
						activeOptions={{ exact: true }}
					>
						Home
					</Link>
					{!isLoading && isAuthenticated && user ? (
						isCandidate ? (
							<Link
								to="/candidate"
								className="nav-link inline-flex items-center gap-1.5"
								activeProps={{ className: "nav-link is-active" }}
							>
								<ListVideo className="h-3.5 w-3.5 opacity-80" />
								My interviews
							</Link>
						) : (
							<>
								<Link
									to="/dashboard"
									className="nav-link inline-flex items-center gap-1.5"
									activeProps={{ className: "nav-link is-active" }}
								>
									<LayoutDashboard className="h-3.5 w-3.5 opacity-80" />
									Dashboard
								</Link>
								<Link
									to="/interviews"
									className="nav-link"
									activeProps={{ className: "nav-link is-active" }}
								>
									Interviews
								</Link>
							</>
						)
					) : null}
					<Link
						to="/about"
						className="nav-link"
						activeProps={{ className: "nav-link is-active" }}
					>
						About
					</Link>
				</div>
			</nav>
		</header>
	);
}
