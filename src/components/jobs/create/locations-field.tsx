import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
import {
	type ChangeEvent,
	type KeyboardEvent,
	useCallback,
	useEffect,
	useId,
	useRef,
	useState,
} from "react";
import { Badge } from "#/components/ui/badge";
import { Input } from "#/components/ui/input";
import { useDebouncedValue } from "#/hooks/use-debounced-value";
import type { JobLocation } from "#/integrations/api/client";
import { searchPhotonPlaces } from "#/lib/photon-geocode";
import { cn } from "#/lib/utils";

type LocationsFieldProps = {
	value: JobLocation[];
	onChange: (next: JobLocation[]) => void;
	workplaceType: string;
};

export function LocationsField({
	value,
	onChange,
	workplaceType,
}: LocationsFieldProps) {
	const listId = useId();
	const containerRef = useRef<HTMLDivElement>(null);
	const blurTimerRef = useRef<number | null>(null);
	const [inputValue, setInputValue] = useState("");
	const [highlight, setHighlight] = useState(0);
	const [listOpen, setListOpen] = useState(false);

	const debouncedQuery = useDebouncedValue(inputValue, 320);

	const {
		data: suggestions = [],
		isFetching,
		isError,
	} = useQuery({
		queryKey: ["photon-locations", debouncedQuery],
		queryFn: () => searchPhotonPlaces(debouncedQuery),
		enabled: debouncedQuery.trim().length >= 2,
		staleTime: 60_000,
		retry: 1,
		placeholderData: keepPreviousData,
	});

	useEffect(() => {
		return () => {
			if (blurTimerRef.current != null) {
				window.clearTimeout(blurTimerRef.current);
			}
		};
	}, []);

	const showList =
		listOpen &&
		debouncedQuery.trim().length >= 2 &&
		(isFetching || isError || suggestions.length > 0);

	const addLocation = useCallback(
		(loc: JobLocation) => {
			const exists = value.some(
				(v) => v.label.trim().toLowerCase() === loc.label.trim().toLowerCase(),
			);
			if (exists) return;
			onChange([...value, loc]);
			setInputValue("");
			setListOpen(false);
		},
		[value, onChange],
	);

	const addFreeText = useCallback(() => {
		const label = inputValue.trim();
		if (!label) return;
		addLocation({ label });
	}, [addLocation, inputValue]);

	const removeAt = useCallback(
		(index: number) => {
			onChange(value.filter((_, i) => i !== index));
		},
		[value, onChange],
	);

	const handleSelect = useCallback(
		(suggestion: JobLocation) => {
			addLocation(suggestion);
		},
		[addLocation],
	);

	const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
		setInputValue(e.target.value);
		setHighlight(0);
		setListOpen(true);
	}, []);

	const handleFocus = useCallback(() => {
		setListOpen(true);
	}, []);

	const handleKeyDown = useCallback(
		(e: KeyboardEvent<HTMLInputElement>) => {
			if (e.key === "Escape") {
				e.preventDefault();
				setListOpen(false);
				return;
			}

			const navigable = showList && suggestions.length > 0 && !isError;

			if (navigable && e.key === "ArrowDown") {
				e.preventDefault();
				setHighlight((h) => (h + 1) % suggestions.length);
				return;
			}
			if (navigable && e.key === "ArrowUp") {
				e.preventDefault();
				setHighlight((h) => (h === 0 ? suggestions.length - 1 : h - 1));
				return;
			}

			if (e.key === "Enter" || e.key === ",") {
				e.preventDefault();
				if (isFetching) return;
				if (navigable) {
					const pick = suggestions[highlight] ?? suggestions[0];
					if (pick) {
						handleSelect(pick);
					}
					return;
				}
				addFreeText();
				return;
			}

			if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
				onChange(value.slice(0, -1));
			}
		},
		[
			addFreeText,
			handleSelect,
			highlight,
			inputValue,
			isError,
			isFetching,
			onChange,
			showList,
			suggestions,
			value,
		],
	);

	const handleBlur = useCallback(() => {
		if (blurTimerRef.current != null) {
			window.clearTimeout(blurTimerRef.current);
		}
		blurTimerRef.current = window.setTimeout(() => {
			blurTimerRef.current = null;
			if (!containerRef.current?.contains(document.activeElement)) {
				setListOpen(false);
				const label = inputValue.trim();
				if (label) {
					addLocation({ label });
				}
			}
		}, 120);
	}, [addLocation, inputValue]);

	if (workplaceType === "Remote") return null;

	return (
		<div ref={containerRef} className="relative w-full">
			<div
				className={cn(
					"flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-2 py-1 shadow-sm transition-colors focus-within:border-primary",
				)}
			>
				{value.map((loc, index) => (
					<Badge
						key={`${loc.label}|${loc.country ?? ""}|${loc.region ?? ""}`}
						variant="secondary"
						className="flex max-w-full items-center gap-1 pr-1 text-xs"
					>
						<span className="truncate">{loc.label}</span>
						<button
							type="button"
							aria-label={`Remove ${loc.label}`}
							onClick={() => removeAt(index)}
							className="shrink-0 rounded-sm hover:opacity-70"
						>
							<X className="size-3" />
						</button>
					</Badge>
				))}
				<div className="relative min-w-[120px] flex-1">
					<Input
						value={inputValue}
						onChange={handleInputChange}
						onKeyDown={handleKeyDown}
						onBlur={handleBlur}
						onFocus={handleFocus}
						placeholder={
							value.length === 0 ? "Enter a location" : "Add another…"
						}
						autoComplete="off"
						aria-autocomplete="list"
						aria-controls={listId}
						aria-expanded={showList}
						role="combobox"
						className="h-auto min-h-7 w-full min-w-0 cursor-text border-0 bg-transparent p-0 text-foreground leading-normal shadow-none caret-primary focus-visible:border-0 focus-visible:ring-0"
						inputMode="search"
					/>

					{showList ? (
						<div
							id={listId}
							role="listbox"
							className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-auto rounded-md border border-border bg-popover py-1 text-sm shadow-md"
						>
							{isFetching ? (
								<div className="flex items-center gap-2 px-3 py-2 text-muted-foreground">
									<Loader2 className="size-3.5 animate-spin" aria-hidden />
									Searching…
								</div>
							) : null}
							{isError ? (
								<div className="px-3 py-2 text-xs text-destructive">
									Could not load suggestions. Try again, or add the location and
									press Enter.
								</div>
							) : null}
							{suggestions.map((s, i) => (
								<div key={s.label} role="presentation">
									<button
										type="button"
										role="option"
										aria-selected={i === highlight}
										className={cn(
											"flex w-full cursor-pointer items-start px-3 py-2 text-left text-sm text-foreground hover:bg-accent",
											i === highlight && "bg-accent",
										)}
										onMouseDown={(e) => e.preventDefault()}
										onClick={() => handleSelect(s)}
										onMouseEnter={() => setHighlight(i)}
									>
										{s.label}
									</button>
								</div>
							))}
						</div>
					) : null}
				</div>
			</div>
		</div>
	);
}
