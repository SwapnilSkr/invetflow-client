import {
	AlertTriangle,
	Brain,
	CheckCircle2,
	ChevronDown,
	ClipboardCheck,
	Cpu,
	FileQuestion,
	MessageCircle,
	UserSearch,
	UserSquare2,
	Voicemail,
} from "lucide-react";
import type { ComponentType } from "react";
import {
	ADDABLE_STAGE_TYPES,
	ENTITY_STAGE_TYPES,
	entityStageAlreadyPresent,
	isSystemStageType,
} from "#/components/jobs/create/pipeline-stage-meta";
import { Button } from "#/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import type { JobStage, StageType } from "#/integrations/api/client";

const STAGE_META: Partial<
	Record<
		StageType,
		{ label: string; Icon: ComponentType<{ className?: string }> }
	>
> = {
	Applied: { label: "Applied", Icon: CheckCircle2 },
	Prescreening: { label: "Prescreening", Icon: FileQuestion },
	VoiceInterview: { label: "Voice interview", Icon: Voicemail },
	GenericAssessment: { label: "Generic assessment", Icon: ClipboardCheck },
	CodingAssessment: { label: "Coding assessment", Icon: Cpu },
	PsychometricAssessment: { label: "Psychometric", Icon: Brain },
	ManualReview: { label: "Manual review", Icon: UserSearch },
	Consent: { label: "Consent", Icon: MessageCircle },
	HumanInterview: { label: "Human interview", Icon: UserSquare2 },
	Offer: { label: "Offer", Icon: ClipboardCheck },
	Hired: { label: "Hired", Icon: CheckCircle2 },
	Rejected: { label: "Rejected", Icon: AlertTriangle },
};

type PipelineAddStageMenuProps = {
	existingStages: JobStage[];
	phoneInterviewLocksAdds: boolean;
	onAdd: (type: StageType) => void;
};

export function PipelineAddStageMenu({
	existingStages,
	phoneInterviewLocksAdds,
	onAdd,
}: PipelineAddStageMenuProps) {
	return (
		<div className="space-y-2">
			{phoneInterviewLocksAdds ? (
				<p className="flex items-start gap-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
					<AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
					This pipeline links a phone-delivered voice interview. Add-stage is
					disabled while that configuration is mirrored from goodfit Horizon
					rulesets.
				</p>
			) : null}
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						type="button"
						variant="secondary"
						disabled={phoneInterviewLocksAdds}
						className="gap-2"
					>
						Add stage
						<ChevronDown className="size-4 opacity-70" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent className="w-64">
					<DropdownMenuLabel>Stage types</DropdownMenuLabel>
					<DropdownMenuSeparator />
					{ADDABLE_STAGE_TYPES.map((type) => {
						const meta = STAGE_META[type];
						const Icon = meta?.Icon ?? ClipboardCheck;
						const dupEntity =
							ENTITY_STAGE_TYPES.includes(type) &&
							entityStageAlreadyPresent(existingStages, type);
						const reservedSystem =
							isSystemStageType(type) &&
							existingStages.some((s) => s.stage_type === type);
						const disabled =
							dupEntity || reservedSystem || phoneInterviewLocksAdds;
						return (
							<DropdownMenuItem
								key={type}
								disabled={disabled}
								onSelect={(e) => {
									e.preventDefault();
									if (!disabled) onAdd(type);
								}}
							>
								<span className="flex items-center gap-2">
									<Icon className="size-4 text-muted-foreground" />
									<span>{meta?.label ?? type}</span>
								</span>
								{dupEntity ? (
									<span className="ml-auto text-[10px] text-muted-foreground">
										In pipeline
									</span>
								) : null}
								{reservedSystem ? (
									<span className="ml-auto text-[10px] text-muted-foreground">
										System stage
									</span>
								) : null}
							</DropdownMenuItem>
						);
					})}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
