import { cn } from "#/lib/utils";

type ChipSelectProps<T extends string> = {
	label: string;
	value: T;
	onChange: (value: T) => void;
	options: readonly T[];
};

export function ChipSelect<T extends string>({
	label,
	value,
	onChange,
	options,
}: ChipSelectProps<T>) {
	return (
		<div className="grid gap-2">
			<span className="text-sm font-semibold text-(--onb-text)">{label}</span>
			<div className="flex flex-wrap gap-2">
				{options.map((opt) => {
					const selected = value === opt;
					return (
						<button
							key={opt}
							type="button"
							onClick={() => onChange(opt)}
							className={cn(
								"rounded-[var(--onb-radius)] border px-3 py-1.5 text-sm font-medium transition-colors",
								selected
									? "border-(--onb-primary) bg-(--onb-primary) text-white"
									: "border-(--onb-border) bg-(--onb-form-bg) text-(--onb-text) hover:border-(--onb-muted)",
							)}
						>
							{opt}
						</button>
					);
				})}
			</div>
		</div>
	);
}
