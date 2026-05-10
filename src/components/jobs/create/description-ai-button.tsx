import { Sparkles } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "#/components/ui/alert";
import { Button } from "#/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#/components/ui/popover";
import { Textarea } from "#/components/ui/textarea";
import { useGenerateJobContent } from "#/integrations/api/queries";
import type { DraftState } from "./types";

function parseJobDescriptionFromContent(content: unknown): string | undefined {
	if (typeof content === "string") {
		return content;
	}
	if (typeof content !== "object" || content === null) {
		return undefined;
	}
	const o = content as Record<string, unknown>;
	const raw = o.job_description ?? o.jobDescription;
	return typeof raw === "string" ? raw : undefined;
}

type Props = {
	draft: Pick<
		DraftState,
		"title" | "jobTitle" | "department" | "seniority" | "workplaceType"
	>;
	onApply: (description: string) => void;
};

export function DescriptionAiButton({ draft, onApply }: Props) {
	const [open, setOpen] = useState(false);
	const [notes, setNotes] = useState("");
	const [error, setError] = useState<string | null>(null);
	const generate = useGenerateJobContent();

	async function handleGenerate() {
		setError(null);
		try {
			const result = await generate.mutateAsync({
				kind: "job_description",
				context: {
					title: draft.title,
					job_title: draft.jobTitle,
					department: draft.department,
					seniority: draft.seniority,
					workplace_type: draft.workplaceType,
					notes,
				},
			});
			const raw = parseJobDescriptionFromContent(result.content);
			if (raw === undefined || !raw.trim()) {
				setError(
					"The AI did not return a description in the expected format. Try again.",
				);
				return;
			}
			onApply(raw);
			setOpen(false);
			setNotes("");
		} catch (e) {
			setError(
				e instanceof Error ? e.message : "Failed to generate description.",
			);
		}
	}

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					type="button"
					size="icon-sm"
					aria-label="Generate with AI"
					title="Generate with AI"
					className="bg-gradient-to-br from-indigo-500 to-emerald-500 text-white hover:opacity-90 border-0"
				>
					<Sparkles className="size-3.5" fill="currentColor" />
				</Button>
			</PopoverTrigger>
			<PopoverContent align="end" className="w-80 space-y-3">
				<div>
					<p className="text-sm font-medium">Generate description</p>
					<p className="mt-0.5 text-xs text-muted-foreground">
						Add context to tailor the description.
					</p>
				</div>
				{error ? (
					<Alert variant="destructive">
						<AlertDescription className="text-xs">{error}</AlertDescription>
					</Alert>
				) : null}
				<Textarea
					placeholder="E.g. Focus on async Rust, platform infra, remote-first culture…"
					value={notes}
					onChange={(e) => setNotes(e.target.value)}
					className="min-h-[80px] text-sm"
				/>
				<Button
					type="button"
					size="sm"
					className="w-full"
					disabled={generate.isPending || !draft.title.trim()}
					onClick={handleGenerate}
				>
					{generate.isPending ? "Generating…" : "Generate"}
				</Button>
			</PopoverContent>
		</Popover>
	);
}
