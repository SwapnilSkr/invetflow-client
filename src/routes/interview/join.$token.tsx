import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { Card, CardContent } from "#/components/ui/card";
import { buildCandidateUrl } from "#/lib/candidate-url";

export const Route = createFileRoute("/interview/join/$token")({
	component: RedirectToCandidateApp,
});

function RedirectToCandidateApp() {
	const { token } = Route.useParams();
	const target = buildCandidateUrl(`/interview/join/${token}`);

	useEffect(() => {
		if (target) {
			window.location.replace(target);
		}
	}, [target]);

	return (
		<main className="page-wrap flex justify-center">
			<Card className="w-full max-w-lg shadow-sm">
				<CardContent className="py-12 text-center">
					<p className="text-lg font-medium">Opening candidate experience…</p>
					<p className="mt-2 text-sm text-muted-foreground">
						You're being redirected to the candidate app. If nothing happens,{" "}
						{target ? (
							<a className="underline" href={target}>
								click here
							</a>
						) : (
							<span>contact your recruiter for the correct link.</span>
						)}
					</p>
				</CardContent>
			</Card>
		</main>
	);
}
