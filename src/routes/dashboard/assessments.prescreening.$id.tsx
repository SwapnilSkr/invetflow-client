import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PrescreeningFormComponent } from "#/components/assessments/PrescreeningFormComponent";
import { Button } from "#/components/ui/button";
import type {
	CreatePrescreeningFormPayload,
	PrescreeningForm as PrescreeningFormDto,
} from "#/integrations/api/client";
import {
	assessmentQueries,
	useUpdatePrescreeningForm,
} from "#/integrations/api/queries";

export const Route = createFileRoute("/dashboard/assessments/prescreening/$id")(
	{
		component: Page,
	},
);

function toPayload(row: PrescreeningFormDto): CreatePrescreeningFormPayload {
	return {
		name: row.name,
		collect_resume: row.collect_resume,
		collect_linkedin: row.collect_linkedin,
		collect_phone: row.collect_phone,
		is_resume_mandatory: row.is_resume_mandatory,
		is_linkedin_mandatory: row.is_linkedin_mandatory,
		is_phone_mandatory: row.is_phone_mandatory,
		auto_reject: row.auto_reject,
		auto_continue: row.auto_continue,
		min_total_score: row.min_total_score,
		confirmation_message: row.confirmation_message,
		knockout_message: row.knockout_message,
		delivery_method: row.delivery_method,
		questions: row.questions.map((q) => ({
			...q,
			options: q.options.map((o) => ({ ...o })),
			knockout_rule: q.knockout_rule ? { ...q.knockout_rule } : null,
		})),
	};
}

function Page() {
	const { id } = Route.useParams();
	const q = useQuery({
		...assessmentQueries.prescreening.detail(id),
		enabled: id.length > 0,
	});
	const update = useUpdatePrescreeningForm();

	if (q.isLoading)
		return (
			<div className="flex justify-center py-24">
				<Loader2 className="size-6 animate-spin" />
			</div>
		);

	if (q.error || !q.data?.id)
		return <p className="p-6 text-sm text-destructive">Could not load form.</p>;

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
				Edit prescreening form
			</h1>
			<PrescreeningFormComponent
				initial={toPayload(q.data)}
				submitLabel="Save"
				onSubmit={async (body) => {
					await update.mutateAsync({ id, body });
				}}
			/>
		</div>
	);
}
