import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { emptyPsychometricAssessmentPayload } from "#/components/assessments/assessment-defaults";
import { PsychometricAssessmentForm } from "#/components/assessments/PsychometricAssessmentForm";
import { Button } from "#/components/ui/button";
import { useCreatePsychometricAssessment } from "#/integrations/api/queries";

export const Route = createFileRoute("/dashboard/assessments/psychometric/new")(
	{
		component: Page,
	},
);

function Page() {
	const navigate = useNavigate();
	const m = useCreatePsychometricAssessment();

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
				New psychometric
			</h1>
			<PsychometricAssessmentForm
				initial={emptyPsychometricAssessmentPayload()}
				submitLabel="Create"
				onSubmit={async (body) => {
					const row = await m.mutateAsync(body);
					if (row.id)
						await navigate({
							to: "/dashboard/assessments/psychometric/$id",
							params: { id: row.id },
						});
				}}
			/>
		</div>
	);
}
