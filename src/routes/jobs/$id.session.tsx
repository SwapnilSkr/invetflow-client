import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import { requireSession } from "#/lib/require-session";
import { parseSessionSearch, type SessionSearch } from "./-session-search";

export const Route = createFileRoute("/jobs/$id/session")({
	beforeLoad: requireSession,
	validateSearch: (search: Record<string, unknown>): SessionSearch =>
		parseSessionSearch(search),
	component: lazyRouteComponent(
		() => import("./-session-room"),
		"InterviewSessionPage",
	),
});
