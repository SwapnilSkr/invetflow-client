import { useQuery } from "@tanstack/react-query";
import { Check, ChevronDown, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#/components/ui/popover";
import { Skeleton } from "#/components/ui/skeleton";
import type { OrganizationMember } from "#/integrations/api/client";
import { useOrganizationMembers } from "#/integrations/api/queries";

interface MemberPickerProps {
	orgId: string;
	value: string[];
	onChange: (next: string[]) => void;
	placeholder?: string;
	disabled?: boolean;
}

export function MemberPicker({
	orgId,
	value,
	onChange,
	placeholder = "Select interviewers...",
	disabled,
}: MemberPickerProps) {
	const query = useQuery(useOrganizationMembers(orgId));
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");

	const selected = (query.data ?? []).filter((m) => value.includes(m.user_id));
	const lowerSearch = search.trim().toLowerCase();
	const filtered = (query.data ?? []).filter((m) => {
		if (!lowerSearch) return true;
		return (
			(m.name?.toLowerCase().includes(lowerSearch) ?? false) ||
			(m.email?.toLowerCase().includes(lowerSearch) ?? false)
		);
	});

	const toggle = (userId: string) => {
		onChange(
			value.includes(userId)
				? value.filter((id) => id !== userId)
				: [...value, userId],
		);
	};

	return (
		<div className="space-y-2">
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						type="button"
						variant="outline"
						disabled={disabled}
						className="w-full justify-between"
					>
						<span className="text-muted-foreground">
							{selected.length === 0
								? placeholder
								: `${selected.length} selected`}
						</span>
						<ChevronDown className="h-4 w-4 opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent
					align="start"
					className="w-[var(--radix-popover-trigger-width)] p-0"
				>
					<div className="border-b border-border p-2">
						<Input
							autoFocus
							placeholder="Search by name or email"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>
					</div>
					<div className="max-h-64 overflow-y-auto p-1">
						{query.isLoading ? (
							<div className="space-y-2 p-2">
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
							</div>
						) : query.isError ? (
							<p className="p-2 text-sm text-destructive">
								Could not load members.
							</p>
						) : filtered.length === 0 ? (
							<p className="p-2 text-sm text-muted-foreground">No matches.</p>
						) : (
							filtered.map((m) => (
								<MemberRow
									key={m.user_id}
									member={m}
									selected={value.includes(m.user_id)}
									onToggle={toggle}
								/>
							))
						)}
					</div>
				</PopoverContent>
			</Popover>
			{selected.length > 0 ? (
				<div className="flex flex-wrap gap-1.5">
					{selected.map((m) => (
						<Badge
							key={m.user_id}
							variant="secondary"
							className="gap-1 pl-2 pr-1"
						>
							<span>{m.name?.trim() || m.email || m.user_id}</span>
							<button
								type="button"
								onClick={() => toggle(m.user_id)}
								className="rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
								aria-label="Remove"
							>
								<X className="h-3 w-3" />
							</button>
						</Badge>
					))}
				</div>
			) : null}
		</div>
	);
}

function MemberRow({
	member,
	selected,
	onToggle,
}: {
	member: OrganizationMember;
	selected: boolean;
	onToggle: (id: string) => void;
}) {
	const label = member.name?.trim() || member.email || member.user_id;
	return (
		<button
			type="button"
			onClick={() => onToggle(member.user_id)}
			className="flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
		>
			<span className="flex flex-col">
				<span className="font-medium text-foreground">{label}</span>
				{member.email && member.name ? (
					<span className="text-xs text-muted-foreground">{member.email}</span>
				) : null}
			</span>
			{selected ? (
				<Check className="h-4 w-4 text-primary" aria-hidden="true" />
			) : null}
		</button>
	);
}
