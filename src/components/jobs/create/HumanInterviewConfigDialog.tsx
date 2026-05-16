import { useEffect, useState } from "react";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Switch } from "#/components/ui/switch";
import type {
	HumanInterviewStageConfig,
	JobStage,
} from "#/integrations/api/client";

type HumanInterviewConfigDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	stage: JobStage;
	onSave: (config: HumanInterviewStageConfig) => void;
};

const DEFAULT_CONFIG: HumanInterviewStageConfig = {
	max_duration_minutes: 60,
	recording_enabled: true,
	transcription_enabled: true,
	summarization_enabled: true,
	waiting_room_enabled: true,
	default_room_type: "Internal",
	allow_screen_share: true,
	allow_chat: true,
};

export function HumanInterviewConfigDialog({
	open,
	onOpenChange,
	stage,
	onSave,
}: HumanInterviewConfigDialogProps) {
	const [config, setConfig] =
		useState<HumanInterviewStageConfig>(DEFAULT_CONFIG);

	useEffect(() => {
		if (open) {
			setConfig(stage.human_interview_config ?? DEFAULT_CONFIG);
		}
	}, [open, stage.human_interview_config]);

	function updateConfig<K extends keyof HumanInterviewStageConfig>(
		key: K,
		value: HumanInterviewStageConfig[K],
	) {
		setConfig((prev) => ({ ...prev, [key]: value }));
	}

	function handleSave() {
		onSave(config);
		onOpenChange(false);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>Configure human interview</DialogTitle>
					<DialogDescription>
						Set defaults for interviews run at this pipeline stage.
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-5 py-2">
					<div className="grid gap-2">
						<Label htmlFor="duration">Max duration (minutes)</Label>
						<Input
							id="duration"
							type="number"
							min={5}
							max={480}
							value={config.max_duration_minutes}
							onChange={(e) => {
								const value = Number(e.target.value);
								if (!Number.isNaN(value)) {
									updateConfig(
										"max_duration_minutes",
										Math.min(480, Math.max(5, value)),
									);
								}
							}}
						/>
						<p className="text-xs text-muted-foreground">
							Clamped between 5 and 480 minutes.
						</p>
					</div>

					<div className="grid gap-2">
						<Label>Default room type</Label>
						<div className="flex gap-3">
							<RoomTypeOption
								label="Internal"
								selected={config.default_room_type === "Internal"}
								onSelect={() => updateConfig("default_room_type", "Internal")}
							/>
							<RoomTypeOption
								label="External"
								selected={config.default_room_type === "External"}
								onSelect={() => updateConfig("default_room_type", "External")}
							/>
						</div>
					</div>

					<div className="space-y-3">
						<ToggleRow
							label="Recording"
							checked={config.recording_enabled}
							onCheckedChange={(checked) =>
								updateConfig("recording_enabled", checked)
							}
						/>
						<ToggleRow
							label="Transcription"
							checked={config.transcription_enabled}
							onCheckedChange={(checked) =>
								updateConfig("transcription_enabled", checked)
							}
						/>
						<ToggleRow
							label="Summarization"
							checked={config.summarization_enabled}
							onCheckedChange={(checked) =>
								updateConfig("summarization_enabled", checked)
							}
						/>
						<ToggleRow
							label="Waiting room"
							checked={config.waiting_room_enabled}
							onCheckedChange={(checked) =>
								updateConfig("waiting_room_enabled", checked)
							}
						/>
						<ToggleRow
							label="Screen sharing"
							checked={config.allow_screen_share}
							onCheckedChange={(checked) =>
								updateConfig("allow_screen_share", checked)
							}
						/>
						<ToggleRow
							label="Chat"
							checked={config.allow_chat}
							onCheckedChange={(checked) => updateConfig("allow_chat", checked)}
						/>
					</div>
				</div>

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<Button type="button" onClick={handleSave}>
						Save configuration
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function RoomTypeOption({
	label,
	selected,
	onSelect,
}: {
	label: string;
	selected: boolean;
	onSelect: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onSelect}
			className={`rounded-md border px-3 py-2 text-sm transition ${
				selected
					? "border-primary bg-primary/10 font-medium text-primary"
					: "border-border bg-card text-foreground hover:bg-muted"
			}`}
		>
			{label}
		</button>
	);
}

function ToggleRow({
	label,
	checked,
	onCheckedChange,
}: {
	label: string;
	checked: boolean;
	onCheckedChange: (checked: boolean) => void;
}) {
	return (
		<div className="flex items-center justify-between gap-4">
			<Label className="text-sm font-normal">{label}</Label>
			<Switch checked={checked} onCheckedChange={onCheckedChange} />
		</div>
	);
}
