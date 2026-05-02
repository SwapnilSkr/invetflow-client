import { createFileRoute, Outlet } from "@tanstack/react-router";
import { requireRecruiter } from "#/lib/require-role";

export const Route = createFileRoute("/dashboard")({
	beforeLoad: requireRecruiter,
	component: () => <Outlet />,
});
