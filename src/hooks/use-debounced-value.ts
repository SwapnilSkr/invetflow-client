import { useEffect, useState } from "react";

/**
 * Debounces a value for search-as-you-type (geonames, filters, etc.).
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
	const [debounced, setDebounced] = useState(value);

	useEffect(() => {
		const id = window.setTimeout(() => setDebounced(value), delayMs);
		return () => window.clearTimeout(id);
	}, [value, delayMs]);

	return debounced;
}
