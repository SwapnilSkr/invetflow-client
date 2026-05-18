import {
	DragDropContext,
	Draggable,
	type DraggableProvidedDragHandleProps,
	Droppable,
	type DropResult,
} from "@hello-pangea/dnd";
import { queryOptions, useQueries } from "@tanstack/react-query";
import {
	ArrowLeft,
	ArrowRight,
	Bot,
	Check,
	ChevronDown,
	GripVertical,
	Info,
	Loader2,
	Settings,
	Trash2,
	X,
} from "lucide-react";
import { type JSX, useState } from "react";
import { AssessmentPickerModal } from "#/components/jobs/create/assessment-picker-modal";
import { HumanInterviewConfigDialog } from "#/components/jobs/create/HumanInterviewConfigDialog";
import {
	defaultPipeline,
	newClientId,
	normalizeJobStage,
} from "#/components/jobs/create/job-create-state";
import { PipelineAddStageMenu } from "#/components/jobs/create/pipeline-add-stage-menu";
import {
	AUTOMATION_BADGE,
	getLinkedAssessmentId,
	setLinkedAssessmentId,
	stageIcon,
	stageRequiresAssessmentLink,
	stageTypeLabel,
	unlinkStage,
} from "#/components/jobs/create/pipeline-stage-meta";
import type { DraftState, DraftUpdate } from "#/components/jobs/create/types";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "#/components/ui/tooltip";
import type {
	CodingAssessment,
	GenericAssessment,
	HumanInterviewStageConfig,
	JobStage,
	PrescreeningForm,
	PsychometricAssessment,
	StageAutomation,
	StageType,
	VoiceAssessment,
} from "#/integrations/api/client";
import { assessmentQueries } from "#/integrations/api/queries";

// ─── Types ───────────────────────────────────────────────────────────────────

type PhasePipelineProps = {
	draft: DraftState;
	update: DraftUpdate;
	errors: Record<string, string>;
	onGeneratePipeline: () => Promise<void>;
	generating: boolean;
	onSaveAndContinue: () => Promise<void>;
	isSaving: boolean;
	onBack: () => void;
};

type PickerState = {
	open: boolean;
	mode: "link" | "edit";
	targetStageId: string | null;
	editAssessmentId: string | null;
};

