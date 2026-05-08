import { Input } from "#/components/ui/input";
import type { ExperienceRange } from "#/integrations/api/client";

type ExperienceRangeFieldProps = {
	value: ExperienceRange | null;
	onChange: (next: ExperienceRange | null) => void;
};

export function ExperienceRangeField({
	value,
	onChange,
}: ExperienceRangeFieldProps) {
	const minStr = value?.min_years != null ? String(value.min_years) : "";
	const maxStr = value?.max_years != null ? String(value.max_years) : "";

	function emitChange(nextMin: string, nextMax: string) {
		if (!nextMin && !nextMax) {
			onChange(null);
			return;
		}
		onChange({
			min_years: nextMin ? Number(nextMin) : null,
			max_years: nextMax ? Number(nextMax) : null,
		});
	}

	return (
		<div className="flex items-center gap-2">
			<Input
				type="number"
				placeholder="Min yrs"
				value={minStr}
				onChange={(e) => emitChange(e.target.value, maxStr)}
				className="w-24"
			/>
			<span className="text-muted-foreground text-sm">–</span>
			<Input
				type="number"
				placeholder="Max yrs"
				value={maxStr}
				onChange={(e) => emitChange(minStr, e.target.value)}
				className="w-24"
			/>
		</div>
	);
}
