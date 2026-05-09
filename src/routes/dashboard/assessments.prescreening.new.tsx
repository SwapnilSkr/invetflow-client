import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { emptyPrescreeningPayload } from "#/components/assessments/assessment-defaults";
import { PrescreeningFormComponent } from "#/components/assessments/PrescreeningFormComponent";
import { Button } from "#/components/ui/button";
import { useCreatePrescreeningForm } from "#/integrations/api/queries";

export const Route = createFileRoute("/dashboard/assessments/prescreening/new")(
	{
		component: Page,
	},
);

function Page() {
	const navigate = useNavigate();
	const m = useCreatePrescreeningForm();

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
				New prescreening form
			</h1>
			<PrescreeningFormComponent
				initial={emptyPrescreeningPayload()}
				submitLabel="Create"
				onSubmit={async (body) => {
					const row = await m.mutateAsync(body);
					if (row.id)
						await navigate({
							to: "/dashboard/assessments/prescreening/$id",
							params: { id: row.id },
						});
				}}
			/>
		</div>
	);
}
