import { useThemeStore } from "#/integrations/stores/theme-store";

export default function ThemeToggle() {
	const mode = useThemeStore((s) => s.mode);
	const cycleMode = useThemeStore((s) => s.cycleMode);

	const label =
		mode === "auto"
			? "Theme mode: auto (system). Click to switch to light mode."
			: `Theme mode: ${mode}. Click to switch mode.`;

	return (
		<button
			type="button"
			onClick={cycleMode}
			aria-label={label}
			title={label}
			className="rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm font-semibold text-[var(--sea-ink)] shadow-sm transition hover:-translate-y-0.5"
		>
			{mode === "auto" ? "Auto" : mode === "dark" ? "Dark" : "Light"}
		</button>
	);
}
