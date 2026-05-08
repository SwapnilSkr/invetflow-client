import { Input } from "#/components/ui/input";
import { Select } from "#/components/ui/select";
import type { SalaryRange } from "#/integrations/api/client";

type SalaryRangeFieldProps = {
	value: SalaryRange | null;
	onChange: (next: SalaryRange | null) => void;
};

const CURRENCIES = ["USD", "EUR", "GBP", "INR"] as const;
const PERIODS = ["Yearly", "Monthly", "Hourly"] as const;

export function SalaryRangeField({ value, onChange }: SalaryRangeFieldProps) {
	const currency = value?.currency ?? "USD";
	const period = value?.period ?? "Yearly";
	const minStr = value?.min != null ? String(value.min) : "";
	const maxStr = value?.max != null ? String(value.max) : "";

	function emitChange(
		nextMin: string,
		nextMax: string,
		nextCurrency: string,
		nextPeriod: string,
	) {
		if (!nextMin && !nextMax) {
			onChange(null);
			return;
		}
		onChange({
			min: nextMin ? Number(nextMin) : null,
			max: nextMax ? Number(nextMax) : null,
			currency: nextCurrency,
			period: nextPeriod,
		});
	}

	return (
		<div className="flex flex-wrap items-center gap-2">
			<Input
				type="number"
				placeholder="Min"
				value={minStr}
				onChange={(e) => emitChange(e.target.value, maxStr, currency, period)}
				className="w-24"
			/>
			<span className="text-muted-foreground text-sm">–</span>
			<Input
				type="number"
				placeholder="Max"
				value={maxStr}
				onChange={(e) => emitChange(minStr, e.target.value, currency, period)}
				className="w-24"
			/>
			<Select
				value={currency}
				onChange={(e) => emitChange(minStr, maxStr, e.target.value, period)}
				className="w-20"
			>
				{CURRENCIES.map((c) => (
					<option key={c} value={c}>
						{c}
					</option>
				))}
			</Select>
			<Select
				value={period}
				onChange={(e) => emitChange(minStr, maxStr, currency, e.target.value)}
				className="w-28"
			>
				{PERIODS.map((p) => (
					<option key={p} value={p}>
						{p}
					</option>
				))}
			</Select>
		</div>
	);
}
