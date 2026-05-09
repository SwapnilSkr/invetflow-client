import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PsychometricAssessmentForm } from "#/components/assessments/PsychometricAssessmentForm";
import { Button } from "#/components/ui/button";
import type {
	CreatePsychometricAssessmentPayload,
	PsychometricAssessment,
} from "#/integrations/api/client";
import {
	assessmentQueries,
	useUpdatePsychometricAssessment,
} from "#/integrations/api/queries";

export const Route = createFileRoute("/dashboard/assessments/psychometric/$id")(
	{
		component: Page,
	},
);

function toPayload(
	row: PsychometricAssessment,
): CreatePsychometricAssessmentPayload {
	return {
		title: row.title,
		description: row.description,
		slug: row.slug,
		framework: row.framework,
		time_limit_minutes: row.time_limit_minutes,
	};
}

function Page() {
	const { id } = Route.useParams();
	const q = useQuery({
		...assessmentQueries.psychometric.detail(id),
		enabled: id.length > 0,
	});
	const update = useUpdatePsychometricAssessment();

	if (q.isLoading)
		return (
			<div className="flex justify-center py-24">
				<Loader2 className="size-6 animate-spin" />
			</div>
		);

	if (q.error || !q.data?.id)
		return (
			<p className="p-6 text-sm text-destructive">Could not load assessment.</p>
		);

	return (
		<div className="mx-auto w-full max-w-4xl space-y-6 pb-16">
			<Button
				variant="ghost"
				size="sm"
				asChild
				className="-ml-2 text-muted-foreground"
			>
				<Link to="/dashboard/assessments">
					<ArrowLeft className="size-4" />
					Assessments
				</Link>
			</Button>
			<h1 className="text-xl font-semibold text-foreground">
				Edit psychometric
			</h1>
			<PsychometricAssessmentForm
				initial={toPayload(q.data)}
				submitLabel="Save"
				onSubmit={async (body) => {
					await update.mutateAsync({ id, body });
				}}
			/>
		</div>
	);
}
