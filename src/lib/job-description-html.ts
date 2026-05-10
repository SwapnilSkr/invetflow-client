import { marked } from "marked";

/** Per-parse options — avoid module-level `marked.setOptions` (predictable, no shared global state). */
const MARKED_PARSE_SYNC = { async: false as const, gfm: true, breaks: true };

const HTML_FRAGMENT_START = /^<[a-z!?/]/i;

/** First line starts like a real HTML fragment (TipTap / API), not Markdown text. */
function looksLikeHtmlFragment(s: string): boolean {
	const t = s.trimStart();
	if (!t.startsWith("<")) return false;
	return HTML_FRAGMENT_START.test(t);
}

/**
 * Turns job description source into HTML TipTap can render.
 * - Already-HTML (from the API or past saves) is left unchanged.
 * - Markdown (common from AI: headings, lists, **bold**) is compiled to HTML.
 * Persisted payloads remain HTML from `editor.getHTML()` for public/candidate pages.
 */
export function jobDescriptionSourceToTipTapHtml(raw: string): string {
	const t = raw.trim();
	if (!t) return "";
	if (looksLikeHtmlFragment(t)) {
		return t;
	}
	const out = marked.parse(t, MARKED_PARSE_SYNC);
	return typeof out === "string" ? out.trim() : "";
}
