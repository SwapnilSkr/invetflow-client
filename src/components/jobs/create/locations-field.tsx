import type { JobLocation } from "#/integrations/api/client";
import { TagInput } from "./tag-input";

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
	if (workplaceType === "Remote") return null;

	const labels = value.map((loc) => loc.label);

	function handleChange(next: string[]) {
		onChange(next.map((label) => ({ label })));
	}

	return (
		<TagInput
			value={labels}
			onChange={handleChange}
			placeholder="Add location (e.g. Bengaluru)"
		/>
	);
}
