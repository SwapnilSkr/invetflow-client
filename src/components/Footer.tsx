import { Link } from "@tanstack/react-router";

export default function Footer() {
	const year = new Date().getFullYear();

	return (
		<footer className="mt-20 border-t border-[var(--line)] px-4 pb-14 pt-10 text-[var(--sea-ink-soft)]">
			<div className="page-wrap flex flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-left">
				<div className="flex items-center gap-2">
					<span className="h-2 w-2 rounded-full bg-[linear-gradient(90deg,#56c6be,#7ed3bf)]" />
					<span className="text-sm font-semibold text-[var(--sea-ink)]">
						InvetFlow
					</span>
				</div>
				<nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
					<Link to="/" className="nav-link">
						Home
					</Link>
					<Link to="/dashboard" className="nav-link">
						Dashboard
					</Link>
					<Link to="/interviews" className="nav-link">
						Interviews
					</Link>
					<Link to="/about" className="nav-link">
						About
					</Link>
				</nav>
				<p className="m-0 text-xs">
					&copy; {year} InvetFlow. All rights reserved.
				</p>
			</div>
			<p className="island-kicker m-0 mt-6 text-center">
				AI-Powered Interview Intelligence
			</p>
		</footer>
	);
}
