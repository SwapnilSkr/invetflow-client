import { Link } from "@tanstack/react-router";
import { Button } from "#/components/ui/button";
import { useAuth, useLogout } from "#/integrations/api/hooks";

export default function AuthHeaderUser() {
	const { user, isLoading } = useAuth();
	const doLogout = useLogout();

	if (isLoading) {
		return <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />;
	}

	if (user) {
		return (
			<div className="flex items-center gap-2">
				<div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200">
					<span className="text-xs font-semibold">
						{user.name?.charAt(0).toUpperCase() || "U"}
					</span>
				</div>
				<Button variant="outline" size="sm" onClick={() => void doLogout()}>
					Sign out
				</Button>
			</div>
		);
	}

	return (
		<Button variant="outline" size="sm" asChild>
			<Link to="/auth">Sign in</Link>
		</Button>
	);
}
