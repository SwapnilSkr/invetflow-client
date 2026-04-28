import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatDuration(minutes: number): string {
	if (minutes < 60) return `${minutes} min`;
	const hours = Math.floor(minutes / 60);
	const mins = minutes % 60;
	return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function formatDate(date: string | Date): string {
	const d = new Date(date);
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	}).format(d);
}

export function getStatusColor(status: string): string {
	switch (status.toLowerCase()) {
		case "draft":
			return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700";
		case "active":
		case "in_progress":
			return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 border-blue-200 dark:border-blue-800";
		case "completed":
		case "done":
			return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700";
		case "scheduled":
		case "pending":
			return "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 border-amber-200 dark:border-amber-800";
		case "cancelled":
		case "error":
			return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 border-red-200 dark:border-red-800";
		default:
			return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700";
	}
}

export function getScoreColor(score: number): string {
	if (score >= 8) return "text-blue-600 dark:text-blue-400";
	if (score >= 6) return "text-amber-600 dark:text-amber-400";
	if (score >= 4) return "text-orange-600 dark:text-orange-400";
	return "text-red-600 dark:text-red-400";
}

export function getScoreBgColor(score: number): string {
	if (score >= 8)
		return "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800";
	if (score >= 6)
		return "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800";
	if (score >= 4)
		return "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800";
	return "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800";
}

export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
	fn: T,
	delay: number,
): (...args: Parameters<T>) => void {
	let timeoutId: ReturnType<typeof setTimeout>;
	return (...args) => {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => fn(...args), delay);
	};
}

export function throttle<T extends (...args: Parameters<T>) => ReturnType<T>>(
	fn: T,
	limit: number,
): (...args: Parameters<T>) => void {
	let inThrottle = false;
	return (...args) => {
		if (!inThrottle) {
			fn(...args);
			inThrottle = true;
			setTimeout(() => (inThrottle = false), limit);
		}
	};
}
