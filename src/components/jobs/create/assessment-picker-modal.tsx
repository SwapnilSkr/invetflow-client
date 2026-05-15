import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import {
	emptyCodingAssessmentPayload,
	emptyGenericAssessmentPayload,
	emptyPrescreeningPayload,
	emptyPsychometricAssessmentPayload,
	emptyVoiceAssessmentPayload,
} from "#/components/assessments/assessment-defaults";
import { CodingAssessmentForm } from "#/components/assessments/CodingAssessmentForm";
import { GenericAssessmentForm } from "#/components/assessments/GenericAssessmentForm";
import { PrescreeningFormComponent } from "#/components/assessments/PrescreeningFormComponent";
import { PsychometricAssessmentForm } from "#/components/assessments/PsychometricAssessmentForm";
import { VoiceAssessmentForm } from "#/components/assessments/VoiceAssessmentForm";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import type {
	CodingAssessment,
	CreateCodingAssessmentPayload,
	CreateGenericAssessmentPayload,
	CreatePrescreeningFormPayload,
	CreatePsychometricAssessmentPayload,
	CreateVoiceAssessmentPayload,
	GenericAssessment,
	PrescreeningForm,
	PsychometricAssessment,
	StageType,
	VoiceAssessment,
} from "#/integrations/api/client";
import {
	assessmentQueries,
	useCreateCodingAssessment,
	useCreateGenericAssessment,
	useCreatePrescreeningForm,
	useCreatePsychometricAssessment,
	useCreateVoiceAssessment,
	useUpdateCodingAssessment,
	useUpdateGenericAssessment,
	useUpdatePrescreeningForm,
	useUpdatePsychometricAssessment,
	useUpdateVoiceAssessment,
} from "#/integrations/api/queries";

type AssessmentPickerModalProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	stageType: StageType;
	mode: "link" | "edit";
	editingAssessmentId: string | null;
	onLinked: (assessmentId: string) => void;
};

