import { queryOptions, useQueries } from "@tanstack/react-query";
import {
	ArrowDown,
	ArrowLeft,
	ArrowRight,
	ArrowUp,
	Bot,
	GripVertical,
	Loader2,
} from "lucide-react";
import { type JSX, useState } from "react";
import { AssessmentPickerModal } from "#/components/jobs/create/assessment-picker-modal";
import {
	defaultPipeline,
	newClientId,
	normalizeJobStage,
} from "#/components/jobs/create/job-create-state";
import { PipelineAddStageMenu } from "#/components/jobs/create/pipeline-add-stage-menu";
import {
	getLinkedAssessmentId,
	setLinkedAssessmentId,
	stageRequiresAssessmentLink,
	unlinkStage,
} from "#/components/jobs/create/pipeline-stage-meta";
import type { DraftState, DraftUpdate } from "#/components/jobs/create/types";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Select } from "#/components/ui/select";
import type {
	CodingAssessment,
	GenericAssessment,
	JobStage,
	PrescreeningForm,
	PsychometricAssessment,
	StageAutomation,
	StageType,
	VoiceAssessment,
} from "#/integrations/api/client";
import { assessmentQueries } from "#/integrations/api/queries";

type PhaseProcessProps = {
	draft: DraftState;
	update: DraftUpdate;
	errors: Record<string, string>;
	onGeneratePipeline: () => Promise<void>;
	generating: boolean;
	onSaveAndContinue: () => Promise<void>;
	isSaving: boolean;
	onBack: () => void;
};

function noopAssessmentQuery(stageId: string) {
	return queryOptions({
		queryKey: ["assessment-detail-skip", stageId],
		queryFn: async () => null,
		enabled: false,
	});
}

