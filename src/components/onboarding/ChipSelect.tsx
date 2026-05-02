import { cn } from "#/lib/utils";

type ChipSelectProps<T extends string> = {
	label: string;
	value: T;
	onChange: (value: T) => void;
	options: readonly T[];
	/** Figma company-size row vs job-title grid. */
	layout?: "row" | "grid";
};

export function ChipSelect<T extends string>({
	label,
	value,
	onChange,
	options,
	layout = "row",
}: ChipSelectProps<T>) {
	return (
		<div className="flex w-full flex-col gap-2">
			<span className="text-[13.33px] font-medium tracking-tight text-[#111827]">
				{label}
			</span>
			<div
				className={cn(
					layout === "grid"
						? "grid grid-cols-2 gap-2.5 sm:grid-cols-3"
						: "flex flex-wrap gap-2.5",
				)}
			>
				{options.map((opt) => {
					const selected = value === opt;
					return (
						<button
							key={opt}
							type="button"
							onClick={() => onChange(opt)}
							className={cn(
								"flex min-h-[30px] items-center justify-center rounded-xl border px-2.5 py-1.5 text-center text-xs font-medium tracking-tight transition-colors",
								"border-black/[0.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0052cc]",
								selected
									? "border-[#0052cc] bg-[#0052cc] text-white"
									: "bg-white text-[#111827] hover:border-[#0052cc]/40",
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