export function AssessmentPickerModal({
	open,
	onOpenChange,
	stageType,
	mode,
	editingAssessmentId,
	onLinked,
}: AssessmentPickerModalProps) {
	const [tab, setTab] = useState<"pick" | "new">("pick");
	const [search, setSearch] = useState("");
	const listParams = useMemo(
		() => ({ q: search, limit: 50, offset: 0 }),
		[search],
	);

	const voiceList = useQuery({
		...assessmentQueries.voice.list(listParams),
		enabled: open && stageType === "VoiceInterview",
	});
	const genericList = useQuery({
		...assessmentQueries.generic.list(listParams),
		enabled: open && stageType === "GenericAssessment",
	});
	const codingList = useQuery({
		...assessmentQueries.coding.list(listParams),
		enabled: open && stageType === "CodingAssessment",
	});
	const psychList = useQuery({
		...assessmentQueries.psychometric.list(listParams),
		enabled: open && stageType === "PsychometricAssessment",
	});
	const presList = useQuery({
		...assessmentQueries.prescreening.list(listParams),
		enabled: open && stageType === "Prescreening",
	});

	const voiceDetail = useQuery({
		...assessmentQueries.voice.detail(editingAssessmentId ?? ""),
		enabled:
			open &&
			mode === "edit" &&
			stageType === "VoiceInterview" &&
			(editingAssessmentId?.length ?? 0) > 0,
	});
	const genericDetail = useQuery({
		...assessmentQueries.generic.detail(editingAssessmentId ?? ""),
		enabled:
			open &&
			mode === "edit" &&
			stageType === "GenericAssessment" &&
			(editingAssessmentId?.length ?? 0) > 0,
	});
	const codingDetail = useQuery({
		...assessmentQueries.coding.detail(editingAssessmentId ?? ""),
		enabled:
			open &&
			mode === "edit" &&
			stageType === "CodingAssessment" &&
			(editingAssessmentId?.length ?? 0) > 0,
	});
	const psychDetail = useQuery({
		...assessmentQueries.psychometric.detail(editingAssessmentId ?? ""),
		enabled:
			open &&
			mode === "edit" &&
			stageType === "PsychometricAssessment" &&
			(editingAssessmentId?.length ?? 0) > 0,
	});
	const presDetail = useQuery({
		...assessmentQueries.prescreening.detail(editingAssessmentId ?? ""),
		enabled:
			open &&
			mode === "edit" &&
			stageType === "Prescreening" &&
			(editingAssessmentId?.length ?? 0) > 0,
	});

	const createVoice = useCreateVoiceAssessment();
	const updateVoice = useUpdateVoiceAssessment();
	const createGeneric = useCreateGenericAssessment();
	const updateGeneric = useUpdateGenericAssessment();
	const createCoding = useCreateCodingAssessment();
	const updateCoding = useUpdateCodingAssessment();
	const createPsych = useCreatePsychometricAssessment();
	const updatePsych = useUpdatePsychometricAssessment();
	const createPres = useCreatePrescreeningForm();
	const updatePres = useUpdatePrescreeningForm();

	function close() {
		onOpenChange(false);
		setSearch("");
		setTab("pick");
	}

	function handleOpenChange(next: boolean) {
		if (!next) {
			setSearch("");
			setTab("pick");
		}
		onOpenChange(next);
	}

	const title =
		mode === "edit"
			? `Edit ${stageType} assessment`
			: `Link ${stageType} assessment`;

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="max-h-[90vh] max-w-3xl overflow-hidden">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>
				{mode === "edit" && editingAssessmentId ? (
					<EditAssessmentBody
						stageType={stageType}
						loading={
							voiceDetail.isLoading ||
							genericDetail.isLoading ||
							codingDetail.isLoading ||
							psychDetail.isLoading ||
							presDetail.isLoading
						}
						voice={voiceDetail.data ?? null}
						generic={genericDetail.data ?? null}
						coding={codingDetail.data ?? null}
						psych={psychDetail.data ?? null}
						pres={presDetail.data ?? null}
						onDone={(id) => {
							onLinked(id);
							close();
						}}
						onCancel={close}
						updateVoice={updateVoice}
						updateGeneric={updateGeneric}
						updateCoding={updateCoding}
						updatePsych={updatePsych}
						updatePres={updatePres}
						editingAssessmentId={editingAssessmentId}
					/>
				) : (
					<Tabs
						value={tab}
						onValueChange={(v) => setTab(v as "pick" | "new")}
						className="w-full"
					>
						<TabsList>
							<TabsTrigger value="pick">Choose existing</TabsTrigger>
							<TabsTrigger value="new">Create new</TabsTrigger>
						</TabsList>
						<TabsContent value="pick" className="space-y-3 pt-4">
							<Input
								placeholder="Search…"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
							/>
							<ListPane
								stageType={stageType}
								voice={voiceList}
								generic={genericList}
								coding={codingList}
								psych={psychList}
								pres={presList}
								onPick={(id) => {
									onLinked(id);
									close();
								}}
								onSwitchToCreate={() => setTab("new")}
							/>
						</TabsContent>
						<TabsContent value="new" className="pt-4">
							<CreateAssessmentPane
								stageType={stageType}
								onCreated={(id) => {
									onLinked(id);
									close();
								}}
								onCancel={close}
								createVoice={createVoice}
								createGeneric={createGeneric}
								createCoding={createCoding}
								createPsych={createPsych}
								createPres={createPres}
							/>
						</TabsContent>
					</Tabs>
				)}
			</DialogContent>
		</Dialog>
	);
}

