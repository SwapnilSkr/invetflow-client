import {
	Bookmark,
	BookmarkCheck,
	Clock,
	MessageSquare,
	Play,
	Send,
	Share2,
} from "lucide-react";
import React from "react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { Separator } from "#/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import { cn } from "#/lib/utils";

interface Comment {
	id: string;
	author: string;
	authorRole: string;
	content: string;
	timestamp: Date;
	timestamp_in_video: number; // seconds
}

interface VideoPlayerProps {
	videoUrl: string;
	title: string;
	duration: number; // seconds
	currentTime?: number;
	comments: Comment[];
	highlights: number[]; // timestamps in seconds
	onTimeUpdate?: (time: number) => void;
	onAddComment?: (comment: Omit<Comment, "id" | "timestamp">) => void;
	onShareHighlight?: (start: number, end: number) => void;
}

export function VideoPlayer({
	videoUrl,
	title,
	duration,
	currentTime = 0,
	comments,
	highlights,
	onTimeUpdate,
	onAddComment,
	onShareHighlight,
}: VideoPlayerProps) {
	const videoRef = React.useRef<HTMLVideoElement>(null);
	const [isPlaying, setIsPlaying] = React.useState(false);
	const [progress, setProgress] = React.useState(0);
	const [newComment, setNewComment] = React.useState("");

	React.useEffect(() => {
		if (videoRef.current) {
			videoRef.current.currentTime = currentTime;
		}
	}, [currentTime]);

	const handleTimeUpdate = () => {
		if (videoRef.current) {
			const current = videoRef.current.currentTime;
			setProgress((current / duration) * 100);
			onTimeUpdate?.(current);
		}
	};

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	const jumpToTime = (time: number) => {
		if (videoRef.current) {
			videoRef.current.currentTime = time;
			videoRef.current.play();
			setIsPlaying(true);
		}
	};

	const handleAddComment = () => {
		if (newComment.trim() && videoRef.current && onAddComment) {
			onAddComment({
				author: "Current User",
				authorRole: "Recruiter",
				content: newComment,
				timestamp_in_video: videoRef.current.currentTime,
			});
			setNewComment("");
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			action();
		}
	};

	return (
		<Card className="overflow-hidden">
			<CardHeader className="pb-0">
				<div className="flex items-center justify-between">
					<CardTitle className="text-lg">{title}</CardTitle>
					<div className="flex items-center gap-2">
						<Badge variant="secondary">
							<Clock className="h-3 w-3 mr-1" />
							{formatTime(duration)}
						</Badge>
					</div>
				</div>
			</CardHeader>

			<CardContent className="p-0 pt-4">
				{/* Video Player */}
				<div className="relative bg-black aspect-video">
					<video
						ref={videoRef}
						src={videoUrl}
						className="w-full h-full"
						onTimeUpdate={handleTimeUpdate}
						onPlay={() => setIsPlaying(true)}
						onPause={() => setIsPlaying(false)}
						controls
					>
						<track kind="captions" src="" label="English" />
					</video>

					{/* Highlight Markers */}
					<div className="absolute bottom-12 left-0 right-0 h-1 bg-white/20 mx-4 rounded-full overflow-hidden">
						{highlights.map((timestamp) => (
							<button
								key={timestamp}
								type="button"
								className="absolute top-0 bottom-0 w-1 bg-yellow-400 cursor-pointer hover:bg-yellow-300"
								style={{ left: `${(timestamp / duration) * 100}%` }}
								onClick={() => jumpToTime(timestamp)}
								onKeyDown={(e) => handleKeyDown(e, () => jumpToTime(timestamp))}
								title={`Jump to ${formatTime(timestamp)}`}
								aria-label={`Jump to ${formatTime(timestamp)}`}
							/>
						))}
					</div>
				</div>

				{/* Comments & Highlights Tabs */}
				<Tabs defaultValue="comments" className="p-4">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="comments">
							<MessageSquare className="h-4 w-4 mr-2" />
							Comments ({comments.length})
						</TabsTrigger>
						<TabsTrigger value="highlights">
							<Bookmark className="h-4 w-4 mr-2" />
							Highlights ({highlights.length})
						</TabsTrigger>
					</TabsList>

					<TabsContent value="comments" className="mt-4 space-y-4">
						{/* Add Comment */}
						<div className="flex gap-2">
							<Input
								placeholder="Add a comment at current timestamp..."
								value={newComment}
								onChange={(e) => setNewComment(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
							/>
							<Button type="button" onClick={handleAddComment} size="icon">
								<Send className="h-4 w-4" />
							</Button>
						</div>

						{/* Comments List */}
						<div className="space-y-3 max-h-64 overflow-y-auto">
							{comments.length === 0 ? (
								<p className="text-sm text-muted-foreground text-center py-4">
									No comments yet. Add one to collaborate with your team.
								</p>
							) : (
								comments.map((comment) => (
									<div
										key={comment.id}
										className="flex gap-3 p-3 rounded-lg bg-muted/50"
									>
										<div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
											{comment.author.charAt(0)}
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2">
												<span className="text-sm font-medium">
													{comment.author}
												</span>
												<Badge variant="secondary" className="text-xs">
													{comment.authorRole}
												</Badge>
												<button
													type="button"
													onClick={() => jumpToTime(comment.timestamp_in_video)}
													className="text-xs text-primary hover:underline"
												>
													{formatTime(comment.timestamp_in_video)}
												</button>
											</div>
											<p className="text-sm text-muted-foreground mt-1">
												{comment.content}
											</p>
										</div>
									</div>
								))
							)}
						</div>
					</TabsContent>

					<TabsContent value="highlights" className="mt-4">
						<div className="space-y-2">
							{highlights.length === 0 ? (
								<p className="text-sm text-muted-foreground text-center py-4">
									No highlights marked. Click the bookmark icon while watching
									to mark key moments.
								</p>
							) : (
								highlights.map((timestamp) => (
									<button
										key={timestamp}
										type="button"
										className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer text-left"
										onClick={() => jumpToTime(timestamp)}
										onKeyDown={(e) =>
											handleKeyDown(e, () => jumpToTime(timestamp))
										}
									>
										<div className="flex items-center gap-3">
											<BookmarkCheck className="h-4 w-4 text-yellow-500" />
											<span className="text-sm font-medium">Highlight</span>
										</div>
										<div className="flex items-center gap-2">
											<span className="text-sm text-muted-foreground">
												{formatTime(timestamp)}
											</span>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="h-8 w-8"
												onClick={(e) => {
													e.stopPropagation();
													onShareHighlight?.(timestamp, timestamp + 30);
												}}
											>
												<Share2 className="h-4 w-4" />
											</Button>
										</div>
									</button>
								))
							)}
						</div>
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
}
