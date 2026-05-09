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

type BlueprintContent = {
	job_description?: string;
	skills?: string[];
	tools?: string[];
	pipeline?: { stages: unknown[] };
};

type Props = {
	draft: Pick<DraftState, "title" | "seniority" | "workplaceType">;
	onApply: (content: BlueprintContent) => void;
};

export function BlueprintAiButton({ draft, onApply }: Props) {
	const [open, setOpen] = useState(false);
	const [notes, setNotes] = useState("");
	const [error, setError] = useState<string | null>(null);
	const generate = useGenerateJobContent();

	async function handleGenerate() {
		setError(null);
		try {
			const result = await generate.mutateAsync({
				kind: "blueprint",
				context: {
					title: draft.title,
					seniority: draft.seniority,
					workplace_type: draft.workplaceType,
					notes,
				},
			});
			onApply(result.content as BlueprintContent);
			setOpen(false);
			setNotes("");
		} catch (e) {
			setError(
				e instanceof Error ? e.message : "Failed to generate blueprint.",
			);
		}
	}

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button type="button" variant="outline" size="sm" className="w-fit">
					<Sparkles className="size-4" />
					Suggest skills &amp; tools with AI
				</Button>
			</PopoverTrigger>
			<PopoverContent align="start" className="w-80 space-y-3">
				<div>
					<p className="text-sm font-medium">AI blueprint</p>
					<p className="mt-0.5 text-xs text-muted-foreground">
						Add context and let AI fill description, skills, tools and stages.
					</p>
				</div>
				{error ? (
					<Alert variant="destructive">
						<AlertDescription className="text-xs">{error}</AlertDescription>
					</Alert>
				) : null}
				<Textarea
					placeholder="E.g. Rust backend engineer, platform team, async-heavy microservices…"
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
