import { X } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import type { MeetingChatMessage } from "./meeting-types";

type ChatPanelProps = {
	messages: MeetingChatMessage[];
	onClose: () => void;
	onSend: (message: string) => Promise<void>;
};

export function ChatPanel({ messages, onClose, onSend }: ChatPanelProps) {
	const [draft, setDraft] = useState("");
	const [isSending, setIsSending] = useState(false);
	const [sendError, setSendError] = useState<string | null>(null);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const message = draft.trim();
		if (!message || isSending) {
			return;
		}

		setDraft("");
		setSendError(null);
		setIsSending(true);
		try {
			await onSend(message);
		} catch (error) {
			setDraft(message);
			setSendError(errorMessage(error, "Message could not be sent."));
		} finally {
			setIsSending(false);
		}
	}

	return (
		<aside className="absolute inset-x-3 bottom-20 z-30 flex max-h-[calc(100dvh-7rem)] min-h-0 flex-col overflow-hidden rounded-xl border border-meeting-border bg-meeting-bg shadow-2xl lg:static lg:inset-auto lg:max-h-none lg:rounded-none lg:border-t-0 lg:border-r-0 lg:border-b-0">
			<div className="flex h-14 shrink-0 items-center justify-between border-meeting-border border-b px-4">
				<div>
					<p className="font-semibold text-sm">Meeting chat</p>
					<p className="text-meeting-text-muted text-xs">
						Visible to everyone here
					</p>
				</div>
				<button
					type="button"
					className="grid size-9 place-items-center rounded-full text-meeting-text-muted transition hover:bg-meeting-surface-hover hover:text-meeting-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-meeting-text"
					onClick={onClose}
					aria-label="Close chat"
				>
					<X className="size-4" aria-hidden />
				</button>
			</div>

			<div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
				{messages.length === 0 ? (
					<p className="rounded-lg bg-meeting-surface/50 px-3 py-3 text-meeting-text-muted text-sm">
						No messages yet.
					</p>
				) : (
					messages.map((message) => (
						<div
							key={message.id}
							className="rounded-lg bg-meeting-surface/50 px-3 py-2"
						>
							<div className="flex items-center justify-between gap-3 text-xs">
								<span className="truncate font-medium text-meeting-text">
									{message.senderName}
								</span>
								<span className="shrink-0 text-meeting-text-muted">
									{new Date(message.timestamp).toLocaleTimeString([], {
										hour: "2-digit",
										minute: "2-digit",
									})}
								</span>
							</div>
							<p className="mt-1 whitespace-pre-wrap break-words text-meeting-text text-sm">
								{message.message}
							</p>
						</div>
					))
				)}
			</div>

			<form
				className="shrink-0 border-meeting-border border-t p-3"
				onSubmit={handleSubmit}
			>
				{sendError ? (
					<p className="mb-2 rounded-md bg-destructive px-3 py-2 text-destructive-foreground text-xs">
						{sendError}
					</p>
				) : null}
				<div className="flex gap-2">
					<input
						value={draft}
						onChange={(event) => setDraft(event.target.value)}
						placeholder="Message everyone"
						className="min-w-0 flex-1 rounded-full border border-meeting-border bg-meeting-surface px-4 py-2 text-sm text-meeting-text outline-none transition placeholder:text-meeting-text-muted focus:border-meeting-text-muted"
					/>
					<button
						type="submit"
						disabled={draft.trim().length === 0 || isSending}
						className="rounded-full bg-meeting-text px-4 py-2 font-medium text-meeting-bg text-sm transition hover:bg-meeting-text-muted disabled:cursor-not-allowed disabled:opacity-50"
					>
						Send
					</button>
				</div>
			</form>
		</aside>
	);
}

function errorMessage(error: unknown, fallback: string) {
	return error instanceof Error && error.message.trim()
		? error.message
		: fallback;
}
