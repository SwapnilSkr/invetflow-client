import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "#/integrations/api/hooks";

export const Route = createFileRoute("/")({ component: IndexRedirect });

function IndexRedirect() {
	const { user, isAuthenticated, isLoading } = useAuth();

	if (isLoading) {
		return (
			<div className="flex min-h-svh items-center justify-center bg-[#f9fafb]">
				<Loader2
					className="h-6 w-6 animate-spin text-[#0052cc]"
					aria-label="Loading"
				/>
			</div>
		);
	}

	if (isAuthenticated && user) {
		if (user.role === "Candidate") {
			return <Navigate to="/candidate" replace />;
		}
		if (!user.onboarding_completed_at) {
			return <Navigate to="/onboarding" search={{ step: "profile" }} replace />;
		}
		return <Navigate to="/dashboard" replace />;
	}

	return <Navigate to="/onboarding" replace />;
}
