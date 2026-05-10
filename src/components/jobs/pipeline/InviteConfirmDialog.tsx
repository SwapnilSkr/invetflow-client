import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";

interface InviteConfirmDialogProps {
	open: boolean;
	email: string;
	title: string;
	confirmLabel?: string;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
	pending?: boolean;
}

export function InviteConfirmDialog({
	open,
	email,
	title,
	confirmLabel = "Send Invitation",
	onOpenChange,
	onConfirm,
	pending = false,
}: InviteConfirmDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title.replace("{email}", email)}</DialogTitle>
					<DialogDescription>
						An email will be sent with a link to join the interview. This also
						schedules the job.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={pending}
					>
						Cancel
					</Button>
					<Button onClick={onConfirm} disabled={pending}>
						{pending ? "Sending..." : confirmLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
