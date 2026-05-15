import { format, parseISO } from "date-fns";
import { CalendarDays } from "lucide-react";
import { Input } from "#/components/ui/input";

interface DateTimePickerProps {
	value: Date | null;
	onChange: (next: Date | null) => void;
	minDate?: Date;
	disabled?: boolean;
	id?: string;
}

/**
 * Minimal date+time picker built on the native `<input type="datetime-local">`.
 * Values are exchanged with the parent as `Date` objects in the local timezone.
 */
export function DateTimePicker({
	value,
	onChange,
	minDate,
	disabled,
	id,
}: DateTimePickerProps) {
	const localValue = value ? toLocalInputValue(value) : "";
	const min = minDate ? toLocalInputValue(minDate) : undefined;

	return (
		<div className="relative">
			<CalendarDays
				className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
				aria-hidden="true"
			/>
			<Input
				id={id}
				type="datetime-local"
				value={localValue}
				min={min}
				disabled={disabled}
				onChange={(e) => {
					const raw = e.target.value;
					if (!raw) {
						onChange(null);
						return;
					}
					onChange(fromLocalInputValue(raw));
				}}
				className="pl-9"
			/>
		</div>
	);
}

/** Format a Date as `YYYY-MM-DDTHH:mm` in the local timezone. */
function toLocalInputValue(d: Date): string {
	return format(d, "yyyy-MM-dd'T'HH:mm");
}

/** Parse a `YYYY-MM-DDTHH:mm` string from the native input as a local-timezone Date. */
function fromLocalInputValue(raw: string): Date {
	// Native `datetime-local` omits seconds and timezone; `parseISO` treats it as local time.
	return parseISO(raw);
}
