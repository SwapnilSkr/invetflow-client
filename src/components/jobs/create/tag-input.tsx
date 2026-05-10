import { X } from "lucide-react";
import { useState } from "react";
import { Badge } from "#/components/ui/badge";
import { Input } from "#/components/ui/input";
import { cn } from "#/lib/utils";

type TagInputProps = {
	value: string[];
	onChange: (next: string[]) => void;
	placeholder?: string;
	className?: string;
};

export function TagInput({
	value,
	onChange,
	placeholder,
	className,
}: TagInputProps) {
	const [inputValue, setInputValue] = useState("");

	function addTag(raw: string) {
		const tag = raw.trim();
		if (!tag || value.includes(tag)) return;
		onChange([...value, tag]);
		setInputValue("");
	}

	function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === "Enter" || e.key === ",") {
			e.preventDefault();
			addTag(inputValue);
		} else if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
			onChange(value.slice(0, -1));
		}
	}

	function handleBlur() {
		if (inputValue.trim()) {
			addTag(inputValue);
		}
	}

	function removeTag(tag: string) {
		onChange(value.filter((t) => t !== tag));
	}

	return (
		<div
			className={cn(
				"flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-2 py-1 shadow-sm transition-colors focus-within:border-primary",
				className,
			)}
		>
			{value.map((tag) => (
				<Badge
					key={tag}
					variant="secondary"
					className="flex items-center gap-1 pr-1 text-xs"
				>
					{tag}
					<button
						type="button"
						aria-label={`Remove ${tag}`}
						onClick={() => removeTag(tag)}
						className="ml-0.5 rounded-sm hover:opacity-70"
					>
						<X className="size-3" />
					</button>
				</Badge>
			))}
			<Input
				value={inputValue}
				onChange={(e) => setInputValue(e.target.value)}
				onKeyDown={handleKeyDown}
				onBlur={handleBlur}
				placeholder={
					value.length === 0 ? (placeholder ?? "Add tag…") : undefined
				}
				className="h-auto min-h-7 min-w-[80px] flex-1 cursor-text border-0 bg-transparent p-0 text-foreground leading-normal shadow-none caret-primary focus-visible:border-0 focus-visible:ring-0"
			/>
		</div>
	);
}