type InterviewConfigState = {
	open: boolean;
	targetStageId: string | null;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const AUTOMATION_OPTIONS: StageAutomation[] = [
	"None",
	"SendInvitation",
	"ScheduleMeeting",
	"SendRejection",
	"SendHiredNotification",
];

const ESTIMATED_MINUTES: Record<StageType, number> = {
	Applied: 0,
	Prescreening: 5,
	VoiceInterview: 20,
	GenericAssessment: 15,
	CodingAssessment: 45,
	PsychometricAssessment: 12,
	Consent: 2,
	HumanInterview: 30,
	ManualReview: 0,
	Offer: 0,
	Hired: 0,
	Rejected: 0,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function automationLabel(a: StageAutomation): string {
	const map: Record<StageAutomation, string> = {
		None: "None",
		SendInvitation: "Send invitation",
		ScheduleMeeting: "Schedule meeting",
		SendRejection: "Send rejection",
		SendHiredNotification: "Send hired notification",
	};
	return map[a] ?? a;
}

function automationHelp(a: StageAutomation): string {
	const map: Record<StageAutomation, string> = {
		None: "No automatic action is triggered when a candidate reaches this stage.",
		SendInvitation:
			"Automatically sends the candidate an invitation for this stage.",
		ScheduleMeeting:
			"Starts the scheduling flow for a recruiter or interviewer meeting.",
		SendRejection:
			"Automatically sends a rejection notification from this stage.",
		SendHiredNotification:
			"Automatically sends the hired notification when the candidate reaches this stage.",
	};
	return map[a] ?? "";
}

function humanTitle(t: StageType): string {
	return stageTypeLabel(t);
}

function noopAssessmentQuery(stageId: string) {
	return queryOptions({
		queryKey: ["assessment-detail-skip", stageId],
		queryFn: async () => null,
		enabled: false,
	});
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AutomationDropdown({
	value,
	onChange,
}: {
	value: StageAutomation;
	onChange: (next: StageAutomation) => void;
}) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					type="button"
					variant="outline"
					className="h-9 w-full justify-between px-3 font-normal"
				>
					{automationLabel(value)}
					<ChevronDown className="size-4 opacity-60" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-64">
				{AUTOMATION_OPTIONS.map((option) => (
					<DropdownMenuItem
						key={option}
						className="gap-2"
						onSelect={(e) => {
							e.preventDefault();
							onChange(option);
						}}
					>
						<Check
							className={`size-4 ${option === value ? "opacity-100" : "opacity-0"}`}
						/>
						<span>{automationLabel(option)}</span>
						<Tooltip>
							<TooltipTrigger asChild>
								<button
									type="button"
									tabIndex={-1}
									aria-label={`About ${automationLabel(option)}`}
									className="ml-auto inline-flex size-5 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
									onPointerDown={(e) => e.preventDefault()}
									onClick={(e) => e.preventDefault()}
								>
									<Info className="size-3.5" />
								</button>
							</TooltipTrigger>
							<TooltipContent side="right" className="max-w-[260px]">
								{automationHelp(option)}
							</TooltipContent>
						</Tooltip>
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function FlagRow({
	label,
	value,
	help,
	onChange,
}: {
	label: string;
	value: boolean;
	help: string;
	onChange: (next: boolean) => void;
}) {
	return (
		<label className="flex min-h-7 min-w-0 items-center justify-between gap-2 rounded-sm px-1.5 py-1 transition-colors hover:bg-muted/50">
			<div className="flex min-w-0 items-center gap-2">
				<input
					type="checkbox"
					checked={value}
					onChange={(e) => onChange(e.target.checked)}
				/>
				<span className="truncate text-xs">{label}</span>
			</div>
			<Tooltip>
				<TooltipTrigger asChild>
					<button
						type="button"
						aria-label={`What ${label} means`}
						className="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground transition hover:bg-background hover:text-foreground"
					>
						<Info className="size-3" />
					</button>
				</TooltipTrigger>
				<TooltipContent side="left" className="max-w-[260px] text-pretty">
					{help}
				</TooltipContent>
			</Tooltip>
		</label>
	);
}

function HumanInterviewSummaryChip({
	config,
}: {
	config: HumanInterviewStageConfig;
}) {
	const parts = [
		`${config.max_duration_minutes} min`,
		`recording ${config.recording_enabled ? "on" : "off"}`,
		`transcript ${config.transcription_enabled ? "on" : "off"}`,
		`waiting room ${config.waiting_room_enabled ? "on" : "off"}`,
	];
	return (
		<span className="mt-1 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
			{parts.join(" · ")}
		</span>
	);
}

// ─── MiniCandidatePreviewCard ────────────────────────────────────────────────

type MiniCandidatePreviewCardProps = {
	stage: JobStage;
};

function MiniCandidatePreviewCard({ stage }: MiniCandidatePreviewCardProps) {
	const Icon = stageIcon(stage.stage_type);
	const badge = AUTOMATION_BADGE[stage.automation];
	const estimatedMinutes = ESTIMATED_MINUTES[stage.stage_type] ?? 0;
	const candidateFacing = stage.candidate_facing;

	return (
		<div className="mt-4 flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-3">
			<div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-background">
				<Icon className="size-4 text-muted-foreground" aria-hidden />
			</div>
			<div className="min-w-0 flex-1">
				<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
					Candidate view
				</p>
				<p className="text-sm font-medium text-foreground truncate">
					{stage.title ?? stageTypeLabel(stage.stage_type)}
				</p>
				<p className="text-xs text-muted-foreground mt-0.5">
					{candidateFacing ? "Candidate sees this stage" : "Internal stage"}
					{estimatedMinutes > 0 ? ` · ~${estimatedMinutes} min` : ""}
				</p>
			</div>
			<span
				className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${badge.className}`}
			>
				{badge.label}
			</span>
		</div>
	);
}

// ─── StageNode ───────────────────────────────────────────────────────────────

type StageNodeProps = {
	stage: JobStage;
	index: number;
	selected: boolean;
	onSelect: (id: string) => void;
	dragHandleProps: DraggableProvidedDragHandleProps | null | undefined;
};

function StageNode({
	stage,
	index,
	selected,
	onSelect,
	dragHandleProps,
}: StageNodeProps) {
	const Icon = stageIcon(stage.stage_type);
	const badge = AUTOMATION_BADGE[stage.automation];

	return (
		<li className="flex items-center gap-2">
			{/* Drag handle */}
			<button
				type="button"
				aria-label="Reorder stage"
				className="flex h-8 w-5 cursor-grab items-center justify-center text-muted-foreground opacity-0 transition-opacity group-hover/node:opacity-100 active:cursor-grabbing focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
				{...dragHandleProps}
			>
				<GripVertical className="size-4" aria-hidden />
			</button>

			{/* Node button */}
			<button
				type="button"
				aria-current={selected ? "true" : undefined}
				onClick={() => onSelect(stage.id)}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						onSelect(stage.id);
					}
				}}
				className={[
					"group/node-btn relative flex min-w-0 flex-1 items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
					selected
						? "border-primary/30 bg-accent ring-2 ring-ring"
						: "border-border bg-card hover:bg-accent/50",
				].join(" ")}
			>
				{/* Stage icon circle */}
				<div
					className={[
						"flex size-9 shrink-0 items-center justify-center rounded-full border",
						selected
							? "border-primary/30 bg-primary/10"
							: "border-border bg-background",
					].join(" ")}
				>
					<Icon
						className={`size-4 ${selected ? "text-primary" : "text-muted-foreground"}`}
						aria-hidden
					/>
				</div>

				{/* Text */}
				<div className="min-w-0 flex-1">
					<p className="truncate text-sm font-medium text-foreground">
						{stage.title ?? stageTypeLabel(stage.stage_type)}
					</p>
					<p className="truncate text-xs text-muted-foreground">
						{stage.is_system_stage
							? "System stage"
							: stageTypeLabel(stage.stage_type)}
					</p>
				</div>

				{/* Badge */}
				<span
					className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${badge.className}`}
				>
					{badge.label}
				</span>

				{/* Index badge */}
				<span className="shrink-0 text-xs text-muted-foreground">
					{index + 1}
				</span>
			</button>
		</li>
	);
}

// ─── StageFlowRail ───────────────────────────────────────────────────────────

type StageFlowRailProps = {
	stages: JobStage[];
	selectedStageId: string | null;
	onSelectStage: (id: string) => void;
	onReorder: (result: DropResult) => void;
};

function StageFlowRail({
	stages,
	selectedStageId,
	onSelectStage,
	onReorder,
}: StageFlowRailProps) {
	if (stages.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
				<p className="text-sm font-medium text-foreground">No stages yet</p>
				<p className="mt-1 text-xs text-muted-foreground">
					Add a stage or generate suggestions to build your pipeline.
				</p>
			</div>
		);
	}

	return (
		<DragDropContext onDragEnd={onReorder}>
			<Droppable droppableId="pipeline-stages" type="PIPELINE_STAGE">
				{(dropProvided) => (
					<ul
						ref={dropProvided.innerRef}
						{...dropProvided.droppableProps}
						className="relative space-y-1 before:absolute before:left-[1.6rem] before:top-0 before:h-full before:w-0.5 before:bg-border before:content-['']"
					>
						{stages.map((stage, index) => (
							<Draggable key={stage.id} draggableId={stage.id} index={index}>
								{(dragProvided) => (
									<div
										ref={dragProvided.innerRef}
										{...dragProvided.draggableProps}
										className="group/node relative"
									>
										<StageNode
											stage={stage}
											index={index}
											selected={selectedStageId === stage.id}
											onSelect={onSelectStage}
											dragHandleProps={dragProvided.dragHandleProps}
										/>
									</div>
								)}
							</Draggable>
						))}
						{dropProvided.placeholder}
					</ul>
				)}
			</Droppable>
		</DragDropContext>
	);
}

// ─── LinkedEntityBlock ───────────────────────────────────────────────────────

type LinkedEntityBlockProps = {
	stage: JobStage;
	fetchedData: unknown;
	fetchStatus: "pending" | "error" | "success";
	fetchingInProgress: boolean;
	onLink: () => void;
	onEdit: () => void;
	onUnlink: () => void;
};

function LinkedEntityBlock({
	stage,
	fetchedData,
	fetchStatus,
	fetchingInProgress,
	onLink,
	onEdit,
	onUnlink,
}: LinkedEntityBlockProps) {
	const linkedId = getLinkedAssessmentId(stage);

	let summaryLines: JSX.Element | null = null;

	if (linkedId && fetchingInProgress) {
		summaryLines = (
			<span className="inline-flex items-center gap-2 text-muted-foreground">
				<Loader2 className="size-4 animate-spin" />
				Fetching linked assessment…
			</span>
		);
	} else if (fetchStatus === "error") {
		summaryLines = (
			<span className="text-xs text-destructive">
				Could not load assessment (routes may still be deploying).
			</span>
		);
	} else if (linkedId) {
		const fq = fetchedData;
		switch (stage.stage_type) {
			case "VoiceInterview": {
				const v = fq as VoiceAssessment | null;
				const qCount = v?.questions?.length ?? 0;
				summaryLines = (
					<>
						<p className="text-sm font-medium text-foreground">
							{v?.title ?? "Voice assessment"}
						</p>
						<p className="mt-1 text-xs text-muted-foreground">
							{v?.skills?.length ?? 0} skills · {qCount} questions · pass{" "}
							{v?.pass_score ?? "—"}
						</p>
						{v?.delivery_method === "Phone" ? (
							<p className="mt-2 text-[11px] text-amber-700">
								Phone delivery: additional stages locked for this funnel.
							</p>
						) : null}
					</>
				);
				break;
			}
			case "GenericAssessment": {
				const v = fq as GenericAssessment | null;
				summaryLines = (
					<>
						<p className="text-sm font-medium">{v?.title ?? "Assessment"}</p>
						<p className="mt-1 text-xs text-muted-foreground">
							{v?.questions?.length ?? 0} questions ·{" "}
							{v?.time_limit_minutes ?? "—"} min
						</p>
					</>
				);
				break;
			}
			case "CodingAssessment": {
				const v = fq as CodingAssessment | null;
				summaryLines = (
					<>
						<p className="text-sm font-medium">{v?.title ?? "Coding pack"}</p>
						<p className="mt-1 text-xs text-muted-foreground">
							{v?.problems?.length ?? 0} problems · pass{" "}
							{v?.pass_completion_number ?? "—"}
						</p>
					</>
				);
				break;
			}
			case "PsychometricAssessment": {
				const v = fq as PsychometricAssessment | null;
				summaryLines = (
					<>
						<p className="text-sm font-medium">{v?.title ?? "Psychometric"}</p>
						<p className="mt-1 text-xs text-muted-foreground">
							{v?.framework ?? "—"}
						</p>
					</>
				);
				break;
			}
			case "Prescreening": {
				const v = fq as PrescreeningForm | null;
				summaryLines = (
					<>
						<p className="text-sm font-medium">{v?.name ?? "Prescreening"}</p>
						<p className="mt-1 text-xs text-muted-foreground">
							{v?.questions?.length ?? 0} questions
						</p>
					</>
				);
				break;
			}
			default:
				break;
		}
	} else {
		summaryLines = (
			<span className="text-sm text-muted-foreground">
				No reusable assessment linked yet.
			</span>
		);
	}

	return (
		<div
			className={
				"mt-4 rounded-md px-3 py-2 " +
				(linkedId
					? "border border-border bg-muted/20"
					: "border border-dashed border-border bg-background")
			}
		>
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="min-w-0">
					<p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
						Linked entity
					</p>
					{summaryLines}
				</div>
				<div className="flex shrink-0 flex-wrap gap-2">
					{!linkedId ? (
						<Button
							type="button"
							size="sm"
							variant="secondary"
							onClick={onLink}
						>
							Link
						</Button>
					) : (
						<>
							<Button
								type="button"
								size="sm"
								variant="outline"
								onClick={onEdit}
							>
								Edit
							</Button>
							<Button
								type="button"
								size="sm"
								variant="ghost"
								onClick={onUnlink}
							>
								Unlink
							</Button>
						</>
					)}
				</div>
			</div>
		</div>
	);
}

// ─── StageInspector ──────────────────────────────────────────────────────────

type StageInspectorProps = {
	stage: JobStage;
	fetchedData: unknown;
	fetchStatus: "pending" | "error" | "success";
	fetchingInProgress: boolean;
	onPatch: (patch: Partial<JobStage>) => void;
	onDelete: () => void;
	onOpenPicker: (mode: "link" | "edit", editId: string | null) => void;
	onUnlink: () => void;
	onOpenInterviewConfig: () => void;
};

function StageInspector({
	stage,
	fetchedData,
	fetchStatus,
	fetchingInProgress,
	onPatch,
	onDelete,
	onOpenPicker,
	onUnlink,
	onOpenInterviewConfig,
}: StageInspectorProps) {
	const Icon = stageIcon(stage.stage_type);
	const linkedId = getLinkedAssessmentId(stage);

	return (
		<div className="flex flex-col gap-4">
			{/* Header */}
			<div className="flex items-center gap-3">
				<div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-background">
					<Icon className="size-5 text-muted-foreground" aria-hidden />
				</div>
				<div className="min-w-0 flex-1">
					<Input
						className="h-8 border-transparent bg-transparent px-0 text-base font-semibold shadow-none focus-visible:border-transparent focus-visible:ring-0"
						value={stage.title ?? ""}
						placeholder={stageTypeLabel(stage.stage_type)}
						onChange={(e) => onPatch({ title: e.target.value || null })}
						aria-label="Stage title"
					/>
					<p className="text-xs text-muted-foreground">
						{stageTypeLabel(stage.stage_type)}
					</p>
				</div>
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					disabled={stage.is_system_stage}
					title={
						stage.is_system_stage
							? "System stages can't be deleted"
							: "Remove stage"
					}
					onClick={onDelete}
					aria-label="Remove stage"
				>
					<Trash2 className="size-4" />
				</Button>
			</div>

			{/* Stage type chip */}
			<div>
				<p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
					Stage type
				</p>
				<span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-foreground">
					<Icon className="size-3.5" aria-hidden />
					{stageTypeLabel(stage.stage_type)}
				</span>
			</div>

			{/* HumanInterview config */}
			{stage.stage_type === "HumanInterview" ? (
				<div className="rounded-md border border-border bg-muted/20 px-3 py-2">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div className="min-w-0">
							<p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
								Interview settings
							</p>
							{stage.human_interview_config ? (
								<HumanInterviewSummaryChip
									config={stage.human_interview_config}
								/>
							) : (
								<p className="text-sm text-muted-foreground">
									No interview settings configured yet.
								</p>
							)}
						</div>
						<Button
							type="button"
							size="sm"
							variant="secondary"
							onClick={onOpenInterviewConfig}
						>
							<Settings className="mr-1 size-3.5" />
							Configure interview
						</Button>
					</div>
				</div>
			) : null}

			{/* Linked entity */}
			{stageRequiresAssessmentLink(stage.stage_type) ? (
				<LinkedEntityBlock
					stage={stage}
					fetchedData={fetchedData}
					fetchStatus={fetchStatus}
					fetchingInProgress={fetchingInProgress}
					onLink={() => onOpenPicker("link", null)}
					onEdit={() => onOpenPicker("edit", linkedId)}
					onUnlink={onUnlink}
				/>
			) : (
				<p className="text-xs text-muted-foreground">
					System/interview-only stage · no reusable entity needed.
				</p>
			)}

			{/* Automation */}
			<div className="grid gap-1.5">
				<Label className="text-xs font-normal text-muted-foreground">
					Automation
				</Label>
				<AutomationDropdown
					value={stage.automation}
					onChange={(next) => onPatch({ automation: next })}
				/>
			</div>

			{/* Pass score */}
			<div className="grid gap-1.5">
				<Label className="text-xs font-normal text-muted-foreground">
					Pass score
				</Label>
				<Input
					type="number"
					className="h-9"
					value={stage.pass_score ?? ""}
					onChange={(e) =>
						onPatch({
							pass_score: e.target.value ? Number(e.target.value) : null,
						})
					}
				/>
			</div>

			{/* Flags */}
			<div className="grid gap-1">
				<p className="text-xs text-muted-foreground">Stage behavior</p>
				<FlagRow
					label="Mandatory"
					value={stage.is_mandatory}
					help="Candidates must complete this stage to progress through the pipeline."
					onChange={(checked) => onPatch({ is_mandatory: checked })}
				/>
				<FlagRow
					label="Candidate-facing"
					value={stage.candidate_facing}
					help="This stage is visible to candidates and can include instructions or actions they must take."
					onChange={(checked) => onPatch({ candidate_facing: checked })}
				/>
				<FlagRow
					label="Contributes"
					value={stage.contributes_to_score}
					help="Results from this stage count toward overall candidate scoring and ranking."
					onChange={(checked) => onPatch({ contributes_to_score: checked })}
				/>
			</div>

			{/* Mini candidate preview card */}
			<MiniCandidatePreviewCard stage={stage} />
		</div>
	);
}

// ─── MobileInspectorSheet ────────────────────────────────────────────────────

type MobileInspectorSheetProps = {
	open: boolean;
	onClose: () => void;
	children: React.ReactNode;
};

function MobileInspectorSheet({
	open,
	onClose,
	children,
}: MobileInspectorSheetProps) {
	return (
		<Dialog open={open} onOpenChange={(v) => !v && onClose()}>
			<DialogContent className="max-h-[90vh] w-full overflow-y-auto sm:max-w-lg">
				<DialogHeader>
					<DialogTitle className="sr-only">Stage inspector</DialogTitle>
					<button
						type="button"
						onClick={onClose}
						className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
						aria-label="Close inspector"
					>
						<X className="size-4" />
					</button>
				</DialogHeader>
				{children}
			</DialogContent>
		</Dialog>
	);
}

// ─── PhasePipeline (main) ─────────────────────────────────────────────────────

export function PhasePipeline({
	draft,
	update,
	errors,
	onGeneratePipeline,
	generating,
	onSaveAndContinue,
	isSaving,
	onBack,
}: PhasePipelineProps) {
	const stages = draft.pipeline.stages;

	// Default selection: first non-Applied stage, or first stage, or null
	const defaultSelected =
		stages.find((s) => s.stage_type !== "Applied")?.id ?? stages[0]?.id ?? null;

	const [selectedStageId, setSelectedStageId] = useState<string | null>(
		defaultSelected,
	);
	const [picker, setPicker] = useState<PickerState>({
		open: false,
		mode: "link",
		targetStageId: null,
		editAssessmentId: null,
	});
	const [interviewConfig, setInterviewConfig] = useState<InterviewConfigState>({
		open: false,
		targetStageId: null,
	});

	// Derive selected stage during render — no effect needed
	const selectedStage = stages.find((s) => s.id === selectedStageId) ?? null;

	// ─── Stage mutation helpers ───────────────────────────────────────────────

	function setStages(nextStages: JobStage[]) {
		update("pipeline", {
			stages: nextStages.map((stage, order) =>
				normalizeJobStage({ ...stage, order }, order),
			),
		});
	}

	function addStage(stageType: StageType) {
		const base = normalizeJobStage(
			{
				id: newClientId("stage"),
				title: humanTitle(stageType),
				stage_type: stageType,
				is_mandatory: stageType === "VoiceInterview",
				candidate_facing:
					stageType === "Prescreening" ||
					stageType === "Consent" ||
					stageType === "HumanInterview" ||
					stageType === "Offer" ||
					stageType === "GenericAssessment",
				contributes_to_score: stageType === "VoiceInterview",
				automation: stageType === "VoiceInterview" ? "SendInvitation" : "None",
				pass_score: null,
				is_system_stage:
					stageType === "Applied" ||
					stageType === "Hired" ||
					stageType === "Rejected",
				voice_assessment_id: null,
				generic_assessment_id: null,
				coding_assessment_id: null,
				psychometric_assessment_id: null,
				prescreening_form_id: null,
			},
			stages.length,
		);
		setStages([...stages, base]);
		setSelectedStageId(base.id);
	}

	function deleteStage(id: string) {
		const idx = stages.findIndex((s) => s.id === id);
		const next = stages.filter((s) => s.id !== id);
		setStages(next);
		if (selectedStageId === id) {
			// Select next, or previous if it was last
			const nextSelected =
				next[idx]?.id ?? next[idx - 1]?.id ?? next[0]?.id ?? null;
			setSelectedStageId(nextSelected);
		}
	}

	function patchStage(id: string, patch: Partial<JobStage>) {
		setStages(stages.map((s) => (s.id === id ? { ...s, ...patch } : s)));
	}

	function handleStageDragEnd(result: DropResult) {
		const destination = result.destination;
		if (!destination || destination.index === result.source.index) return;
		const next = [...stages];
		const [moved] = next.splice(result.source.index, 1);
		next.splice(destination.index, 0, moved);
		setStages(next);
	}

	// ─── Assessment queries ───────────────────────────────────────────────────

	const queries = stages.map((stage) => {
		const id = getLinkedAssessmentId(stage);
		const needsFetch = Boolean(
			id &&
				stage.stage_type !== "Applied" &&
				stageRequiresAssessmentLink(stage.stage_type),
		);

		switch (stage.stage_type) {
			case "VoiceInterview":
				return needsFetch && id
					? assessmentQueries.voice.detail(id)
					: noopAssessmentQuery(stage.id);
			case "GenericAssessment":
				return needsFetch && id
					? assessmentQueries.generic.detail(id)
					: noopAssessmentQuery(stage.id);
			case "CodingAssessment":
				return needsFetch && id
					? assessmentQueries.coding.detail(id)
					: noopAssessmentQuery(stage.id);
			case "PsychometricAssessment":
				return needsFetch && id
					? assessmentQueries.psychometric.detail(id)
					: noopAssessmentQuery(stage.id);
			case "Prescreening":
				return needsFetch && id
					? assessmentQueries.prescreening.detail(id)
					: noopAssessmentQuery(stage.id);
			default:
				return noopAssessmentQuery(stage.id);
		}
	});

	const fetched = useQueries({ queries });

	// Phone-locks-adds logic
	const voiceIdsLinked = stages
		.filter(
			(s) =>
				s.stage_type === "VoiceInterview" &&
				typeof s.voice_assessment_id === "string" &&
				s.voice_assessment_id.length > 0,
		)
		.map((s) => s.voice_assessment_id as string);

	const phoneWatch = useQueries({
		queries: voiceIdsLinked.map((id) => assessmentQueries.voice.detail(id)),
	});

	const phoneLocksAdds =
		voiceIdsLinked.length > 0 &&
		voiceIdsLinked.some((_id, i) => {
			const row = phoneWatch[i]?.data as VoiceAssessment | null | undefined;
			return row?.delivery_method === "Phone";
		});

	const unlinkedAssessmentCount = stages.filter(
		(s) =>
			stageRequiresAssessmentLink(s.stage_type) && !getLinkedAssessmentId(s),
	).length;

	// Inspector data for selected stage
	const selectedIndex = selectedStage
		? stages.findIndex((s) => s.id === selectedStage.id)
		: -1;
	const selectedFetched =
		selectedIndex >= 0 ? fetched[selectedIndex] : undefined;

	const pickerStage = picker.targetStageId
		? stages.find((s) => s.id === picker.targetStageId)
		: null;

	// ─── Inspector content (reused for desktop and mobile sheet) ─────────────

	const inspectorContent =
		selectedStage && selectedFetched !== undefined ? (
			<StageInspector
				stage={selectedStage}
				fetchedData={selectedFetched.data ?? null}
				fetchStatus={selectedFetched.status}
				fetchingInProgress={
					selectedFetched.status === "pending" ||
					selectedFetched.fetchStatus === "fetching"
				}
				onPatch={(patch) => patchStage(selectedStage.id, patch)}
				onDelete={() => deleteStage(selectedStage.id)}
				onOpenPicker={(mode, editId) =>
					setPicker({
						open: true,
						mode,
						targetStageId: selectedStage.id,
						editAssessmentId: editId,
					})
				}
				onUnlink={() =>
					setStages(
						stages.map((s) => (s.id === selectedStage.id ? unlinkStage(s) : s)),
					)
				}
				onOpenInterviewConfig={() =>
					setInterviewConfig({ open: true, targetStageId: selectedStage.id })
				}
			/>
		) : (
			<p className="text-sm text-muted-foreground">
				Select a stage to inspect and configure it.
			</p>
		);

	return (
		<TooltipProvider delayDuration={180}>
			<div className="space-y-4">
				{/* Error banner */}
				{errors["pipeline.stages"] ? (
					<p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
						{errors["pipeline.stages"]}
					</p>
				) : null}
				{unlinkedAssessmentCount > 0 ? (
					<p className="rounded-md border border-border bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
						{unlinkedAssessmentCount} assessment stage(s) still need an entity
						linked before publishing.
					</p>
				) : null}

				{/* Toolbar */}
				<div className="flex flex-wrap gap-2">
					<Button
						type="button"
						variant="outline"
						disabled={generating}
						onClick={() => void onGeneratePipeline()}
					>
						<Bot className="size-4" />
						Generate stage suggestions
					</Button>
					<Button
						type="button"
						variant="outline"
						disabled={generating}
						onClick={() => setStages(defaultPipeline().stages)}
					>
						Reset defaults
					</Button>
					<PipelineAddStageMenu
						existingStages={stages}
						phoneInterviewLocksAdds={phoneLocksAdds}
						onAdd={addStage}
					/>
				</div>

				<p className="text-xs text-muted-foreground">
					Generate stage suggestions uses the job title, seniority, and
					description to replace the current stage list with an AI-suggested
					pipeline. It does not create or link assessments automatically.
				</p>

				{/* Split layout */}
				<div className="flex flex-col gap-4 md:flex-row md:items-start">
					{/* Rail */}
					<div className="md:w-[340px] md:shrink-0 lg:w-[380px]">
						<StageFlowRail
							stages={stages}
							selectedStageId={selectedStageId}
							onSelectStage={setSelectedStageId}
							onReorder={handleStageDragEnd}
						/>
					</div>

					{/* Desktop inspector */}
					<div className="hidden min-w-0 flex-1 rounded-lg border border-border bg-card p-4 md:block">
						{inspectorContent}
					</div>
				</div>

				{/* Mobile inspector sheet */}
				<MobileInspectorSheet
					open={selectedStageId !== null}
					onClose={() => setSelectedStageId(null)}
				>
					{inspectorContent}
				</MobileInspectorSheet>

				{/* Assessment picker modal */}
				{pickerStage ? (
					<AssessmentPickerModal
						open={picker.open}
						onOpenChange={(open) =>
							open
								? setPicker((p) => ({ ...p, open: true }))
								: setPicker({
										open: false,
										mode: "link",
										targetStageId: null,
										editAssessmentId: null,
									})
						}
						stageType={pickerStage.stage_type}
						mode={picker.mode}
						editingAssessmentId={picker.editAssessmentId}
						onLinked={(assessmentId) => {
							setStages(
								stages.map((row) =>
									pickerStage && row.id === pickerStage.id
										? setLinkedAssessmentId(row, assessmentId)
										: row,
								),
							);
						}}
					/>
				) : null}

				{/* Human interview config dialog */}
				{interviewConfig.targetStageId ? (
					<HumanInterviewConfigDialog
						open={interviewConfig.open}
						onOpenChange={(open) =>
							setInterviewConfig({
								open,
								targetStageId: open ? interviewConfig.targetStageId : null,
							})
						}
						stage={
							(stages.find((s) => s.id === interviewConfig.targetStageId) ?? {
								id: "",
								title: null,
								order: 0,
								stage_type: "HumanInterview",
								is_mandatory: false,
								candidate_facing: true,
								contributes_to_score: false,
								automation: "None",
								pass_score: null,
								is_system_stage: false,
								voice_assessment_id: null,
								generic_assessment_id: null,
								coding_assessment_id: null,
								psychometric_assessment_id: null,
								prescreening_form_id: null,
								human_interview_config: null,
							}) as JobStage
						}
						onSave={(config) => {
							setStages(
								stages.map((row) =>
									row.id === interviewConfig.targetStageId
										? { ...row, human_interview_config: config }
										: row,
								),
							);
						}}
					/>
				) : null}

				{/* Action bar */}
				<div className="flex items-center justify-between pt-2">
					<Button type="button" variant="ghost" onClick={onBack}>
						<ArrowLeft className="size-4" />
						Back
					</Button>
					<Button
						type="button"
						disabled={isSaving}
						onClick={() => void onSaveAndContinue()}
					>
						{isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
						Save &amp; continue
						{!isSaving ? <ArrowRight className="size-4" /> : null}
					</Button>
				</div>
			</div>
		</TooltipProvider>
	);
}
