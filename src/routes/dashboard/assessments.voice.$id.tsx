import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { VoiceAssessmentForm } from "#/components/assessments/VoiceAssessmentForm";
import { Button } from "#/components/ui/button";
import type {
	CreateVoiceAssessmentPayload,
	VoiceAssessment,
} from "#/integrations/api/client";
import {
	assessmentQueries,
	useUpdateVoiceAssessment,
} from "#/integrations/api/queries";

export const Route = createFileRoute("/dashboard/assessments/voice/$id")({
	component: Page,
});

function toVoicePayload(row: VoiceAssessment): CreateVoiceAssessmentPayload {
	return {
		title: row.title,
		description: row.description,
		slug: row.slug,
		delivery_method: row.delivery_method,
		is_multilingual: row.is_multilingual,
		languages: [...row.languages],
		greeting: row.greeting,
		parting: row.parting,
		pass_score: row.pass_score,
		skills: row.skills.map((s) => ({ ...s })),
		questions: row.questions.map((q) => ({ ...q })),
		intake_questions: row.intake_questions.map((q) => ({ ...q })),
		phone_settings: row.phone_settings ? { ...row.phone_settings } : null,
	};
}

function Page() {
	const { id } = Route.useParams();
	const q = useQuery({
		...assessmentQueries.voice.detail(id),
		enabled: id.length > 0,
	});
	const update = useUpdateVoiceAssessment();

	if (q.isLoading) {
		return (
			<div className="flex justify-center py-24">
				<Loader2 className="size-6 animate-spin" />
			</div>
		);
	}

	if (q.error || !q.data?.id) {
		return (
			<p className="p-6 text-sm text-destructive">
				Could not load voice assessment.
			</p>
		);
	}

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
				Edit voice assessment
			</h1>
			<VoiceAssessmentForm
				initial={toVoicePayload(q.data)}
				submitLabel="Save"
				onSubmit={async (body) => {
					await update.mutateAsync({ id, body });
				}}
			/>
		</div>
	);
}
