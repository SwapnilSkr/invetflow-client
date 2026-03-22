import { AlertTriangle, Bot, Clock, User } from "lucide-react";
import React from "react";
import { cn } from "#/lib/utils";

interface AIInterviewMessage {
	id: string;
	type: "ai" | "candidate" | "system";
	content: string;
	timestamp: Date;
	metadata?: {
		confidence?: number;
		sentiment?: "positive" | "neutral" | "negative";
		followUp?: boolean;
	};
}

interface AIInterviewTranscriptProps {
	messages: AIInterviewMessage[];
	className?: string;
}

export function AIInterviewTranscript({
	messages,
	className,
}: AIInterviewTranscriptProps) {
	const scrollRef = React.useRef<HTMLDivElement>(null);

	React.useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
		}
	});

	return (
		<div
			ref={scrollRef}
			className={cn(
				"flex flex-col gap-3 overflow-y-auto p-4 max-h-[400px]",
				className,
			)}
		>
			{messages.length === 0 && (
				<div className="text-center text-muted-foreground py-8">
					<Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
					<p className="text-sm">The interview will begin shortly...</p>
				</div>
			)}

			{messages.map((message) => (
				<MessageBubble key={message.id} message={message} />
			))}
		</div>
	);
}

function MessageBubble({ message }: { message: AIInterviewMessage }) {
	const isAI = message.type === "ai";
	const isSystem = message.type === "system";

	if (isSystem) {
		return (
			<div className="flex items-center justify-center gap-2 py-2">
				<div className="h-px flex-1 bg-border" />
				<span className="text-xs text-muted-foreground flex items-center gap-1">
					<Clock className="h-3 w-3" />
					{message.content}
				</span>
				<div className="h-px flex-1 bg-border" />
			</div>
		);
	}

	return (
		<div className={cn("flex gap-3", isAI ? "flex-row" : "flex-row-reverse")}>
			<div
				className={cn(
					"flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
					isAI
						? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
						: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400",
				)}
			>
				{isAI ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
			</div>

			<div
				className={cn(
					"flex flex-col max-w-[80%]",
					isAI ? "items-start" : "items-end",
				)}
			>
				<div
					className={cn(
						"rounded-2xl px-4 py-2.5 text-sm",
						isAI
							? "bg-muted text-foreground rounded-tl-sm"
							: "bg-emerald-500 text-white rounded-tr-sm",
					)}
				>
					{message.content}
				</div>

				<div className="flex items-center gap-2 mt-1">
					<span className="text-xs text-muted-foreground">
						{message.timestamp.toLocaleTimeString([], {
							hour: "2-digit",
							minute: "2-digit",
						})}
					</span>

					{isAI && message.metadata?.followUp && (
						<span className="text-xs text-blue-500 flex items-center gap-0.5">
							<AlertTriangle className="h-3 w-3" />
							Follow-up
						</span>
					)}

					{isAI && message.metadata?.confidence !== undefined && (
						<span
							className={cn(
								"text-xs",
								message.metadata.confidence > 0.8
									? "text-emerald-500"
									: message.metadata.confidence > 0.6
										? "text-amber-500"
										: "text-red-500",
							)}
						>
							{Math.round(message.metadata.confidence * 100)}%
						</span>
					)}
				</div>
			</div>
		</div>
	);
}
