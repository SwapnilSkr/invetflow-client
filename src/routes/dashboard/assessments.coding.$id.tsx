import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { CodingAssessmentForm } from "#/components/assessments/CodingAssessmentForm";
import { Button } from "#/components/ui/button";
import type {
	CodingAssessment,
	CreateCodingAssessmentPayload,
} from "#/integrations/api/client";
import {
	assessmentQueries,
	useUpdateCodingAssessment,
} from "#/integrations/api/queries";

export const Route = createFileRoute("/dashboard/assessments/coding/$id")({
	component: Page,
});

function toPayload(row: CodingAssessment): CreateCodingAssessmentPayload {
	return {
		title: row.title,
		description: row.description,
		slug: row.slug,
		time_limit_minutes: row.time_limit_minutes,
		pass_completion_number: row.pass_completion_number,
		timing_mode: row.timing_mode,
		allowed_languages: [...row.allowed_languages],
		problems: row.problems.map((p) => ({
			...p,
			test_cases: p.test_cases.map((t) => ({ ...t })),
		})),
	};
}

function Page() {
	const { id } = Route.useParams();
	const q = useQuery({
		...assessmentQueries.coding.detail(id),
		enabled: id.length > 0,
	});
	const update = useUpdateCodingAssessment();

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
				Edit coding assessment
			</h1>
			<CodingAssessmentForm
				initial={toPayload(q.data)}
				submitLabel="Save"
				onSubmit={async (body) => {
					await update.mutateAsync({ id, body });
				}}
			/>
		</div>
	);
}
