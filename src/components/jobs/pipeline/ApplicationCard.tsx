import { formatDistanceToNow } from "date-fns";
import { Copy, Mail, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback } from "#/components/ui/avatar";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import type { Application } from "#/integrations/api/client";
import { CommsDrawer } from "./CommsDrawer";

interface ApplicationCardProps {
	application: Application;
	inviteUrl: string | null;
	isInvitationColumn: boolean;
	isProspectsColumn?: boolean;
	onCopyInvite: (inviteUrl: string) => Promise<void>;
	onReinvite: (
		email: string,
		name: string | null,
		cooldownActive: boolean,
	) => void;
	onInviteProspect?: (
		applicationId: string,
		email: string,
		name: string | null,
	) => void;
}

function initialsForApplication(application: Application): string {
	const source = application.candidate_name || application.candidate_email;
	return source.trim().charAt(0).toUpperCase() || "C";
}

function boardStatusClass(status: Application["board_status"]): string {
	switch (status) {
		case "Invited":
			return "bg-primary/10 text-primary border-primary/20";
		case "Hired":
			return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400";
		case "Rejected":
			return "bg-destructive/10 text-destructive border-destructive/20";
		default:
			return "bg-secondary text-secondary-foreground border-transparent";
	}
}

export function ApplicationCard({
	application,
	inviteUrl,
	isInvitationColumn,
	isProspectsColumn = false,
	onCopyInvite,
	onReinvite,
	onInviteProspect,
}: ApplicationCardProps) {
	const [drawerOpen, setDrawerOpen] = useState(false);
	const expiresAt = application.invitation_expires_at
		? new Date(application.invitation_expires_at)
		: null;
	const cooldownUntil = application.last_invited_at
		? new Date(
				new Date(application.last_invited_at).getTime() + 8 * 60 * 60 * 1000,
			)
		: null;
	const cooldownActive = cooldownUntil
		? cooldownUntil.getTime() > Date.now()
		: false;

	return (
		<>
			<div className="rounded-lg border border-border bg-card p-3 text-foreground shadow-xs">
				<div className="flex items-start justify-between gap-2">
					<div className="flex min-w-0 items-center gap-2">
						<Avatar className="h-8 w-8">
							<AvatarFallback>
								{initialsForApplication(application)}
							</AvatarFallback>
						</Avatar>
						<div className="min-w-0">
							<p className="truncate text-sm font-medium">
								{application.candidate_name || application.candidate_email}
							</p>
							<p className="truncate text-xs text-muted-foreground">
								{application.candidate_email}
							</p>
						</div>
					</div>
					{isInvitationColumn || isProspectsColumn ? (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="icon-sm" aria-label="Actions">
									<MoreHorizontal className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								{isInvitationColumn ? (
									<DropdownMenuItem
										disabled={cooldownActive}
										title={
											cooldownUntil
												? `Re-invite available ${formatDistanceToNow(cooldownUntil, { addSuffix: true })}`
												: undefined
										}
										onClick={() =>
											onReinvite(
												application.candidate_email,
												application.candidate_name,
												cooldownActive,
											)
										}
									>
										Re-invite
									</DropdownMenuItem>
								) : null}
								{isProspectsColumn ? (
									<DropdownMenuItem
										onClick={() =>
											onInviteProspect?.(
												application.id,
												application.candidate_email,
												application.candidate_name,
											)
										}
									>
										Invite
									</DropdownMenuItem>
								) : null}
							</DropdownMenuContent>
						</DropdownMenu>
					) : null}
				</div>
				<div className="mt-3 flex flex-wrap items-center gap-2">
					<Badge className={boardStatusClass(application.board_status)}>
						{application.board_status}
					</Badge>
					{application.source.toLowerCase() !== "individualinvite" ? (
						<Badge variant="outline">{application.source}</Badge>
					) : null}
					{isInvitationColumn && application.is_invitation_expired ? (
						<Badge
							title={`Invitation lapsed${expiresAt ? ` ${formatDistanceToNow(expiresAt, { addSuffix: true })}` : ""}. Re-invite to reset.`}
							className="bg-destructive/15 px-2 py-0.5 text-destructive"
						>
							Expired
						</Badge>
					) : null}
					{isInvitationColumn && inviteUrl ? (
						<Button
							variant="outline"
							size="icon-sm"
							onClick={() => void onCopyInvite(inviteUrl)}
							aria-label="Copy invite link"
						>
							<Copy className="h-3.5 w-3.5" />
						</Button>
					) : null}
				</div>
				{application.board_status === "Invited" && application.comms_summary ? (
					<button
						type="button"
						className="mt-3 flex w-full items-center gap-2 border-t border-border pt-2 text-left text-xs text-muted-foreground"
						onClick={() => setDrawerOpen(true)}
					>
						<Mail className="h-3 w-3" />
						<span>{application.comms_summary.invitation_count}</span>
						{application.comms_summary.last_created_at ? (
							<span>
								{formatDistanceToNow(
									new Date(application.comms_summary.last_created_at),
									{ addSuffix: true },
								)}
							</span>
						) : null}
					</button>
				) : null}
			</div>
			<CommsDrawer
				application={application}
				open={drawerOpen}
				onOpenChange={setDrawerOpen}
			/>
		</>
	);
}
