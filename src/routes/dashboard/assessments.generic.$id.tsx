import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { GenericAssessmentForm } from "#/components/assessments/GenericAssessmentForm";
import { Button } from "#/components/ui/button";
import type {
	CreateGenericAssessmentPayload,
	GenericAssessment,
} from "#/integrations/api/client";
import {
	assessmentQueries,
	useUpdateGenericAssessment,
} from "#/integrations/api/queries";

export const Route = createFileRoute("/dashboard/assessments/generic/$id")({
	component: Page,
});

function toPayload(row: GenericAssessment): CreateGenericAssessmentPayload {
	return {
		title: row.title,
		description: row.description,
		slug: row.slug,
		time_limit_minutes: row.time_limit_minutes,
		shuffle_questions: row.shuffle_questions,
		pass_score: row.pass_score,
		timing_mode: row.timing_mode,
		questions: row.questions.map((q) => ({
			...q,
			options: q.options.map((o) => ({ ...o })),
		})),
	};
}

function Page() {
	const { id } = Route.useParams();
	const q = useQuery({
		...assessmentQueries.generic.detail(id),
		enabled: id.length > 0,
	});
	const update = useUpdateGenericAssessment();

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
				Edit generic assessment
			</h1>
			<GenericAssessmentForm
				initial={toPayload(q.data)}
				submitLabel="Save"
				onSubmit={async (body) => {
					await update.mutateAsync({ id, body });
				}}
			/>
		</div>
	);
}
