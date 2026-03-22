import { Link } from "@tanstack/react-router";
import { Button } from "#/components/ui/button";
import { logout } from "#/integrations/api/client";
import { authClient } from "#/lib/auth-client";

export default function BetterAuthHeader() {
	const { data: session, isPending } = authClient.useSession();

	if (isPending) {
		return (
			<div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
		);
	}

	if (session?.user) {
		return (
			<div className="flex items-center gap-2">
				<div className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(79,184,178,0.14)] text-[var(--lagoon-deep)]">
					<span className="text-xs font-semibold">
						{session.user.name?.charAt(0).toUpperCase() || "U"}
					</span>
				</div>
				<Button
					variant="outline"
					size="sm"
					onClick={() => void logout()}
				>
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
