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
import { useAddProspect } from "#/integrations/api/queries";

interface ProspectModalProps {
	jobId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}

export function ProspectModal({
	jobId,
	open,
	onOpenChange,
	onSuccess,
}: ProspectModalProps) {
	const addProspect = useAddProspect(jobId);
	const nameId = useId();
	const emailId = useId();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [error, setError] = useState<string | null>(null);
	const normalizedEmail = email.trim().toLowerCase();

	const submit = async () => {
		setError(null);
		try {
			await addProspect.mutateAsync({
				name: name.trim() || undefined,
				email: normalizedEmail,
			});
			setName("");
			setEmail("");
			onOpenChange(false);
			onSuccess();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not add prospect.");
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add prospect</DialogTitle>
					<DialogDescription>
						Add a candidate to the prospect pool without sending an invite.
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
							value={name}
							onChange={(e) => setName(e.target.value)}
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
						disabled={addProspect.isPending}
					>
						Cancel
					</Button>
					<Button
						onClick={() => void submit()}
						disabled={!normalizedEmail || addProspect.isPending}
					>
						{addProspect.isPending ? "Adding..." : "Add prospect"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
