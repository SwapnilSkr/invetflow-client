import { Link } from "@tiptap/extension-link";
import { Placeholder } from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import {
	Bold,
	Italic,
	Link as LinkIcon,
	List,
	ListOrdered,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo } from "react";
import { Button } from "#/components/ui/button";
import { jobDescriptionSourceToTipTapHtml } from "#/lib/job-description-html";
import { cn } from "#/lib/utils";

const EMPTY_TIPTAP_DOC = /^<p[^>]*>(?:\s|<br\b[^>]*\/?\s*)*<\/p>$/i;

/** True for empty TipTap docs: <p></p>, optional br / trailing break, no user text. */
function isEmptyTipTapHtml(html: string): boolean {
	const t = html.trim();
	if (!t) return true;
	return EMPTY_TIPTAP_DOC.test(t);
}

/** Normalizes empty docs so "" from state matches serialized empty editor HTML. */
function normalizeEditorHtmlForCompare(html: string): string {
	const trimmed = html.trim();
	if (!trimmed || isEmptyTipTapHtml(trimmed)) return "";
	return trimmed;
}

type RichTextEditorProps = {
	value: string;
	onChange: (html: string) => void;
	placeholder?: string;
	className?: string;
	toolbarExtra?: ReactNode;
};

export function RichTextEditor({
	value,
	onChange,
	placeholder,
	className,
	toolbarExtra,
}: RichTextEditorProps) {
	const extensions = useMemo(
		() => [
			StarterKit,
			Placeholder.configure({
				placeholder: placeholder ?? "Write something…",
				emptyNodeClass: "is-empty",
			}),
			Link.configure({ openOnClick: false, autolink: true }),
		],
		[placeholder],
	);

	const editor = useEditor({
		extensions,
		content: jobDescriptionSourceToTipTapHtml(value),
		// Defer first render to the client — TanStack Start SSRs by default and
		// ProseMirror needs the DOM.
		immediatelyRender: false,
		onUpdate({ editor: ed }) {
			onChange(ed.getHTML());
		},
	});

	useEffect(() => {
		if (!editor || editor.isDestroyed) return;
		const html = jobDescriptionSourceToTipTapHtml(value || "");
		const incoming = normalizeEditorHtmlForCompare(html);
		const current = normalizeEditorHtmlForCompare(editor.getHTML());
		if (incoming === current) return;
		editor.commands.setContent(html || "", { emitUpdate: false });
	}, [editor, value]);

	if (!editor) return null;

	function toggleLink() {
		if (editor?.isActive("link")) {
			editor.chain().focus().unsetLink().run();
			return;
		}
		const url = window.prompt("URL");
		if (url) {
			editor?.chain().focus().setLink({ href: url }).run();
		}
	}

	return (
		<div
			data-slot="rich-text-editor"
			className={cn(
				"rounded-md border border-input bg-transparent shadow-sm focus-within:border-primary",
				className,
			)}
		>
			<div className="flex items-center gap-0.5 border-b border-input px-2 py-1">
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					aria-label="Bold"
					aria-pressed={editor.isActive("bold")}
					onClick={() => editor.chain().focus().toggleBold().run()}
					className={cn(editor.isActive("bold") && "bg-accent")}
				>
					<Bold className="size-3.5" />
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					aria-label="Italic"
					aria-pressed={editor.isActive("italic")}
					onClick={() => editor.chain().focus().toggleItalic().run()}
					className={cn(editor.isActive("italic") && "bg-accent")}
				>
					<Italic className="size-3.5" />
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					aria-label="Bullet list"
					aria-pressed={editor.isActive("bulletList")}
					onClick={() => editor.chain().focus().toggleBulletList().run()}
					className={cn(editor.isActive("bulletList") && "bg-accent")}
				>
					<List className="size-3.5" />
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					aria-label="Ordered list"
					aria-pressed={editor.isActive("orderedList")}
					onClick={() => editor.chain().focus().toggleOrderedList().run()}
					className={cn(editor.isActive("orderedList") && "bg-accent")}
				>
					<ListOrdered className="size-3.5" />
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					aria-label="Link"
					aria-pressed={editor.isActive("link")}
					onClick={toggleLink}
					className={cn(editor.isActive("link") && "bg-accent")}
				>
					<LinkIcon className="size-3.5" />
				</Button>
				{toolbarExtra ? (
					<div className="ml-auto flex items-center">{toolbarExtra}</div>
				) : null}
			</div>
			<EditorContent
				editor={editor}
				className="prose prose-sm max-w-none px-3 py-2 text-sm focus:outline-none [&_.ProseMirror]:min-h-[140px] [&_.ProseMirror]:outline-none [&_.ProseMirror_p.is-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-empty:first-child::before]:select-none [&_.ProseMirror_p.is-empty:first-child::before]:float-left [&_.ProseMirror_p.is-empty:first-child::before]:text-muted-foreground [&_.ProseMirror_p.is-empty:first-child::before]:content-[attr(data-placeholder)]"
			/>
		</div>
	);
}
