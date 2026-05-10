import { Copy, MoreHorizontal } from "lucide-react";
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

interface ApplicationCardProps {
	application: Application;
	inviteUrl: string | null;
	isInvitationColumn: boolean;
	onCopyInvite: (inviteUrl: string) => Promise<void>;
	onReinvite: (email: string, name: string | null) => void;
}

function initialsForApplication(application: Application): string {
	const source = application.candidate_name || application.candidate_email;
	return source.trim().charAt(0).toUpperCase() || "C";
}

function boardStatusClass(status: Application["board_status"]): string {
	switch (status) {
		case "Invited":
			return "bg-blue-50 text-blue-700 border-blue-200";
		case "Hired":
			return "bg-green-50 text-green-700 border-green-200";
		case "Rejected":
			return "bg-red-50 text-red-700 border-red-200";
		default:
			return "bg-secondary text-secondary-foreground border-transparent";
	}
}

export function ApplicationCard({
	application,
	inviteUrl,
	isInvitationColumn,
	onCopyInvite,
	onReinvite,
}: ApplicationCardProps) {
	return (
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
				{isInvitationColumn ? (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon-sm" aria-label="Actions">
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem
								onClick={() =>
									onReinvite(
										application.candidate_email,
										application.candidate_name,
									)
								}
							>
								Re-invite
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				) : null}
			</div>
			<div className="mt-3 flex flex-wrap items-center gap-2">
				<Badge className={boardStatusClass(application.board_status)}>
					{application.board_status}
				</Badge>
				{application.source.toLowerCase() !== "invite" ? (
					<Badge variant="outline">{application.source}</Badge>
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
		</div>
	);
}
