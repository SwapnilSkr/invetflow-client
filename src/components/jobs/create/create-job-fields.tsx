import type React from "react";
import { cn } from "#/lib/utils";

export const selectClassName = cn(
	"flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm",
	"focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
);

export const textareaClassName = cn(
	"flex min-h-[160px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm",
	"placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
);

export function Field({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div className="grid gap-2">
			<span className="text-sm font-medium text-[#111827]">{label}</span>
			{children}
		</div>
	);
}

export function CheckRow({
	label,
	checked,
	onChange,
}: {
	label: string;
	checked: boolean;
	onChange: (checked: boolean) => void;
}) {
	return (
		<label className="flex items-center gap-3 rounded-lg border border-black/8 bg-white px-3 py-2 text-sm">
			<input
				type="checkbox"
				checked={checked}
				onChange={(e) => onChange(e.target.checked)}
				className="size-4"
			/>
			{label}
		</label>
	);
}

export function Summary({ title, rows }: { title: string; rows: string[] }) {
	return (
		<div className="rounded-lg border border-black/8 bg-white p-4">
			<h3 className="font-semibold text-[#111827]">{title}</h3>
			<ul className="mt-2 space-y-1 text-sm text-[#6b7280]">
				{rows.filter(Boolean).map((row) => (
					<li key={row}>{row}</li>
				))}
			</ul>
		</div>
	);
}
