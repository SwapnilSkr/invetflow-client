import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import {
	createFileRoute,
	Link,
	Outlet,
	useRouterState,
} from "@tanstack/react-router";
import { Brain, Cpu, Layers, Voicemail } from "lucide-react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import { assessmentQueries } from "#/integrations/api/queries";

export const Route = createFileRoute("/dashboard/assessments")({
	component: AssessmentsLayout,
});

type KindConfig = {
	key: "voice" | "generic" | "coding" | "psychometric" | "prescreening";
	label: string;
	newPath:
		| "/dashboard/assessments/voice/new"
		| "/dashboard/assessments/generic/new"
		| "/dashboard/assessments/coding/new"
		| "/dashboard/assessments/psychometric/new"
		| "/dashboard/assessments/prescreening/new";
	detailPath:
		| "/dashboard/assessments/voice/$id"
		| "/dashboard/assessments/generic/$id"
		| "/dashboard/assessments/coding/$id"
		| "/dashboard/assessments/psychometric/$id"
		| "/dashboard/assessments/prescreening/$id";
	Icon: typeof Voicemail;
};

const KINDS: KindConfig[] = [
	{
		key: "voice",
		label: "Voice",
		newPath: "/dashboard/assessments/voice/new",
		detailPath: "/dashboard/assessments/voice/$id",
		Icon: Voicemail,
	},
	{
		key: "generic",
		label: "Generic",
		newPath: "/dashboard/assessments/generic/new",
		detailPath: "/dashboard/assessments/generic/$id",
		Icon: Layers,
	},
	{
		key: "coding",
		label: "Coding",
		newPath: "/dashboard/assessments/coding/new",
		detailPath: "/dashboard/assessments/coding/$id",
		Icon: Cpu,
	},
	{
		key: "psychometric",
		label: "Psychometric",
		newPath: "/dashboard/assessments/psychometric/new",
		detailPath: "/dashboard/assessments/psychometric/$id",
		Icon: Brain,
	},
	{
		key: "prescreening",
		label: "Prescreening",
		newPath: "/dashboard/assessments/prescreening/new",
		detailPath: "/dashboard/assessments/prescreening/$id",
		Icon: Layers,
	},
];

type AssessmentListRow = {
	id?: string | null;
	title?: string;
	name?: string;
};

type AssessmentListPayload = {
	assessments: AssessmentListRow[];
};

function AssessmentsLayout() {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const nested =
		pathname.startsWith("/dashboard/assessments/") &&
		pathname !== "/dashboard/assessments/";
	if (nested) {
		return <Outlet />;
	}
	return <AssessmentLibraryIndex />;
}

function AssessmentLibraryIndex() {
	return (
		<div className="mx-auto w-full max-w-6xl space-y-8">
			<div>
				<h1 className="text-2xl font-bold tracking-tight text-foreground">
					Assessments
				</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Reusable entities you can link to any job pipeline stage.
				</p>
			</div>
			<div className="grid gap-6">
				{KINDS.map((k) => (
					<AssessmentKindSection key={k.key} kind={k} />
				))}
			</div>
		</div>
	);
}

function AssessmentKindSection({ kind }: { kind: KindConfig }) {
	switch (kind.key) {
		case "voice":
			return <VoiceAssessmentListSection kind={kind} />;
		case "generic":
			return <GenericAssessmentListSection kind={kind} />;
		case "coding":
			return <CodingAssessmentListSection kind={kind} />;
		case "psychometric":
			return <PsychometricAssessmentListSection kind={kind} />;
		case "prescreening":
			return <PrescreeningAssessmentListSection kind={kind} />;
	}
}

function VoiceAssessmentListSection({ kind }: { kind: KindConfig }) {
	const q = useQuery({ ...assessmentQueries.voice.list(), staleTime: 30_000 });
	return <SectionShell kind={kind} q={q} />;
}

function GenericAssessmentListSection({ kind }: { kind: KindConfig }) {
	const q = useQuery({
		...assessmentQueries.generic.list(),
		staleTime: 30_000,
	});
	return <SectionShell kind={kind} q={q} />;
}

function CodingAssessmentListSection({ kind }: { kind: KindConfig }) {
	const q = useQuery({
		...assessmentQueries.coding.list(),
		staleTime: 30_000,
	});
	return <SectionShell kind={kind} q={q} />;
}

function PsychometricAssessmentListSection({ kind }: { kind: KindConfig }) {
	const q = useQuery({
		...assessmentQueries.psychometric.list(),
		staleTime: 30_000,
	});
	return <SectionShell kind={kind} q={q} />;
}

function PrescreeningAssessmentListSection({ kind }: { kind: KindConfig }) {
	const q = useQuery({
		...assessmentQueries.prescreening.list(),
		staleTime: 30_000,
	});
	return <SectionShell kind={kind} q={q} />;
}

function SectionShell({
	kind,
	q,
}: {
	kind: KindConfig;
	q: UseQueryResult<AssessmentListPayload>;
}) {
	return (
		<section className="rounded-xl border border-border bg-card">
			<div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
				<div className="flex items-center gap-2">
					<kind.Icon className="size-5 text-muted-foreground" />
					<h2 className="font-semibold text-foreground">{kind.label}</h2>
				</div>
				<Button asChild size="sm" variant="secondary">
					<Link to={kind.newPath}>New</Link>
				</Button>
			</div>
			<div className="p-4">
				{q.isLoading ? (
					<div className="space-y-2">
						<Skeleton className="h-12 w-full" />
						<Skeleton className="h-12 w-full" />
					</div>
				) : q.error ? (
					<p className="text-sm text-muted-foreground">
						List unavailable until Phase 1 assessment routes ship.
					</p>
				) : (
					<ul className="divide-y divide-border">
						{(q.data?.assessments ?? []).flatMap((row) => {
							const rid =
								typeof row.id === "string" && row.id.length > 0 ? row.id : null;
							if (!rid) return [];
							const label =
								"title" in row && typeof row.title === "string"
									? row.title
									: "name" in row && typeof row.name === "string"
										? row.name
										: "Untitled";
							return [
								<li key={rid}>
									<Link
										to={kind.detailPath}
										params={{ id: rid }}
										className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm no-underline hover:bg-muted/50"
									>
										<span className="font-medium text-foreground">{label}</span>
										<Badge variant="outline">{kind.label}</Badge>
									</Link>
								</li>,
							];
						})}
						{q.data && (q.data.assessments?.length ?? 0) === 0 ? (
							<li className="py-6 text-center text-sm text-muted-foreground">
								No {kind.label.toLowerCase()} assessments yet.
							</li>
						) : null}
					</ul>
				)}
			</div>
		</section>
	);
}
