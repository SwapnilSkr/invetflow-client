import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { emptyVoiceAssessmentPayload } from "#/components/assessments/assessment-defaults";
import { VoiceAssessmentForm } from "#/components/assessments/VoiceAssessmentForm";
import { Button } from "#/components/ui/button";
import { useCreateVoiceAssessment } from "#/integrations/api/queries";

export const Route = createFileRoute("/dashboard/assessments/voice/new")({
	component: Page,
});

function Page() {
	const navigate = useNavigate();
	const createVoice = useCreateVoiceAssessment();

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
				New voice assessment
			</h1>
			<VoiceAssessmentForm
				initial={emptyVoiceAssessmentPayload()}
				submitLabel="Create"
				onSubmit={async (body) => {
					const row = await createVoice.mutateAsync(body);
					if (row.id) {
						await navigate({
							to: "/dashboard/assessments/voice/$id",
							params: { id: row.id },
						});
					}
				}}
			/>
		</div>
	);
}