function ListPane({
	stageType,
	voice,
	generic,
	coding,
	psych,
	pres,
	onPick,
	onSwitchToCreate,
}: {
	stageType: StageType;
	voice: ReturnType<typeof useQuery>;
	generic: ReturnType<typeof useQuery>;
	coding: ReturnType<typeof useQuery>;
	psych: ReturnType<typeof useQuery>;
	pres: ReturnType<typeof useQuery>;
	onPick: (id: string) => void;
	onSwitchToCreate: () => void;
}) {
	const q =
		stageType === "VoiceInterview"
			? voice
			: stageType === "GenericAssessment"
				? generic
				: stageType === "CodingAssessment"
					? coding
					: stageType === "PsychometricAssessment"
						? psych
						: stageType === "Prescreening"
							? pres
							: null;

	if (!q) {
		return (
			<p className="text-sm text-muted-foreground">
				This stage type does not use a reusable assessment entity.
			</p>
		);
	}

	if (q.isLoading) {
		return (
			<div className="flex justify-center py-12">
				<Loader2 className="size-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (q.error) {
		return (
			<p className="text-sm text-destructive">
				Couldn&apos;t load assessments. Check your connection and try again.
			</p>
		);
	}

	const data = q.data as {
		assessments: Array<{ id: string | null; title?: string; name?: string }>;
	};
	const rows = data.assessments?.filter((a) => a.id) ?? [];

	if (rows.length === 0) {
		return (
			<div className="space-y-3">
				<Button type="button" onClick={onSwitchToCreate}>
					Create your first assessment
				</Button>
				<p className="text-sm text-muted-foreground">
					No assessments found yet. You can also adjust your search.
				</p>
			</div>
		);
	}

	return (
		<ul className="max-h-[min(48vh,400px)] space-y-1 overflow-y-auto pr-1">
			{rows.flatMap((row) => {
				const rid = row.id;
				if (!rid) return [];
				return [
					<li key={rid}>
						<button
							type="button"
							onClick={() => onPick(rid)}
							className="flex w-full items-center rounded-lg border border-border px-3 py-2.5 text-left text-sm hover:bg-muted"
						>
							{row.title ?? row.name ?? "Untitled"}
						</button>
					</li>,
				];
			})}
		</ul>
	);
}

function CreateAssessmentPane({
	stageType,
	onCreated,
	onCancel,
	createVoice,
	createGeneric,
	createCoding,
	createPsych,
	createPres,
}: {
	stageType: StageType;
	onCreated: (id: string) => void;
	onCancel: () => void;
	createVoice: ReturnType<typeof useCreateVoiceAssessment>;
	createGeneric: ReturnType<typeof useCreateGenericAssessment>;
	createCoding: ReturnType<typeof useCreateCodingAssessment>;
	createPsych: ReturnType<typeof useCreatePsychometricAssessment>;
	createPres: ReturnType<typeof useCreatePrescreeningForm>;
}) {
	async function persist(idPromise: Promise<{ id: string | null }>) {
		const row = await idPromise;
		if (row?.id) onCreated(row.id);
	}

	switch (stageType) {
		case "VoiceInterview":
			return (
				<VoiceAssessmentForm
					initial={emptyVoiceAssessmentPayload()}
					submitLabel="Create & link"
					onCancel={onCancel}
					onSubmit={async (body) => {
						const row = await createVoice.mutateAsync(body);
						if (row.id) onCreated(row.id);
					}}
				/>
			);
		case "GenericAssessment":
			return (
				<GenericAssessmentForm
					initial={emptyGenericAssessmentPayload()}
					submitLabel="Create & link"
					onCancel={onCancel}
					onSubmit={async (body) => persist(createGeneric.mutateAsync(body))}
				/>
			);
		case "CodingAssessment":
			return (
				<CodingAssessmentForm
					initial={emptyCodingAssessmentPayload()}
					submitLabel="Create & link"
					onCancel={onCancel}
					onSubmit={async (body) => persist(createCoding.mutateAsync(body))}
				/>
			);
		case "PsychometricAssessment":
			return (
				<PsychometricAssessmentForm
					initial={emptyPsychometricAssessmentPayload()}
					submitLabel="Create & link"
					onCancel={onCancel}
					onSubmit={async (body) => persist(createPsych.mutateAsync(body))}
				/>
			);
		case "Prescreening":
			return (
				<PrescreeningFormComponent
					initial={emptyPrescreeningPayload()}
					submitLabel="Create & link"
					onCancel={onCancel}
					onSubmit={async (body) => persist(createPres.mutateAsync(body))}
				/>
			);
		default:
			return (
				<p className="text-sm text-muted-foreground">
					No assessment factory for «{stageType}».
				</p>
			);
	}
}

function EditAssessmentBody({
	stageType,
	loading,
	voice,
	generic,
	coding,
	psych,
	pres,
	onDone,
	onCancel,
	updateVoice,
	updateGeneric,
	updateCoding,
	updatePsych,
	updatePres,
	editingAssessmentId,
}: {
	stageType: StageType;
	loading: boolean;
	voice: VoiceAssessment | null;
	generic: GenericAssessment | null;
	coding: CodingAssessment | null;
	psych: PsychometricAssessment | null;
	pres: PrescreeningForm | null;
	onDone: (id: string) => void;
	onCancel: () => void;
	updateVoice: ReturnType<typeof useUpdateVoiceAssessment>;
	updateGeneric: ReturnType<typeof useUpdateGenericAssessment>;
	updateCoding: ReturnType<typeof useUpdateCodingAssessment>;
	updatePsych: ReturnType<typeof useUpdatePsychometricAssessment>;
	updatePres: ReturnType<typeof useUpdatePrescreeningForm>;
	editingAssessmentId: string;
}) {
	if (loading) {
		return (
			<div className="flex justify-center py-16">
				<Loader2 className="size-6 animate-spin" />
			</div>
		);
	}

	switch (stageType) {
		case "VoiceInterview":
			return voice?.id ? (
				<VoiceAssessmentForm
					initial={toVoicePayload(voice)}
					submitLabel="Save changes"
					onCancel={onCancel}
					onSubmit={async (body) => {
						const row = await updateVoice.mutateAsync({
							id: editingAssessmentId,
							body,
						});
						if (row.id) onDone(row.id);
					}}
				/>
			) : (
				<MissingAssessment />
			);
		case "GenericAssessment":
			return generic?.id ? (
				<GenericAssessmentForm
					initial={toGenericPayload(generic)}
					submitLabel="Save changes"
					onCancel={onCancel}
					onSubmit={async (body) => {
						const row = await updateGeneric.mutateAsync({
							id: editingAssessmentId,
							body,
						});
						if (row.id) onDone(row.id);
					}}
				/>
			) : (
				<MissingAssessment />
			);
		case "CodingAssessment":
			return coding?.id ? (
				<CodingAssessmentForm
					initial={toCodingPayload(coding)}
					submitLabel="Save changes"
					onCancel={onCancel}
					onSubmit={async (body) => {
						const row = await updateCoding.mutateAsync({
							id: editingAssessmentId,
							body,
						});
						if (row.id) onDone(row.id);
					}}
				/>
			) : (
				<MissingAssessment />
			);
		case "PsychometricAssessment":
			return psych?.id ? (
				<PsychometricAssessmentForm
					initial={toPsychPayload(psych)}
					submitLabel="Save changes"
					onCancel={onCancel}
					onSubmit={async (body) => {
						const row = await updatePsych.mutateAsync({
							id: editingAssessmentId,
							body,
						});
						if (row.id) onDone(row.id);
					}}
				/>
			) : (
				<MissingAssessment />
			);
		case "Prescreening":
			return pres?.id ? (
				<PrescreeningFormComponent
					initial={toPresPayload(pres)}
					submitLabel="Save changes"
					onCancel={onCancel}
					onSubmit={async (body) => {
						const row = await updatePres.mutateAsync({
							id: editingAssessmentId,
							body,
						});
						if (row.id) onDone(row.id);
					}}
				/>
			) : (
				<MissingAssessment />
			);
		default:
			return (
				<p className="text-sm text-muted-foreground">
					Nothing to edit for this stage type.
				</p>
			);
	}
}

function MissingAssessment() {
	return (
		<p className="text-sm text-muted-foreground">
			Couldn&apos;t load this assessment. It may have been deleted.
		</p>
	);
}

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

function toGenericPayload(
	row: GenericAssessment,
): CreateGenericAssessmentPayload {
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

function toCodingPayload(row: CodingAssessment): CreateCodingAssessmentPayload {
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

function toPsychPayload(
	row: PsychometricAssessment,
): CreatePsychometricAssessmentPayload {
	return {
		title: row.title,
		description: row.description,
		slug: row.slug,
		framework: row.framework,
		time_limit_minutes: row.time_limit_minutes,
		items: row.items.map((item) => ({ ...item })),
	};
}

function toPresPayload(row: PrescreeningForm): CreatePrescreeningFormPayload {
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
