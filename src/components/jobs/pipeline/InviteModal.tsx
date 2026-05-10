import { useId, useState } from "react";
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
import { useAssignCandidate } from "#/integrations/api/queries";
import { InviteConfirmDialog } from "./InviteConfirmDialog";

interface InviteModalProps {
	jobId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: (email: string) => void;
}

export function InviteModal({
	jobId,
	open,
	onOpenChange,
	onSuccess,
}: InviteModalProps) {
	const assignCandidate = useAssignCandidate();
	const nameId = useId();
	const emailId = useId();
	const [fullName, setFullName] = useState("");
	const [email, setEmail] = useState("");
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const normalizedEmail = email.trim().toLowerCase();
	const canSubmit = normalizedEmail.length > 0 && !assignCandidate.isPending;

	const sendInvite = async () => {
		setError(null);
		try {
			await assignCandidate.mutateAsync({
				id: jobId,
				data: {
					candidate_name:
						fullName.trim() || normalizedEmail.split("@")[0] || "Candidate",
					candidate_email: normalizedEmail,
				},
			});
			setConfirmOpen(false);
			onOpenChange(false);
			setFullName("");
			setEmail("");
			onSuccess(normalizedEmail);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Could not send invitation.",
			);
			setConfirmOpen(false);
		}
	};

	return (
		<>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Invite candidate</DialogTitle>
						<DialogDescription>
							Add a candidate and send an invitation email.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<label htmlFor={nameId} className="text-sm font-medium">
								Full name
							</label>
							<Input
								id={nameId}
								placeholder="Alex Rivera"
								value={fullName}
								onChange={(e) => setFullName(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<label htmlFor={emailId} className="text-sm font-medium">
								Email
							</label>
							<Input
								id={emailId}
								type="email"
								placeholder="alex@company.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
							/>
						</div>
						{error ? (
							<p className="text-sm text-destructive" role="alert">
								{error}
							</p>
						) : null}
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={assignCandidate.isPending}
						>
							Cancel
						</Button>
						<Button onClick={() => setConfirmOpen(true)} disabled={!canSubmit}>
							Continue
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<InviteConfirmDialog
				open={confirmOpen}
				onOpenChange={setConfirmOpen}
				email={normalizedEmail}
				title="Send invitation to {email}?"
				onConfirm={() => void sendInvite()}
				pending={assignCandidate.isPending}
			/>
		</>
	);
}
