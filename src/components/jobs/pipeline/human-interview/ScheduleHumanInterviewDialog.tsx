import { useState } from "react";
import { Alert, AlertDescription } from "#/components/ui/alert";
import { Button } from "#/components/ui/button";
import { DateTimePicker } from "#/components/ui/date-time-picker";
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
import type {
	HumanInterviewRoomType,
	HumanInterviewSession,
	ScheduleHumanInterviewBody,
	UpdateHumanInterviewBody,
} from "#/integrations/api/client";
import { isApiError } from "#/integrations/api/errors";
import {
	useScheduleHumanInterview,
	useUpdateHumanInterview,
} from "#/integrations/api/queries";
import { MemberPicker } from "./MemberPicker";

interface ScheduleHumanInterviewDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	jobId: string;
	applicationId: string;
	orgId: string;
	stageId: string;
	/** When present, dialog operates in reschedule mode against this session. */
	existing?: HumanInterviewSession | null;
}

const defaultTimezone =
	typeof Intl !== "undefined"
		? Intl.DateTimeFormat().resolvedOptions().timeZone
		: "UTC";

export function ScheduleHumanInterviewDialog({
	open,
	onOpenChange,
	jobId,
	applicationId,
	orgId,
	stageId,
	existing,
}: ScheduleHumanInterviewDialogProps) {
	const isEdit = !!existing;
	const [interviewerIds, setInterviewerIds] = useState<string[]>(
		existing?.interviewer_user_ids ?? [],
	);
	const [scheduledAt, setScheduledAt] = useState<Date | null>(
		existing ? new Date(existing.scheduled_at) : null,
	);
	const [duration, setDuration] = useState<number>(
		existing?.duration_minutes ?? 30,
	);
	const [meetingLink, setMeetingLink] = useState<string>(
		existing?.meeting_link ?? "",
	);
	const [roomType, setRoomType] = useState<HumanInterviewRoomType>(
		existing?.room_type ?? "External",
	);
	const [location, setLocation] = useState<string>(existing?.location ?? "");
	const [timezone, setTimezone] = useState<string>(
		existing?.timezone ?? defaultTimezone,
	);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const scheduleMutation = useScheduleHumanInterview(jobId, applicationId);
	const updateMutation = useUpdateHumanInterview(jobId, applicationId);
	const isSubmitting = scheduleMutation.isPending || updateMutation.isPending;

	const reset = () => {
		setInterviewerIds(existing?.interviewer_user_ids ?? []);
		setScheduledAt(existing ? new Date(existing.scheduled_at) : null);
		setDuration(existing?.duration_minutes ?? 30);
		setMeetingLink(existing?.meeting_link ?? "");
		setRoomType(existing?.room_type ?? "External");
		setLocation(existing?.location ?? "");
		setTimezone(existing?.timezone ?? defaultTimezone);
		setErrorMessage(null);
	};

	const handleClose = (next: boolean) => {
		if (!next) reset();
		onOpenChange(next);
	};

	const validate = (): string | null => {
		if (interviewerIds.length === 0) {
			return "Pick at least one interviewer.";
		}
		if (!scheduledAt) {
			return "Pick a date and time.";
		}
		if (Number.isNaN(scheduledAt.getTime())) {
			return "The selected date is invalid.";
		}
		if (scheduledAt <= new Date()) {
			return "Pick a future date and time.";
		}
		if (duration < 5 || duration > 480) {
			return "Duration must be between 5 and 480 minutes.";
		}
		if (!timezone.trim()) {
			return "Timezone is required.";
		}
		if (roomType === "External" && !meetingLink.trim() && !location.trim()) {
			return "Add a meeting link or location for external interviews.";
		}
		return null;
	};

	const submit = async () => {
		setErrorMessage(null);
		const err = validate();
		if (err) {
			setErrorMessage(err);
			return;
		}
		const at = scheduledAt as Date;
		try {
			if (isEdit && existing) {
				const body: UpdateHumanInterviewBody = {
					interviewer_user_ids: interviewerIds,
					scheduled_at: at.toISOString(),
					duration_minutes: duration,
					meeting_link:
						roomType === "Internal" ? null : meetingLink.trim() || null,
					location: location.trim() || null,
					timezone: timezone.trim(),
				};
				await updateMutation.mutateAsync({ id: existing.id, body });
			} else {
				const body: ScheduleHumanInterviewBody = {
					stage_id: stageId,
					interviewer_user_ids: interviewerIds,
					scheduled_at: at.toISOString(),
					duration_minutes: duration,
					meeting_link:
						roomType === "Internal" ? null : meetingLink.trim() || null,
					room_type: roomType,
					location: location.trim() || null,
					timezone: timezone.trim(),
				};
				await scheduleMutation.mutateAsync(body);
			}
			handleClose(false);
		} catch (e) {
			if (isApiError(e)) setErrorMessage(e.message);
			else if (e instanceof Error) setErrorMessage(e.message);
			else setErrorMessage("Could not save.");
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>
						{isEdit ? "Reschedule interview" : "Schedule interview"}
					</DialogTitle>
					<DialogDescription>
						{isEdit
							? "Update the time, link, or panel. The candidate will be notified."
							: "Pick interviewers and a time. The candidate will see the details."}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div className="space-y-1.5">
						<Label>Interviewers</Label>
						<MemberPicker
							orgId={orgId}
							value={interviewerIds}
							onChange={setInterviewerIds}
							disabled={isSubmitting}
						/>
					</div>

					<div className="grid gap-3 sm:grid-cols-2">
						<div className="space-y-1.5">
							<Label htmlFor="hi-schedule-at">When</Label>
							<DateTimePicker
								id="hi-schedule-at"
								value={scheduledAt}
								onChange={setScheduledAt}
								minDate={new Date()}
								disabled={isSubmitting}
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="hi-duration">Duration (minutes)</Label>
							<Input
								id="hi-duration"
								type="number"
								min={5}
								max={480}
								step={5}
								value={duration}
								onChange={(e) =>
									setDuration(Number.parseInt(e.target.value, 10) || 0)
								}
								disabled={isSubmitting}
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label>Room type</Label>
						<div className="grid grid-cols-2 gap-2">
							<Button
								type="button"
								variant={roomType === "Internal" ? "default" : "outline"}
								onClick={() => setRoomType("Internal")}
								disabled={isSubmitting || isEdit}
							>
								Internal
							</Button>
							<Button
								type="button"
								variant={roomType === "External" ? "default" : "outline"}
								onClick={() => setRoomType("External")}
								disabled={isSubmitting || isEdit}
							>
								External
							</Button>
						</div>
					</div>

					{roomType === "External" ? (
						<div className="space-y-1.5">
							<Label htmlFor="hi-link">Meeting link</Label>
							<Input
								id="hi-link"
								type="url"
								placeholder="https://meet.example.com/abc"
								value={meetingLink}
								onChange={(e) => setMeetingLink(e.target.value)}
								disabled={isSubmitting}
							/>
						</div>
					) : null}

					<div className="space-y-1.5">
						<Label htmlFor="hi-location">Location (in-person, optional)</Label>
						<Input
							id="hi-location"
							placeholder="HQ — Conference Room 4B"
							value={location}
							onChange={(e) => setLocation(e.target.value)}
							disabled={isSubmitting}
						/>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="hi-tz">Timezone</Label>
						<Input
							id="hi-tz"
							placeholder="IANA timezone (e.g. America/Los_Angeles)"
							value={timezone}
							onChange={(e) => setTimezone(e.target.value)}
							disabled={isSubmitting}
						/>
					</div>

					{errorMessage ? (
						<Alert variant="destructive">
							<AlertDescription>{errorMessage}</AlertDescription>
						</Alert>
					) : null}
				</div>

				<DialogFooter>
					<Button
						type="button"
						variant="ghost"
						onClick={() => handleClose(false)}
						disabled={isSubmitting}
					>
						Cancel
					</Button>
					<Button type="button" onClick={submit} disabled={isSubmitting}>
						{isEdit ? "Save" : "Schedule"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
