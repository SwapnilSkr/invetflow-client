import { create } from "zustand";

export type ThemeMode = "light" | "dark" | "auto";

function readStoredMode(): ThemeMode {
	if (typeof window === "undefined") {
		return "light";
	}
	const stored = window.localStorage.getItem("theme");
	if (stored === "light" || stored === "dark" || stored === "auto") {
		return stored;
	}
	/** App default: light minimal SaaS (see DESIGN.md) — not system `prefers-color-scheme`. */
	return "light";
}

/**
 * Keep DOM + localStorage in sync with __root's inline `THEME_INIT_SCRIPT` (key `theme`).
 * matchMedia is registered once; no `useEffect` in the component (Vercel: avoid effect for sync that can be store + subscription).
 */
function applyThemeMode(mode: ThemeMode) {
	if (typeof window === "undefined") {
		return;
	}
	const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
	const resolved = mode === "auto" ? (prefersDark ? "dark" : "light") : mode;

	document.documentElement.classList.remove("light", "dark");
	document.documentElement.classList.add(resolved);

	if (mode === "auto") {
		document.documentElement.removeAttribute("data-theme");
	} else {
		document.documentElement.setAttribute("data-theme", mode);
	}
	document.documentElement.style.colorScheme = resolved;
}

function nextMode(mode: ThemeMode): ThemeMode {
	if (mode === "light") {
		return "dark";
	}
	if (mode === "dark") {
		return "auto";
	}
	return "light";
}

type ThemeState = {
	mode: ThemeMode;
	setMode: (m: ThemeMode) => void;
	cycleMode: () => void;
};

export const useThemeStore = create<ThemeState>((set, get) => ({
	mode: readStoredMode(),
	setMode: (m) => set({ mode: m }),
	cycleMode: () => {
		const next = nextMode(get().mode);
		set({ mode: next });
	},
}));

if (typeof window !== "undefined") {
	const sync = (state: ThemeState) => {
		applyThemeMode(state.mode);
		try {
			window.localStorage.setItem("theme", state.mode);
		} catch {
			/* private mode, etc. */
		}
	};

	sync(useThemeStore.getState());
	useThemeStore.subscribe((state) => {
		sync(state);
	});

	window
		.matchMedia("(prefers-color-scheme: dark)")
		.addEventListener("change", () => {
			if (useThemeStore.getState().mode === "auto") {
				sync(useThemeStore.getState());
			}
		});
}
