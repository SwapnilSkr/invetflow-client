import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Clock, Mail } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback } from "#/components/ui/avatar";
import { Badge } from "#/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import type { Application } from "#/integrations/api/client";
import { applicationQueries } from "#/integrations/api/queries";

interface CommsDrawerProps {
	application: Application;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function CommsDrawer({
	application,
	open,
	onOpenChange,
}: CommsDrawerProps) {
	const [tab, setTab] = useState<"communications" | "history">(
		"communications",
	);
	const communications = useQuery({
		...applicationQueries.communications(application.id),
		enabled: open,
	});
	const auditLog = useQuery({
		...applicationQueries.auditLog(application.id),
		enabled: open,
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>
						{application.candidate_name || application.candidate_email}
					</DialogTitle>
					<DialogDescription>{application.candidate_email}</DialogDescription>
				</DialogHeader>

				<div className="flex border-b border-border">
					<button
						type="button"
						className={`border-b-2 px-3 py-2 text-sm ${
							tab === "communications"
								? "border-primary text-foreground"
								: "border-transparent text-muted-foreground"
						}`}
						onClick={() => setTab("communications")}
					>
						Communications
					</button>
					<button
						type="button"
						className={`border-b-2 px-3 py-2 text-sm ${
							tab === "history"
								? "border-primary text-foreground"
								: "border-transparent text-muted-foreground"
						}`}
						onClick={() => setTab("history")}
					>
						History
					</button>
				</div>

				{tab === "communications" ? (
					<div className="max-h-96 space-y-3 overflow-y-auto">
						{communications.data?.length ? (
							communications.data.map((comm) => (
								<div
									key={comm.id}
									className="flex items-center gap-3 rounded-md border border-border p-3"
								>
									<Mail className="h-4 w-4 text-muted-foreground" />
									<div className="min-w-0 flex-1">
										<p className="text-sm font-medium">{comm.comm_type}</p>
										<p className="text-xs text-muted-foreground">
											{formatDistanceToNow(new Date(comm.created_at), {
												addSuffix: true,
											})}
										</p>
									</div>
									<Badge variant="outline">{comm.outcome}</Badge>
								</div>
							))
						) : (
							<div className="rounded-md border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
								No communications yet
							</div>
						)}
					</div>
				) : (
					<div className="max-h-96 space-y-3 overflow-y-auto">
						{auditLog.data?.length ? (
							auditLog.data.map((entry) => (
								<div
									key={entry.id}
									className="flex items-center gap-3 rounded-md border border-border p-3"
								>
									<Avatar className="h-8 w-8">
										<AvatarFallback>
											{entry.actor_id.charAt(0).toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<div className="min-w-0 flex-1">
										<p className="text-sm font-medium">
											{auditLabel(
												entry.action_type,
												entry.from_board_status,
												entry.to_board_status,
											)}{" "}
											by {entry.actor_id}
										</p>
										<p className="text-xs text-muted-foreground">
											{formatDistanceToNow(new Date(entry.created_at), {
												addSuffix: true,
											})}
										</p>
									</div>
									<Clock className="h-4 w-4 text-muted-foreground" />
								</div>
							))
						) : (
							<div className="rounded-md border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
								No history yet
							</div>
						)}
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}

function auditLabel(
	actionType: string,
	fromStatus: string | null,
	toStatus: string | null,
): string {
	switch (actionType) {
		case "ManualDragAndDrop":
			return fromStatus && toStatus
				? `Moved from ${fromStatus} to ${toStatus}`
				: "Moved";
		case "InvitationRenewed":
			return "Invited";
		case "Revoked":
			return "Revoked";
		default:
			return actionType;
	}
}
