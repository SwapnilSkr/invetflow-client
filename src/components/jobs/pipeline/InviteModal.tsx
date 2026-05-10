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
import type { Application } from "#/integrations/api/client";
import {
	useAssignCandidate,
	useBulkAssignCandidates,
} from "#/integrations/api/queries";
import { parseInviteFile } from "./bulk-invite-parser";
import { InviteConfirmDialog } from "./InviteConfirmDialog";

interface InviteModalProps {
	jobId: string;
	open: boolean;
	applications: Application[];
	onOpenChange: (open: boolean) => void;
	onSuccess: (email: string) => void;
	onBulkSuccess: (message: string) => void;
}

export function InviteModal({
	jobId,
	open,
	applications,
	onOpenChange,
	onSuccess,
	onBulkSuccess,
}: InviteModalProps) {
	const assignCandidate = useAssignCandidate();
	const bulkAssign = useBulkAssignCandidates();
	const nameId = useId();
	const emailId = useId();
	const [fullName, setFullName] = useState("");
	const [email, setEmail] = useState("");
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [tab, setTab] = useState<"manual" | "file">("manual");
	const [fileRows, setFileRows] = useState<BulkInviteRow[]>([]);

	const normalizedEmail = email.trim().toLowerCase();
	const canSubmit = normalizedEmail.length > 0 && !assignCandidate.isPending;
	const existingEmails = new Set(
		applications.map((app) => app.candidate_email.trim().toLowerCase()),
	);
	const validRows = fileRows
		.filter((row) => row.status === "valid")
		.slice(0, 100);

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

	const sendBulk = async () => {
		setError(null);
		try {
			const result = await bulkAssign.mutateAsync({
				id: jobId,
				data: {
					candidates: validRows.map((row) => ({
						candidate_name: row.name || row.email.split("@")[0] || "Candidate",
						candidate_email: row.email,
					})),
				},
			});
			setFileRows([]);
			onOpenChange(false);
			onBulkSuccess(
				result.errors.length
					? `${result.sent} sent, ${result.skipped} skipped`
					: `${result.sent} invitations sent`,
			);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Could not send bulk invites.",
			);
		}
	};

	const handleFile = async (file: File | null) => {
		setError(null);
		if (!file) {
			setFileRows([]);
			return;
		}
		try {
			const parsed = await parseInviteFile(file);
			setFileRows(toBulkRows(parsed, existingEmails));
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Could not parse invite file.",
			);
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
					<div className="flex border-b border-border">
						<button
							type="button"
							className={`border-b-2 px-3 py-2 text-sm ${
								tab === "manual"
									? "border-primary text-foreground"
									: "border-transparent text-muted-foreground"
							}`}
							onClick={() => setTab("manual")}
						>
							Manual
						</button>
						<button
							type="button"
							className={`border-b-2 px-3 py-2 text-sm ${
								tab === "file"
									? "border-primary text-foreground"
									: "border-transparent text-muted-foreground"
							}`}
							onClick={() => setTab("file")}
						>
							Import file
						</button>
					</div>
					{tab === "manual" ? (
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
					) : (
						<div className="space-y-3">
							<input
								type="file"
								accept=".csv,.xlsx,.xls"
								className="w-full rounded-md border-2 border-dashed border-border p-4 text-sm"
								onChange={(event) =>
									void handleFile(event.currentTarget.files?.[0] ?? null)
								}
							/>
							{fileRows.length > 100 ? (
								<p className="text-xs text-muted-foreground">
									Only the first 100 valid rows will be imported.
								</p>
							) : null}
							<p className="text-xs text-muted-foreground">
								{validRows.length} valid,{" "}
								{
									fileRows.filter((row) => row.status === "invalid-email")
										.length
								}{" "}
								invalid,{" "}
								{fileRows.filter((row) => row.status === "duplicate").length}{" "}
								duplicate skipped
							</p>
							{fileRows.length ? (
								<div className="max-h-48 overflow-y-auto rounded-md border border-border">
									<table className="w-full text-left text-xs">
										<thead className="border-b border-border bg-muted">
											<tr>
												<th className="px-2 py-1">Name</th>
												<th className="px-2 py-1">Email</th>
												<th className="px-2 py-1">Status</th>
											</tr>
										</thead>
										<tbody>
											{fileRows.map((row) => (
												<tr
													key={row.key}
													className="border-b border-border last:border-0"
												>
													<td className="px-2 py-1">{row.name || "-"}</td>
													<td className="px-2 py-1">{row.email || "-"}</td>
													<td
														className={`px-2 py-1 ${
															row.status === "valid"
																? "text-muted-foreground"
																: "text-destructive"
														}`}
													>
														{row.status}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							) : null}
							{error ? (
								<p className="text-sm text-destructive" role="alert">
									{error}
								</p>
							) : null}
						</div>
					)}
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={assignCandidate.isPending || bulkAssign.isPending}
						>
							Cancel
						</Button>
						{tab === "manual" ? (
							<Button
								onClick={() => setConfirmOpen(true)}
								disabled={!canSubmit}
							>
								Continue
							</Button>
						) : (
							<Button
								onClick={() => void sendBulk()}
								disabled={!validRows.length || bulkAssign.isPending}
							>
								{bulkAssign.isPending
									? "Sending..."
									: `Send ${validRows.length} invitations`}
							</Button>
						)}
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<InviteConfirmDialog
				open={confirmOpen}
				onOpenChange={setConfirmOpen}
				email={normalizedEmail}
				title={`Send invitation to ${normalizedEmail}?`}
				onConfirm={() => void sendInvite()}
				pending={assignCandidate.isPending}
			/>
		</>
	);
}

type BulkInviteRow = {
	key: string;
	name: string | null;
	email: string;
	status: "valid" | "invalid-email" | "duplicate";
};

function toBulkRows(
	rows: Array<{ name: string | null; email: string }>,
	existingEmails: Set<string>,
): BulkInviteRow[] {
	const seen = new Set<string>();
	const rowCounts = new Map<string, number>();
	return rows
		.map((row) => {
			const email = row.email.trim().toLowerCase();
			let status: BulkInviteRow["status"] = "valid";
			if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
				status = "invalid-email";
			} else if (existingEmails.has(email) || seen.has(email)) {
				status = "duplicate";
			}
			seen.add(email);
			const keySeed = email || row.name || "blank";
			const count = rowCounts.get(keySeed) ?? 0;
			rowCounts.set(keySeed, count + 1);
			return { key: `${keySeed}:${count}`, name: row.name, email, status };
		})
		.filter((row) => row.email.length > 0);
}