export function PhaseProcess({
	draft,
	update,
	errors,
	onGeneratePipeline,
	generating,
	onSaveAndContinue,
	isSaving,
	onBack,
}: PhaseProcessProps) {
	const [picker, setPicker] = useState<{
		open: boolean;
		mode: "link" | "edit";
		targetStageId: string | null;
		editAssessmentId: string | null;
	}>(() => ({
		open: false,
		mode: "link",
		targetStageId: null,
		editAssessmentId: null,
	}));

	function setStages(stages: JobStage[]) {
		update("pipeline", {
			stages: stages.map((stage, order) =>
				normalizeJobStage({ ...stage, order }, order),
			),
		});
	}

	const queries = draft.pipeline.stages.map((stage) => {
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

	const voiceIdsLinked = draft.pipeline.stages
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

	const unlinkedAssessmentCount = draft.pipeline.stages.filter(
		(s) =>
			stageRequiresAssessmentLink(s.stage_type) && !getLinkedAssessmentId(s),
	).length;

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
			draft.pipeline.stages.length,
		);
		setStages([...draft.pipeline.stages, base]);
	}

	const pickerStage = picker.targetStageId
		? draft.pipeline.stages.find((s) => s.id === picker.targetStageId)
		: null;

	return (
		<div className="space-y-6">
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

			<div className="flex flex-wrap gap-2">
				<Button
					type="button"
					variant="outline"
					disabled={generating}
					onClick={() => void onGeneratePipeline()}
				>
					<Bot className="size-4" />
					Generate stages
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
					existingStages={draft.pipeline.stages}
					phoneInterviewLocksAdds={phoneLocksAdds}
					onAdd={addStage}
				/>
			</div>

			<ul className="space-y-3">
				{draft.pipeline.stages.map((stage, index) => {
					const fq = fetched[index]?.data ?? null;

					let summaryLines: JSX.Element | null = null;
					const linkedId = getLinkedAssessmentId(stage);
					if (
						fetched[index]?.status === "pending" ||
						fetched[index]?.fetchStatus === "fetching"
					) {
						summaryLines = (
							<span className="inline-flex items-center gap-2 text-muted-foreground">
								<Loader2 className="size-4 animate-spin" />
								Fetching linked assessment…
							</span>
						);
					} else if (
						linkedId &&
						stageRequiresAssessmentLink(stage.stage_type)
					) {
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
											{v?.skills?.length ?? 0} skills · {qCount} questions ·
											pass {v?.pass_score ?? "—"}
										</p>
										{v?.delivery_method === "Phone" ? (
											<p className="mt-2 text-[11px] text-amber-700">
												Phone delivery: additional stages locked for this
												funnel.
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
										<p className="text-sm font-medium">
											{v?.title ?? "Assessment"}
										</p>
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
										<p className="text-sm font-medium">
											{v?.title ?? "Coding pack"}
										</p>
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
										<p className="text-sm font-medium">
											{v?.title ?? "Psychometric"}
										</p>
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
										<p className="text-sm font-medium">
											{v?.name ?? "Prescreening"}
										</p>
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
					} else if (fetched[index]?.isError) {
						summaryLines = (
							<span className="text-xs text-destructive">
								Could not load assessment (routes may still be deploying).
							</span>
						);
					} else if (
						stageRequiresAssessmentLink(stage.stage_type) &&
						!linkedId
					) {
						summaryLines = (
							<span className="text-sm text-muted-foreground">
								No reusable assessment linked yet.
							</span>
						);
					} else if (!stageRequiresAssessmentLink(stage.stage_type)) {
						summaryLines = (
							<span className="text-xs text-muted-foreground">
								System/interview-only stage · no reusable entity needed.
							</span>
						);
					}

					return (
						<li
							key={stage.id}
							className="rounded-lg border border-border bg-card p-3 md:grid md:grid-cols-[auto_1fr_auto] md:gap-4"
						>
							<div className="mb-3 flex md:mb-0">
								<GripVertical className="mt-7 size-4 text-muted-foreground" />
								<span className="mt-8 md:hidden ml-3 text-[10px] font-medium uppercase text-muted-foreground">
									Reorder
								</span>
							</div>
							<div className="grid gap-3">
								<div className="flex flex-wrap items-center gap-2">
									<Input
										className="max-w-[220px]"
										value={stage.title ?? ""}
										onChange={(e) =>
											setStages(
												draft.pipeline.stages.map((row) =>
													row.id === stage.id
														? { ...row, title: e.target.value || null }
														: row,
												),
											)
										}
									/>
									<BadgeMuted>{stage.stage_type}</BadgeMuted>
								</div>

								{stageRequiresAssessmentLink(stage.stage_type) ? (
									<div
										className={
											linkedId
												? "rounded-md border border-border bg-muted/30 p-3"
												: "rounded-md border border-dashed border-border p-3"
										}
									>
										{summaryLines}
										<div className="mt-3 flex flex-wrap gap-2">
											{!linkedId ? (
												<Button
													type="button"
													size="sm"
													variant="secondary"
													onClick={() =>
														setPicker({
															open: true,
															mode: "link",
															targetStageId: stage.id,
															editAssessmentId: null,
														})
													}
												>
													Link assessment
												</Button>
											) : (
												<>
													<Button
														type="button"
														size="sm"
														variant="outline"
														onClick={() =>
															setPicker({
																open: true,
																mode: "edit",
																targetStageId: stage.id,
																editAssessmentId: linkedId,
															})
														}
													>
														Edit assessment
													</Button>
													<Button
														type="button"
														size="sm"
														variant="ghost"
														onClick={() =>
															setStages(
																draft.pipeline.stages.map((row) =>
																	row.id === stage.id ? unlinkStage(row) : row,
																),
															)
														}
													>
														Unlink
													</Button>
												</>
											)}
										</div>
									</div>
								) : (
									<div className="rounded-md bg-muted/20 p-2 text-xs text-muted-foreground">
										Configure candidate prompts or interviewer notes per stage
										runner.
									</div>
								)}

								<div className="grid gap-4 border-t border-border pt-3 md:grid-cols-[1fr_auto]">
									<div className="flex flex-wrap gap-4">
										<div className="grid gap-1">
											<Label className="text-xs font-normal text-muted-foreground">
												Automation
											</Label>
											<Select
												value={stage.automation}
												onChange={(e) =>
													setStages(
														draft.pipeline.stages.map((row) =>
															row.id === stage.id
																? {
																		...row,
																		automation: e.target
																			.value as StageAutomation,
																	}
																: row,
														),
													)
												}
												className="min-w-[180px]"
											>
												{(
													[
														"None",
														"SendInvitation",
														"ScheduleMeeting",
														"SendRejection",
														"SendHiredNotification",
													] as StageAutomation[]
												).map((a) => (
													<option key={a} value={a}>
														{a}
													</option>
												))}
											</Select>
										</div>
										<label className="flex items-center gap-2">
											<input
												type="checkbox"
												checked={stage.is_mandatory}
												onChange={(e) =>
													setStages(
														draft.pipeline.stages.map((row) =>
															row.id === stage.id
																? { ...row, is_mandatory: e.target.checked }
																: row,
														),
													)
												}
											/>
											<span className="text-xs">Mandatory</span>
										</label>
										<label className="flex items-center gap-2">
											<input
												type="checkbox"
												checked={stage.contributes_to_score}
												onChange={(e) =>
													setStages(
														draft.pipeline.stages.map((row) =>
															row.id === stage.id
																? {
																		...row,
																		contributes_to_score: e.target.checked,
																	}
																: row,
														),
													)
												}
											/>
											<span className="text-xs">Contributes</span>
										</label>
										<label className="flex items-center gap-2">
											<input
												type="checkbox"
												checked={stage.candidate_facing}
												onChange={(e) =>
													setStages(
														draft.pipeline.stages.map((row) =>
															row.id === stage.id
																? {
																		...row,
																		candidate_facing: e.target.checked,
																	}
																: row,
														),
													)
												}
											/>
											<span className="text-xs">Candidate-facing</span>
										</label>
									</div>
									<div className="flex items-end gap-2">
										<div className="grid gap-1">
											<Label className="text-xs font-normal text-muted-foreground">
												Pass score
											</Label>
											<Input
												type="number"
												className="w-[104px]"
												value={stage.pass_score ?? ""}
												onChange={(e) =>
													setStages(
														draft.pipeline.stages.map((row) =>
															row.id === stage.id
																? {
																		...row,
																		pass_score: e.target.value
																			? Number(e.target.value)
																			: null,
																	}
																: row,
														),
													)
												}
											/>
										</div>
									</div>
								</div>
							</div>
							<div className="mt-4 flex shrink-0 flex-row justify-end gap-1 md:mt-[38px] md:flex-col md:justify-start">
								<Button
									type="button"
									variant="outline"
									size="icon-sm"
									disabled={index === 0}
									onClick={() => {
										const next = [...draft.pipeline.stages];
										[next[index - 1], next[index]] = [
											next[index],
											next[index - 1],
										];
										setStages(next);
									}}
									aria-label="Move stage up"
								>
									<ArrowUp className="size-4" />
								</Button>
								<Button
									type="button"
									variant="outline"
									size="icon-sm"
									disabled={index === draft.pipeline.stages.length - 1}
									onClick={() => {
										const next = [...draft.pipeline.stages];
										[next[index + 1], next[index]] = [
											next[index],
											next[index + 1],
										];
										setStages(next);
									}}
									aria-label="Move stage down"
								>
									<ArrowDown className="size-4" />
								</Button>
								<Button
									type="button"
									variant="outline"
									size="icon-sm"
									disabled={stage.is_system_stage}
									title={
										stage.is_system_stage
											? "System stages can't be deleted"
											: "Remove stage"
									}
									onClick={() =>
										setStages(
											draft.pipeline.stages.filter(
												(row) => row.id !== stage.id,
											),
										)
									}
									aria-label="Remove stage"
								>
									×
								</Button>
							</div>
						</li>
					);
				})}
			</ul>

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
							draft.pipeline.stages.map((row) =>
								pickerStage && row.id === pickerStage.id
									? setLinkedAssessmentId(row, assessmentId)
									: row,
							),
						);
					}}
				/>
			) : null}

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
	);
}

function BadgeMuted({ children }: { children: string }) {
	return (
		<span className="rounded-md border border-border bg-muted/50 px-2 py-1 text-[11px] font-medium text-muted-foreground">
			{children}
		</span>
	);
}

function humanTitle(t: JobStage["stage_type"]): string {
	const map: Record<string, string> = {
		Applied: "Applied",
		Prescreening: "Prescreening",
		VoiceInterview: "Voice interview",
		GenericAssessment: "Generic assessment",
		CodingAssessment: "Coding assessment",
		PsychometricAssessment: "Psychometric",
		ManualReview: "Manual review",
		Consent: "Consent",
		HumanInterview: "Human interview",
		Offer: "Offer",
		Hired: "Hired",
		Rejected: "Rejected",
	};
	return map[t] ?? t;
}
