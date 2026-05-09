import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "#/lib/utils";

type Option<T extends string> = {
	value: T;
	label: string;
	description?: string;
	icon?: ReactNode;
};

type Props<T extends string> = {
	value: T | "";
	onChange: (next: T) => void;
	options: Option<T>[];
	columns?: 2 | 3 | 4;
	ariaLabel: string;
};

export function ButtonCardGroup<T extends string>({
	value,
	onChange,
	options,
	columns = 3,
	ariaLabel: _ariaLabel,
}: Props<T>) {
	return (
		<div
			className={cn(
				"grid gap-3",
				columns === 2 && "grid-cols-2",
				columns === 3 && "grid-cols-2 sm:grid-cols-3",
				columns === 4 && "grid-cols-2 sm:grid-cols-4",
			)}
		>
			{options.map((opt) => {
				const selected = value === opt.value;
				return (
					<button
						key={opt.value}
						type="button"
						aria-pressed={selected}
						onClick={() => onChange(opt.value)}
						className={cn(
							"relative flex cursor-pointer flex-col items-start rounded-lg border bg-muted/40 px-4 py-3.5 text-left transition-all",
							selected
								? "border-primary bg-primary/5"
								: "border-border hover:border-input/80 hover:bg-muted",
						)}
					>
						{opt.icon ? (
							<span className="mb-1.5 size-5 text-muted-foreground">
								{opt.icon}
							</span>
						) : null}
						<span className="text-sm font-medium text-foreground">
							{opt.label}
						</span>
						{opt.description ? (
							<span className="mt-0.5 text-xs text-muted-foreground">
								{opt.description}
							</span>
						) : null}
						{selected ? (
							<span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
								<Check className="size-3" />
							</span>
						) : null}
					</button>
				);
			})}
		</div>
	);
}
