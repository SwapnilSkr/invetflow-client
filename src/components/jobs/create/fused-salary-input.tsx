import { useState } from "react";
import type { SalaryRange } from "#/integrations/api/client";

type Props = {
	value: SalaryRange | null;
	onChange: (next: SalaryRange | null) => void;
};

const CURRENCIES = ["USD", "EUR", "GBP", "INR"] as const;
const PERIODS = ["Yearly", "Monthly", "Hourly"] as const;

const CURRENCY_SYMBOLS: Record<string, string> = {
	USD: "$",
	EUR: "€",
	GBP: "£",
	INR: "₹",
};

const PERIOD_LABELS: Record<string, string> = {
	Yearly: "year",
	Monthly: "month",
	Hourly: "hour",
};

function formatAmount(n: number): string {
	if (n >= 100000) return `${(n / 100000).toFixed(1).replace(/\.0$/, "")}L`;
	if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
	return String(n);
}

export function FusedSalaryInput({ value, onChange }: Props) {
	const [localCurrency, setLocalCurrency] = useState("INR");
	const [localPeriod, setLocalPeriod] = useState("Yearly");

	const currency = value?.currency ?? localCurrency;
	const period = value?.period ?? localPeriod;
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

	const sym = CURRENCY_SYMBOLS[currency] ?? currency;
	const periodLabel = PERIOD_LABELS[period] ?? period.toLowerCase();

	const hasMin = value?.min != null;
	const hasMax = value?.max != null;
	const preview =
		hasMin && hasMax && value?.min != null && value.max != null
			? `Candidates see: ${sym}${formatAmount(value.min)} – ${sym}${formatAmount(value.max)} / ${periodLabel}`
			: hasMin && value?.min != null
				? `Candidates see: from ${sym}${formatAmount(value.min)} / ${periodLabel}`
				: hasMax && value?.max != null
					? `Candidates see: up to ${sym}${formatAmount(value.max)} / ${periodLabel}`
					: null;

	return (
		<div>
			<div className="flex h-11 items-stretch divide-x divide-input overflow-hidden rounded-lg border border-input bg-background">
				<div className="flex items-center px-3 text-sm">
					<select
						value={currency}
						onChange={(e) => {
							const next = e.target.value;
							setLocalCurrency(next);
							emitChange(minStr, maxStr, next, period);
						}}
						className="bg-transparent outline-none cursor-pointer pr-2 text-sm"
					>
						{CURRENCIES.map((c) => (
							<option key={c} value={c}>
								{c}
							</option>
						))}
					</select>
				</div>
				<div className="flex flex-1 items-center px-3 text-sm">
					<input
						type="number"
						placeholder="Min"
						value={minStr}
						onChange={(e) =>
							emitChange(e.target.value, maxStr, currency, period)
						}
						className="w-full bg-transparent outline-none placeholder:text-muted-foreground text-sm"
					/>
				</div>
				<div className="flex flex-1 items-center px-3 text-sm">
					<input
						type="number"
						placeholder="Max"
						value={maxStr}
						onChange={(e) =>
							emitChange(minStr, e.target.value, currency, period)
						}
						className="w-full bg-transparent outline-none placeholder:text-muted-foreground text-sm"
					/>
				</div>
				<div className="flex items-center px-3 text-sm">
					<select
						value={period}
						onChange={(e) => {
							const next = e.target.value;
							setLocalPeriod(next);
							emitChange(minStr, maxStr, currency, next);
						}}
						className="bg-transparent outline-none cursor-pointer pr-2 text-sm"
					>
						{PERIODS.map((p) => (
							<option key={p} value={p}>
								{p}
							</option>
						))}
					</select>
				</div>
			</div>
			{preview ? (
				<p className="mt-1.5 text-xs text-muted-foreground">{preview}</p>
			) : null}
		</div>
	);
}
